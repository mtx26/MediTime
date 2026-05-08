import { Redirect, Stack } from 'expo-router';
import { RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../../components/common/BackButton';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { Page, usePageHeaderOptions } from '../../components/common/Page';
import { AcceptInviteEmptyState, AcceptInviteSummary } from '../../components/share';
import { useAcceptInvite } from '../../hooks/share';
import { useIosTheme } from '../../theme/ios';

export default function AcceptInviteScreen() {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const invite = useAcceptInvite();

  const headerOptions = usePageHeaderOptions({
    title: invite.title,
    headerLeft: () => <BackButton fallbackHref="/calendars" variant="header" />,
  });
  const refreshControl = (
    <RefreshControl
      refreshing={invite.refreshing}
      onRefresh={invite.refreshInvitation}
      tintColor={ios.primary}
      colors={[ios.primary]}
      progressBackgroundColor={ios.card}
    />
  );

  if (invite.isAuthLoading || (invite.loading && !invite.invitation && !invite.notFound)) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <LoadingIndicator label={String(t('invitation.loading'))} variant="screen" />
      </>
    );
  }

  if (!invite.userInfo) {
    return <Redirect href="/(auth)/login" />;
  }

  if (invite.notFound || !invite.invitation) {
    return (
      <Page
        screen={<Stack.Screen options={headerOptions} />}
        refreshControl={refreshControl}
        gap={0}
        horizontalPadding={0}
        topPadding={0}
      >
        <AcceptInviteEmptyState />
      </Page>
    );
  }

  return (
    <Page
      screen={<Stack.Screen options={headerOptions} />}
      refreshControl={refreshControl}
      gap={18}
      topPadding={18}
      withTopInset
    >
      <AcceptInviteSummary
        invitation={invite.invitation}
        loading={invite.loading}
        onAccept={() => void invite.handleAccept()}
        onReject={() => void invite.handleReject()}
      />
    </Page>
  );
}
