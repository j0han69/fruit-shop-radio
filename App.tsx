import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FruitSplash } from './src/components/FruitSplash';
import { colors } from './src/config/radio';
import { LanguageProvider } from './src/hooks/useLanguage';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/providers/AuthProvider';
import { LiveStateProvider } from './src/providers/LiveStateProvider';
import { PushRegistrar } from './src/providers/PushRegistrar';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.plum,
    text: colors.text,
    border: colors.border,
  },
};

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const finishSplash = useCallback(() => setIsSplashVisible(false), []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        {/* Анонимный вход → Realtime-флаг эфира → регистрация push */}
        <AuthProvider>
          <LiveStateProvider>
            <PushRegistrar />
            <NavigationContainer theme={navigationTheme}>
              <StatusBar style={isSplashVisible ? 'light' : 'dark'} hidden={isSplashVisible} />
              <RootNavigator />
            </NavigationContainer>
            {isSplashVisible ? <FruitSplash onFinish={finishSplash} /> : null}
          </LiveStateProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
