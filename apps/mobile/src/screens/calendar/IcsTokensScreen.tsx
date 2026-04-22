import { RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button, ScrollView, Spinner, Text, XStack, YStack } from 'tamagui';
import type { CalendarDetailSourceType } from '@meditime/types';
import { CalendarNotFoundState, IcsTokenCard } from '../../components/calendar';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { OutlineButton } from '../../components/common/OutlineButton';
import { useIcsTokens } from '../../hooks/calendar';
import { useIosTheme } from '../../theme/ios';

type IcsTokensScreenProps = {
  sourceType: CalendarDetailSourceType;
};

export default function IcsTokensScreen({ sourceType }: IcsTokensScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();
  const ics = useIcsTokens(sourceType);
  const bottomContentInset = 56 + insets.bottom + 18;

  const headerOptions = {
    title: String(t('ics.calendar_ics')),
    headerBackButtonDisplayMode: 'generic' as const,
    headerBackTitle: String(t('back')),
    headerTitleStyle: {
      color: ios.foreground,
      fontWeight: '700' as const,
    },
    headerStyle: {
      backgroundColor: ios.background,
    },
    headerTintColor: ios.primary,
    headerShadowVisible: false,
  };

  if (ics.loading && ics.tokens.length === 0) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <LoadingIndicator label={String(t('ics.loading_ics_tokens'))} variant="screen" />
      </>
    );
  }

  if (ics.notFound) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <CalendarNotFoundState onBackToCalendars={ics.backToCalendars} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ScrollView
        flex={1}
        style={{ flex: 1, backgroundColor: ios.background }}
        refreshControl={(
          <RefreshControl
            refreshing={ics.refreshing}
            onRefresh={() => void ics.loadTokens('refresh')}
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
          <XStack style={{ alignItems: 'center', gap: 9 }}>
            <Ionicons name="link-outline" size={24} color={ios.primary} />
            <Text style={{ flex: 1, color: ios.foreground, fontSize: 23, lineHeight: 29, fontWeight: '900' }}>
              {t('ics.title')}
            </Text>
          </XStack>

          <InfoBanner iconName="information-circle-outline" text={String(t('ics.info_description'))} />

          {ics.error && (
            <YStack style={{ gap: 10 }}>
              <InfoBanner iconName="warning-outline" text={ics.error} tone="warning" />
              <OutlineButton label={String(t('retry'))} onPress={() => void ics.loadTokens('refresh')} />
            </YStack>
          )}

          {ics.tokens.length === 0 ? (
            <InfoBanner iconName="calendar-outline" text={String(t('ics.no_tokens'))} />
          ) : (
            <YStack style={{ gap: 10 }}>
              {ics.tokens.map((token) => (
                <IcsTokenCard
                  key={token.id}
                  token={token}
                  webcalUrl={ics.getTokenUrl(token.token)}
                  disabled={ics.isMutating}
                  onDelete={ics.confirmDeleteToken}
                  onShare={ics.shareToken}
                  onSubscribe={ics.subscribeToken}
                />
              ))}
            </YStack>
          )}

          <Button
            size="$5"
            onPress={() => void ics.createToken()}
            disabled={ics.isMutating}
            style={{
              minHeight: 50,
              borderRadius: 14,
              backgroundColor: ios.primary,
              opacity: ics.isMutating ? 0.55 : 1,
            }}
          >
            <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {ics.isMutating ? (
                <Spinner size="small" color={ios.primaryForeground} />
              ) : (
                <Ionicons name="add-circle-outline" size={18} color={ios.primaryForeground} />
              )}
              <Text style={{ color: ios.primaryForeground, fontSize: 16, fontWeight: '900' }}>
                {t('ics.add_token')}
              </Text>
            </XStack>
          </Button>
        </YStack>
      </ScrollView>
    </>
  );
}
