import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Text, YStack } from 'tamagui';
import { OutlineButton } from '../../common/OutlineButton';
import { ios } from '../../../theme/ios';

type ImageImportPanelProps = {
  fileName: string | null;
  disabled: boolean;
  onChooseSource: () => void;
  onRemoveImage: () => void;
};

export function ImageImportPanel({
  fileName,
  disabled,
  onChooseSource,
  onRemoveImage,
}: ImageImportPanelProps) {
  const { t } = useTranslation();

  return (
    <YStack style={{ gap: 12 }}>
      <Pressable onPress={onChooseSource} disabled={disabled} accessibilityRole="button">
        {({ pressed }) => (
          <YStack
            style={{
              minHeight: 132,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: 18,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: fileName ? ios.blueInfoBorder : ios.border,
              backgroundColor: pressed ? ios.accentHover : fileName ? ios.blueInfoBg : ios.background,
              opacity: disabled ? 0.55 : 1,
            }}
          >
            <Ionicons
              name={fileName ? 'image-outline' : 'cloud-upload-outline'}
              size={32}
              color={fileName ? ios.primary : ios.mutedForeground}
            />
            <Text style={{ color: ios.foreground, textAlign: 'center', fontSize: 16, fontWeight: '800' }}>
              {fileName ? t('image_upload.file_selected') : t('calendar.choose_image')}
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
