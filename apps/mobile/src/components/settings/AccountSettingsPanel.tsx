import { Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Input, Text, XStack, YStack } from 'tamagui';
import type { MobileAccountSettingsProps } from '@meditime/types';
import { MobileForm } from '../common/MobileForm';
import { SettingsPanelSection } from './SettingsPanelSection';
import { useIosTheme } from '../../theme/ios';

export function AccountSettingsPanel({
  displayName,
  email,
  photoUrl,
  isSaving,
  onChangePhoto,
  onDisplayNameChange,
  onSaveDisplayName,
  onResetDisplayName,
}: MobileAccountSettingsProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <YStack style={{ gap: 14 }}>
      <YStack style={{ gap: 4 }}>
        <Text style={{ color: ios.foreground, fontSize: 24, lineHeight: 30, fontWeight: '900' }}>
          {t('settings.account')}
        </Text>
        <Text style={{ color: ios.mutedForeground, fontSize: 14, lineHeight: 20 }}>
          {t('account.instructions')}
        </Text>
      </YStack>

      <SettingsPanelSection
        glass
        iconName="camera-outline"
        title={String(t('account.profile_photo.title'))}
        description={String(t('account.profile_photo.description'))}
      >
        <XStack style={{ alignItems: 'center', gap: 14 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={String(t('account.change_photo'))}
            disabled={isSaving}
            onPress={onChangePhoto}
          >
            {({ pressed }) => (
              <YStack
                style={{
                  width: 86,
                  height: 86,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 43,
                  overflow: 'hidden',
                  backgroundColor: ios.blueInfoBg,
                  opacity: pressed ? 0.75 : 1,
                }}
              >
                {photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    style={{ width: 86, height: 86 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="person-circle-outline" size={60} color={ios.primary} />
                )}
              </YStack>
            )}
          </Pressable>
          <YStack style={{ flex: 1, gap: 5 }}>
            <Text style={{ color: ios.foreground, fontSize: 14, lineHeight: 20, fontWeight: '800' }}>
              {t('account.profile_photo.hint')}
            </Text>
            <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 18 }}>
              {t('account.profile_photo.size_limit')}
            </Text>
            <Button size="$3" disabled={isSaving} onPress={onChangePhoto}>
              {t('account.change_photo')}
            </Button>
          </YStack>
        </XStack>
      </SettingsPanelSection>

      <SettingsPanelSection
        glass
        iconName="person-circle-outline"
        title={String(t('account.personal_info.title'))}
        description={String(t('account.personal_info.description'))}
      >
        <YStack style={{ gap: 10 }}>
          <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>
            {t('auth.email')}
          </Text>
          <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 22, fontWeight: '800' }}>
            {email}
          </Text>
        </YStack>

        <MobileForm onSubmit={onSaveDisplayName} disabled={isSaving} gap="$3">
          {(form) => (
            <>
              <YStack style={{ gap: 8 }}>
                <Text style={{ color: ios.mutedForeground, fontSize: 13, lineHeight: 18, fontWeight: '700' }}>
                  {t('account.display_name.label')}
                </Text>
                <Input
                  size="$4"
                  value={displayName}
                  placeholder={t('account.display_name.placeholder')}
                  onChangeText={onDisplayNameChange}
                  autoCapitalize="words"
                  {...form.getInputProps()}
                />
                <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 18 }}>
                  {t('account.display_name.hint')}
                </Text>
              </YStack>

              <XStack style={{ gap: 10 }}>
                <Button
                  flex={1}
                  size="$4"
                  theme="blue"
                  disabled={isSaving}
                  opacity={isSaving ? 0.7 : 1}
                  onPress={form.submit}
                >
                  {t('account.save_changes')}
                </Button>
                <Button flex={1} size="$4" onPress={onResetDisplayName}>
                  {t('cancel')}
                </Button>
              </XStack>
            </>
          )}
        </MobileForm>
      </SettingsPanelSection>
    </YStack>
  );
}
