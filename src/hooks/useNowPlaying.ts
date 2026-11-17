import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { NOW_PLAYING_POLL_INTERVAL_MS } from '../config/radio';
import { fetchNowPlaying } from '../services/radio';
import { NowPlaying } from '../types';

const MAX_BACKOFF_MS = 120_000;

// Кэш на уровне модуля: при повторном монтировании экрана трек виден сразу
let cachedNowPlaying: NowPlaying | null = null;

/**
 * Опрашивает метаданные Icecast / Radio.co каждые 15 секунд.
 * • При ошибке показывает последний известный трек (не стирает данные).
 * • При серии ошибок увеличивает интервал (до 2 минут).
 * • В фоне опрос останавливается, при возврате — сразу обновляется.
 */
export function useNowPlaying() {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(cachedNowPlaying);
  const [isLoading, setIsLoading] = useState(cachedNowPlaying === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let failures = 0;

    const schedule = () => {
      if (!isActive) return;
      const delay = Math.min(NOW_PLAYING_POLL_INTERVAL_MS * 2 ** failures, MAX_BACKOFF_MS);
      timer = setTimeout(() => void load(), delay);
    };

    const load = async () => {
      timer = null;
      try {
        const data = await fetchNowPlaying();
        if (!isActive) return;
        failures = 0;
        setError(null);
        const isSame =
          data?.artist === cachedNowPlaying?.artist && data?.track === cachedNowPlaying?.track;
        if (!isSame) {
          cachedNowPlaying = data;
          setNowPlaying(data);
        }
      } catch (e) {
        if (!isActive) return;
        failures = Math.min(failures + 1, 4);
        setError(e instanceof Error ? e.message : 'unknown');
      } finally {
        if (isActive) {
          setIsLoading(false);
          if (AppState.currentState === 'active') schedule();
        }
      }
    };

    void load();

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        if (!timer) void load();
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    });

    return () => {
      isActive = false;
      if (timer) clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return { nowPlaying, isLoading, error };
}
