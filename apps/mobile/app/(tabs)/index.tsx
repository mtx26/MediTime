import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Linking, Modal, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Input,
  ScrollView,
  Spinner,
  Text,
  XStack,
  YStack,
} from 'tamagui';
import type { CalendarItem } from '@meditime/types';
import {
  buildPersonalCalendarActions,
  buildSharedCalendarActions,
} from '@meditime/utils';
import ActionSheet, { type MobileActionSheetAction } from '../../src/components/common/ActionSheet';
import { useCalendars } from '../../src/hooks/calendars/useCalendars';
import { toActionSheetItems } from '../../src/utils/actionSheetAdapter';

const web = {
  background: '#ffffff',
  foreground: '#020817',
  primary: '#0f172a',
  mutedForeground: '#64748b',
  border: '#e2e8f0',
  accentHover: '#f1f5f9',
  blueInfoBg: 'rgba(59, 130, 246, 0.15)',
  blueInfoBorder: 'rgba(59, 130, 246, 0.5)',
  blueText: '#2563eb',
  warningBg: '#fef3c7',
  warningText: '#92400e',
  destructive: '#dc2626',
};

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
  onStockPress: (calendar: CalendarItem) => void;
  renameMode?: string | null;
  renameValues?: Record<string, string>;
  isMutating?: boolean;
  onRenameChange?: (calendarId: string, value: string) => void;
  onRenameSubmit?: (calendar: CalendarItem) => void;
  onRenameCancel?: () => void;
};

function toMobileHref(webHref: string) {
  const [path, query] = webHref.split('?');
  const parts = path.split('/').filter(Boolean);
  const mobileRootRoutes = new Set([
    'calendar',
    'shared-user-calendar',
    'shared-token-calendar',
    'shared-calendars',
    'add-calendar',
  ]);
  const routeParts = mobileRootRoutes.has(parts[0]) ? parts : parts.slice(1);
  return `/${routeParts.join('/')}${query ? `?${query}` : ''}`;
}

function OutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button
      size="$3"
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingHorizontal: 16,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: web.border,
        backgroundColor: web.background,
      }}
    >
      <Text style={{ color: web.foreground, fontWeight: '600' }}>{label}</Text>
    </Button>
  );
}

function IconButton({
  label,
  iconName,
  onPress,
  variant = 'outline',
  disabled = false,
}: {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'outline' | 'default';
  disabled?: boolean;
}) {
  const isDefault = variant === 'default';

  return (
    <Button
      size="$3"
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 40,
        minHeight: 40,
        paddingHorizontal: 0,
        borderRadius: 6,
        borderWidth: isDefault ? 0 : 1,
        borderColor: web.border,
        backgroundColor: isDefault ? web.primary : web.background,
        opacity: disabled ? 0.6 : 1,
      }}
      aria-label={label}
    >
      <Ionicons name={iconName} size={18} color={isDefault ? web.background : web.foreground} />
    </Button>
  );
}

function StatusBadge({ text }: { text: string }) {
  return (
    <XStack
      style={{
        alignSelf: 'flex-start',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        backgroundColor: web.warningBg,
      }}
    >
      <Ionicons name="warning-outline" size={15} color={web.warningText} />
      <Text style={{ color: web.warningText, fontSize: 13, fontWeight: '700' }}>
        {text}
      </Text>
    </XStack>
  );
}

function RenameForm({
  calendar,
  value,
  disabled,
  onChange,
  onSubmit,
  onCancel,
}: {
  calendar: CalendarItem;
  value: string;
  disabled: boolean;
  onChange: (calendarId: string, value: string) => void;
  onSubmit: (calendar: CalendarItem) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();

  return (
    <YStack
      style={{
        paddingTop: 12,
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: web.border,
      }}
    >
      <XStack style={{ gap: 8, width: '100%', alignItems: 'center' }}>
        <Input
          id={`renameCalendarName${calendar.id}`}
          aria-label={t('calendar.new_name')}
          value={value}
          disabled={disabled}
          onChangeText={(next) => onChange(calendar.id, next)}
          placeholder={t('calendar.new_name')}
          returnKeyType="done"
          onSubmitEditing={() => onSubmit(calendar)}
          style={{ flex: 1, borderRadius: 6 }}
        />
        <IconButton
          label={t('rename')}
          iconName="pencil-outline"
          variant="default"
          disabled={disabled}
          onPress={() => onSubmit(calendar)}
        />
        <IconButton
          label={t('cancel')}
          iconName="close-outline"
          disabled={disabled}
          onPress={onCancel}
        />
      </XStack>
    </YStack>
  );
}

function CalendarRow({
  calendar,
  isLast,
  actions,
  onOpen,
  onNavigate,
  onStockPress,
  isRenaming,
  renameValue,
  isMutating = false,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}: {
  calendar: CalendarItem;
  isLast: boolean;
  actions: MobileActionSheetAction[];
  onOpen: (calendar: CalendarItem) => void;
  onNavigate: (href: string) => void;
  onStockPress: (calendar: CalendarItem) => void;
  isRenaming?: boolean;
  renameValue?: string;
  isMutating?: boolean;
  onRenameChange?: (calendarId: string, value: string) => void;
  onRenameSubmit?: (calendar: CalendarItem) => void;
  onRenameCancel?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <YStack
      style={{
        padding: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: web.border,
        backgroundColor: web.background,
      }}
    >
      <XStack
        style={{
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <YStack style={{ flexGrow: 1, flexShrink: 1, minWidth: 160 }}>
          <Text
            numberOfLines={2}
            style={{
              color: web.foreground,
              fontSize: 18,
              lineHeight: 24,
              fontWeight: '700',
              marginBottom: 4,
            }}
          >
            {calendar.name}
          </Text>

          <Text style={{ color: web.mutedForeground, fontSize: 14, lineHeight: 20 }}>
            {t('medicines.label')}:{' '}
            <Text style={{ color: web.foreground, fontWeight: '700' }}>
              {calendar.boxes_count ?? '...'}
            </Text>
          </Text>

          {calendar.owner_name && (
            <Text
              numberOfLines={1}
              style={{ color: web.mutedForeground, fontSize: 14, lineHeight: 20, marginTop: 4 }}
            >
              {t('shared_by')}{' '}
              <Text style={{ color: web.foreground, fontWeight: '700' }}>
                {calendar.owner_name}
              </Text>
            </Text>
          )}
        </YStack>

        <XStack style={{ alignItems: 'center', gap: 8 }}>
          <OutlineButton label={t('open')} onPress={() => onOpen(calendar)} />
          <ActionSheet actions={actions} onNavigate={onNavigate} />
        </XStack>
      </XStack>

      {calendar.ifLowStock && (
        <Pressable onPress={() => onStockPress(calendar)}>
          <StatusBadge text={t('stock_alert')} />
        </Pressable>
      )}

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
  );
}

function EmptyInfo({ text }: { text: string }) {
  return (
    <XStack
      style={{
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: web.blueInfoBorder,
        backgroundColor: web.blueInfoBg,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }}
    >
      <Ionicons name="information-circle-outline" size={20} color={web.blueText} />
      <Text style={{ marginLeft: 8, color: web.foreground, fontWeight: '700', flex: 1 }}>
        {text}
      </Text>
    </XStack>
  );
}

function AddCalendarFooter({
  isAdding,
  name,
  disabled,
  onStart,
  onCancel,
  onChange,
  onSubmit,
}: {
  isAdding: boolean;
  name: string;
  disabled: boolean;
  onStart: () => void;
  onCancel: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();

  if (!isAdding) {
    return (
      <Button
        chromeless
        onPress={onStart}
        style={{
          minHeight: 40,
          borderRadius: 0,
          borderTopWidth: 1,
          borderTopColor: web.border,
          backgroundColor: web.background,
        }}
      >
        <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="add-outline" size={16} color={web.primary} />
          <Text style={{ color: web.primary, fontWeight: '700' }}>
            {t('calendar.add_calendar')}
          </Text>
        </XStack>
      </Button>
    );
  }

  return (
    <YStack
      style={{
        gap: 8,
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: web.border,
        backgroundColor: web.background,
      }}
    >
      <Input
        size="$4"
        value={name}
        onChangeText={onChange}
        disabled={disabled}
        placeholder={t('calendar.calendar_name_placeholder')}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        style={{ borderRadius: 6 }}
      />
      <XStack style={{ gap: 8, justifyContent: 'flex-end' }}>
        <IconButton label={t('cancel')} iconName="close-outline" disabled={disabled} onPress={onCancel} />
        <IconButton
          label={t('calendar.add_calendar')}
          iconName="checkmark-outline"
          variant="default"
          disabled={disabled}
          onPress={onSubmit}
        />
      </XStack>
    </YStack>
  );
}

function CalendarSection({
  title,
  iconName,
  calendars,
  emptyText,
  showInfoEmpty = false,
  addFooter,
  getActions,
  onOpen,
  onNavigate,
  onStockPress,
  renameMode,
  renameValues = {},
  isMutating = false,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}: CalendarSectionProps) {
  return (
    <YStack style={{ width: '100%', maxWidth: 672, gap: 16 }}>
      <XStack style={{ alignItems: 'center', gap: 8, marginBottom: 0 }}>
        <Ionicons name={iconName} size={24} color={web.primary} />
        <Text style={{ color: web.foreground, fontSize: 20, lineHeight: 28, fontWeight: '800' }}>
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
            borderColor: web.border,
            borderRadius: 8,
            backgroundColor: web.background,
            shadowColor: '#000',
            shadowOpacity: 0.16,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
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
              onStockPress={onStockPress}
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

function PdfDialog({
  open,
  includeInactive,
  onIncludeInactiveChange,
  onCancel,
  onDownload,
}: {
  open: boolean;
  includeInactive: boolean;
  onIncludeInactiveChange: (value: boolean) => void;
  onCancel: () => void;
  onDownload: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 20,
          backgroundColor: 'rgba(2, 8, 23, 0.35)',
        }}
      >
        <Pressable>
          <YStack
            style={{
              gap: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: web.border,
              borderRadius: 8,
              backgroundColor: web.background,
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
            }}
          >
            <YStack style={{ gap: 8 }}>
              <Text style={{ color: web.foreground, fontSize: 20, lineHeight: 28, fontWeight: '800' }}>
                {t('boxes.export_pdf_title')}
              </Text>
              <Text style={{ color: web.mutedForeground, fontSize: 14, lineHeight: 20 }}>
                {t('boxes.export_pdf_description')}
              </Text>
            </YStack>

            <Pressable onPress={() => onIncludeInactiveChange(!includeInactive)}>
              <XStack style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                <Ionicons
                  name={includeInactive ? 'checkbox-outline' : 'square-outline'}
                  size={22}
                  color={web.foreground}
                />
                <Text style={{ flex: 1, color: web.foreground, fontSize: 15, fontWeight: '600' }}>
                  {t('boxes.include_inactive_medicines')}
                </Text>
              </XStack>
            </Pressable>

            <XStack style={{ justifyContent: 'flex-end', gap: 8 }}>
              <OutlineButton label={t('cancel')} onPress={onCancel} />
              <Button
                size="$3"
                onPress={onDownload}
                style={{
                  minHeight: 40,
                  paddingHorizontal: 16,
                  borderRadius: 6,
                  backgroundColor: web.primary,
                }}
              >
                <XStack style={{ alignItems: 'center', gap: 8 }}>
                  <Ionicons name="download-outline" size={16} color={web.background} />
                  <Text style={{ color: web.background, fontWeight: '700' }}>{t('boxes.export_pdf')}</Text>
                </XStack>
              </Button>
            </XStack>
          </YStack>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function CalendarsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lng = i18n.language || 'fr';
  const [calendarName, setCalendarName] = useState('');
  const [isAddingCalendar, setIsAddingCalendar] = useState(false);
  const [renameValues, setRenameValues] = useState<Record<string, string>>({});
  const [renameMode, setRenameMode] = useState<string | null>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfCalendarId, setPdfCalendarId] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const {
    personalCalendars,
    sharedCalendars,
    isLoading,
    isMutating,
    error,
    loadCalendars,
    addCalendar,
    deleteCalendar,
    renameCalendar,
    deleteSharedCalendar,
    getPersonalCalendarPdfUrl,
  } = useCalendars();

  useFocusEffect(
    useCallback(() => {
      void loadCalendars();
    }, [loadCalendars]),
  );

  const translate = useCallback((key: string) => String(t(key)), [t]);

  const navigateToHref = useCallback(
    (href: string) => {
      router.push(toMobileHref(href) as never);
    },
    [router],
  );

  const handleAddCalendar = async () => {
    const name = calendarName.trim();
    if (!name) return;

    const result = await addCalendar(name);
    if (result.success) {
      setCalendarName('');
      setIsAddingCalendar(false);
      return;
    }

    Alert.alert(t('calendar.error_calendar_creation'), result.error ?? t('calendar.error_calendar_creation'));
  };

  const openPdfDialog = (calendarId: string) => {
    setPdfCalendarId(calendarId);
    setIncludeInactive(false);
    setPdfDialogOpen(true);
  };

  const handleDownloadPdf = async () => {
    if (!pdfCalendarId) return;

    const url = getPersonalCalendarPdfUrl(pdfCalendarId, includeInactive);
    setPdfDialogOpen(false);
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('errors.pdf_download_error'), t('errors.pdf_download_error'));
    }
  };

  const handleRenameSubmit = (calendar: CalendarItem) => {
    const nextName = (renameValues[calendar.id] ?? '').trim();
    if (!nextName) return;

    Alert.alert(
      t('calendar.rename_title'),
      t('calendar.rename_description'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('rename'),
          onPress: () => {
            void renameCalendar(calendar.id, nextName).then((result) => {
              if (result.success) {
                setRenameValues((prev) => ({ ...prev, [calendar.id]: '' }));
                setRenameMode(null);
                return;
              }
              Alert.alert(t('calendar.rename_error'), result.error ?? t('calendar.rename_error'));
            });
          },
        },
      ],
    );
  };

  const handleDeleteCalendarClick = (calendarId: string) => {
    Alert.alert(
      t('calendar.delete_title'),
      t('calendar.delete_description'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            void deleteCalendar(calendarId);
          },
        },
      ],
    );
  };

  const handleDeleteSharedCalendarClick = (calendarId: string) => {
    Alert.alert(
      t('calendar.delete_shared_title'),
      t('calendar.delete_shared_description'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            void deleteSharedCalendar(calendarId);
          },
        },
      ],
    );
  };

  const getPersonalActions = (calendar: CalendarItem) => {
    return toActionSheetItems(
      buildPersonalCalendarActions(
        { calendarId: calendar.id, lng, basePath: 'calendar', selectedDate: null },
        {
          onRename: () => setRenameMode(calendar.id),
          onDelete: () => handleDeleteCalendarClick(calendar.id),
          onExportPdf: () => openPdfDialog(calendar.id),
        },
        ['pillbox', 'day_view'],
      ),
      translate,
    );
  };

  const getSharedActions = (calendar: CalendarItem) => {
    return toActionSheetItems(
      buildSharedCalendarActions(
        { calendarId: calendar.id, lng, basePath: 'shared-user-calendar', selectedDate: null },
        {
          onDelete: () => handleDeleteSharedCalendarClick(calendar.id),
          onExportPdf: () => openPdfDialog(calendar.id),
        },
        ['pillbox', 'day_view'],
      ),
      translate,
    );
  };

  const openPersonalCalendar = (calendar: CalendarItem) => {
    router.push(`/calendar/${calendar.id}` as never);
  };

  const openSharedCalendar = (calendar: CalendarItem) => {
    router.push(`/shared-user-calendar/${calendar.id}` as never);
  };

  const openPersonalStockAlerts = (calendar: CalendarItem) => {
    router.push(`/calendar/${calendar.id}/stock-alerts` as never);
  };

  const openSharedStockAlerts = (calendar: CalendarItem) => {
    router.push(`/shared-user-calendar/${calendar.id}/stock-alerts` as never);
  };

  if (isLoading && personalCalendars.length === 0 && sharedCalendars.length === 0) {
    return (
      <YStack style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: web.background, gap: 12 }}>
        <Spinner size="large" color="$blue10" />
        <Text style={{ color: web.mutedForeground, fontWeight: '700' }}>{t('loading_calendars')}</Text>
      </YStack>
    );
  }

  return (
    <>
      <ScrollView
        flex={1}
        style={{ flex: 1, backgroundColor: web.background }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadCalendars} />}
      >
        <YStack
          style={{
            flex: 1,
            alignItems: 'center',
            gap: 24,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 96,
            backgroundColor: web.background,
          }}
        >
          {error && (
            <YStack
              style={{
                width: '100%',
                maxWidth: 672,
                gap: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: '#fecaca',
                borderRadius: 8,
                backgroundColor: '#fef2f2',
              }}
            >
              <Text style={{ color: web.destructive, fontWeight: '700' }}>{error}</Text>
              <OutlineButton label={t('retry')} onPress={loadCalendars} />
            </YStack>
          )}

          <CalendarSection
            title={t('my_calendars')}
            iconName="calendar-outline"
            calendars={personalCalendars}
            getActions={getPersonalActions}
            onOpen={openPersonalCalendar}
            onNavigate={navigateToHref}
            onStockPress={openPersonalStockAlerts}
            renameMode={renameMode}
            renameValues={renameValues}
            isMutating={isMutating}
            onRenameChange={(calendarId, value) =>
              setRenameValues((prev) => ({ ...prev, [calendarId]: value }))
            }
            onRenameSubmit={handleRenameSubmit}
            onRenameCancel={() => setRenameMode(null)}
            addFooter={
              <AddCalendarFooter
                isAdding={isAddingCalendar}
                name={calendarName}
                disabled={isMutating}
                onStart={() => setIsAddingCalendar(true)}
                onCancel={() => {
                  setIsAddingCalendar(false);
                  setCalendarName('');
                }}
                onChange={setCalendarName}
                onSubmit={handleAddCalendar}
              />
            }
          />

          <CalendarSection
            title={t('shared_calendars')}
            iconName="people-outline"
            calendars={sharedCalendars}
            emptyText={t('no_shared_calendars')}
            showInfoEmpty
            getActions={getSharedActions}
            onOpen={openSharedCalendar}
            onNavigate={navigateToHref}
            onStockPress={openSharedStockAlerts}
          />
        </YStack>
      </ScrollView>

      <PdfDialog
        open={pdfDialogOpen}
        includeInactive={includeInactive}
        onIncludeInactiveChange={setIncludeInactive}
        onCancel={() => setPdfDialogOpen(false)}
        onDownload={handleDownloadPdf}
      />
    </>
  );
}
