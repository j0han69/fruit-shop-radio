/**
 * Аудио-синглтон радио.
 *
 * Плеер создаётся ОДИН раз на всё приложение, вне React-дерева.
 * Поэтому ни смена вкладок, ни перемонтирование экранов, ни включение/выключение
 * видео его не пересоздают — звук не прерывается.
 *
 * React-компоненты подписываются на состояние через useSyncExternalStore
 * (см. src/hooks/useRadioPlayer.ts).
 */
import {
  type AudioPlayer,
  type AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';

export type RadioErrorCode = 'audioMode' | 'stream' | null;

export interface RadioAudioState {
  isAudioPlaying: boolean;
  isBuffering: boolean;
  hasLiveSignal: boolean;
  volume: number;
  errorCode: RadioErrorCode;
}

let player: AudioPlayer | null = null;
let currentUrl: string | null = null;
let audioModeReady: Promise<void> | null = null;
/** Пользователь хочет слушать (нажал Play) — для автопереподключения */
let wantsToPlay = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

let state: RadioAudioState = {
  isAudioPlaying: false,
  isBuffering: false,
  hasLiveSignal: false,
  volume: 0.8,
  errorCode: null,
};

const listeners = new Set<() => void>();

function setState(patch: Partial<RadioAudioState>) {
  const next = { ...state, ...patch };
  const changed = (Object.keys(next) as (keyof RadioAudioState)[]).some(
    (key) => next[key] !== state[key],
  );
  if (!changed) return;
  state = next;
  listeners.forEach((listener) => listener());
}

function ensureAudioMode() {
  if (!audioModeReady) {
    audioModeReady = setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    }).catch(() => {
      audioModeReady = null;
      setState({ errorCode: 'audioMode' });
    });
  }
  return audioModeReady;
}

function onStatus(status: AudioStatus) {
  setState({
    isAudioPlaying: status.playing,
    isBuffering: status.isBuffering,
    hasLiveSignal: status.playing ? true : status.didJustFinish ? false : state.hasLiveSignal,
    errorCode: status.playing ? null : state.errorCode,
  });

  // Живой поток «закончился» (обрыв сети/сервера) — переподключаемся
  if (status.didJustFinish && wantsToPlay) scheduleReconnect();
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (!player || !currentUrl || !wantsToPlay) return;
    try {
      player.replace({ uri: currentUrl });
      player.play();
    } catch {
      setState({ errorCode: 'stream' });
    }
  }, 3000);
}

/** Создаёт плеер при первом вызове. Повторные вызовы с тем же URL ничего не делают. */
export function initRadioAudio(streamUrl: string) {
  void ensureAudioMode();
  if (player) {
    if (currentUrl !== streamUrl) {
      currentUrl = streamUrl;
      player.replace({ uri: streamUrl });
    }
    return;
  }
  currentUrl = streamUrl;
  player = createAudioPlayer({ uri: streamUrl });
  player.volume = state.volume;
  player.addListener('playbackStatusUpdate', onStatus);
}

export async function playRadio() {
  if (!player) return;
  wantsToPlay = true;
  await ensureAudioMode();
  try {
    setState({ errorCode: null });
    player.play();
  } catch {
    setState({ errorCode: 'stream' });
  }
}

export function pauseRadio() {
  wantsToPlay = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  try {
    player?.pause();
  } catch {
    setState({ errorCode: 'stream' });
  }
}

export function toggleRadio() {
  if (state.isAudioPlaying || wantsToPlay) pauseRadio();
  else void playRadio();
}

export function setRadioVolume(volume: number) {
  const normalized = Math.max(0, Math.min(1, volume));
  if (player) player.volume = normalized;
  setState({ volume: normalized });
}

export function subscribeRadio(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRadioState(): RadioAudioState {
  return state;
}
