// POST /functions/v1/yookassa-webhook  (деплоить с --no-verify-jwt)
// URL указывается в ЛК ЮKassa → Интеграция → HTTP-уведомления.
// События: payment.succeeded, payment.canceled.
//
// ЮKassa не подписывает уведомления, поэтому телу НЕ доверяем:
// берём из него только id платежа и запрашиваем настоящий статус через API
// с секретным ключом. Подделать результат невозможно.
import { json, syncDonation } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const body = await req.json().catch(() => null);
    const paymentId = body?.object?.id;
    if (typeof paymentId !== 'string' || !/^[\w-]{10,64}$/.test(paymentId)) {
      return json({ ok: true }); // мусор — отвечаем 200, чтобы ЮKassa не повторяла
    }

    await syncDonation(paymentId);
    return json({ ok: true });
  } catch (error) {
    console.error('yookassa-webhook', error);
    // 500 → ЮKassa повторит уведомление позже
    return json({ error: 'server_error' }, 500);
  }
});
