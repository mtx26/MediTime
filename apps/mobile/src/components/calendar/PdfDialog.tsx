import { Modal, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Text, XStack, YStack } from 'tamagui';
import { LiquidButton } from '../common/LiquidButton';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

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
  const handleCancel = () => {
    hapticSelection();
    onCancel();
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={handleCancel}>
      <Pressable
        onPress={handleCancel}
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
            glassEffectStyle="regular"
            style={{
              borderRadius: 24,
              padding: 8,
            }}
          >
            <YStack style={{ gap: 18, padding: 12 }}>
              <XStack style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <YStack style={{ flex: 1, gap: 8 }}>
                  <Text style={{ color: ios.foreground, fontSize: 20, lineHeight: 28, fontWeight: '800' }}>
                    {t('boxes.export_pdf_title')}
                  </Text>
                  <Text style={{ color: ios.mutedForeground, fontSize: 14, lineHeight: 20 }}>
                    {t('boxes.export_pdf_description')}
                  </Text>
                </YStack>
                <Pressable onPress={handleCancel}>
                  {({ pressed }) => (
                    <GlassView
                      colorScheme={colorScheme}
                      glassEffectStyle="regular"
                      style={{
                        width: 32,
                        height: 32,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 16,
                        borderWidth: 0.5,
                        borderColor: ios.border,
                        overflow: 'hidden',
                        opacity: pressed ? 0.72 : 1,
                      }}
                    >
                      <Ionicons name="close" size={16} color={ios.primary} />
                    </GlassView>
                  )}
                </Pressable>
              </XStack>

              <Pressable
                onPress={() => {
                  hapticSelection();
                  onIncludeInactiveChange(!includeInactive);
                }}
              >
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
