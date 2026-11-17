// Общие утилиты для всех Edge Functions (Deno).
// Секреты читаются ТОЛЬКО из Deno.env (Supabase → Edge Functions → Secrets).
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret: ${name}`);
  return value;
}

/** Клиент с service_role: обходит RLS. Использовать только на сервере. */
export function adminClient(): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Достаёт пользователя из заголовка Authorization: Bearer <jwt>. */
export async function getUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return null;
  const { data, error } = await adminClient().auth.getUser(jwt);
  if (error || !data.user) return null;
  return data.user;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await adminClient()
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data);
}

// ---------------------------------------------------------------- ЮKassa
const YOOKASSA_API = 'https://api.yookassa.ru/v3';

function yookassaAuth(): string {
  const shopId = requireEnv('YOOKASSA_SHOP_ID');
  const secret = requireEnv('YOOKASSA_SECRET_KEY');
  return 'Basic ' + btoa(`${shopId}:${secret}`);
}

export interface YooPayment {
  id: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  paid: boolean;
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  metadata?: Record<string, string>;
}

export async function yooCreatePayment(body: unknown, idempotenceKey: string): Promise<YooPayment> {
  const res = await fetch(`${YOOKASSA_API}/payments`, {
    method: 'POST',
    headers: {
      Authorization: yookassaAuth(),
      'Idempotence-Key': idempotenceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`YooKassa ${res.status}: ${await res.text()}`);
  return await res.json();
}

/** Запрашиваем платёж напрямую у ЮKassa — единственный надёжный источник статуса. */
export async function yooGetPayment(paymentId: string): Promise<YooPayment> {
  const res = await fetch(`${YOOKASSA_API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: yookassaAuth() },
  });
  if (!res.ok) throw new Error(`YooKassa ${res.status}: ${await res.text()}`);
  return await res.json();
}

/** Переводит статус ЮKassa в статус нашей таблицы donations. */
export function mapYooStatus(status: YooPayment['status']): 'pending' | 'succeeded' | 'canceled' {
  if (status === 'succeeded') return 'succeeded';
  if (status === 'canceled') return 'canceled';
  return 'pending';
}

/** Синхронизирует строку donations с реальным статусом платежа. succeeded не перезаписывается. */
export async function syncDonation(paymentId: string): Promise<string | null> {
  const payment = await yooGetPayment(paymentId);
  const status = mapYooStatus(payment.status);
  const db = adminClient();
  const { data } = await db
    .from('donations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('provider_payment_id', paymentId)
    .neq('status', 'succeeded')
    .select('status')
    .maybeSingle();
  if (data) return data.status as string;
  const { data: current } = await db
    .from('donations')
    .select('status')
    .eq('provider_payment_id', paymentId)
    .maybeSingle();
  return (current?.status as string | undefined) ?? null;
}
