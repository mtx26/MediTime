import { Redirect, Stack } from 'expo-router';
import { RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { YStack } from 'tamagui';
import { SharedCalendarPanel, SharedCalendarPicker } from '../../components/share';
import { PdfDialog } from '../../components/calendar';
import ActionSheet from '../../components/common/ActionSheet';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { OutlineButton } from '../../components/common/OutlineButton';
import { Page, usePageHeaderOptions } from '../../components/common/Page';
import { useSharedCalendars } from '../../hooks/share';
import { useIosTheme } from '../../theme/ios';

export default function SharedCalendarsScreen() {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const shared = useSharedCalendars();

  if (shared.isAuthLoading) {
    return <LoadingIndicator label={String(t('loading_share'))} variant="screen" />;
  }

  if (!shared.userInfo) {
    return <Redirect href="/(auth)/login" />;
  }

  const headerOptions = usePageHeaderOptions({
    title: String(t('shared_calendars')),
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
  });

  if (shared.isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <LoadingIndicator label={String(t('loading_share'))} variant="screen" />
      </>
    );
  }

  return (
    <>
        <Page
        screen={<Stack.Screen options={headerOptions} />}
        refreshControl={(
          <RefreshControl
            refreshing={shared.isRefreshing}
            onRefresh={shared.refresh}
            tintColor={ios.primary}
            colors={[ios.primary]}
            progressBackgroundColor={ios.card}
          />
        )}
        gap={14}
        withBottomTabInset
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
      </Page>
      <PdfDialog
        open={shared.pdfDialogOpen}
        includeInactive={shared.includeInactive}
        onIncludeInactiveChange={shared.setIncludeInactive}
        onCancel={() => shared.setPdfDialogOpen(false)}
        onDownload={() => void shared.openCalendarPdf()}
      />
    </>
  );
}
