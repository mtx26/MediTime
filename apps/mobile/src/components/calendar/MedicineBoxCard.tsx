import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type {
  BoxesViewBoxItem,
  CalendarBoxAlertItem,
  MobileMedicineBoxCardProps,
} from '@meditime/types';
import type { MobileActionSheetAction } from '../common/ActionSheet';
import ActionSheet from '../common/ActionSheet';
import { useIosTheme } from '../../theme/ios';

function isFullBox(box: BoxesViewBoxItem | CalendarBoxAlertItem): box is BoxesViewBoxItem {
  return Array.isArray((box as BoxesViewBoxItem).conditions);
}

function hasOnlyExpiredConditions(box: BoxesViewBoxItem) {
  return box.conditions.length > 0 && box.conditions.every((condition) => {
    if (!condition?.max_date) return false;
    return new Date() > new Date(condition.max_date);
  });
}

function hasSomeExpiredConditions(box: BoxesViewBoxItem) {
  return box.conditions.some((condition) => {
    if (!condition?.max_date) return false;
    return new Date() > new Date(condition.max_date);
  });
}

function getStatusItems(
  box: BoxesViewBoxItem | CalendarBoxAlertItem,
  t: (key: string) => string,
) {
  const statuses: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    text: string;
    tone: 'warning' | 'danger' | 'success' | 'info';
  }> = [];

  if (isFullBox(box)) {
    if (box.conditions.filter(Boolean).length === 0) {
      statuses.push({ icon: 'information-circle-outline', tone: 'warning', text: t('boxes.condition.none') });
    } else if (hasOnlyExpiredConditions(box)) {
      statuses.push({ icon: 'pause-circle-outline', tone: 'info', text: t('boxes.condition.inactive') });
    } else if (hasSomeExpiredConditions(box)) {
      statuses.push({ icon: 'alert-circle-outline', tone: 'info', text: t('boxes.condition.expired') });
    }
  }

  if (box.box_capacity <= 0 || box.stock_alert_threshold <= 0) {
    statuses.push({ icon: 'notifications-off-outline', tone: 'info', text: t('boxes.stock.badge.alerts_disabled') });
    return statuses;
  }

  if (box.stock_quantity <= 0) {
    statuses.push({ icon: 'warning-outline', tone: 'danger', text: t('boxes.stock.badge.out') });
  } else if (box.stock_quantity <= box.stock_alert_threshold) {
    statuses.push({ icon: 'warning-outline', tone: 'warning', text: t('boxes.stock.badge.low') });
  } else {
    statuses.push({ icon: 'checkmark-circle-outline', tone: 'success', text: t('boxes.stock.badge.high') });
  }

  return statuses;
}

function formatConditionSummary(box: BoxesViewBoxItem, t: (key: string) => string) {
  return `${t('boxes.intake_conditions')}: ${box.conditions.filter(Boolean).length}`;
}

function formatConditionLine(box: BoxesViewBoxItem, index: number, t: (key: string) => string) {
  const condition = box.conditions[index];
  if (!condition) return '';

  const tabletCount = Number(condition.tablet_count ?? 1);
  const intervalDays = Number(condition.interval_days ?? 1);

  return [
    `${tabletCount} ${tabletCount > 1 ? t('boxes.tablets') : t('boxes.tablet')}`,
    condition.time_of_day ?? '-',
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
}: MobileMedicineBoxCardProps<MobileActionSheetAction>) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const translate = (key: string) => String(t(key));
  const isCritical = box.stock_quantity <= 0;
  const isAlertMode = mode === 'alerts';
  const canRestock = typeof onRestock === 'function';
  const showMissingPillbox = box.stock_quantity < 0 && typeof onMissingPillbox === 'function';
  const statuses = getStatusItems(box, translate);
  const cardBorderColor = isCritical
    ? ios.destructiveBorder
    : !isAlertMode && isFullBox(box) && hasOnlyExpiredConditions(box)
      ? ios.primary
      : ios.border;

  return (
    <YStack
      style={{
        gap: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: cardBorderColor,
        backgroundColor: ios.card,
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
        </YStack>

        {actions && actions.length > 0 ? (
          <ActionSheet actions={actions} buttonSize="sm" variant="plain" />
        ) : null}
      </XStack>

      <XStack style={{ gap: 12 }}>
        <YStack style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 16 }}>
            {t('boxes.capacity')}
          </Text>
          <Text style={{ color: ios.foreground, fontSize: 16, lineHeight: 22, fontWeight: '800' }}>
            {box.box_capacity}
          </Text>
        </YStack>

        <YStack style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 16 }}>
            {t('boxes.alert_threshold')}
          </Text>
          <Text style={{ color: ios.foreground, fontSize: 16, lineHeight: 22, fontWeight: '800' }}>
            {box.stock_alert_threshold}
          </Text>
        </YStack>

        <YStack style={{ flex: 1, gap: 2 }}>
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
      </XStack>

      <XStack style={{ flexWrap: 'wrap', gap: 8 }}>
        {statuses.map((status) => {
          const palette = status.tone === 'danger'
            ? { background: ios.destructiveBg, color: ios.destructive }
            : status.tone === 'success'
              ? { background: ios.successBg, color: ios.success }
              : status.tone === 'info'
                ? { background: ios.accentHover, color: ios.mutedForeground }
                : { background: ios.warningBg, color: ios.warningText };

          return (
            <XStack
              key={status.text}
              style={{
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: palette.background,
              }}
            >
              <Ionicons name={status.icon} size={14} color={palette.color} />
              <Text style={{ color: palette.color, fontSize: 12, lineHeight: 16, fontWeight: '800' }}>
                {status.text}
              </Text>
            </XStack>
          );
        })}
      </XStack>

      {isFullBox(box) && !isAlertMode ? (
        <Pressable
          onPress={onToggleExpanded ?? onEdit ?? undefined}
          disabled={!onToggleExpanded && !onEdit}
          accessibilityRole="button"
        >
          {({ pressed }) => (
            <YStack
              style={{
                gap: 8,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: ios.border,
                backgroundColor: pressed ? ios.accentHover : ios.background,
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
            </YStack>
          )}
        </Pressable>
      ) : null}

      {canRestock || showMissingPillbox ? (
        <YStack style={{ gap: 8 }}>
          {canRestock ? (
            <Pressable
              onPress={() => onRestock?.(box.id)}
              disabled={disabled || box.box_capacity === 0}
              accessibilityRole="button"
              accessibilityLabel={String(t('boxes.restock'))}
            >
              {({ pressed }) => (
                <XStack
                  style={{
                    minHeight: 46,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 14,
                    backgroundColor: pressed ? ios.accentHover : ios.blueInfoBg,
                    opacity: disabled || box.box_capacity === 0 ? 0.5 : 1,
                    paddingHorizontal: 14,
                  }}
                >
                  <Ionicons name="add-circle-outline" size={18} color={ios.primary} />
                  <Text style={{ color: ios.primary, fontSize: 15, lineHeight: 20, fontWeight: '800' }}>
                    {t('boxes.restock')}
                  </Text>
                </XStack>
              )}
            </Pressable>
          ) : null}

          {showMissingPillbox ? (
            <Pressable
              onPress={() => onMissingPillbox?.(box.id)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={String(t('boxes.missing_pillbox'))}
            >
              {({ pressed }) => (
                <XStack
                  style={{
                    minHeight: 46,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: ios.border,
                    backgroundColor: pressed ? ios.accentHover : ios.background,
                    opacity: disabled ? 0.5 : 1,
                    paddingHorizontal: 14,
                  }}
                >
                  <Ionicons name="grid-outline" size={18} color={ios.primary} />
                  <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 20, fontWeight: '800' }}>
                    {t('boxes.missing_pillbox')}
                  </Text>
                </XStack>
              )}
            </Pressable>
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  );
}
