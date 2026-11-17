// POST /functions/v1/send-live-notification
// body: { title?: string, body?: string }
// Только для админов. Рассылает push всем устройствам из push_tokens через Expo Push API.
// Кулдаун 5 минут, чтобы случайно не отправить анонс дважды.
import { adminClient, corsHeaders, getUser, isAdmin, json } from '../_shared/utils.ts';

const COOLDOWN_MS = 5 * 60_000;
const BATCH = 100;

interface ExpoTicket {
  status: 'ok' | 'error';
  details?: { error?: string };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: 'unauthorized' }, 401);
    if (!(await isAdmin(user.id))) return json({ error: 'forbidden' }, 403);

    const db = adminClient();

    // Атомарно «занимаем» слот рассылки: обновление пройдёт, только если кулдаун истёк
    const threshold = new Date(Date.now() - COOLDOWN_MS).toISOString();
    const { data: claimed } = await db
      .from('app_state')
      .update({ last_announce_at: new Date().toISOString() })
      .eq('id', 1)
      .or(`last_announce_at.is.null,last_announce_at.lt.${threshold}`)
      .select('id');
    if (!claimed || claimed.length === 0) return json({ error: 'cooldown' }, 429);

    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 80) : '🍊 Мы в эфире!';
    const text =
      typeof body?.body === 'string' && body.body.trim()
        ? body.body.trim().slice(0, 180)
        : 'Фруктовая лавка начала видеотрансляцию. Заходи!';

    const { data: rows, error } = await db.from('push_tokens').select('token');
    if (error) throw error;
    const tokens = (rows ?? []).map((r) => r.token as string);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    const expoToken = Deno.env.get('EXPO_ACCESS_TOKEN');
    if (expoToken) headers.Authorization = `Bearer ${expoToken}`;

    let sent = 0;
    const dead: string[] = [];

    for (let i = 0; i < tokens.length; i += BATCH) {
      const chunk = tokens.slice(i, i + BATCH);
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(
          chunk.map((to) => ({
            to,
            title,
            body: text,
            sound: 'default',
            channelId: 'live',
            data: { type: 'live' },
          })),
        ),
      });
      if (!res.ok) {
        console.error('expo push', res.status, await res.text());
        continue;
      }
      const { data: tickets } = (await res.json()) as { data: ExpoTicket[] };
      tickets.forEach((ticket, idx) => {
        if (ticket.status === 'ok') sent++;
        else if (ticket.details?.error === 'DeviceNotRegistered') dead.push(chunk[idx]);
      });
    }

    if (dead.length) await db.from('push_tokens').delete().in('token', dead);

    return json({ ok: true, total: tokens.length, sent, removed: dead.length });
  } catch (error) {
    console.error('send-live-notification', error);
    return json({ error: 'server_error' }, 500);
  }
});
