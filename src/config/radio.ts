// Все значения здесь ПУБЛИЧНЫЕ. Секреты живут только в Supabase Secrets.
// EXPO_PUBLIC_* подставляются из файла .env при сборке (см. .env.example).

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';
export const IS_BACKEND_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const STREAM_URL =
  process.env.EXPO_PUBLIC_STREAM_URL || 'https://example.com/stream.mp3';
export const METADATA_URL = process.env.EXPO_PUBLIC_METADATA_URL ?? '';
export const ICECAST_MOUNT = process.env.EXPO_PUBLIC_ICECAST_MOUNT ?? '';

export const NOW_PLAYING_POLL_INTERVAL_MS = 15_000;
export const QUICK_DONATION_AMOUNTS = [100, 300, 500, 1000] as const;
export const MIN_DONATION_RUB = 10;
export const MAX_DONATION_RUB = 100_000;
/** Должен совпадать с DONATION_RETURN_URL в Supabase Secrets и со scheme в app.json */
export const DONATION_RETURN_URL = 'fruktovaya-lavka://donate-complete';

// TODO: заменить на официальные адреса аккаунтов радио.
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/',
  telegram: 'https://t.me/',
} as const;

export const colors = {
  background: '#FFF7E8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFF0D4',
  accent: '#FF623E',
  accentPressed: '#E44928',
  text: '#321A3B',
  textSecondary: '#7A6A75',
  border: '#EFDDBE',
  success: '#4C9951',
  plum: '#321A3B',
  lime: '#B8E35B',
  yellow: '#FFD34E',
  berry: '#8D52C7',
  navText: '#C8B9CC',
} as const;
