import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import type { CalendarItem } from '@meditime/types';
import type { MobileActionSheetAction } from '../common/ActionSheet';
import { useIosTheme } from '../../theme/ios';
import { CalendarRow } from './CalendarRow';
import { EmptyInfo } from './EmptyInfo';

type CalendarSectionProps = {
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  calendars: CalendarItem[];
  emptyText?: string;
  showInfoEmpty?: boolean;
  addFooter?: ReactNode;
  getActions: (calendar: CalendarItem) => MobileActionSheetAction[];
  onOpen: (calendar: CalendarItem) => void;
  onNavigate: (href: string) => void;
  renameMode?: string | null;
  renameValues?: Record<string, string>;
  isMutating?: boolean;
  onRenameChange?: (calendarId: string, value: string) => void;
  onRenameSubmit?: (calendar: CalendarItem) => void;
  onRenameCancel?: () => void;
};

export function CalendarSection({
  title,
  iconName,
  calendars,
  emptyText,
  showInfoEmpty = false,
  addFooter,
  getActions,
  onOpen,
  onNavigate,
  renameMode,
  renameValues = {},
  isMutating = false,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}: CalendarSectionProps) {
  const ios = useIosTheme();

  return (
    <YStack style={{ width: '100%', maxWidth: 672, gap: 16 }}>
      <XStack style={{ alignItems: 'center', gap: 8, marginBottom: 0 }}>
        <Ionicons name={iconName} size={24} color={ios.primary} />
        <Text style={{ color: ios.foreground, fontSize: 20, lineHeight: 28, fontWeight: '800' }}>
          {title}
        </Text>
      </XStack>

      {showInfoEmpty && calendars.length === 0 && emptyText ? (
        <EmptyInfo text={emptyText} />
      ) : (
        <YStack
          style={{
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: ios.border,
            borderRadius: 14,
            backgroundColor: ios.card,
          }}
        >
          {calendars.map((calendar, index) => (
            <CalendarRow
              key={calendar.id}
              calendar={calendar}
              isLast={index === calendars.length - 1 && !addFooter}
              actions={getActions(calendar)}
              onOpen={onOpen}
              onNavigate={onNavigate}
              isRenaming={renameMode === calendar.id}
              renameValue={renameValues[calendar.id] ?? ''}
              isMutating={isMutating}
              onRenameChange={onRenameChange}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
            />
          ))}
          {addFooter}
        </YStack>
      )}
    </YStack>
  );
}
