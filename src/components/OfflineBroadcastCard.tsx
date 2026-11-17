import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '../config/radio';
import { useLanguage } from '../hooks/useLanguage';

interface OfflineBroadcastCardProps {
  title?: string;
  description?: string;
}

const equalizerHeights = [9, 16, 12, 19, 11];

export function OfflineBroadcastCard({
  title,
  description,
}: OfflineBroadcastCardProps) {
  const { t } = useLanguage();
  const equalizer = useRef(equalizerHeights.map(() => new Animated.Value(0.35))).current;

  useEffect(() => {
    const animations = equalizer.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 110),
          Animated.timing(value, {
            toValue: 1,
            duration: 330 + index * 45,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.25,
            duration: 330 + index * 45,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [equalizer]);

  return (
    <View style={styles.card}>
      <Image
        accessibilityLabel={t('offlineTitle')}
        resizeMode="cover"
        source={require('../../assets/offline-dj.png')}
        style={styles.image}
        testID="offline-image"
      />

      <View style={styles.content}>
        <View style={styles.statusRow}>
          <View style={styles.equalizer}>
            {equalizer.map((value, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.equalizerBar,
                  { height: equalizerHeights[index], transform: [{ scaleY: value }] },
                ]}
                testID={`offline-equalizer-${index}`}
              />
            ))}
          </View>
          <Text style={styles.status}>{t('offlineStatus')}</Text>
        </View>
        <Text style={styles.title}>{title ?? t('offlineTitle')}</Text>
        <Text style={styles.description}>{description ?? t('offlineDescription')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: colors.plum,
    borderWidth: 1,
    borderColor: colors.plum,
  },
  image: {
    width: '100%',
    height: 260,
  },
  content: {
    padding: 22,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  equalizer: {
    height: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  equalizerBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.lime,
  },
  status: {
    color: colors.yellow,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 12,
    color: colors.surface,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  description: {
    marginTop: 7,
    color: colors.navText,
    fontSize: 13,
    lineHeight: 19,
  },
});
