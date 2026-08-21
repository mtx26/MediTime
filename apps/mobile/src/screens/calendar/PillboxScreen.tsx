import { useCallback } from 'react';
import { Image, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Text, XStack } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import type { CalendarDetailSourceType } from '@meditime/types';
import { DAYS } from '@meditime/constants';
import { CalendarNotFoundState } from '../../components/calendar';
import { InfoBanner } from '../../components/common/InfoBanner';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { usePillbox } from '../../hooks/calendar/usePillbox';
import { useIosTheme } from '../../theme/ios';

// Pill icon assets — PNGs (320×320) generated from SVGs via scripts/convert-pill-svgs.mjs
const PILL_ASSETS = {
  '0.00': require('../../../assets/icons/pills/0.00_pills.png'),
  '0.25': require('../../../assets/icons/pills/0.25_pills.png'),
  '0.50': require('../../../assets/icons/pills/0.50_pills.png'),
  '0.75': require('../../../assets/icons/pills/0.75_pills.png'),
  '1.00': require('../../../assets/icons/pills/1.00_pills.png'),
} as const;

type PillboxScreenProps = {
  sourceType: Exclude<CalendarDetailSourceType, 'token'>;
};

// Moment colors matching the web exactly
const MOMENT_BG: Record<string, string> = {
  morning: '#ef4444',  // red-500
  noon: '#22c55e',     // green-500
  evening: '#60a5fa',  // blue-400
};

function getPillAsset(count: number | undefined) {
  if (count == null || count === 0) return PILL_ASSETS['0.00'];
  if (count <= 0.25) return PILL_ASSETS['0.25'];
  if (count <= 0.5) return PILL_ASSETS['0.50'];
  if (count <= 0.75) return PILL_ASSETS['0.75'];
  return PILL_ASSETS['1.00'];
}

// Le composant exporté gère le lock d'orientation et fournit un SafeAreaProvider
// propre à l'intérieur du modal natif (fullScreenModal iOS = UIViewController séparé,
// le SafeAreaProvider parent ne mesure pas la bonne fenêtre).
export default function PillboxScreen({ sourceType }: PillboxScreenProps) {
  return (
    <SafeAreaProvider>
      <PillboxScreenContent sourceType={sourceType} />
    </SafeAreaProvider>
  );
}

function PillboxScreenContent({ sourceType }: PillboxScreenProps) {
  const { t, i18n } = useTranslation();
  const ios = useIosTheme();
  const { width, height } = useWindowDimensions();
  const pillbox = usePillbox(sourceType);
  const lng = i18n.language ?? 'fr';

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const landscapeW = width;
  const landscapeH = height;

  if (pillbox.loading && pillbox.orderedMeds.length === 0) {
    return <LoadingIndicator label={String(t('loading_pillbox'))} variant="screen" />;
  }

  if (pillbox.notFound) {
    return <CalendarNotFoundState onBackToCalendars={pillbox.backToCalendars} />;
  }

  const current = pillbox.orderedMeds[pillbox.selectedMedIndex];
  const momentColor = MOMENT_BG[current?.moment ?? 'morning'] ?? MOMENT_BG.morning;
  const isRefillMode = pillbox.medsId?.length > 0;

  const gridPadding = 16;
  const colGap = 6;
  // Colonnes : largeur disponible après safe area (left+right) + padding grille
  const usableW = landscapeW - insets.left - insets.right;
  const colW = Math.min((usableW - gridPadding * 2 - colGap * 6) / 7, 96);
  const iconSize = Math.min(colW * 0.70, 58);
  // Hauteur fixe des cases pilule (réduite)
  const cellHeight = Math.round(Math.min(landscapeH * 0.30, 76));

  return (
    <>
      <StatusBar hidden />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: ios.background }]}>
        {/* ── Bouton fermer ────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { top: insets.top + 10, left: insets.left + 10 }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>

          {/* ── Completed ─────────────────────────────────────────────── */}
          {pillbox.isPillboxUsed ? (
            <View style={[styles.completedWrap, { backgroundColor: ios.successBg }]}>
              <Ionicons name="checkmark-circle" size={56} color={ios.success} />
              <Text style={{ color: ios.success, fontWeight: '700', fontSize: 18, textAlign: 'center', marginTop: 8 }}>
                {String(t('calendar_completed_this_week'))}
              </Text>
            </View>
          ) : pillbox.error ? (
            <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
              <InfoBanner iconName="warning-outline" text={pillbox.error} tone="warning" />
            </View>
          ) : pillbox.orderedMeds.length === 0 ? (
            <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
              <InfoBanner iconName="medical-outline" text={String(t('no_medicines_scheduled'))} />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {/* ── Moment header ─────────────────────────────────────── */}
              <View style={[styles.momentHeader, { backgroundColor: momentColor }]}>
                <Text style={styles.momentText}>{String(t(current?.moment ?? ''))}</Text>
              </View>

              {/* ── Med name bar ──────────────────────────────────────── */}
              <View style={[styles.medNameBar, { backgroundColor: ios.foreground }]}>
                <Text style={[styles.medNameText, { color: ios.background }]} numberOfLines={1}>
                  {current?.title ?? ''}
                </Text>
              </View>

              {/* ── 7-day pill grid ───────────────────────────────────── */}
              <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1 }}>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <View style={[styles.gridRow, { paddingHorizontal: gridPadding, gap: colGap, justifyContent: 'center' }]}>
                {DAYS.map((day, idx) => {
                  const count = current?.cells[day];
                  const date = pillbox.weekDates[idx];
                  const pillAsset = getPillAsset(count);
                  return (
                    <View key={day} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                      <Text style={{ color: ios.foreground, fontSize: 14, fontWeight: '600' }}>
                        {String(t(day))}
                      </Text>
                      {date ? (
                        <Text style={{ color: ios.mutedForeground, fontSize: 12 }}>
                          {date.toLocaleDateString(lng, { month: 'numeric', day: 'numeric' })}
                        </Text>
                      ) : null}
                      <View style={[
                        styles.pillCell,
                        { backgroundColor: ios.card, borderColor: ios.border, width: colW, height: cellHeight },
                      ]}>
                        <Image
                          source={pillAsset}
                          style={{ width: iconSize, height: iconSize }}
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
                </View>

              {/* ── Navigation ────────────────────────────────────────── */}
              <XStack style={[styles.navRow, { borderTopColor: 'transparent', paddingBottom: 10, paddingHorizontal: 20 }]}>
                <TouchableOpacity
                  onPress={pillbox.handlePreviousMed}
                  disabled={pillbox.selectedMedIndex === 0}
                  style={[styles.navBtn, { borderColor: ios.border, opacity: pillbox.selectedMedIndex === 0 ? 0.4 : 1 }]}
                >
                  <Ionicons name="arrow-back" size={16} color={ios.foreground} />
                  <Text style={{ color: ios.foreground, fontWeight: '600', fontSize: 14, marginLeft: 6 }}>
                    {String(t('previous'))}
                  </Text>
                </TouchableOpacity>

                <Text style={{ color: ios.mutedForeground, fontSize: 13 }}>
                  {pillbox.selectedMedIndex + 1} / {pillbox.orderedMeds.length}
                </Text>

                {pillbox.selectedMedIndex < pillbox.orderedMeds.length - 1 ? (() => {
                  const currentMoment = pillbox.orderedMeds[pillbox.selectedMedIndex]?.moment;
                  const nextMoment = pillbox.orderedMeds[pillbox.selectedMedIndex + 1]?.moment;
                  const isSameMoment = currentMoment === nextMoment;
                  const btnBg = isSameMoment ? 'transparent' : (MOMENT_BG[nextMoment ?? 'morning'] ?? ios.primary);
                  const btnTextColor: string = isSameMoment ? ios.foreground : '#fff';
                  return (
                    <TouchableOpacity
                      onPress={pillbox.handleNextMed}
                      style={[styles.navBtn, {
                        borderColor: isSameMoment ? ios.border : 'transparent',
                        backgroundColor: btnBg,
                      }]}
                    >
                      <Text style={{ color: btnTextColor, fontWeight: '600', fontSize: 14, marginRight: 6 }}>
                        {isSameMoment ? String(t('next')) : String(t(nextMoment ?? ''))}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color={btnTextColor} />
                    </TouchableOpacity>
                  );
                })() : (
                  <TouchableOpacity
                    onPress={pillbox.handleComplete}
                    disabled={pillbox.isCompleting}
                    style={[styles.navBtn, { backgroundColor: '#22c55e', borderColor: 'transparent' }]}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14, marginLeft: 6 }}>
                      {String(t('done'))}
                    </Text>
                  </TouchableOpacity>
                )}
              </XStack>
              </SafeAreaView>
            </View>
          )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  completedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  momentHeader: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  momentText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  medNameBar: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  medNameText: {
    fontWeight: '700',
    fontSize: 17,
  },
  closeBtn: {
    position: 'absolute',
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  pillCell: {
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    marginTop: 4,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
});
