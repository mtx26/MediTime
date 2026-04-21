import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spinner, YStack } from 'tamagui';
import { useAuth } from '../../src/hooks/auth/useAuth';
import { useIosTheme } from '../../src/theme/ios';

export default function TabsLayout() {
  const { userInfo, isLoading } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();
  const tabBarHeight = 56 + insets.bottom;
  const tabBarPaddingBottom = Math.max(insets.bottom, 5);

  if (isLoading) {
    return (
      <YStack style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ios.background }}>
        <Spinner size="large" color={ios.primary} />
      </YStack>
    );
  }

  if (!userInfo) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: ios.primary,
        tabBarInactiveTintColor: ios.mutedForeground,
        tabBarStyle: {
          height: tabBarHeight + 4,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          paddingTop: 7,
          paddingBottom: tabBarPaddingBottom,
          borderTopWidth: 1,
          borderTopColor: ios.tabBarBorder,
          backgroundColor: ios.tabBarBackground,
          ...Platform.select({
            ios: {
              shadowColor: ios.shadow,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.14,
              shadowRadius: 24,
            },
            android: {
              elevation: 14,
            },
          }),
        },
        tabBarItemStyle: {
          borderRadius: 8,
          minHeight: 50,
          marginHorizontal: 6,
          paddingVertical: 2,
        },
        tabBarIconStyle: {
          width: 34,
          height: 25,
          marginBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0,
          lineHeight: 15,
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="calendars"
        options={{
          title: t('calendars'),
          tabBarLabel: t('calendars'),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 34,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: focused ? ios.blueInfoBg : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          title: t('notification.label'),
          tabBarLabel: t('notification.label'),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 34,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: focused ? ios.blueInfoBg : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? 'notifications' : 'notifications-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: t('settings.label'),
          tabBarLabel: t('settings.label'),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 34,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: focused ? ios.blueInfoBg : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
