import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spinner, YStack } from 'tamagui';
import { useAuth } from '../../src/hooks/auth/useAuth';
import { TabIcon } from '../../src/components/common/TabIcon';
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
        tabBarActiveTintColor: ios.primary,
        tabBarInactiveTintColor: ios.mutedForeground,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: tabBarHeight,
          paddingTop: 4,
          paddingBottom: tabBarPaddingBottom,
          borderTopWidth: 1,
          borderTopColor: ios.tabBarBorder,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
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
          paddingVertical: 2,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0,
        },
      }}
    >
      <Tabs.Screen
        name="calendars"
        options={{
          title: t('calendars'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              iconName="calendar-outline"
              focusedIconName="calendar"
            />
          ),
        }}
      />
    </Tabs>
  );
}
