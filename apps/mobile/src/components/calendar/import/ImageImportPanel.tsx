import { Image, Pressable, type GestureResponderEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Text, YStack } from 'tamagui';
import { useAppTheme, useIosTheme } from '../../../theme/ios';
import { hapticImpact, hapticSelection } from '../../../utils/haptics';

type ImageImportPanelProps = {
  fileName: string | null;
  imageUri: string | null;
  disabled: boolean;
  onChooseSource: () => void;
  onRemoveImage: () => void;
};

export function ImageImportPanel({
  fileName,
  imageUri,
  disabled,
  onChooseSource,
  onRemoveImage,
}: ImageImportPanelProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();

  const handleRemoveImage = (event: GestureResponderEvent) => {
    event.stopPropagation();
    hapticImpact();
    onRemoveImage();
  };

  if (imageUri) {
    return (
      <Pressable
        onPress={() => {
          hapticSelection();
          onChooseSource();
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={String(t('image_upload.click_to_change'))}
      >
        {({ pressed }) => (
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{
            minHeight: 180,
            borderRadius: 24,
            padding: 8,
            opacity: disabled ? 0.55 : pressed ? 0.85 : 1,
          }}
        >
            <YStack style={{ minHeight: 180, overflow: 'hidden', borderRadius: 16 }}>
              <Image
                source={{ uri: imageUri }}
                resizeMode="cover"
                style={{
                  width: '100%',
                  height: 180,
                }}
              />
            </YStack>
            <YStack
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.52)',
              }}
            >
              <Text
                numberOfLines={1}
                style={{ color: ios.primaryForeground, fontSize: 13, fontWeight: '700' }}
              >
                {fileName ?? t('image_upload.file_selected')}
              </Text>
            </YStack>
            <Pressable
              onPress={handleRemoveImage}
              disabled={disabled}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={String(t('image_upload.remove_image'))}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
              }}
            >
              {({ pressed: closePressed }) => (
                <YStack
                  style={{
                    width: 34,
                    height: 34,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: closePressed ? 'rgba(0, 0, 0, 0.68)' : 'rgba(0, 0, 0, 0.52)',
                  }}
                >
                  <Ionicons name="close" size={20} color={ios.primaryForeground} />
                </YStack>
              )}
            </Pressable>
          </GlassView>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => {
        hapticSelection();
        onChooseSource();
      }}
      disabled={disabled}
      accessibilityRole="button"
    >
      {({ pressed }) => (
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{
            minHeight: 132,
            borderRadius: 24,
            padding: 8,
            opacity: disabled ? 0.55 : 1,
          }}
        >
          <YStack
            style={{
              minHeight: 116,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: 10,
              opacity: pressed ? 0.82 : 1,
            }}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={32}
              color={ios.mutedForeground}
            />
            <Text style={{ color: ios.foreground, textAlign: 'center', fontSize: 16, fontWeight: '800' }}>
              {t('calendar.choose_image')}
            </Text>
            <Text style={{ color: ios.mutedForeground, textAlign: 'center', fontSize: 13, fontWeight: '600' }}>
              {t('image_upload.file_types')}
            </Text>
          </YStack>
        </GlassView>
      )}
    </Pressable>
  );
}
