import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { readFunctionError, supabase } from './supabase';

// Показываем уведомление, даже если приложение открыто
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Запрашивает разрешение, получает Expo push-токен и сохраняет его в Supabase
 * через RPC register_push_token (привязка к анонимному ID).
 * Возвращает токен или null (эмулятор, отказ, нет projectId).
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('live', {
      name: 'Начало эфира',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('push: нет EAS projectId — выполните `eas init`');
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const { error } = await supabase.rpc('register_push_token', {
    p_token: token,
    p_platform: Platform.OS,
  });
  if (error) console.warn('push: не удалось сохранить токен', error.message);
  return token;
}

export type SendLiveResult =
  | { ok: true; total: number; sent: number }
  | { ok: false; error: string };

/** Рассылка «Мы в эфире!» всем устройствам. Работает только для админа (проверка на сервере). */
export async function sendLiveNotification(title?: string, body?: string): Promise<SendLiveResult> {
  const { data, error } = await supabase.functions.invoke('send-live-notification', {
    body: { title, body },
  });
  if (error) return { ok: false, error: await readFunctionError(error) };
  return { ok: true, total: data?.total ?? 0, sent: data?.sent ?? 0 };
}
