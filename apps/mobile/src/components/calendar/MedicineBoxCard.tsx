import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type {
  BoxesViewBoxItem,
  CalendarBoxAlertItem,
  MobileMedicineBoxCardProps,
} from '@meditime/types';
import ContextMenu, { type MobileContextMenuActionList } from '../common/ContextMenu';
import { getBoxDisplayFlags, getBoxStatusItems, type BoxStatusItemKey } from '@meditime/utils';
import { GlassSurface } from '../common/GlassSurface';
import { useIosTheme } from '../../theme/ios';
import { hapticImpact, hapticSelection } from '../../utils/haptics';

function isFullBox(box: BoxesViewBoxItem | CalendarBoxAlertItem): box is BoxesViewBoxItem {
  return Array.isArray((box as BoxesViewBoxItem).conditions);
}

const STATUS_ICON_MAP: Record<BoxStatusItemKey, keyof typeof Ionicons.glyphMap> = {
  condition_none: 'information-circle-outline',
  condition_inactive: 'pause-circle-outline',
  condition_expired: 'alert-circle-outline',
  stock_out: 'warning-outline',
  stock_low: 'warning-outline',
  stock_ok: 'checkmark-circle-outline',
  alerts_disabled: 'notifications-off-outline',
};

function formatConditionSummary(box: BoxesViewBoxItem, t: (key: string) => string) {
  return `${t('boxes.intake_conditions')}: ${box.conditions.filter(Boolean).length}`;
}

function formatConditionLine(box: BoxesViewBoxItem, index: number, t: (key: string) => string) {
  const condition = box.conditions[index];
  if (!condition) return '';

  const tabletCount = Number(condition.tablet_count ?? 1);
  const intervalDays = Number(condition.interval_days ?? 1);
  const timeOfDay = condition.time_of_day && ['morning', 'noon', 'evening'].includes(condition.time_of_day)
    ? t(condition.time_of_day)
    : condition.time_of_day ?? '-';

  return [
    `${tabletCount} ${tabletCount > 1 ? t('boxes.tablets') : t('boxes.tablet')}`,
    timeOfDay,
    `${t('boxes.every')} ${intervalDays} ${intervalDays > 1 ? t('boxes.days') : t('boxes.day')}`,
  ].join(' - ');
}

export function MedicineBoxCard({
  box,
  actions,
  disabled = false,
  mode = 'alerts',
  expanded = false,
  onEdit,
  onMissingPillbox,
  onRestock,
  onToggleExpanded,
}: MobileMedicineBoxCardProps<MobileContextMenuActionList[number]>) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const translate = (key: string) => String(t(key));
  const { isCritical, isLow, allExpired, isMissingPillbox } = getBoxDisplayFlags(box);
  const isAlertMode = mode === 'alerts';
  const canRestock = typeof onRestock === 'function';
  const showMissingPillbox = isMissingPillbox && typeof onMissingPillbox === 'function';
  const cardBorderColor = isCritical
    ? ios.destructiveBorder
    : isLow
      ? ios.warningText
      : !isAlertMode && allExpired
        ? ios.primary
        : ios.border;

  return (
    <GlassSurface
      borderColor={cardBorderColor}
      glassEffectStyle="clear"
      surfaceTone="subtle"
      style={{
        gap: 12,
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 14,
      }}
    >
      <XStack style={{ alignItems: 'flex-start', gap: 10 }}>
        <YStack style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={{ color: ios.foreground, fontSize: 18, lineHeight: 24, fontWeight: '900' }}>
            {`${box.name}${(box.dose ?? 0) > 0 ? ` (${box.dose} mg)` : ''}`}
          </Text>
          {isAlertMode ? (
            <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18 }}>
              {isCritical ? t('critical_stock') : t('low_stock')}
            </Text>
          ) : null}
          <XStack style={{ alignItems: 'center', gap: 4 }}>
            <Ionicons name="notifications-outline" size={12} color={ios.mutedForeground} />
            <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 16 }}>
              {`${t('boxes.alert_threshold')} : ${box.stock_alert_threshold}`}
            </Text>
          </XStack>
        </YStack>

        {actions && actions.length > 0 ? (
          <ContextMenu actions={actions} buttonSize="sm" variant="plain" />
        ) : null}
      </XStack>

      <YStack style={{ gap: 12 }}>
        <XStack style={{ alignItems: 'stretch', gap: 12 }}>
          <YStack style={{ flex: 1, gap: 2, justifyContent: 'center' }}>
            <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 16 }}>
              {t('boxes.remaining_qty')}
            </Text>
            <Text
              style={{
              color: isCritical ? ios.destructive : ios.foreground,
                fontSize: 16,
                lineHeight: 22,
                fontWeight: '900',
              }}
            >
              {box.stock_quantity}
            </Text>
          </YStack>

          {canRestock ? (
            <Pressable
              onPress={() => {
                hapticImpact();
                onRestock?.(box.id);
              }}
              disabled={disabled || box.box_capacity === 0}
              accessibilityRole="button"
              accessibilityLabel={String(t('boxes.restock'))}
              style={{ flex: 1 }}
            >
              {({ pressed }) => (
                <GlassSurface
                  glassEffectStyle="clear"
                  style={{
                    minHeight: 46,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 14,
                    borderColor: pressed ? ios.primary : ios.border,
                    opacity: disabled || box.box_capacity === 0 ? 0.5 : 1,
                    paddingHorizontal: 12,
                  }}
                >
                  <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Ionicons name="add-circle-outline" size={18} color={ios.primary} />
                    <Text style={{ color: ios.primary, fontSize: 15, lineHeight: 20, fontWeight: '800' }}>
                      {t('boxes.restock')}
                    </Text>
                  </XStack>
                </GlassSurface>
              )}
            </Pressable>
          ) : null}
        </XStack>
      </YStack>

      <XStack style={{ flexWrap: 'wrap', gap: 8 }}>
        {getBoxStatusItems(box).map((item) => {
          const palette = item.variant === 'danger'
            ? { background: ios.destructiveBg, color: ios.destructive }
            : item.variant === 'success'
              ? { background: ios.successBg, color: ios.success }
              : item.variant === 'info'
                ? { background: ios.accentHover, color: ios.mutedForeground }
                : { background: ios.warningBg, color: ios.warningText };

          return (
            <XStack
              key={item.key}
              style={{
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: palette.background,
              }}
            >
              <Ionicons name={STATUS_ICON_MAP[item.key]} size={14} color={palette.color} />
              <Text style={{ color: palette.color, fontSize: 12, lineHeight: 16, fontWeight: '800' }}>
                {t(item.i18nKey)}
              </Text>
            </XStack>
          );
        })}
      </XStack>

      {isFullBox(box) && !isAlertMode ? (
        <Pressable
          onPress={() => {
            hapticSelection();
            (onToggleExpanded ?? onEdit)?.();
          }}
          disabled={!onToggleExpanded && !onEdit}
          accessibilityRole="button"
        >
          {({ pressed }) => (
            <GlassSurface
              glassEffectStyle="clear"
              style={{
                gap: 8,
                borderRadius: 14,
                borderColor: ios.border,
                paddingHorizontal: 12,
                paddingVertical: 12,
                opacity: !onToggleExpanded && !onEdit ? 0.7 : 1,
              }}
            >
              <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <Text style={{ flex: 1, color: ios.foreground, fontSize: 14, lineHeight: 20, fontWeight: '700' }}>
                  {formatConditionSummary(box, translate)}
                </Text>
                <Ionicons
                  name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={18}
                  color={ios.mutedForeground}
                />
              </XStack>

              {expanded ? (
                <YStack style={{ gap: 6 }}>
                  {box.conditions.filter(Boolean).map((condition, index) => (
                    <Text
                      key={`${condition.id ?? index}-${condition.time_of_day ?? 'time'}`}
                      style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18 }}
                    >
                      {formatConditionLine(box, index, translate)}
                    </Text>
                  ))}
                </YStack>
              ) : null}
            </GlassSurface>
          )}
        </Pressable>
      ) : null}

      {showMissingPillbox ? (
        <YStack style={{ gap: 8 }}>
          <Pressable
            onPress={() => {
              hapticImpact();
              onMissingPillbox?.(box.id);
            }}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={String(t('boxes.missing_pillbox'))}
          >
            {({ pressed }) => (
              <GlassSurface
                glassEffectStyle="clear"
                style={{
                  minHeight: 46,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 14,
                  borderColor: pressed ? ios.primary : ios.border,
                  opacity: disabled ? 0.5 : 1,
                  paddingHorizontal: 14,
                }}
              >
                <Ionicons name="grid-outline" size={18} color={ios.primary} />
                <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 20, fontWeight: '800' }}>
                  {t('boxes.missing_pillbox')}
                </Text>
              </GlassSurface>
            )}
          </Pressable>
        </YStack>
      ) : null}
    </GlassSurface>
  );
}
