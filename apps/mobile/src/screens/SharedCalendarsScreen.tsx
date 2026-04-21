import { Redirect, Tabs } from 'expo-router';
import { RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ScrollView, YStack } from 'tamagui';
import { SharedCalendarPanel, SharedCalendarPicker } from '../components/share';
import ActionSheet from '../components/common/ActionSheet';
import { InfoBanner } from '../components/common/InfoBanner';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { OutlineButton } from '../components/common/OutlineButton';
import { useSharedCalendars } from '../hooks/share';
import { useIosTheme } from '../theme/ios';

export default function SharedCalendarsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();
  const shared = useSharedCalendars();
  const bottomContentInset = 56 + insets.bottom + 18;

  if (shared.isAuthLoading) {
    return <LoadingIndicator label={String(t('loading_share'))} variant="screen" />;
  }

  if (!shared.userInfo) {
    return <Redirect href="/(auth)/login" />;
  }

  const headerOptions = {
    headerShown: true,
    title: String(t('shared_calendars')),
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
      shared.actions.length > 0 ? (
        <ActionSheet
          actions={shared.actions}
          buttonSize="sm"
          variant="plain"
          onNavigate={shared.navigateToHref}
        />
      ) : null
    ),
  };

  if (shared.isLoading) {
    return (
      <>
        <Tabs.Screen options={headerOptions} />
        <LoadingIndicator label={String(t('loading_share'))} variant="screen" />
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
            refreshing={shared.isRefreshing}
            onRefresh={shared.refresh}
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
          {shared.error && (
            <YStack style={{ gap: 10 }}>
              <InfoBanner iconName="warning-outline" text={shared.error} tone="warning" />
              <OutlineButton label={String(t('retry'))} onPress={shared.refresh} />
            </YStack>
          )}

          {shared.personalCalendars.length === 0 ? (
            <InfoBanner iconName="people-outline" text={String(t('no_calendar_found_cta'))} />
          ) : (
            <>
              <SharedCalendarPicker
                calendars={shared.personalCalendars}
                selectedCalendarId={shared.selectedCalendarId}
                onSelectCalendar={shared.setSelectedCalendarId}
              />

              {shared.selectedCalendarId && shared.selectedSharedData ? (
                <SharedCalendarPanel
                  calendarId={shared.selectedCalendarId}
                  data={shared.selectedSharedData}
                  emailToInvite={shared.emailToInvite}
                  onCreateToken={shared.createPublicLink}
                  onDeleteInvitation={shared.deleteRegistrationInvitation}
                  onDeleteToken={shared.deletePublicLink}
                  onDeleteUser={shared.deleteLoginInvitation}
                  onEmailChange={shared.setEmailToInvite}
                  onInvite={shared.sendInvitation}
                  onShareToken={shared.shareLink}
                />
              ) : (
                <InfoBanner iconName="people-outline" text={String(t('shared_calendar_management'))} />
              )}
            </>
          )}
        </YStack>
      </ScrollView>
    </>
  );
}
