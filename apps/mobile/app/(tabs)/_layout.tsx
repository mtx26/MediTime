import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/auth/useAuth';
import { YStack, Spinner } from 'tamagui';

const ios = {
  groupedBackground: '#f2f2f7',
  card: '#ffffff',
  text: '#111111',
  label: '#8e8e93',
  separator: '#d1d1d6',
  systemBlue: '#007aff',
};

export default function TabsLayout() {
  const { userInfo, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <YStack style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ios.groupedBackground }}>
        <Spinner size="large" color={ios.systemBlue} />
      </YStack>
    );
  }

  if (!userInfo) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: t('calendars'),
        headerTitleStyle: {
          fontWeight: '700',
          color: ios.text,
        },
        headerStyle: {
          backgroundColor: ios.groupedBackground,
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: ios.systemBlue,
        tabBarInactiveTintColor: ios.label,
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 12,
          borderTopColor: ios.separator,
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('calendars'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
