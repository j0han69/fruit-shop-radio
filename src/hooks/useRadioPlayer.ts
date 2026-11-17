import { useSyncExternalStore } from 'react';

import {
  getRadioState,
  initRadioAudio,
  setRadioVolume,
  subscribeRadio,
  toggleRadio,
} from '../audio/radioAudio';
import { useLanguage } from './useLanguage';

/**
 * Хук ТОЛЬКО для аудио. Ничего не знает про видео.
 * Плеер — синглтон (src/audio/radioAudio.ts), поэтому хук можно вызывать
 * в любом количестве компонентов: поток один и не перезапускается.
 */
export function useRadioPlayer(streamUrl: string) {
  const { t } = useLanguage();
  initRadioAudio(streamUrl); // идемпотентно: создаёт плеер только в первый раз
  const state = useSyncExternalStore(subscribeRadio, getRadioState, getRadioState);

  const error =
    state.errorCode === 'audioMode'
      ? t('audioModeError')
      : state.errorCode === 'stream'
        ? t('streamError')
        : null;

  return {
    isAudioPlaying: state.isAudioPlaying,
    /** Алиас для совместимости с PlayerControls */
    isPlaying: state.isAudioPlaying,
    isBuffering: state.isBuffering,
    isLive: state.hasLiveSignal,
    volume: state.volume,
    error,
    togglePlayback: toggleRadio,
    setVolume: setRadioVolume,
  };
}
