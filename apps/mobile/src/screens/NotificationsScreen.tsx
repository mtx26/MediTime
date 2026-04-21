import { Redirect, Tabs } from 'expo-router';
import { RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ScrollView, YStack } from 'tamagui';
import ActionSheet from '../components/common/ActionSheet';
import { InfoBanner } from '../components/common/InfoBanner';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { OutlineButton } from '../components/common/OutlineButton';
import NotificationLine from '../components/common/NotificationLine';
import { useNotifications } from '../hooks/notifications';
import { useIosTheme } from '../theme/ios';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();
  const notifications = useNotifications();
  const bottomContentInset = 56 + insets.bottom + 18;

  if (notifications.isAuthLoading) {
    return <LoadingIndicator label={String(t('loading_notifications'))} variant="screen" />;
  }

  if (!notifications.userInfo) {
    return <Redirect href="/(auth)/login" />;
  }

  const headerOptions = {
    headerShown: true,
    title: String(t('notification.label')),
    headerTintColor: ios.primary,
    headerStyle: {
      backgroundColor: ios.background,
    },
    headerShadowVisible: false,
    headerTitleStyle: {
      color: ios.foreground,
      fontWeight: '700' as const,
    },
    headerRight: () => (
      <ActionSheet
        actions={notifications.actions}
        buttonSize="sm"
        variant="plain"
        onNavigate={notifications.navigateToHref}
      />
    ),
  };

  if (notifications.isLoading && notifications.notificationsData === null) {
    return (
      <>
        <Tabs.Screen options={headerOptions} />
        <LoadingIndicator label={String(t('loading_notifications'))} variant="screen" />
      </>
    );
  }

  return (
    <>
      <Tabs.Screen options={headerOptions} />
      <ScrollView
        flex={1}
        style={{ flex: 1, backgroundColor: ios.background }}
        refreshControl={(
          <RefreshControl
            refreshing={notifications.isRefreshing}
            onRefresh={() => void notifications.loadNotifications('refresh')}
            tintColor={ios.primary}
            colors={[ios.primary]}
            progressBackgroundColor={ios.card}
          />
        )}
      >
        <YStack
          style={{
            flex: 1,
            gap: 14,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: bottomContentInset,
            backgroundColor: ios.background,
          }}
        >
          {notifications.error && (
            <YStack style={{ gap: 10 }}>
              <InfoBanner iconName="warning-outline" text={notifications.error} tone="warning" />
              <OutlineButton
                label={String(t('retry'))}
                onPress={() => void notifications.loadNotifications('refresh')}
              />
            </YStack>
          )}

          {(notifications.notificationsData ?? []).length === 0 ? (
            <InfoBanner
              iconName="notifications-outline"
              text={String(t('no_notifications'))}
            />
          ) : (
            <YStack style={{ gap: 10 }}>
              {(notifications.notificationsData ?? []).map((notification) => (
                <NotificationLine
                  key={notification.notification_id}
                  notif={notification}
                  onRead={notifications.readNotification}
                />
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </>
  );
}
