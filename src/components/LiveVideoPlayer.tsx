import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../config/radio';
import { useLanguage } from '../hooks/useLanguage';

interface LiveVideoPlayerProps {
  videoUrl: string;
}

/**
 * Видеоплеер эфира. ВСЕГДА без звука: звук идёт из отдельного аудиопотока
 * (src/audio/radioAudio.ts), который видео никак не трогает.
 * Компонент полностью размонтируется, когда эфир выключают.
 */
export function LiveVideoPlayer({ videoUrl }: LiveVideoPlayerProps) {
  const { t } = useLanguage();
  const player = useVideoPlayer(videoUrl, (p) => {
    p.muted = true;
    p.volume = 0;
    p.loop = false;
    // Не забираем аудиосессию у радио
    p.audioMixingMode = 'mixWithOthers';
    p.staysActiveInBackground = false;
    p.showNowPlayingNotification = false;
    p.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
      <View style={styles.badge}>
        <View style={styles.dot} />
        <Text style={styles.badgeText}>{t('videoLive')}</Text>
      </View>
      {status === 'error' ? (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{t('videoError')}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: colors.plum,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(50, 26, 59, 0.75)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(50, 26, 59, 0.8)',
  },
  errorText: {
    color: colors.surface,
    fontSize: 14,
    textAlign: 'center',
  },
});
