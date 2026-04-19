import { Modal, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Button, Text, XStack, YStack } from 'tamagui';
import { OutlineButton } from '../common/OutlineButton';
import { useIosTheme } from '../../theme/ios';

type PdfDialogProps = {
  open: boolean;
  includeInactive: boolean;
  onIncludeInactiveChange: (value: boolean) => void;
  onCancel: () => void;
  onDownload: () => void;
};

export function PdfDialog({
  open,
  includeInactive,
  onIncludeInactiveChange,
  onCancel,
  onDownload,
}: PdfDialogProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 20,
          backgroundColor: ios.overlay,
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
              shadowColor: ios.shadow,
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
                  <Ionicons name="download-outline" size={16} color={ios.primaryForeground} />
                  <Text style={{ color: ios.primaryForeground, fontWeight: '700' }}>{t('boxes.export_pdf')}</Text>
                </XStack>
              </Button>
            </XStack>
          </YStack>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
