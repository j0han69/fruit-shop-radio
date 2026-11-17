import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { IS_BACKEND_CONFIGURED } from '../config/radio';
import { supabase } from '../lib/supabase';

interface AppStateRow {
  is_video_live: boolean;
  video_url: string | null;
}

interface LiveStateValue {
  isVideoLive: boolean;
  videoUrl: string | null;
  refresh: () => Promise<void>;
}

const LiveStateContext = createContext<LiveStateValue | null>(null);

/**
 * Глобальный флаг эфира из таблицы app_state (id = 1).
 * Админ меняет его — все клиенты получают UPDATE через Supabase Realtime.
 * На аудио этот флаг НЕ влияет: он переключает только видео/заглушку.
 */
export function LiveStateProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppStateRow>({ is_video_live: false, video_url: null });

  const refresh = useCallback(async () => {
    if (!IS_BACKEND_CONFIGURED) return;
    const { data } = await supabase
      .from('app_state')
      .select('is_video_live, video_url')
      .eq('id', 1)
      .maybeSingle();
    if (data) setState(data as AppStateRow);
  }, []);

  useEffect(() => {
    if (!IS_BACKEND_CONFIGURED) return;
    void refresh();

    const channel = supabase
      .channel('app_state_live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_state', filter: 'id=eq.1' },
        (payload) => {
          const row = payload.new as Partial<AppStateRow>;
          setState((prev) => ({
            is_video_live: row.is_video_live ?? prev.is_video_live,
            video_url: row.video_url !== undefined ? row.video_url : prev.video_url,
          }));
        },
      )
      .subscribe((status) => {
        // После (пере)подключения перечитываем — могли пропустить событие
        if (status === 'SUBSCRIBED') void refresh();
      });

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh();
    });

    return () => {
      appStateSub.remove();
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ isVideoLive: state.is_video_live, videoUrl: state.video_url, refresh }),
    [state, refresh],
  );

  return <LiveStateContext.Provider value={value}>{children}</LiveStateContext.Provider>;
}

export function useLiveState() {
  const context = useContext(LiveStateContext);
  if (!context) throw new Error('useLiveState must be used inside LiveStateProvider');
  return context;
}
