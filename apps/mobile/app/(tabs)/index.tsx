import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Linking, Modal, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
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
import type { CalendarItem, MedicineReviewMedicineInput, QRScannedMedicine } from '@meditime/types';
import {
  ADD_CALENDAR_IMPORT_TYPES,
  type AddCalendarImportType,
} from '@meditime/constants';
import {
  buildPersonalCalendarActions,
  buildSharedCalendarActions,
  extractGTIN01,
  fetchMedicamentsFromSupabase,
} from '@meditime/utils';
import ActionSheet, { type MobileActionSheetAction } from '../../src/components/common/ActionSheet';
import { useCalendars } from '../../src/hooks/calendars/useCalendars';
import { toActionSheetItems } from '../../src/utils/actionSheetAdapter';

const ios = {
  background: '#f2f2f7',
  card: '#ffffff',
  foreground: '#111111',
  primary: '#007aff',
  mutedForeground: '#8e8e93',
  border: '#d1d1d6',
  accentHover: '#e5e5ea',
  blueInfoBg: '#e8f3ff',
  blueInfoBorder: '#bfddff',
  blueText: '#007aff',
  warningBg: '#fff8e1',
  warningText: '#a05a00',
  destructive: '#ff3b30',
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

type AddCalendarStep = 'form' | 'review';
type MedicineReviewField = 'name' | 'dose' | 'stock_quantity' | 'stock_max' | 'stock_alert_threshold';

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

function parsePositiveInteger(value: string | number | null | undefined, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const parsed = parseInt(String(value ?? '').replace(/\D/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMedicineReviewInput(medicine: MedicineReviewMedicineInput): MedicineReviewMedicineInput {
  return {
    ...medicine,
    stock_quantity: medicine.stock_quantity ?? '',
    stock_max: medicine.stock_max ?? '',
    stock_alert_threshold: medicine.stock_alert_threshold ?? '',
    conditions: Array.isArray(medicine.conditions) ? medicine.conditions : [],
  };
}

function getApiErrorMessage(result: unknown, fallback: string) {
  const error = typeof result === 'object' && result ? (result as { error?: unknown }).error : null;
  return typeof error === 'string' ? error : fallback;
}

function OutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button
      size="$3"
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 0,
        borderColor: 'transparent',
        backgroundColor: '#e8f3ff',
      }}
    >
      <Text style={{ color: ios.primary, fontWeight: '700' }}>{label}</Text>
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
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {({ pressed }) => (
        <YStack
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            backgroundColor: isDefault ? ios.primary : '#e8f3ff',
            opacity: disabled ? 0.6 : pressed ? 0.75 : 1,
          }}
        >
          <Ionicons name={iconName} size={18} color={isDefault ? ios.card : ios.primary} />
        </YStack>
      )}
    </Pressable>
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
        borderRadius: 8,
        backgroundColor: ios.warningBg,
      }}
    >
      <Ionicons name="warning-outline" size={15} color={ios.warningText} />
      <Text style={{ color: ios.warningText, fontSize: 13, fontWeight: '700' }}>
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
        borderTopColor: ios.border,
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
          style={{
            flex: 1,
            minHeight: 44,
            borderWidth: 0,
            borderRadius: 12,
            backgroundColor: ios.background,
            color: ios.foreground,
            fontSize: 16,
          }}
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
  isRenaming?: boolean;
  renameValue?: string;
  isMutating?: boolean;
  onRenameChange?: (calendarId: string, value: string) => void;
  onRenameSubmit?: (calendar: CalendarItem) => void;
  onRenameCancel?: () => void;
}) {
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
        <XStack
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
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

          <YStack
            style={{
              width: 24,
              height: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={ios.mutedForeground} />
          </YStack>
        </XStack>

        {calendar.ifLowStock && (
          <StatusBadge text={t('stock_alert')} />
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
    </ActionSheet>
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
        borderRadius: 12,
        borderWidth: 1,
        borderColor: ios.blueInfoBorder,
        backgroundColor: ios.blueInfoBg,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }}
    >
      <Ionicons name="information-circle-outline" size={20} color={ios.blueText} />
      <Text style={{ marginLeft: 8, color: ios.foreground, fontWeight: '700', flex: 1 }}>
        {text}
      </Text>
    </XStack>
  );
}

function AddCalendarFooter({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {({ pressed }) => (
        <XStack
          style={{
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderTopWidth: 1,
            borderTopColor: ios.border,
            backgroundColor: pressed ? ios.accentHover : ios.card,
          }}
        >
          <Ionicons name="add-circle-outline" size={19} color={ios.primary} />
          <Text style={{ color: ios.primary, fontSize: 16, fontWeight: '700' }}>
            {t('calendar.add_calendar')}
          </Text>
        </XStack>
      )}
    </Pressable>
  );
}

function ImportTypeOption({
  label,
  iconName,
  selected,
  onPress,
}: {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {({ pressed }) => (
        <XStack
          style={{
            minHeight: 44,
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: selected ? ios.blueInfoBg : pressed ? ios.accentHover : ios.background,
            borderWidth: selected ? 1 : 0,
            borderColor: selected ? ios.blueInfoBorder : 'transparent',
          }}
        >
          <Ionicons name={iconName} size={19} color={selected ? ios.primary : ios.mutedForeground} />
          <Text
            style={{
              flex: 1,
              color: selected ? ios.primary : ios.foreground,
              fontSize: 15,
              fontWeight: '700',
            }}
          >
            {label}
          </Text>
          {selected && <Ionicons name="checkmark-circle" size={18} color={ios.primary} />}
        </XStack>
      )}
    </Pressable>
  );
}

function InfoBanner({
  iconName,
  text,
  tone = 'info',
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  text: string;
  tone?: 'info' | 'warning';
}) {
  const isInfo = tone === 'info';

  return (
    <XStack
      style={{
        gap: 10,
        padding: 12,
        borderRadius: 14,
        backgroundColor: isInfo ? ios.blueInfoBg : ios.warningBg,
      }}
    >
      <Ionicons
        name={iconName}
        size={20}
        color={isInfo ? ios.blueText : ios.warningText}
      />
      <Text
        style={{
          flex: 1,
          color: ios.foreground,
          fontSize: 14,
          lineHeight: 20,
          fontWeight: '600',
        }}
      >
        {text}
      </Text>
    </XStack>
  );
}

function QRImportPanel({
  medicines,
  loadingGtin,
  disabled,
  onBarcodeScanned,
  onRemoveMedicine,
}: {
  medicines: QRScannedMedicine[];
  loadingGtin: string | null;
  disabled: boolean;
  onBarcodeScanned: (result: BarcodeScanningResult) => void;
  onRemoveMedicine: (codeFmd: string | null | undefined) => void;
}) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission?.granted;

  return (
    <YStack style={{ gap: 12 }}>
      <YStack
        style={{
          overflow: 'hidden',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: ios.border,
          backgroundColor: '#000',
          height: 240,
        }}
      >
        {hasPermission ? (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['datamatrix', 'qr'] }}
            onBarcodeScanned={disabled || loadingGtin ? undefined : onBarcodeScanned}
          />
        ) : (
          <YStack
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: 20,
              backgroundColor: ios.background,
            }}
          >
            <Ionicons name="camera-outline" size={30} color={ios.primary} />
            <Text style={{ textAlign: 'center', color: ios.foreground, fontWeight: '700' }}>
              {t('scanner.camera_error')}
            </Text>
            <OutlineButton label={t('boxes.scan_qr_code')} onPress={() => void requestPermission()} />
          </YStack>
        )}
      </YStack>

      {loadingGtin && (
        <XStack style={{ alignItems: 'center', gap: 8 }}>
          <Spinner size="small" color={ios.primary} />
          <Text style={{ color: ios.mutedForeground, fontWeight: '700' }}>
            {loadingGtin}
          </Text>
        </XStack>
      )}

      <YStack
        style={{
          overflow: 'hidden',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: ios.border,
          backgroundColor: ios.card,
        }}
      >
        {medicines.length === 0 ? (
          <YStack style={{ alignItems: 'center', gap: 8, padding: 16 }}>
            <Ionicons name="qr-code-outline" size={24} color={ios.mutedForeground} />
            <Text style={{ textAlign: 'center', color: ios.mutedForeground, fontWeight: '700' }}>
              {t('calendar.error_no_medicines')}
            </Text>
          </YStack>
        ) : (
          medicines.map((medicine, index) => (
            <XStack
              key={`${medicine.code_fmd ?? medicine.name}-${index}`}
              style={{
                alignItems: 'center',
                gap: 10,
                padding: 12,
                borderBottomWidth: index === medicines.length - 1 ? 0 : 1,
                borderBottomColor: ios.border,
              }}
            >
              <YStack style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={2} style={{ color: ios.foreground, fontSize: 16, fontWeight: '800' }}>
                  {medicine.name}
                </Text>
                <Text style={{ color: ios.mutedForeground, fontSize: 13, marginTop: 2 }}>
                  {medicine.dose ?? 0} mg - {medicine.stock_quantity}/{medicine.box_capacity}
                </Text>
              </YStack>
              <IconButton
                label={t('boxes.condition.delete')}
                iconName="trash-outline"
                disabled={disabled}
                onPress={() => onRemoveMedicine(medicine.code_fmd)}
              />
            </XStack>
          ))
        )}
      </YStack>
    </YStack>
  );
}

function ImageImportPanel({
  fileName,
  disabled,
  onPickImage,
  onRemoveImage,
}: {
  fileName: string | null;
  disabled: boolean;
  onPickImage: () => void;
  onRemoveImage: () => void;
}) {
  const { t } = useTranslation();

  return (
    <YStack style={{ gap: 12 }}>
      <Pressable onPress={onPickImage} disabled={disabled} accessibilityRole="button">
        {({ pressed }) => (
          <YStack
            style={{
              minHeight: 148,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: 18,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: fileName ? ios.blueInfoBorder : ios.border,
              backgroundColor: pressed ? ios.accentHover : fileName ? ios.blueInfoBg : ios.background,
            }}
          >
            <Ionicons
              name={fileName ? 'image-outline' : 'cloud-upload-outline'}
              size={32}
              color={fileName ? ios.primary : ios.mutedForeground}
            />
            <Text style={{ color: ios.foreground, textAlign: 'center', fontSize: 16, fontWeight: '800' }}>
              {fileName ? t('image_upload.file_selected') : t('image_upload.click_to_select_file')}
            </Text>
            <Text style={{ color: ios.mutedForeground, textAlign: 'center', fontSize: 13, fontWeight: '600' }}>
              {fileName ?? t('image_upload.file_types')}
            </Text>
          </YStack>
        )}
      </Pressable>

      {fileName && (
        <OutlineButton label={t('image_upload.remove_image')} onPress={onRemoveImage} />
      )}
    </YStack>
  );
}

function ReviewField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  required = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric';
  required?: boolean;
}) {
  return (
    <YStack style={{ gap: 7 }}>
      <Text style={{ color: ios.foreground, fontSize: 14, fontWeight: '700' }}>
        {label}{required ? <Text style={{ color: ios.destructive }}> *</Text> : null}
      </Text>
      <Input
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={{
          minHeight: 44,
          borderWidth: 0,
          borderRadius: 12,
          backgroundColor: ios.background,
          color: ios.foreground,
          fontSize: 16,
        }}
      />
    </YStack>
  );
}

function MedicineReviewPanel({
  medicines,
  index,
  disabled,
  onIndexChange,
  onFieldChange,
  onRemoveMedicine,
  onBack,
  onSave,
}: {
  medicines: MedicineReviewMedicineInput[];
  index: number;
  disabled: boolean;
  onIndexChange: (index: number) => void;
  onFieldChange: (index: number, field: MedicineReviewField, value: string) => void;
  onRemoveMedicine: (index: number) => void;
  onBack: () => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  const current = medicines[index];

  if (!current) {
    return (
      <YStack style={{ gap: 12, padding: 20 }}>
        <InfoBanner iconName="warning-outline" tone="warning" text={t('image_upload.no_medicines_found')} />
        <OutlineButton label={t('previous')} onPress={onBack} />
      </YStack>
    );
  }

  const canGoPrev = index > 0;
  const canGoNext = index < medicines.length - 1;

  return (
    <YStack style={{ gap: 16, padding: 20 }}>
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <YStack style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: ios.foreground, fontSize: 20, lineHeight: 26, fontWeight: '800' }}>
            {t('medicine_review.title')}
          </Text>
          <Text style={{ color: ios.mutedForeground, fontSize: 14, marginTop: 3 }}>
            {index + 1} / {medicines.length}
          </Text>
        </YStack>
        <IconButton
          label={t('medicine_review.delete_medicine')}
          iconName="trash-outline"
          disabled={disabled}
          onPress={() => onRemoveMedicine(index)}
        />
      </XStack>

      <ReviewField
        label={t('boxes.name')}
        value={String(current.name ?? '')}
        required
        onChangeText={(value) => onFieldChange(index, 'name', value)}
      />
      <ReviewField
        label={t('boxes.dose')}
        value={String(current.dose ?? '')}
        keyboardType="numeric"
        required
        onChangeText={(value) => onFieldChange(index, 'dose', value)}
      />
      <ReviewField
        label={t('medicine_review.current_stock')}
        value={String(current.stock_quantity ?? '')}
        keyboardType="numeric"
        onChangeText={(value) => onFieldChange(index, 'stock_quantity', value)}
      />
      <ReviewField
        label={t('medicine_review.maximum_stock')}
        value={String(current.stock_max ?? '')}
        keyboardType="numeric"
        onChangeText={(value) => onFieldChange(index, 'stock_max', value)}
      />
      <ReviewField
        label={t('boxes.alert_threshold')}
        value={String(current.stock_alert_threshold ?? '')}
        keyboardType="numeric"
        onChangeText={(value) => onFieldChange(index, 'stock_alert_threshold', value)}
      />

      <InfoBanner
        iconName="calendar-outline"
        text={`${t('boxes.intake_conditions')}: ${current.conditions?.length ?? 0}`}
      />

      <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <IconButton
          label={t('previous')}
          iconName="chevron-back"
          disabled={disabled || !canGoPrev}
          onPress={() => onIndexChange(index - 1)}
        />
        <OutlineButton label={t('previous')} onPress={onBack} />
        <Button
          size="$3"
          onPress={canGoNext ? () => onIndexChange(index + 1) : onSave}
          disabled={disabled || !String(current.name ?? '').trim()}
          style={{
            minHeight: 40,
            paddingHorizontal: 16,
            borderRadius: 14,
            backgroundColor: canGoNext ? ios.primary : '#34c759',
            opacity: disabled || !String(current.name ?? '').trim() ? 0.55 : 1,
          }}
        >
          <XStack style={{ alignItems: 'center', gap: 8 }}>
            <Ionicons name={canGoNext ? 'chevron-forward' : 'checkmark-circle-outline'} size={16} color={ios.card} />
            <Text style={{ color: ios.card, fontWeight: '800' }}>
              {canGoNext ? t('next') : t('medicine_review.finish')}
            </Text>
          </XStack>
        </Button>
      </XStack>
    </YStack>
  );
}

function AddCalendarModal({
  open,
  name,
  importType,
  step,
  disabled,
  qrMedicines,
  qrLoadingGtin,
  imageFileName,
  importedMedicines,
  medicineReviewIndex,
  onNameChange,
  onImportTypeChange,
  onQrBarcodeScanned,
  onRemoveQrMedicine,
  onPickImage,
  onRemoveImage,
  onMedicineReviewIndexChange,
  onMedicineReviewFieldChange,
  onRemoveImportedMedicine,
  onBackToImport,
  onSaveImportedMedicines,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  name: string;
  importType: AddCalendarImportType;
  step: AddCalendarStep;
  disabled: boolean;
  qrMedicines: QRScannedMedicine[];
  qrLoadingGtin: string | null;
  imageFileName: string | null;
  importedMedicines: MedicineReviewMedicineInput[];
  medicineReviewIndex: number;
  onNameChange: (value: string) => void;
  onImportTypeChange: (value: AddCalendarImportType) => void;
  onQrBarcodeScanned: (result: BarcodeScanningResult) => void;
  onRemoveQrMedicine: (codeFmd: string | null | undefined) => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
  onMedicineReviewIndexChange: (index: number) => void;
  onMedicineReviewFieldChange: (index: number, field: MedicineReviewField, value: string) => void;
  onRemoveImportedMedicine: (index: number) => void;
  onBackToImport: () => void;
  onSaveImportedMedicines: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();
  const isManual = importType === ADD_CALENDAR_IMPORT_TYPES.MANUAL;
  const isQr = importType === ADD_CALENDAR_IMPORT_TYPES.QR;
  const isFile = importType === ADD_CALENDAR_IMPORT_TYPES.FILE;
  const canSubmit = Boolean(
    name.trim()
      && (isManual || (isQr && qrMedicines.length > 0) || (isFile && imageFileName)),
  );

  const importDescription =
    isQr
      ? t('calendar.import_type_qr_description')
      : isFile
        ? t('calendar.import_type_file_description')
        : t('calendar.import_type_manual_description');

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
        }}
      >
        <Pressable>
          <YStack
            style={{
              width: '100%',
              maxWidth: 672,
              alignSelf: 'center',
              overflow: 'hidden',
              borderRadius: 20,
              backgroundColor: ios.card,
            }}
          >
            <YStack
              style={{
                alignItems: 'center',
                gap: 10,
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: ios.border,
              }}
            >
              <Ionicons name={step === 'review' ? 'pencil-outline' : 'calendar-outline'} size={34} color={ios.primary} />
              <Text style={{ color: ios.foreground, fontSize: 24, lineHeight: 30, fontWeight: '800' }}>
                {step === 'review' ? t('medicine_review.title') : t('calendar.add_calendar')}
              </Text>
            </YStack>

            <ScrollView style={{ maxHeight: 620 }}>
              {step === 'review' ? (
                <MedicineReviewPanel
                  medicines={importedMedicines}
                  index={medicineReviewIndex}
                  disabled={disabled}
                  onIndexChange={onMedicineReviewIndexChange}
                  onFieldChange={onMedicineReviewFieldChange}
                  onRemoveMedicine={onRemoveImportedMedicine}
                  onBack={onBackToImport}
                  onSave={onSaveImportedMedicines}
                />
              ) : (
                <YStack style={{ gap: 18, padding: 20 }}>
                  <YStack style={{ gap: 8 }}>
                    <Text style={{ color: ios.foreground, fontSize: 15, fontWeight: '700' }}>
                      {t('calendar.name')} <Text style={{ color: ios.destructive }}>*</Text>
                    </Text>
                    <Input
                      value={name}
                      onChangeText={onNameChange}
                      disabled={disabled}
                      placeholder={t('calendar.name')}
                      returnKeyType="done"
                      onSubmitEditing={onSubmit}
                      style={{
                        minHeight: 48,
                        borderWidth: 0,
                        borderRadius: 12,
                        backgroundColor: ios.background,
                        color: ios.foreground,
                        fontSize: 17,
                      }}
                    />
                  </YStack>

                  <YStack style={{ gap: 8 }}>
                    <Text style={{ color: ios.foreground, fontSize: 15, fontWeight: '700' }}>
                      {t('calendar.import_type')} <Text style={{ color: ios.destructive }}>*</Text>
                    </Text>
                    <YStack style={{ gap: 8 }}>
                      <ImportTypeOption
                        label={t('calendar.import_type_manual')}
                        iconName="add-outline"
                        selected={isManual}
                        onPress={() => onImportTypeChange(ADD_CALENDAR_IMPORT_TYPES.MANUAL)}
                      />
                      <ImportTypeOption
                        label={t('calendar.scan_qr_option')}
                        iconName="qr-code-outline"
                        selected={isQr}
                        onPress={() => onImportTypeChange(ADD_CALENDAR_IMPORT_TYPES.QR)}
                      />
                      <ImportTypeOption
                        label={t('calendar.import_type_file')}
                        iconName="cloud-upload-outline"
                        selected={isFile}
                        onPress={() => onImportTypeChange(ADD_CALENDAR_IMPORT_TYPES.FILE)}
                      />
                    </YStack>
                  </YStack>

                  <InfoBanner
                    iconName={isManual ? 'information-circle-outline' : isQr ? 'qr-code-outline' : 'image-outline'}
                    text={importDescription}
                    tone="info"
                  />

                  {isQr && (
                    <QRImportPanel
                      medicines={qrMedicines}
                      loadingGtin={qrLoadingGtin}
                      disabled={disabled}
                      onBarcodeScanned={onQrBarcodeScanned}
                      onRemoveMedicine={onRemoveQrMedicine}
                    />
                  )}

                  {isFile && (
                    <ImageImportPanel
                      fileName={imageFileName}
                      disabled={disabled}
                      onPickImage={onPickImage}
                      onRemoveImage={onRemoveImage}
                    />
                  )}

                  <YStack style={{ gap: 10 }}>
                    <Button
                      size="$5"
                      onPress={onSubmit}
                      disabled={disabled || !canSubmit}
                      style={{
                        minHeight: 50,
                        borderRadius: 14,
                        backgroundColor: ios.primary,
                        opacity: disabled || !canSubmit ? 0.55 : 1,
                      }}
                    >
                      <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {disabled ? (
                          <Spinner size="small" color={ios.card} />
                        ) : (
                          <Ionicons name={isFile ? 'arrow-forward' : 'add-outline'} size={19} color={ios.card} />
                        )}
                        <Text style={{ color: ios.card, fontSize: 17, fontWeight: '800' }}>
                          {isFile ? t('next') : t('add')}
                        </Text>
                      </XStack>
                    </Button>
                    <OutlineButton label={t('cancel')} onPress={onCancel} />
                  </YStack>
                </YStack>
              )}
            </ScrollView>
          </YStack>
        </Pressable>
      </Pressable>
    </Modal>
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
            borderRadius: 16,
            backgroundColor: ios.card,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 1,
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
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
        }}
      >
        <Pressable>
          <YStack
            style={{
              gap: 18,
              padding: 20,
              borderWidth: 1,
              borderColor: ios.border,
              borderRadius: 20,
              backgroundColor: ios.card,
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
            }}
          >
            <YStack style={{ gap: 8 }}>
              <Text style={{ color: ios.foreground, fontSize: 20, lineHeight: 28, fontWeight: '800' }}>
                {t('boxes.export_pdf_title')}
              </Text>
              <Text style={{ color: ios.mutedForeground, fontSize: 14, lineHeight: 20 }}>
                {t('boxes.export_pdf_description')}
              </Text>
            </YStack>

            <Pressable onPress={() => onIncludeInactiveChange(!includeInactive)}>
              <XStack style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                <Ionicons
                  name={includeInactive ? 'checkbox-outline' : 'square-outline'}
                  size={22}
                  color={ios.foreground}
                />
                <Text style={{ flex: 1, color: ios.foreground, fontSize: 15, fontWeight: '600' }}>
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
                  borderRadius: 14,
                  backgroundColor: ios.primary,
                }}
              >
                <XStack style={{ alignItems: 'center', gap: 8 }}>
                  <Ionicons name="download-outline" size={16} color={ios.card} />
                  <Text style={{ color: ios.card, fontWeight: '700' }}>{t('boxes.export_pdf')}</Text>
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
  const [addCalendarOpen, setAddCalendarOpen] = useState(false);
  const [calendarImportType, setCalendarImportType] = useState<AddCalendarImportType>(
    ADD_CALENDAR_IMPORT_TYPES.MANUAL,
  );
  const [addCalendarStep, setAddCalendarStep] = useState<AddCalendarStep>('form');
  const [isImportingCalendar, setIsImportingCalendar] = useState(false);
  const [qrMedicines, setQrMedicines] = useState<QRScannedMedicine[]>([]);
  const [qrScannedCodes, setQrScannedCodes] = useState<string[]>([]);
  const [qrLoadingGtin, setQrLoadingGtin] = useState<string | null>(null);
  const [imageAssetUri, setImageAssetUri] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [importedMedicines, setImportedMedicines] = useState<MedicineReviewMedicineInput[]>([]);
  const [medicineReviewIndex, setMedicineReviewIndex] = useState(0);
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
    createPersonalBox,
    analyzeImageBase64,
    saveAnalysisResult,
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

  const resetAddCalendarFlow = useCallback(() => {
    setCalendarName('');
    setCalendarImportType(ADD_CALENDAR_IMPORT_TYPES.MANUAL);
    setAddCalendarStep('form');
    setQrMedicines([]);
    setQrScannedCodes([]);
    setQrLoadingGtin(null);
    setImageAssetUri(null);
    setImageFileName(null);
    setImportedMedicines([]);
    setMedicineReviewIndex(0);
  }, []);

  const handleImportTypeChange = useCallback((value: AddCalendarImportType) => {
    setCalendarImportType(value);
    setAddCalendarStep('form');
    setQrMedicines([]);
    setQrScannedCodes([]);
    setQrLoadingGtin(null);
    setImageAssetUri(null);
    setImageFileName(null);
    setImportedMedicines([]);
    setMedicineReviewIndex(0);
  }, []);

  const handlePickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('image_upload.select_file_error'), t('image_upload.select_file_error'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const asset = result.assets[0];
    setImageAssetUri(asset.uri);
    setImageFileName(asset.fileName ?? asset.uri.split('/').pop() ?? t('image_upload.file_selected'));
    setImportedMedicines([]);
    setMedicineReviewIndex(0);
  }, [t]);

  const handleRemoveImage = useCallback(() => {
    setImageAssetUri(null);
    setImageFileName(null);
    setImportedMedicines([]);
    setMedicineReviewIndex(0);
  }, []);

  const handleQrBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      const rawCode = result.data?.trim();
      const fallbackGtin = rawCode?.match(/^[0-9]{14}$/)?.[0] ?? null;
      const gtin = rawCode ? extractGTIN01(rawCode) ?? fallbackGtin : null;

      if (!gtin || qrLoadingGtin || qrScannedCodes.includes(gtin)) {
        return;
      }

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        Alert.alert(t('error'), 'Configuration Supabase manquante.');
        return;
      }

      setQrScannedCodes((prev) => [...prev, gtin]);
      setQrLoadingGtin(gtin);

      try {
        const medicines = await fetchMedicamentsFromSupabase({
          supabaseUrl: SUPABASE_URL,
          supabaseAnonKey: SUPABASE_ANON_KEY,
          codeFmd: gtin,
        });
        const medicine = medicines[0];

        if (!medicine) {
          setQrScannedCodes((prev) => prev.filter((code) => code !== gtin));
          Alert.alert(t('image_upload.no_medicines_found'), gtin);
          return;
        }

        const dose = parsePositiveInteger(medicine.dose, 0);
        const conditionnement = parsePositiveInteger(medicine.conditionnement, 0);

        setQrMedicines((prev) => [
          ...prev,
          {
            name: medicine.name || 'Unknown',
            dose,
            box_capacity: conditionnement,
            stock_quantity: conditionnement,
            stock_alert_threshold: 10,
            code_fmd: gtin,
          },
        ]);
      } catch (err) {
        setQrScannedCodes((prev) => prev.filter((code) => code !== gtin));
        Alert.alert(t('scanner.add_all_error'), err instanceof Error ? err.message : t('scanner.add_all_error'));
      } finally {
        setQrLoadingGtin(null);
      }
    },
    [qrLoadingGtin, qrScannedCodes, t],
  );

  const handleRemoveQrMedicine = useCallback((codeFmd: string | null | undefined) => {
    setQrMedicines((prev) => prev.filter((medicine) => medicine.code_fmd !== codeFmd));
    if (codeFmd) {
      setQrScannedCodes((prev) => prev.filter((code) => code !== codeFmd));
    }
  }, []);

  const handleMedicineReviewFieldChange = useCallback(
    (index: number, field: MedicineReviewField, value: string) => {
      setImportedMedicines((prev) => prev.map((medicine, currentIndex) => (
        currentIndex === index ? { ...medicine, [field]: value } : medicine
      )));
    },
    [],
  );

  const handleRemoveImportedMedicine = useCallback((index: number) => {
    setImportedMedicines((prev) => {
      const next = prev.filter((_, currentIndex) => currentIndex !== index);
      if (next.length === 0) {
        setAddCalendarStep('form');
        setMedicineReviewIndex(0);
      } else if (medicineReviewIndex >= next.length) {
        setMedicineReviewIndex(next.length - 1);
      }
      return next;
    });
  }, [medicineReviewIndex]);

  const handleSaveImportedMedicines = useCallback(async () => {
    const name = calendarName.trim();
    if (!name || importedMedicines.length === 0) return;

    setIsImportingCalendar(true);
    try {
      const result = await saveAnalysisResult(name, importedMedicines.map(normalizeMedicineReviewInput));
      if (result.success && result.calendar_id) {
        resetAddCalendarFlow();
        setAddCalendarOpen(false);
        return;
      }

      Alert.alert(
        String(t('image_upload.analysis_error')),
        getApiErrorMessage(result, String(t('image_upload.analysis_error'))),
      );
    } finally {
      setIsImportingCalendar(false);
    }
  }, [calendarName, importedMedicines, resetAddCalendarFlow, saveAnalysisResult, t]);

  const handleAddCalendar = async () => {
    const name = calendarName.trim();
    if (!name) return;

    setIsImportingCalendar(true);

    try {
      if (calendarImportType === ADD_CALENDAR_IMPORT_TYPES.MANUAL) {
        const result = await addCalendar(name);
        if (result.success) {
          resetAddCalendarFlow();
          setAddCalendarOpen(false);
          return;
        }

        Alert.alert(t('calendar.error_calendar_creation'), result.error ?? t('calendar.error_calendar_creation'));
        return;
      }

      if (calendarImportType === ADD_CALENDAR_IMPORT_TYPES.QR) {
        if (qrMedicines.length === 0) {
          Alert.alert(t('calendar.error_no_medicines'), t('calendar.error_no_medicines'));
          return;
        }

        const calendarResult = await addCalendar(name) as { success: boolean; calendarId?: string; error?: string };
        if (!calendarResult.success || !calendarResult.calendarId) {
          Alert.alert(t('calendar.error_calendar_creation'), calendarResult.error ?? t('calendar.error_calendar_creation'));
          return;
        }

        let errorCount = 0;
        for (const medicine of qrMedicines) {
          const boxResult = await createPersonalBox(
            calendarResult.calendarId,
            medicine.name,
            medicine.box_capacity,
            medicine.stock_alert_threshold,
            medicine.stock_quantity,
            medicine.dose,
            [],
            medicine.code_fmd ?? null,
          );
          if (!boxResult.success) {
            errorCount += 1;
          }
        }

        await loadCalendars();
        resetAddCalendarFlow();
        setAddCalendarOpen(false);

        if (errorCount > 0) {
          Alert.alert(t('calendar.error_partial_success', { count: errorCount }));
        }
        return;
      }

      if (calendarImportType === ADD_CALENDAR_IMPORT_TYPES.FILE) {
        if (!imageAssetUri) {
          Alert.alert(t('image_upload.select_file_error'), t('image_upload.select_file_error'));
          return;
        }

        const base64 = await FileSystem.readAsStringAsync(imageAssetUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const result = await analyzeImageBase64(base64);

        if (result.success && Array.isArray(result.medicines) && result.medicines.length > 0) {
          setImportedMedicines(result.medicines.map(normalizeMedicineReviewInput));
          setMedicineReviewIndex(0);
          setAddCalendarStep('review');
          return;
        }

        Alert.alert(
          String(result.success ? t('image_upload.no_medicines_found') : t('image_upload.analysis_error')),
          getApiErrorMessage(result, ''),
        );
      }
    } finally {
      setIsImportingCalendar(false);
    }
  };

  const handleCancelAddCalendar = () => {
    setAddCalendarOpen(false);
    resetAddCalendarFlow();
  };

  const isAddCalendarBusy = isMutating || isImportingCalendar || Boolean(qrLoadingGtin);

  const handleBackToImport = () => {
    setAddCalendarStep('form');
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

  if (isLoading && personalCalendars.length === 0 && sharedCalendars.length === 0) {
    return (
      <YStack style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ios.background, gap: 12 }}>
        <Spinner size="large" color={ios.primary} />
        <Text style={{ color: ios.mutedForeground, fontWeight: '700' }}>{t('loading_calendars')}</Text>
      </YStack>
    );
  }

  return (
    <>
      <ScrollView
        flex={1}
        style={{ flex: 1, backgroundColor: ios.background }}
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
            backgroundColor: ios.background,
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
                borderRadius: 16,
                backgroundColor: '#fff1f0',
              }}
            >
              <Text style={{ color: ios.destructive, fontWeight: '700' }}>{error}</Text>
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
            renameMode={renameMode}
            renameValues={renameValues}
            isMutating={isMutating}
            onRenameChange={(calendarId, value) =>
              setRenameValues((prev) => ({ ...prev, [calendarId]: value }))
            }
            onRenameSubmit={handleRenameSubmit}
            onRenameCancel={() => setRenameMode(null)}
            addFooter={<AddCalendarFooter onPress={() => setAddCalendarOpen(true)} />}
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

      <AddCalendarModal
        open={addCalendarOpen}
        name={calendarName}
        importType={calendarImportType}
        step={addCalendarStep}
        disabled={isAddCalendarBusy}
        qrMedicines={qrMedicines}
        qrLoadingGtin={qrLoadingGtin}
        imageFileName={imageFileName}
        importedMedicines={importedMedicines}
        medicineReviewIndex={medicineReviewIndex}
        onNameChange={setCalendarName}
        onImportTypeChange={handleImportTypeChange}
        onQrBarcodeScanned={handleQrBarcodeScanned}
        onRemoveQrMedicine={handleRemoveQrMedicine}
        onPickImage={() => void handlePickImage()}
        onRemoveImage={handleRemoveImage}
        onMedicineReviewIndexChange={setMedicineReviewIndex}
        onMedicineReviewFieldChange={handleMedicineReviewFieldChange}
        onRemoveImportedMedicine={handleRemoveImportedMedicine}
        onBackToImport={handleBackToImport}
        onSaveImportedMedicines={() => void handleSaveImportedMedicines()}
        onCancel={handleCancelAddCalendar}
        onSubmit={handleAddCalendar}
      />
    </>
  );
}
