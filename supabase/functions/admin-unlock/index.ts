// POST /functions/v1/admin-unlock
// body: { pin: string }
// PIN хранится ТОЛЬКО в секрете ADMIN_PIN на сервере. В приложении его нет.
// При верном PIN текущий анонимный ID добавляется в таблицу admins.
// Защита от перебора: не более 10 неверных попыток за 15 минут на весь сервис.
import { adminClient, corsHeaders, getUser, json, requireEnv } from '../_shared/utils.ts';

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 10;

async function sha256(text: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(digest);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: 'unauthorized' }, 401);

    const db = adminClient();
    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
    const { count } = await db
      .from('admin_unlock_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('success', false)
      .gte('created_at', since);
    if ((count ?? 0) >= MAX_FAILURES) return json({ error: 'too_many_attempts' }, 429);

    const body = await req.json().catch(() => ({}));
    const pin = typeof body?.pin === 'string' ? body.pin : '';

    const ok = constantTimeEqual(await sha256(pin), await sha256(requireEnv('ADMIN_PIN')));
    await db.from('admin_unlock_attempts').insert({ user_id: user.id, success: ok });

    if (!ok) return json({ error: 'wrong_pin' }, 403);

    await db.from('admins').upsert({ user_id: user.id });
    return json({ ok: true });
  } catch (error) {
    console.error('admin-unlock', error);
    return json({ error: 'server_error' }, 500);
  }
});
