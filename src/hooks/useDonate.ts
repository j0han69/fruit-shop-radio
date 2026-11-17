import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { MAX_DONATION_RUB, MIN_DONATION_RUB } from '../config/radio';
import { processDonation } from '../services/donations';
import { useLanguage } from './useLanguage';

export function useDonate(onSuccess?: () => void) {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);

  const donate = useCallback(
    async (amountRub: number, message: string) => {
      if (isProcessing) return;
      const amount = Math.round(amountRub);
      if (!Number.isFinite(amount) || amount < MIN_DONATION_RUB || amount > MAX_DONATION_RUB) {
        Alert.alert(t('invalidAmountTitle'), t('invalidAmountRange'));
        return;
      }

      setIsProcessing(true);
      try {
        const outcome = await processDonation(amount, message.trim());
        switch (outcome) {
          case 'succeeded':
            Alert.alert(t('donateSuccessTitle'), t('donateSuccessText'));
            onSuccess?.();
            break;
          case 'pending':
            Alert.alert(t('donatePendingTitle'), t('donatePendingText'));
            onSuccess?.();
            break;
          case 'canceled':
            Alert.alert(t('donateCanceled'));
            break;
          case 'backend_off':
            Alert.alert(t('donateErrorTitle'), t('donateBackendOff'));
            break;
          default:
            Alert.alert(t('donateErrorTitle'), t('donateErrorText'));
        }
      } catch {
        Alert.alert(t('donateErrorTitle'), t('donateErrorText'));
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, onSuccess, t],
  );

  return { donate, isProcessing };
}
