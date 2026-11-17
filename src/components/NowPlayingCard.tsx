import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../config/radio';
import { useLanguage } from '../hooks/useLanguage';
import { NowPlaying } from '../types';

interface NowPlayingCardProps {
  nowPlaying: NowPlaying | null;
  isLoading: boolean;
}

export function NowPlayingCard({
  nowPlaying,
  isLoading,
}: NowPlayingCardProps) {
  const { t } = useLanguage();
  const track = isLoading && !nowPlaying
    ? t('loading')
    : nowPlaying?.track ?? t('streamFallback');
  const artist = isLoading && !nowPlaying
    ? t('loadingHint')
    : nowPlaying?.artist ?? t('streamFallbackHint');

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <Ionicons name="musical-notes" size={17} color={colors.accent} />
        <Text style={styles.label}>{t('nowPlaying')}</Text>
      </View>
      <Text
        accessibilityLiveRegion="polite"
        numberOfLines={2}
        style={styles.track}
      >
        {track}
      </Text>
      <Text numberOfLines={1} style={styles.artist}>
        {artist}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  track: {
    color: colors.text,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
  },
  artist: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 24,
  },
});
