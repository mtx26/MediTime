import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import type { CalendarItem } from '@meditime/types';
import ActionSheet, { type MobileActionSheetAction } from '../common/ActionSheet';
import { ios } from '../../theme/ios';
import { RenameForm } from './RenameForm';
import { StatusBadge } from './StatusBadge';

type CalendarRowProps = {
  calendar: CalendarItem;
  isLast: boolean;
  actions: MobileActionSheetAction[];
  onOpen: (calendar: CalendarItem) => void;
  onNavigate: (href: string) => void;
  isRenaming?: boolean;
  renameValue?: string;
  isMutating?: boolean;
  onRenameChange?: (calendarId: string, value: string) => void;
  onRenameSubmit?: (calendar: CalendarItem) => void;
  onRenameCancel?: () => void;
};

export function CalendarRow({
  calendar,
  isLast,
  actions,
  onOpen,
  onNavigate,
  isRenaming,
  renameValue,
  isMutating = false,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}: CalendarRowProps) {
  const { t } = useTranslation();

  return (
    <ActionSheet
      actions={actions}
      onNavigate={onNavigate}
      triggerMode="longPress"
      onPress={isRenaming ? undefined : () => onOpen(calendar)}
    >
      <YStack
        style={{
          padding: 12,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: ios.border,
          backgroundColor: ios.card,
        }}
      >
        <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <YStack style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={2}
              style={{
                color: ios.foreground,
                fontSize: 18,
                lineHeight: 24,
                fontWeight: '700',
                marginBottom: 4,
              }}
            >
              {calendar.name}
            </Text>

            <Text style={{ color: ios.mutedForeground, fontSize: 14, lineHeight: 20 }}>
              {t('medicines.label')}:{' '}
              <Text style={{ color: ios.foreground, fontWeight: '700' }}>
                {calendar.boxes_count ?? '...'}
              </Text>
            </Text>

            {calendar.owner_name && (
              <Text
                numberOfLines={1}
                style={{ color: ios.mutedForeground, fontSize: 14, lineHeight: 20, marginTop: 4 }}
              >
                {t('shared_by')}{' '}
                <Text style={{ color: ios.foreground, fontWeight: '700' }}>
                  {calendar.owner_name}
                </Text>
              </Text>
            )}
          </YStack>

          <YStack style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-forward" size={20} color={ios.mutedForeground} />
          </YStack>
        </XStack>

        {calendar.ifLowStock && <StatusBadge text={t('stock_alert')} />}

        {isRenaming && onRenameChange && onRenameSubmit && onRenameCancel && (
          <RenameForm
            calendar={calendar}
            value={renameValue ?? ''}
            disabled={isMutating}
            onChange={onRenameChange}
            onSubmit={onRenameSubmit}
            onCancel={onRenameCancel}
          />
        )}
      </YStack>
    </ActionSheet>
  );
}
