import { Redirect, Tabs } from 'expo-router';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';
import { DynamicColorIOS, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spinner, YStack } from 'tamagui';
import { TabIcon } from '../../src/components/common/TabIcon';
import { useAuth } from '../../src/hooks/auth/useAuth';
import { useAppTheme, useIosTheme } from '../../src/theme/ios';

export default function TabsLayout() {
  const { userInfo, isLoading } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();
  const tabBarHeight = 56 + insets.bottom;
  const tabBarPaddingBottom = Math.max(insets.bottom, 5);
  const nativeTintColor = Platform.OS === 'ios'
    ? DynamicColorIOS({ dark: 'white', light: 'black' })
    : ios.primary;
  const nativeTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

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

  if (Platform.OS !== 'web') {
    return (
      <ThemeProvider value={nativeTheme}>
        <NativeTabs
          disableTransparentOnScrollEdge
          labelStyle={{
            color: nativeTintColor,
            fontSize: 12,
            fontWeight: '700',
          }}
          tintColor={nativeTintColor}
        >
          <NativeTabs.Trigger name="calendars">
            <Icon
              sf={{ default: 'calendar', selected: 'calendar' }}
              androidSrc={<VectorIcon family={Ionicons} name="calendar-outline" />}
              selectedColor={nativeTintColor}
            />
            <Label hidden>{t('calendars')}</Label>
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="shared-calendars">
            <Icon
              sf={{ default: 'person.2', selected: 'person.2.fill' }}
              androidSrc={<VectorIcon family={Ionicons} name="people-outline" />}
              selectedColor={nativeTintColor}
            />
            <Label hidden>{t('shared_calendars')}</Label>
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="notifications">
            <Icon
              sf={{ default: 'bell', selected: 'bell.fill' }}
              androidSrc={<VectorIcon family={Ionicons} name="notifications-outline" />}
              selectedColor={nativeTintColor}
            />
            <Label hidden>{t('notification.label')}</Label>
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="settings">
            <Icon
              sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
              androidSrc={<VectorIcon family={Ionicons} name="settings-outline" />}
              selectedColor={nativeTintColor}
            />
            <Label hidden>{t('settings.label')}</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      </ThemeProvider>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
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
      }}
    >
      <Tabs.Screen
        name="calendars"
        options={{
          title: t('calendars'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} iconName="calendar-outline" focusedIconName="calendar" />
          ),
        }}
      />
      <Tabs.Screen
        name="shared-calendars"
        options={{
          title: t('shared_calendars'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} iconName="people-outline" focusedIconName="people" />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('notification.label'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} iconName="notifications-outline" focusedIconName="notifications" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.label'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} iconName="settings-outline" focusedIconName="settings" />
          ),
        }}
      />
    </Tabs>
  );
}
