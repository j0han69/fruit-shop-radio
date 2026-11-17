// POST /functions/v1/create-donation
// body: { amountRub: number, message?: string }
// Создаёт платёж в ЮKassa и pending-строку в donations.
// Возвращает { donationId, confirmationUrl } — клиент открывает страницу оплаты.
// Никаких персональных данных: в ЮKassa уходит только сумма и анонимный donation_id.
import { adminClient, corsHeaders, getUser, json, yooCreatePayment } from '../_shared/utils.ts';

const MIN_RUB = 10;
const MAX_RUB = 100_000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: 'unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const amountRub = Number(body?.amountRub);
    if (!Number.isInteger(amountRub) || amountRub < MIN_RUB || amountRub > MAX_RUB) {
      return json({ error: 'invalid_amount', min: MIN_RUB, max: MAX_RUB }, 400);
    }
    const message =
      typeof body?.message === 'string' && body.message.trim()
        ? body.message.trim().slice(0, 200)
        : null;

    const db = adminClient();
    const returnUrl = Deno.env.get('DONATION_RETURN_URL') ?? 'fruktovaya-lavka://donate-complete';

    // 1) Сначала создаём строку, чтобы её id ушёл в metadata платежа
    const { data: donation, error: insertError } = await db
      .from('donations')
      .insert({
        user_id: user.id,
        amount: amountRub * 100,
        currency: 'RUB',
        message,
        status: 'pending',
        provider: 'yookassa',
        return_url: returnUrl,
      })
      .select('id')
      .single();
    if (insertError || !donation) throw insertError ?? new Error('insert failed');

    // 2) Создаём платёж. Idempotence-Key = id доната → повтор запроса не создаст второй платёж
    const payment = await yooCreatePayment(
      {
        amount: { value: amountRub.toFixed(2), currency: 'RUB' },
        capture: true,
        confirmation: { type: 'redirect', return_url: returnUrl },
        description: 'Поддержка радио «Фруктовая лавка»',
        metadata: { donation_id: donation.id },
      },
      donation.id,
    );

    await db
      .from('donations')
      .update({ provider_payment_id: payment.id, updated_at: new Date().toISOString() })
      .eq('id', donation.id);

    const confirmationUrl = payment.confirmation?.confirmation_url;
    if (!confirmationUrl) throw new Error('no confirmation_url');

    return json({ donationId: donation.id, confirmationUrl });
  } catch (error) {
    console.error('create-donation', error);
    return json({ error: 'server_error' }, 500);
  }
});
