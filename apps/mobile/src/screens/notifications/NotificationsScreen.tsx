import { Redirect, Stack } from 'expo-router';
import { RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { YStack } from 'tamagui';
import ActionSheet from '../../components/common/ActionSheet';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { OutlineButton } from '../../components/common/OutlineButton';
import { Page, usePageHeaderOptions } from '../../components/common/Page';
import NotificationLine from '../../components/common/NotificationLine';
import { useNotifications } from '../../hooks/notifications';
import { useIosTheme } from '../../theme/ios';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const notifications = useNotifications();

  if (notifications.isAuthLoading) {
    return <LoadingIndicator label={String(t('loading_notifications'))} variant="screen" />;
  }

  if (!notifications.userInfo) {
    return <Redirect href="/(auth)/login" />;
  }

  const headerOptions = usePageHeaderOptions({
    title: String(t('notification.label')),
    headerRight: () => (
      <ActionSheet
        actions={notifications.actions}
        buttonSize="sm"
        variant="plain"
        onNavigate={notifications.navigateToHref}
      />
    ),
  });

  if (notifications.isLoading && notifications.notificationsData === null) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <LoadingIndicator label={String(t('loading_notifications'))} variant="screen" />
      </>
    );
  }

  return (
    <Page
      screen={<Stack.Screen options={headerOptions} />}
      refreshControl={(
        <RefreshControl
          refreshing={notifications.isRefreshing}
          onRefresh={() => void notifications.loadNotifications('refresh')}
          tintColor={ios.primary}
          colors={[ios.primary]}
          progressBackgroundColor={ios.card}
        />
      )}
      gap={14}
      withBottomTabInset
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
    </Page>
  );
}
