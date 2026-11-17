import * as WebBrowser from 'expo-web-browser';

import { DONATION_RETURN_URL, IS_BACKEND_CONFIGURED } from '../config/radio';
import { readFunctionError, supabase } from '../lib/supabase';

export type DonationOutcome =
  | 'succeeded'
  | 'pending'
  | 'canceled'
  | 'failed'
  | 'backend_off'
  | 'unauthorized';

/**
 * Поток оплаты (ЮKassa, без персональных данных):
 * 1. Edge Function create-donation создаёт платёж → возвращает confirmationUrl
 * 2. Открываем страницу оплаты ЮKassa во встроенном браузере
 * 3. После закрытия/возврата спрашиваем check-donation — сервер сверяет статус с ЮKassa
 * Секретный ключ ЮKassa живёт ТОЛЬКО в Supabase Secrets.
 */
export async function processDonation(amountRub: number, message: string): Promise<DonationOutcome> {
  if (!IS_BACKEND_CONFIGURED) return 'backend_off';

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return 'unauthorized';

  const { data, error } = await supabase.functions.invoke('create-donation', {
    body: { amountRub, message: message || undefined },
  });
  if (error || !data?.confirmationUrl || !data?.donationId) {
    if (error) console.warn('create-donation:', await readFunctionError(error));
    return 'failed';
  }

  const result = await WebBrowser.openAuthSessionAsync(data.confirmationUrl, DONATION_RETURN_URL);

  const status = await checkDonation(data.donationId);
  if (status === 'succeeded') return 'succeeded';
  if (status === 'canceled') return 'canceled';
  // Пользователь закрыл окно, не оплатив
  if (result.type === 'cancel' || result.type === 'dismiss') {
    return status === 'pending' ? 'canceled' : 'failed';
  }
  return 'pending';
}

async function checkDonation(donationId: string): Promise<string | null> {
  // Банк иногда подтверждает с задержкой — делаем пару попыток
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase.functions.invoke('check-donation', {
      body: { donationId },
    });
    if (!error && data?.status && data.status !== 'pending') return data.status as string;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return 'pending';
}

export interface DonationRow {
  id: string;
  amount: number; // в копейках
  currency: string;
  message: string | null;
  status: 'pending' | 'succeeded' | 'canceled' | 'failed';
  created_at: string;
}

/** История донатов текущего анонимного пользователя (RLS отдаёт только свои). */
export async function fetchMyDonations(): Promise<DonationRow[]> {
  if (!IS_BACKEND_CONFIGURED) return [];
  const { data, error } = await supabase
    .from('donations')
    .select('id, amount, currency, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as DonationRow[];
}
