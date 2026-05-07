import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView, type GlassStyle } from 'expo-glass-effect';
import { Text, XStack, YStack } from 'tamagui';
import type { CalendarItem } from '@meditime/types';
import type { MobileContextMenuActionList } from '../common/ContextMenu';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { CalendarRow } from './CalendarRow';
import { EmptyInfo } from './EmptyInfo';

type CalendarSectionProps = {
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  calendars: CalendarItem[];
  emptyText?: string;
  showInfoEmpty?: boolean;
  addFooter?: ReactNode;
  glassEffectStyle?: GlassStyle;
  glassStyle?: StyleProp<ViewStyle>;
  getActions: (calendar: CalendarItem) => MobileContextMenuActionList;
  getStockAlertHref?: (calendar: CalendarItem) => string;
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
  glassEffectStyle = 'clear',
  glassStyle,
  getActions,
  getStockAlertHref,
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
  const { colorScheme } = useAppTheme();

  return (
    <YStack style={{ width: '100%', maxWidth: 672, gap: 14 }}>
      <XStack style={{ alignItems: 'center', gap: 8 }}>
        <Ionicons name={iconName} size={24} color={ios.primary} />
        <Text style={{ color: ios.foreground, fontSize: 20, lineHeight: 28, fontWeight: '800' }}>
          {title}
        </Text>
      </XStack>
      {calendars.length === 0 ? (
        showInfoEmpty && emptyText ? (
          <EmptyInfo text={emptyText} />
        ) : null
      ) : (
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle={glassEffectStyle}
          style={[
            {
              borderRadius: 24,
            },
            glassStyle,
          ]}
        >
          {calendars.map((calendar, index) => (
            <CalendarRow
              key={calendar.id}
              calendar={calendar}
              isLast={index === calendars.length - 1 && !addFooter}
              actions={getActions(calendar)}
              getStockAlertHref={getStockAlertHref}
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
        </GlassView>
      )}
    </YStack>
  );
}
