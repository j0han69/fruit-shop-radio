import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'; // TextInput используется для customAmount

import { Screen } from '../components/Screen';
import { colors, QUICK_DONATION_AMOUNTS } from '../config/radio';
import { useLanguage } from '../hooks/useLanguage';
import { useDonate } from '../hooks/useDonate';

export function DonateScreen() {
  const { t } = useLanguage();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(300);
  const [customAmount, setCustomAmount] = useState('');
  const { donate, isProcessing } = useDonate();

  const parsedCustomAmount = Number(customAmount.replace(',', '.'));
  const amount = selectedAmount ?? parsedCustomAmount;

  const selectQuickAmount = (value: number) => {
    setSelectedAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    setSelectedAmount(null);
    setCustomAmount(value);
  };

  const handleDonate = () => {
    void donate(amount, '');
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>{t('donateEyebrow')}</Text>
        <Text style={styles.title}>{t('donateTitle')}</Text>
        <Text style={styles.subtitle}>{t('donateSubtitle')}</Text>

        <Text style={styles.donateNote}>{t('donateNote')}</Text>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="heart" size={34} color={colors.accent} />
          </View>
          <Text style={styles.heroTitle}>{t('donateHeroTitle')}</Text>
          <Text style={styles.heroText}>{t('donateHeroText')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('amountTitle')}</Text>
          <View style={styles.amountGrid}>
            {QUICK_DONATION_AMOUNTS.map((value) => {
              const isSelected = selectedAmount === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={value}
                  onPress={() => selectQuickAmount(value)}
                  style={({ pressed }) => [
                    styles.amountButton,
                    isSelected && styles.amountButtonSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.amountButtonText,
                      isSelected && styles.amountButtonTextSelected,
                    ]}
                  >
                    {value} ₽
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>{t('customAmount')}</Text>
          <View style={styles.amountInputWrapper}>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={handleCustomAmount}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              selectionColor={colors.accent}
              style={styles.amountInput}
              value={customAmount}
            />
            <Text style={styles.currency}>₽</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: isProcessing, disabled: isProcessing }}
          disabled={isProcessing}
          onPress={handleDonate}
          style={({ pressed }) => [
            styles.donateButton,
            (pressed || isProcessing) && styles.donateButtonPressed,
          ]}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator color={colors.text} />
              <Text style={styles.donateButtonText}>{t('donateProcessing')}</Text>
            </>
          ) : (
            <>
              <Ionicons name="heart" size={20} color={colors.text} />
              <Text style={styles.donateButtonText}>{t('support')}</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>{t('donateDisclaimer')}</Text>
      </ScrollView>
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
  subtitle: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  hero: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 26,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 98, 62, 0.25)',
    backgroundColor: 'rgba(255, 98, 62, 0.07)',
  },
  heroIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 98, 62, 0.13)',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroText: {
    marginTop: 7,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 13,
  },
  amountButton: {
    width: '48%',
    flexGrow: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  amountButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(255, 98, 62, 0.12)',
  },
  amountButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  amountButtonTextSelected: {
    color: colors.accent,
  },
  pressed: {
    opacity: 0.75,
  },
  inputLabel: {
    marginTop: 18,
    marginBottom: 9,
    color: colors.textSecondary,
    fontSize: 12,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  currency: {
    paddingRight: 18,
    color: colors.textSecondary,
    fontSize: 18,
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
  },
  donateButtonPressed: {
    backgroundColor: colors.accentPressed,
    transform: [{ scale: 0.99 }],
  },
  donateButtonText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  disclaimer: {
    marginTop: 14,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
  donateNote: {
    marginTop: 16,
    marginBottom: 8,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
});
