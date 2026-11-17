import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdminGate } from '../admin/AdminGate';
import { LiveIndicator } from '../components/LiveIndicator';
import { LiveVideoPlayer } from '../components/LiveVideoPlayer';
import { NowPlayingCard } from '../components/NowPlayingCard';
import { OfflineBroadcastCard } from '../components/OfflineBroadcastCard';
import { PlayerControls } from '../components/PlayerControls';
import { Screen } from '../components/Screen';
import { colors, STREAM_URL } from '../config/radio';
import { useLanguage } from '../hooks/useLanguage';
import { useListeningTimer } from '../hooks/useListeningTimer';
import { useNowPlaying } from '../hooks/useNowPlaying';
import { useRadioPlayer } from '../hooks/useRadioPlayer';
import { useLiveState } from '../providers/LiveStateProvider';

export function LiveScreen() {
  const { t } = useLanguage();
  // АУДИО: независимое состояние, синглтон-плеер, никогда не пересоздаётся
  const {
    isAudioPlaying,
    isBuffering,
    isLive: hasLiveSignal,
    volume,
    error,
    togglePlayback,
    setVolume,
  } = useRadioPlayer(STREAM_URL);
  // ВИДЕО: независимое состояние из Supabase Realtime (меняет админ)
  const { isVideoLive, videoUrl } = useLiveState();
  const showVideo = isVideoLive && Boolean(videoUrl);
  const isLive = hasLiveSignal || isVideoLive;
  const { nowPlaying, isLoading } = useNowPlaying();
  const listeningTime = useListeningTimer(isAudioPlaying);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {/* Скрытая админка: долгое нажатие (2,5 с) на название радио */}
          <AdminGate>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>{t('radioBrand')}</Text>
              <Text style={styles.title}>{t('liveTitle')}</Text>
            </View>
          </AdminGate>
          {isLive ? <LiveIndicator /> : null}
        </View>

        {/* Видео без звука ИЛИ заглушка. Аудио при этом не трогается. */}
        {showVideo && videoUrl ? (
          <LiveVideoPlayer key={videoUrl} videoUrl={videoUrl} />
        ) : hasLiveSignal ? (
          <View style={styles.showCard}>
            <View style={styles.fruitBadgeLeft}>
              <Text style={styles.fruitEmoji}>🍋</Text>
            </View>
            <View style={styles.fruitBadgeRight}>
              <Text style={styles.fruitEmoji}>🍊</Text>
            </View>
            <View style={styles.artworkOuter}>
              <View style={styles.leaf} />
              <View style={styles.artworkInner}>
                <Ionicons name="radio" size={48} color={colors.surface} />
              </View>
            </View>
            <Text style={styles.showName}>{t('showName')}</Text>
            <Text style={styles.host}>{t('showHost')}</Text>
            <Text style={styles.showDescription}>{t('showDescription')}</Text>
            <View style={styles.flavorBadge}>
              <Text style={styles.flavorBadgeText}>{t('freshSound')}</Text>
            </View>
          </View>
        ) : (
          <OfflineBroadcastCard />
        )}

        <PlayerControls
          isPlaying={isAudioPlaying}
          isBuffering={isBuffering}
          volume={volume}
          listeningTime={listeningTime}
          onTogglePlayback={togglePlayback}
          onVolumeChange={setVolume}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <NowPlayingCard
          isLoading={isLive && isLoading}
          nowPlaying={isLive ? nowPlaying : null}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 2,
  },
  headerCopy: {
    flexShrink: 1,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  title: {
    marginTop: 4,
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  showCard: {
    position: 'relative',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 28,
    backgroundColor: colors.plum,
    borderWidth: 1,
    borderColor: colors.plum,
  },
  fruitBadgeLeft: {
    position: 'absolute',
    top: 22,
    left: 22,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.yellow,
    transform: [{ rotate: '-12deg' }],
  },
  fruitBadgeRight: {
    position: 'absolute',
    top: 28,
    right: 24,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lime,
    transform: [{ rotate: '12deg' }],
  },
  fruitEmoji: {
    fontSize: 23,
  },
  artworkOuter: {
    width: 138,
    height: 138,
    borderRadius: 69,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 211, 78, 0.55)',
    backgroundColor: 'rgba(255, 211, 78, 0.12)',
  },
  leaf: {
    position: 'absolute',
    top: -2,
    right: 12,
    width: 29,
    height: 16,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: colors.lime,
    transform: [{ rotate: '-25deg' }],
  },
  artworkInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  showName: {
    color: colors.surface,
    fontSize: 25,
    fontWeight: '800',
  },
  host: {
    marginTop: 5,
    color: colors.yellow,
    fontSize: 15,
  },
  showDescription: {
    marginTop: 14,
    color: colors.navText,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  flavorBadge: {
    marginTop: 18,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.lime,
  },
  flavorBadgeText: {
    color: colors.plum,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  error: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
