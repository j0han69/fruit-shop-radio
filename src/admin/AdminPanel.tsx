import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../config/radio';
import { useLanguage } from '../hooks/useLanguage';
import { sendLiveNotification } from '../lib/push';
import { supabase } from '../lib/supabase';
import { useLiveState } from '../providers/LiveStateProvider';

interface AdminPanelProps {
  visible: boolean;
  onClose: () => void;
}

interface AdminDonation {
  id: string;
  amount: number;
  message: string | null;
  created_at: string;
  profiles: { listener_number: number } | null;
}

/**
 * Пульт ведущего. Права проверяются на сервере (RLS: is_admin()),
 * поэтому даже если кто-то откроет этот экран — изменить он ничего не сможет.
 */
export function AdminPanel({ visible, onClose }: AdminPanelProps) {
  const { t } = useLanguage();
  const { isVideoLive, videoUrl, refresh } = useLiveState();
  const [urlDraft, setUrlDraft] = useState(videoUrl ?? '');
  const [toggling, setToggling] = useState(false);
  const [announcing, setAnnouncing] = useState(false);
  const [donations, setDonations] = useState<AdminDonation[]>([]);

  useEffect(() => {
    if (visible) setUrlDraft(videoUrl ?? '');
  }, [visible, videoUrl]);

  const loadDonations = useCallback(async () => {
    const { data } = await supabase
      .from('donations')
      .select('id, amount, message, created_at, profiles(listener_number)')
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false })
      .limit(20);
    setDonations((data as unknown as AdminDonation[]) ?? []);
  }, []);

  useEffect(() => {
    if (visible) void loadDonations();
  }, [visible, loadDonations]);

  const updateState = useCallback(
    async (patch: { is_video_live?: boolean; video_url?: string | null }) => {
      // .select('id') — чтобы заметить отказ RLS (иначе update «успешно» меняет 0 строк)
      const { data, error } = await supabase
        .from('app_state')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', 1)
        .select('id');
      if (error || !data || data.length === 0) {
        Alert.alert(t('adminTitle'), error ? t('adminError') : t('adminForbidden'));
        return false;
      }
      await refresh();
      return true;
    },
    [refresh, t],
  );

  const toggleLive = useCallback(
    async (next: boolean) => {
      setToggling(true);
      await updateState({ is_video_live: next });
      setToggling(false);
    },
    [updateState],
  );

  const saveUrl = useCallback(async () => {
    const trimmed = urlDraft.trim();
    if (await updateState({ video_url: trimmed || null })) {
      Alert.alert(t('adminTitle'), t('adminSaved'));
    }
  }, [urlDraft, updateState, t]);

  const announce = useCallback(() => {
    Alert.alert(t('adminAnnounce'), t('adminAnnounceConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('confirm'),
        onPress: async () => {
          setAnnouncing(true);
          const result = await sendLiveNotification();
          setAnnouncing(false);
          if (result.ok) {
            Alert.alert(t('adminAnnounceSent'), `${result.sent} / ${result.total}`);
          } else {
            Alert.alert(
              t('adminTitle'),
              result.error === 'cooldown'
                ? t('adminCooldown')
                : result.error === 'forbidden'
                  ? t('adminForbidden')
                  : t('adminError'),
            );
          }
        },
      },
    ]);
  }, [t]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('adminTitle')}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>{t('adminClose')}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>{t('adminLiveToggle')}</Text>
                <Text style={[styles.state, isVideoLive && styles.stateOn]}>
                  {isVideoLive ? t('adminLiveOn') : t('adminLiveOff')}
                </Text>
              </View>
              {toggling ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Switch
                  value={isVideoLive}
                  onValueChange={toggleLive}
                  trackColor={{ true: colors.accent, false: colors.border }}
                />
              )}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{t('adminVideoUrl')}</Text>
            <TextInput
              value={urlDraft}
              onChangeText={setUrlDraft}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="https://.../live.m3u8"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
            <Pressable style={styles.secondaryButton} onPress={saveUrl}>
              <Text style={styles.secondaryText}>{t('adminSave')}</Text>
            </Pressable>
          </View>

          <Pressable style={styles.primaryButton} onPress={announce} disabled={announcing}>
            {announcing ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.primaryText}>📣 {t('adminAnnounce')}</Text>
            )}
          </Pressable>

          <View style={styles.card}>
            <Text style={styles.label}>{t('adminRecentDonations')}</Text>
            {donations.length === 0 ? (
              <Text style={styles.muted}>{t('noDonations')}</Text>
            ) : (
              donations.map((d) => (
                <View key={d.id} style={styles.donation}>
                  <Text style={styles.donationTop}>
                    {d.profiles ? `Слушатель_${d.profiles.listener_number}` : '—'} ·{' '}
                    {(d.amount / 100).toLocaleString('ru-RU')} ₽
                  </Text>
                  {d.message ? <Text style={styles.donationMsg}>{d.message}</Text> : null}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  close: { color: colors.accent, fontWeight: '700', fontSize: 15 },
  card: {
    gap: 10,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  state: { marginTop: 4, color: colors.text, fontSize: 22, fontWeight: '800' },
  stateOn: { color: colors.accent },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  primaryButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
  primaryText: { color: colors.surface, fontSize: 15, fontWeight: '800' },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
  },
  secondaryText: { color: colors.text, fontWeight: '700' },
  muted: { color: colors.textSecondary },
  donation: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  donationTop: { color: colors.text, fontWeight: '700' },
  donationMsg: { marginTop: 3, color: colors.textSecondary },
});
