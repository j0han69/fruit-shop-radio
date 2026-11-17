import { useLiveState } from '../providers/LiveStateProvider';

/**
 * @deprecated Оставлен для совместимости. Используйте useLiveState().
 * Раньше опрашивал мок-API, теперь берёт флаг из Supabase Realtime.
 */
export function useBroadcastStatus(): boolean {
  return useLiveState().isVideoLive;
}
