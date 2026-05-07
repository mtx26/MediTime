import { TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { GlassView } from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';
import type { CalendarDetailSourceType } from '@meditime/types';
import { CalendarNotFoundState } from '../../components/calendar';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { Page, usePageHeaderOptions } from '../../components/common/Page';
import { useMissedIntakesRecap } from '../../hooks/calendar/useMissedIntakesRecap';
import { useAppTheme, useIosTheme } from '../../theme/ios';

type MissedIntakesRecapScreenProps = {
  sourceType: Exclude<CalendarDetailSourceType, 'token'>;
};

function formatDaysList(days: string[], lng: string): string {
  if (days.length === 0) return '';
  if (days.length <= 3) {
    return days
      .map((d) =>
        new Date(d).toLocaleDateString(lng, { day: 'numeric', month: 'short' }),
      )
      .join(', ');
  }
  const first = new Date(days[0]).toLocaleDateString(lng, { day: 'numeric', month: 'short' });
  const last = new Date(days[days.length - 1]).toLocaleDateString(lng, { day: 'numeric', month: 'short' });
  return `${first} → ${last} (${days.length})`;
}

export default function MissedIntakesRecapScreen({ sourceType }: MissedIntakesRecapScreenProps) {
  const { t, i18n } = useTranslation();
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();
  const recap = useMissedIntakesRecap(sourceType);
  const lng = i18n.language ?? 'fr';

  const headerOptions = usePageHeaderOptions({
    title: String(t('missed_intakes.recap_title')),
    headerBackButtonDisplayMode: 'generic' as const,
    headerBackTitle: String(t('back')),
  });

  if (!recap.payload) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <CalendarNotFoundState onBackToCalendars={() => {}} />
      </>
    );
  }

  if (recap.loading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <LoadingIndicator label={String(t('loading'))} variant="screen" />
      </>
    );
  }

  return (
    <Page
      screen={<Stack.Screen options={headerOptions} />}
      gap={14}
      withBottomTabInset
    >
      {recap.error ? (
        <InfoBanner iconName="warning-outline" text={recap.error} tone="warning" />
      ) : null}

      {/* Criteria summary */}
      <GlassView
        colorScheme={colorScheme}
        glassEffectStyle="clear"
        style={{ borderRadius: 20, padding: 16, gap: 10 }}
      >
        <Text
          style={{
            color: ios.mutedForeground,
            fontSize: 13,
            fontWeight: '600',
            textTransform: 'uppercase',
          }}
        >
          {String(t('missed_intakes.criteria'))}
        </Text>

        <XStack style={{ gap: 8, alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={18} color={ios.mutedForeground} />
          <Text style={{ color: ios.foreground, fontSize: 15 }}>
            {formatDaysList(recap.previewDays.length > 0 ? recap.previewDays : (recap.payload?.days ?? []), lng)}
          </Text>
        </XStack>

        <XStack style={{ gap: 8, alignItems: 'center' }}>
          <Ionicons name="options-outline" size={18} color={ios.mutedForeground} />
          <Text style={{ color: ios.foreground, fontSize: 15 }}>
            {recap.payload.mode === 'intake'
              ? String(t('missed_intakes.mode_intake'))
              : String(t('missed_intakes.mode_medication'))}
          </Text>
        </XStack>
      </GlassView>

      {/* Affected meds */}
      {recap.previewBoxes.length > 0 ? (
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{ borderRadius: 20, padding: 16, gap: 10 }}
        >
          <Text
            style={{
              color: ios.mutedForeground,
              fontSize: 13,
              fontWeight: '600',
              textTransform: 'uppercase',
            }}
          >
            {String(t('missed_intakes.affected_meds'))}
          </Text>

          {recap.previewBoxes.map((box) => (
            <YStack
              key={box.box_id}
              style={{
                backgroundColor: ios.accentHover,
                borderRadius: 14,
                padding: 14,
                gap: 6,
              }}
            >
              <Text style={{ color: ios.foreground, fontWeight: '600', fontSize: 15 }}>
                {box.name}
                {box.dose ? ` (${box.dose})` : ''}
              </Text>
              <XStack style={{ gap: 16 }}>
                <YStack style={{ gap: 2 }}>
                  <Text style={{ color: ios.mutedForeground, fontSize: 12 }}>
                    {String(t('missed_intakes.old_stock'))}
                  </Text>
                  <Text style={{ color: ios.foreground, fontWeight: '600', fontSize: 14 }}>
                    {box.old_stock}
                  </Text>
                </YStack>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={ios.mutedForeground}
                  style={{ alignSelf: 'flex-end', marginBottom: 2 }}
                />
                <YStack style={{ gap: 2 }}>
                  <Text style={{ color: ios.mutedForeground, fontSize: 12 }}>
                    {String(t('missed_intakes.new_stock'))}
                  </Text>
                  <Text
                    style={{
                      color: ios.success,
                      fontWeight: '700',
                      fontSize: 14,
                    }}
                  >
                    {box.new_stock}
                  </Text>
                </YStack>
                <YStack style={{ gap: 2, marginLeft: 'auto' }}>
                  <Text style={{ color: ios.mutedForeground, fontSize: 12 }}>
                    {String(t('missed_intakes.tablets_added'))}
                  </Text>
                  <Text
                    style={{
                      color: ios.primary,
                      fontWeight: '700',
                      fontSize: 14,
                    }}
                  >
                    +{box.tablets_to_add}
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          ))}
        </GlassView>
      ) : (
        <InfoBanner
          iconName="checkmark-circle-outline"
          text={String(t('missed_intakes.no_affected_meds'))}
        />
      )}

      {/* Info */}
      <XStack
        style={{
          gap: 10,
          backgroundColor: ios.blueInfoBg,
          borderRadius: 14,
          padding: 14,
          alignItems: 'flex-start',
        }}
      >
        <Ionicons name="information-circle-outline" size={18} color={ios.blueText} style={{ marginTop: 1 }} />
        <Text style={{ color: ios.blueText, fontSize: 13, flex: 1, lineHeight: 18 }}>
          {recap.payload.mode === 'intake'
            ? String(t('missed_intakes.info_intake'))
            : String(t('missed_intakes.info_medication'))}
        </Text>
      </XStack>

      {/* Apply button */}
      {recap.previewBoxes.length > 0 ? (
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{ borderRadius: 20, padding: 16 }}
        >
          <TouchableOpacity
            onPress={() => void recap.handleApply()}
            disabled={recap.applying}
            style={{
              backgroundColor: recap.applying ? ios.border : ios.primary,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            {recap.applying ? (
              <XStack style={{ gap: 8, alignItems: 'center' }}>
                <Ionicons name="sync-outline" size={18} color={ios.primaryForeground} />
                <Text style={{ color: ios.primaryForeground, fontWeight: '700', fontSize: 16 }}>
                  {String(t('loading'))}
                </Text>
              </XStack>
            ) : (
              <Text style={{ color: ios.primaryForeground, fontWeight: '700', fontSize: 16 }}>
                {String(t('missed_intakes.apply'))}
              </Text>
            )}
          </TouchableOpacity>
        </GlassView>
      ) : null}
    </Page>
  );
}
