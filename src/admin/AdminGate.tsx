import { PropsWithChildren, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, IS_BACKEND_CONFIGURED } from '../config/radio';
import { useLanguage } from '../hooks/useLanguage';
import { readFunctionError, supabase } from '../lib/supabase';
import { AdminPanel } from './AdminPanel';

const LONG_PRESS_MS = 2500;

/**
 * Скрытый вход в админку: оборачивает заголовок/логотип.
 * Долгое нажатие (2,5 с) → если этот анонимный ID уже админ, сразу пульт,
 * иначе — окно ввода PIN. PIN проверяется ТОЛЬКО на сервере (admin-unlock).
 */
export function AdminGate({ children }: PropsWithChildren) {
  const { t } = useLanguage();
  const [pinVisible, setPinVisible] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openGate = useCallback(async () => {
    if (!IS_BACKEND_CONFIGURED) return;
    const { data } = await supabase.rpc('is_admin');
    if (data === true) setPanelVisible(true);
    else {
      setPin('');
      setError(null);
      setPinVisible(true);
    }
  }, []);

  const submitPin = useCallback(async () => {
    if (!pin || busy) return;
    setBusy(true);
    setError(null);
    const { error: fnError } = await supabase.functions.invoke('admin-unlock', { body: { pin } });
    setBusy(false);
    if (fnError) {
      const code = await readFunctionError(fnError);
      setError(
        code === 'wrong_pin'
          ? t('adminWrongPin')
          : code === 'too_many_attempts'
            ? t('adminTooMany')
            : t('adminError'),
      );
      return;
    }
    setPin('');
    setPinVisible(false);
    setPanelVisible(true);
  }, [pin, busy, t]);

  return (
    <>
      <Pressable onLongPress={openGate} delayLongPress={LONG_PRESS_MS}>
        {children}
      </Pressable>

      <Modal
        visible={pinVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPinVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.backdrop}
        >
          <View style={styles.card}>
            <Text style={styles.title}>{t('adminPinPrompt')}</Text>
            <TextInput
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={12}
              autoFocus
              style={styles.input}
              onSubmitEditing={submitPin}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.row}>
              <Pressable style={styles.secondary} onPress={() => setPinVisible(false)}>
                <Text style={styles.secondaryText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable style={styles.primary} onPress={submitPin} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.primaryText}>{t('adminUnlock')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AdminPanel visible={panelVisible} onClose={() => setPanelVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(50, 26, 59, 0.55)',
  },
  card: {
    gap: 14,
    padding: 22,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 22,
    letterSpacing: 6,
    textAlign: 'center',
  },
  error: {
    color: colors.accent,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  primary: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  primaryText: {
    color: colors.surface,
    fontWeight: '800',
  },
  secondary: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
  },
  secondaryText: {
    color: colors.text,
    fontWeight: '700',
  },
});
