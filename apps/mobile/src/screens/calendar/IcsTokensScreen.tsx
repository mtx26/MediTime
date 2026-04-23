import { Pressable, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { CalendarDetailSourceType } from '@meditime/types';
import { CalendarNotFoundState, IcsTokenCard } from '../../components/calendar';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { OutlineButton } from '../../components/common/OutlineButton';
import { Page, usePageHeaderOptions } from '../../components/common/Page';
import { useIcsTokens } from '../../hooks/calendar';
import { useIosTheme } from '../../theme/ios';

type IcsTokensScreenProps = {
  sourceType: CalendarDetailSourceType;
};

export default function IcsTokensScreen({ sourceType }: IcsTokensScreenProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const ics = useIcsTokens(sourceType);

  const headerOptions = usePageHeaderOptions({
    title: String(t('ics.calendar_ics')),
    headerBackButtonDisplayMode: 'generic' as const,
    headerBackTitle: String(t('back')),
  });

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
    <Page
      screen={<Stack.Screen options={headerOptions} />}
      refreshControl={(
        <RefreshControl
          refreshing={ics.refreshing}
          onRefresh={() => void ics.loadTokens('refresh')}
          tintColor={ios.primary}
          colors={[ios.primary]}
          progressBackgroundColor={ios.card}
        />
      )}
      gap={14}
      withBottomTabInset
    >
      {ics.error && (
        <YStack style={{ gap: 10 }}>
          <InfoBanner iconName="warning-outline" text={ics.error} tone="warning" />
          <OutlineButton label={String(t('retry'))} onPress={() => void ics.loadTokens('refresh')} />
        </YStack>
      )}

      <InfoBanner
        iconName="information-circle-outline"
        text={String(t('ics.info_description'))}
      />

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

      <Pressable
        onPress={() => void ics.createToken()}
        disabled={ics.isMutating}
        accessibilityRole="button"
        accessibilityLabel={String(t('ics.add_token'))}
      >
        {({ pressed }) => (
          <XStack
            style={{
              minHeight: 52,
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: ios.border,
              backgroundColor: pressed ? ios.accentHover : ios.card,
              opacity: ics.isMutating ? 0.55 : 1,
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color={ios.primary} />
            <Text style={{ flex: 1, color: ios.primary, fontSize: 15, fontWeight: '800' }}>
              {t('ics.add_token')}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={ios.mutedForeground} />
          </XStack>
        )}
      </Pressable>
    </Page>
  );
}
