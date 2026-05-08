import { Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import type { MobileAccountSettingsProps } from '@meditime/types';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

export function AccountSettingsPanel({
  displayName,
  email,
  photoUrl,
  isSaving,
  onChangePhoto,
  onPromptDisplayName,
}: MobileAccountSettingsProps) {
  const { t } = useTranslation();
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();

  return (
    <YStack style={{ gap: 20 }}>
      {/* En-tête */}
      <YStack style={{ gap: 4 }}>
        <Text style={{ color: ios.foreground, fontSize: 24, lineHeight: 30, fontWeight: '900' }}>
          {t('settings.account')}
        </Text>
        <Text style={{ color: ios.mutedForeground, fontSize: 14, lineHeight: 20 }}>
          {t('account.instructions')}
        </Text>
      </YStack>

      {/* Carte profil : photo + identité */}
      <GlassView
        colorScheme={colorScheme}
        glassEffectStyle="clear"
        style={{ borderRadius: 24, padding: 18 }}
      >
        <XStack style={{ alignItems: 'center', gap: 18 }}>
          {/* Avatar */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={String(t('account.change_photo'))}
            disabled={isSaving}
            onPress={() => { hapticSelection(); onChangePhoto(); }}
          >
            {({ pressed }) => (
              <YStack style={{ position: 'relative' }}>
                <YStack
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    overflow: 'hidden',
                    opacity: pressed ? 0.75 : 1,
                    backgroundColor: ios.accentHover,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={{ width: 80, height: 80 }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="person-circle-outline" size={56} color={ios.primary} />
                  )}
                </YStack>
                {/* Pastille caméra */}
                <YStack
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: ios.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="camera" size={13} color="#fff" />
                </YStack>
              </YStack>
            )}
          </Pressable>

          {/* Nom + email */}
          <YStack style={{ flex: 1, gap: 4 }}>
            <XStack style={{ alignItems: 'center', gap: 8 }}>
              <Text
                style={{ flex: 1, color: ios.foreground, fontSize: 18, fontWeight: '800', lineHeight: 24 }}
                numberOfLines={1}
              >
                {displayName || t('account.display_name.placeholder')}
              </Text>
              <Pressable
                accessibilityRole="button"
                hitSlop={12}
                onPress={() => { hapticSelection(); onPromptDisplayName(); }}
              >
                <Ionicons name="pencil-outline" size={17} color={ios.primary} />
              </Pressable>
            </XStack>
            <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18 }} numberOfLines={1}>
              {email}
            </Text>
          </YStack>
        </XStack>
      </GlassView>
    </YStack>
  );
}


