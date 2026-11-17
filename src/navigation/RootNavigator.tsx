import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { colors } from '../config/radio';
import { useLanguage } from '../hooks/useLanguage';
import { ChatScreen } from '../screens/ChatScreen';
import { DonateScreen } from '../screens/DonateScreen';
import { LiveScreen } from '../screens/LiveScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RootTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<RootTabParamList>();

const icons: Record<
  keyof RootTabParamList,
  keyof typeof Ionicons.glyphMap
> = {
  Live: 'radio-outline',
  Donate: 'heart-outline',
  Chat: 'chatbubbles-outline',
  Profile: 'person-outline',
};

export function RootNavigator() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.yellow,
        tabBarInactiveTintColor: colors.navText,
        tabBarStyle: {
          height: 68,
          paddingTop: 7,
          paddingBottom: 8,
          backgroundColor: colors.plum,
          borderTopColor: colors.plum,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={icons[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Live"
        component={LiveScreen}
        options={{ title: t('tabLive') }}
      />
      <Tab.Screen
        name="Donate"
        component={DonateScreen}
        options={{ title: t('tabDonate') }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: t('tabChat') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('tabProfile') }}
      />
    </Tab.Navigator>
  );
}
