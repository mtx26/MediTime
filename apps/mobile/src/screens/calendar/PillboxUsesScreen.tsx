import { RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, XStack, YStack } from 'tamagui';
import type { CalendarDetailSourceType } from '@meditime/types';
import { CalendarNotFoundState, PillboxUseRow } from '../../components/calendar';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { OutlineButton } from '../../components/common/OutlineButton';
import { usePillboxUses } from '../../hooks/calendar';
import { useIosTheme } from '../../theme/ios';

type PillboxUsesScreenProps = {
  sourceType: CalendarDetailSourceType;
};

export default function PillboxUsesScreen({ sourceType }: PillboxUsesScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();
  const pillboxUses = usePillboxUses(sourceType);
  const bottomContentInset = 56 + insets.bottom + 18;

  const headerOptions = {
    title: String(t('pillbox_uses')),
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

  if (pillboxUses.loading && pillboxUses.sortedUses.length === 0) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <LoadingIndicator label={String(t('loading_pillbox_uses'))} variant="screen" />
      </>
    );
  }

  if (pillboxUses.notFound) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <CalendarNotFoundState onBackToCalendars={pillboxUses.backToCalendars} />
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
            refreshing={pillboxUses.refreshing}
            onRefresh={() => void pillboxUses.loadUses('refresh')}
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
            <Ionicons name="time-outline" size={24} color={ios.primary} />
            <Text style={{ flex: 1, color: ios.foreground, fontSize: 23, lineHeight: 29, fontWeight: '900' }}>
              {t('pillbox_uses')}
            </Text>
          </XStack>

          {pillboxUses.error && (
            <YStack style={{ gap: 10 }}>
              <InfoBanner iconName="warning-outline" text={pillboxUses.error} tone="warning" />
              <OutlineButton label={String(t('retry'))} onPress={() => void pillboxUses.loadUses('refresh')} />
            </YStack>
          )}

          {pillboxUses.sortedUses.length === 0 ? (
            <InfoBanner iconName="time-outline" text={String(t('you_have_no_pillbox_use_history'))} />
          ) : (
            <YStack style={{ gap: 10 }}>
              {pillboxUses.sortedUses.map((use) => (
                <PillboxUseRow
                  key={use.id}
                  use={use}
                  weekLabel={pillboxUses.formatWeek(use.prepared_at)}
                  disabled={pillboxUses.isMutating}
                  onCancel={pillboxUses.confirmCancelUse}
                />
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </>
  );
}
