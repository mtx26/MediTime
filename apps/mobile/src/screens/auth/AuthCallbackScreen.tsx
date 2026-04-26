import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { useAuthCallback } from '../../hooks/auth/useAuthCallback';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

export default function AuthCallbackScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();
  const callback = useAuthCallback();

  if (callback.loading) {
    return <LoadingIndicator label={String(t('auth_callback.loading'))} variant="screen" />;
  }

  return (
    <YStack
      flex={1}
      gap="$4"
      style={{
        justifyContent: 'center',
        padding: 20,
        backgroundColor: ios.background,
      }}
    >
      <GlassView
        colorScheme={colorScheme}
        glassEffectStyle="clear"
        style={{
          borderRadius: 24,
          padding: 14,
        }}
      >
        <XStack style={{ alignItems: 'center', gap: 10 }}>
          <Ionicons name="warning-outline" size={20} color={ios.warningText} />
          <Text
            style={{
              flex: 1,
              color: ios.foreground,
              fontSize: 14,
              lineHeight: 20,
              fontWeight: '500',
            }}
          >
            {callback.error ?? t('auth_callback.session_error')}
          </Text>
        </XStack>
      </GlassView>

      {callback.isRecovery && (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            hapticSelection();
            callback.requestNewResetLink();
          }}
        >
          {({ pressed }) => (
            <GlassView
              colorScheme={colorScheme}
              glassEffectStyle="clear"
              style={{
                minHeight: 48,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                paddingHorizontal: 16,
                paddingVertical: 10,
                opacity: pressed ? 0.82 : 1,
              }}
            >
              <Text style={{ color: ios.primary, fontWeight: '800', textAlign: 'center' }}>
                {t('reset_password_confirm.request_new_link')}
              </Text>
            </GlassView>
          )}
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          hapticSelection();
          callback.backToLogin();
        }}
      >
        {({ pressed }) => (
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="clear"
            style={{
              minHeight: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 18,
              paddingHorizontal: 16,
              paddingVertical: 10,
              opacity: pressed ? 0.82 : 1,
            }}
          >
            <Text style={{ color: ios.primary, fontWeight: '800', textAlign: 'center' }}>
              {t('auth.back_to_login')}
            </Text>
          </GlassView>
        )}
      </Pressable>
    </YStack>
  );
}
