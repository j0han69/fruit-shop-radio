import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  ImageSourcePropType,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors } from '../config/radio';
import { useLanguage } from '../hooks/useLanguage';

const fruitSources: ImageSourcePropType[] = [
  require('../../assets/fruits/small/orange.png'),
  require('../../assets/fruits/small/lemon.png'),
  require('../../assets/fruits/small/strawberry.png'),
  require('../../assets/fruits/small/watermelon.png'),
];

interface FallingFruitProps {
  source: ImageSourcePropType;
  x: number;
  targetY: number;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
}

function FallingFruit({
  source,
  x,
  targetY,
  size,
  delay,
  duration,
  rotation,
}: FallingFruitProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.bounce),
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [delay, duration, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-size * 1.5, targetY],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${rotation}deg`],
  });

  return (
    <Animated.Image
      resizeMode="contain"
      source={source}
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        width: size,
        height: size,
        transform: [{ translateY }, { rotate }],
      }}
    />
  );
}

interface FruitSplashProps {
  onFinish: () => void;
}

export function FruitSplash({ onFinish }: FruitSplashProps) {
  const { t } = useLanguage();
  const { width, height } = useWindowDimensions();
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const titleScale = useRef(new Animated.Value(0.92)).current;

  const fruits = useMemo(
    () => Array.from({ length: 622 }, (_, index) => {
      const row = Math.floor(index / 7);
      const column = index % 7;
      const size = 62 + ((index * 17) % 48);
      const horizontalStep = width / 6;

      return {
        source: fruitSources[index % fruitSources.length],
        x: Math.max(-20, Math.min(width - size + 20, column * horizontalStep - 22 + ((index * 13) % 25))),
        targetY: height - 92 - row * 54 - ((index * 19) % 38),
        size,
        delay: (index % 8) * 175 + Math.floor(index / 8) * 260,
        duration: 1250 + ((index * 97) % 600),
        rotation: (index % 2 === 0 ? 1 : -1) * (90 + ((index * 31) % 210)),
      };
    }),
    [height, width],
  );

  useEffect(() => {
    Animated.spring(titleScale, {
      toValue: 1,
      friction: 5,
      tension: 70,
      useNativeDriver: true,
    }).start();

    const fade = Animated.sequence([
      Animated.delay(3600),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 550,
        useNativeDriver: true,
      }),
    ]);

    fade.start(({ finished }) => {
      if (finished) onFinish();
    });

    return () => fade.stop();
  }, [onFinish, overlayOpacity, titleScale]);

  return (
    <Animated.View
      pointerEvents="auto"
      style={[styles.overlay, { opacity: overlayOpacity }]}
    >
      <Animated.View style={[styles.brand, { transform: [{ scale: titleScale }] }]}>
        <View style={styles.brandMark}>
          <View style={styles.brandLeaf} />
          <Text style={styles.brandMarkText}>ФЛ</Text>
        </View>
        <Text style={styles.title}>{t('brandName')}</Text>
      </Animated.View>

      <View style={styles.fruitLayer}>
        {fruits.map((fruit, index) => (
          <FallingFruit key={index} {...fruit} />
        ))}
      </View>

      <View style={styles.bottomGlow} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    overflow: 'hidden',
    backgroundColor: colors.plum,
  },
  brand: {
    position: 'absolute',
    zIndex: 2,
    top: '15%',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  brandMark: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: colors.accent,
  },
  brandLeaf: {
    position: 'absolute',
    top: -5,
    right: 4,
    width: 28,
    height: 16,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: colors.lime,
    transform: [{ rotate: '-25deg' }],
  },
  brandMarkText: {
    color: colors.surface,
    fontSize: 25,
    fontWeight: '900',
  },
  title: {
    color: colors.surface,
    fontSize: 38,
    lineHeight: 43,
    fontWeight: '900',
    letterSpacing: -1.2,
    textAlign: 'center',
  },
  fruitLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  bottomGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 16,
    backgroundColor: colors.accent,
  },
});
