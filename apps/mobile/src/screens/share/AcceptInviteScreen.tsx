import { Redirect, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ScrollView, YStack } from 'tamagui';
import { BackButton } from '../../components/common/BackButton';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { AcceptInviteEmptyState, AcceptInviteSummary } from '../../components/share';
import { useAcceptInvite } from '../../hooks/share';
import { useIosTheme } from '../../theme/ios';

export default function AcceptInviteScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();
  const invite = useAcceptInvite();

  const headerOptions = {
    headerShown: true,
    title: invite.title,
    headerTintColor: ios.primary,
    headerStyle: {
      backgroundColor: ios.background,
    },
    headerShadowVisible: false,
    headerTitleStyle: {
      color: ios.foreground,
      fontWeight: '700' as const,
    },
    headerLeft: () => <BackButton fallbackHref="/calendars" variant="header" />,
  };

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
      <>
        <Stack.Screen options={headerOptions} />
        <AcceptInviteEmptyState />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ScrollView flex={1} style={{ flex: 1, backgroundColor: ios.background }}>
        <YStack
          style={{
            flex: 1,
            gap: 18,
            paddingHorizontal: 16,
            paddingTop: Math.max(insets.top, 18),
            paddingBottom: 24,
            backgroundColor: ios.background,
          }}
        >
          <AcceptInviteSummary
            invitation={invite.invitation}
            loading={invite.loading}
            onAccept={() => void invite.handleAccept()}
            onReject={() => void invite.handleReject()}
          />
        </YStack>
      </ScrollView>
    </>
  );
}
