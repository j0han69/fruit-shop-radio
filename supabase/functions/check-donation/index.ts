// POST /functions/v1/check-donation
// body: { donationId: string }
// Вызывается клиентом после закрытия страницы оплаты.
// Спрашивает статус напрямую у ЮKassa (на случай, если вебхук ещё не дошёл).
import { adminClient, corsHeaders, getUser, json, syncDonation } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: 'unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const donationId = typeof body?.donationId === 'string' ? body.donationId : '';
    if (!donationId) return json({ error: 'invalid_request' }, 400);

    const { data: donation } = await adminClient()
      .from('donations')
      .select('id, user_id, status, provider_payment_id')
      .eq('id', donationId)
      .maybeSingle();

    // Чужой донат проверить нельзя
    if (!donation || donation.user_id !== user.id) return json({ error: 'not_found' }, 404);
    if (!donation.provider_payment_id) return json({ status: donation.status });

    const status = await syncDonation(donation.provider_payment_id);
    return json({ status: status ?? donation.status });
  } catch (error) {
    console.error('check-donation', error);
    return json({ error: 'server_error' }, 500);
  }
});
