import { Modal, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Text, XStack, YStack } from 'tamagui';
import { LiquidButton } from '../common/LiquidButton';
import { OutlineButton } from '../common/OutlineButton';
import { useAppTheme, useIosTheme } from '../../theme/ios';

type PdfDialogProps = {
  open: boolean;
  includeInactive: boolean;
  onIncludeInactiveChange: (value: boolean) => void;
  onCancel: () => void;
  onDownload: () => void | Promise<void>;
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
  const { colorScheme } = useAppTheme();

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
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="clear"
            style={{
              borderRadius: 24,
              padding: 8,
            }}
          >
            <YStack style={{ gap: 18, padding: 12 }}>
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
                <LiquidButton
                  iconName="download-outline"
                  label={t('boxes.export_pdf')}
                  onPress={onDownload}
                />
              </XStack>
            </YStack>
          </GlassView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
