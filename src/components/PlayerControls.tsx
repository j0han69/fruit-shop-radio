import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../config/radio';
import { useLanguage } from '../hooks/useLanguage';

interface PlayerControlsProps {
  isPlaying: boolean;
  isBuffering: boolean;
  volume: number;
  listeningTime: string;
  onTogglePlayback: () => void;
  onVolumeChange: (volume: number) => void;
}

export function PlayerControls({
  isPlaying,
  isBuffering,
  volume,
  listeningTime,
  onTogglePlayback,
  onVolumeChange,
}: PlayerControlsProps) {
  const { t } = useLanguage();
  const volumePercent = Math.round(volume * 100);

  return (
    <View style={styles.container}>
      <View style={styles.playbackRow}>
        <View>
          <Text style={styles.timeLabel}>{t('listeningTime')}</Text>
          <Text style={styles.time}>{listeningTime}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? t('pause') : t('play')}
          onPress={onTogglePlayback}
          style={({ pressed }) => [
            styles.playButton,
            pressed && styles.playButtonPressed,
          ]}
        >
          {isBuffering && !isPlaying ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={30}
              color={colors.text}
              style={!isPlaying && styles.playIcon}
            />
          )}
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.volumeHeader}>
        <View style={styles.volumeTitleRow}>
          <Ionicons name="volume-high" size={18} color={colors.textSecondary} />
          <Text style={styles.volumeTitle}>{t('volume')}</Text>
        </View>
        <Text style={styles.volumeValue}>{volumePercent}%</Text>
      </View>
      <View style={styles.volumeControl}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('decreaseVolume')}
          hitSlop={10}
          onPress={() => onVolumeChange(volume - 0.1)}
          style={styles.volumeButton}
        >
          <Ionicons name="remove" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.volumeTrack}>
          <View
            style={[styles.volumeFill, { width: `${volumePercent}%` }]}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('increaseVolume')}
          hitSlop={10}
          onPress={() => onVolumeChange(volume + 0.1)}
          style={styles.volumeButton}
        >
          <Ionicons name="add" size={20} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  time: {
    marginTop: 6,
    color: colors.text,
    fontSize: 25,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  playButtonPressed: {
    backgroundColor: colors.accentPressed,
    transform: [{ scale: 0.96 }],
  },
  playIcon: {
    marginLeft: 4,
  },
  divider: {
    height: 1,
    marginVertical: 20,
    backgroundColor: colors.border,
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  volumeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeTitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  volumeValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  volumeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  volumeTrack: {
    flex: 1,
    height: 5,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  volumeFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
});
