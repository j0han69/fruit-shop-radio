import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Screen } from '../components/Screen';
import { colors, SOCIAL_LINKS } from '../config/radio';
import { languages } from '../config/translations';
import { AnyTranslationKey, useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../providers/AuthProvider';
import { DonationRow, fetchMyDonations } from '../services/donations';

const STATUS_KEYS: Record<DonationRow['status'], AnyTranslationKey> = {
  succeeded: 'statusSucceeded',
  pending: 'statusPending',
  canceled: 'statusCanceled',
  failed: 'statusFailed',
};

const STATUS_COLORS: Record<DonationRow['status'], string> = {
  succeeded: colors.success,
  pending: colors.berry,
  canceled: colors.textSecondary,
  failed: colors.accent,
};

export function ProfileScreen() {
  const { language, setLanguage, t } = useLanguage();
  const { userId, profile, nickname, isReady } = useAuth();
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [isLoadingDonations, setIsLoadingDonations] = useState(false);
  const currentLanguage = languages.find((item) => item.code === language);

  // Обновляем историю при каждом открытии вкладки
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let isActive = true;
      setIsLoadingDonations(true);
      fetchMyDonations()
        .then((rows) => isActive && setDonations(rows))
        .catch(() => undefined)
        .finally(() => isActive && setIsLoadingDonations(false));
      return () => {
        isActive = false;
      };
    }, [userId]),
  );

  const avatarLetter = profile ? String(profile.listener_number).slice(-2) : null;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>{t('profileEyebrow')}</Text>
        <Text style={styles.title}>{t('profileTitle')}</Text>

        <View style={styles.profileCard}>
          <View
            style={[
              styles.avatar,
              profile && { backgroundColor: profile.avatar_color, borderColor: profile.avatar_color },
            ]}
          >
            {avatarLetter ? (
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            ) : (
              <Ionicons name="person" size={42} color={colors.textSecondary} />
            )}
          </View>
          <Text style={styles.name}>
            {nickname ?? (isReady ? t('guest') : t('connecting'))}
          </Text>
          <Text style={styles.description}>{t('anonymousDescription')}</Text>
        </View>

        <View style={styles.socialCard}>
          <Text style={styles.socialTitle}>{t('donationHistory')}</Text>
          {isLoadingDonations && donations.length === 0 ? (
            <ActivityIndicator color={colors.accent} />
          ) : donations.length === 0 ? (
            <Text style={styles.emptyText}>{t('noDonations')}</Text>
          ) : (
            donations.map((donation) => (
              <View key={donation.id} style={styles.donationRow}>
                <View style={styles.donationCopy}>
                  <Text style={styles.donationAmount}>
                    {(donation.amount / 100).toLocaleString('ru-RU')} ₽
                  </Text>
                  <Text style={styles.donationDate}>
                    {new Date(donation.created_at).toLocaleDateString()}
                    {donation.message ? ` · ${donation.message}` : ''}
                  </Text>
                </View>
                <Text style={[styles.donationStatus, { color: STATUS_COLORS[donation.status] }]}>
                  {t(STATUS_KEYS[donation.status])}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.socialCard}>
          <Text style={styles.socialTitle}>{t('socialNetworks')}</Text>
          <View style={styles.socialRow}>
            <Pressable
              accessibilityLabel="Instagram"
              accessibilityRole="link"
              onPress={() => Linking.openURL(SOCIAL_LINKS.instagram).catch(() => undefined)}
              style={({ pressed }) => [
                styles.socialButton,
                styles.instagramButton,
                pressed && styles.languageCardPressed,
              ]}
            >
              <Ionicons name="logo-instagram" size={22} color={colors.surface} />
              <Text style={styles.socialButtonText}>Instagram</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Telegram"
              accessibilityRole="link"
              onPress={() => Linking.openURL(SOCIAL_LINKS.telegram).catch(() => undefined)}
              style={({ pressed }) => [
                styles.socialButton,
                styles.telegramButton,
                pressed && styles.languageCardPressed,
              ]}
            >
              <Ionicons name="paper-plane" size={20} color={colors.surface} />
              <Text style={styles.socialButtonText}>Telegram</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsLanguageModalVisible(true)}
          style={({ pressed }) => [
            styles.languageCard,
            pressed && styles.languageCardPressed,
          ]}
          testID="language-trigger"
        >
          <View style={styles.languageTriggerContent} testID="language-trigger-content">
            <View style={styles.languageIcon}>
              <Ionicons name="language" size={25} color={colors.plum} />
            </View>
            <View style={styles.languageCopy}>
              <Text style={styles.languageLabel}>{t('language')}</Text>
              <Text style={styles.languageValue}>{currentLanguage?.nativeName}</Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={21}
            color={colors.textSecondary}
            style={styles.languageChevron}
          />
        </Pressable>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsLanguageModalVisible(false)}
        transparent
        visible={isLanguageModalVisible}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            accessibilityLabel={t('closeLanguageSelector')}
            onPress={() => setIsLanguageModalVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.languageSheet} testID="language-selector">
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('chooseLanguage')}</Text>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isSelected = item.code === language;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      setLanguage(item.code);
                      setIsLanguageModalVisible(false);
                    }}
                    style={({ pressed }) => [
                      styles.languageOption,
                      isSelected && styles.languageOptionSelected,
                      pressed && styles.languageCardPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.languageOptionText,
                        isSelected && styles.languageOptionTextSelected,
                      ]}
                    >
                      {item.nativeName}
                    </Text>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={23} color={colors.accent} />
                    ) : null}
                  </Pressable>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 4,
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  profileCard: {
    alignItems: 'center',
    marginTop: 24,
    padding: 26,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  name: {
    marginTop: 15,
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  description: {
    maxWidth: 270,
    marginTop: 7,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 32,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  donationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  donationCopy: {
    flex: 1,
  },
  donationAmount: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  donationDate: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 12,
  },
  donationStatus: {
    fontSize: 12,
    fontWeight: '800',
  },
  socialCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  socialTitle: {
    marginBottom: 13,
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  socialButton: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  instagramButton: {
    backgroundColor: colors.berry,
  },
  telegramButton: {
    backgroundColor: '#299ED6',
  },
  socialButtonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '800',
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  languageCardPressed: {
    opacity: 0.75,
  },
  languageTriggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lime,
  },
  languageCopy: {
    alignItems: 'center',
    marginLeft: 12,
  },
  languageLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  languageValue: {
    marginTop: 4,
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  languageChevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(50, 26, 59, 0.55)',
  },
  languageSheet: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '68%',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    borderRadius: 24,
    backgroundColor: colors.background,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 34,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
    backgroundColor: colors.border,
  },
  sheetTitle: {
    marginBottom: 10,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
    marginBottom: 3,
    borderRadius: 12,
  },
  languageOptionSelected: {
    backgroundColor: 'rgba(255, 98, 62, 0.12)',
  },
  languageOptionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  languageOptionTextSelected: {
    color: colors.accent,
    fontWeight: '800',
  },
});
