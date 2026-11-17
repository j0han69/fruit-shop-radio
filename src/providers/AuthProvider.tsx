import type { Session } from '@supabase/supabase-js';
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

export interface Profile {
  id: string;
  listener_number: number;
  avatar_color: string;
}

interface AuthContextValue {
  session: Session | null;
  userId: string | null;
  profile: Profile | null;
  nickname: string | null;
  isReady: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Анонимный вход (Privacy by Design): ни email, ни телефона.
 * Сессия хранится в AsyncStorage, поэтому ID и история донатов
 * сохраняются между запусками (но теряются при удалении приложения).
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isReady, setIsReady] = useState(!IS_BACKEND_CONFIGURED);

  const ensureSession = useCallback(async () => {
    if (!IS_BACKEND_CONFIGURED) return;
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setSession(data.session);
      setIsReady(true);
      return;
    }
    const { data: signIn, error } = await supabase.auth.signInAnonymously();
    if (error) console.warn('Anonymous sign-in failed:', error.message);
    setSession(signIn.session ?? null);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!IS_BACKEND_CONFIGURED) return;
    void ensureSession();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    // Если при запуске не было сети — пробуем снова при возврате в приложение
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void ensureSession();
    });
    return () => {
      sub.subscription.unsubscribe();
      appStateSub.remove();
    };
  }, [ensureSession]);

  const userId = session?.user.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, listener_number, avatar_color')
      .eq('id', userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    void refreshProfile();
  }, [userId, refreshProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      userId,
      profile,
      nickname: profile ? `Слушатель_${profile.listener_number}` : null,
      isReady,
      refreshProfile,
    }),
    [session, userId, profile, isReady, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
