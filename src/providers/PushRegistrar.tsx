import { useEffect, useRef } from 'react';

import { registerForPushNotifications } from '../lib/push';
import { useAuth } from './AuthProvider';

/** Регистрирует push-токен один раз, когда появился анонимный пользователь. */
export function PushRegistrar() {
  const { userId } = useAuth();
  const registeredFor = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || registeredFor.current === userId) return;
    registeredFor.current = userId;
    registerForPushNotifications().catch((error) => {
      console.warn('push registration failed', error);
      registeredFor.current = null;
    });
  }, [userId]);

  return null;
}
