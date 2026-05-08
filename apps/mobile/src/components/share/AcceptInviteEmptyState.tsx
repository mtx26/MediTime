import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

export function AcceptInviteEmptyState() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();
  const goHome = () => {
    hapticSelection();
    router.replace('/');
  };

  return (
    <YStack
      style={{
        flex: 1,
        justifyContent: 'center',
        gap: 14,
        padding: 18,
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
            {t('invitation.invalid_or_expired')}
          </Text>
        </XStack>
      </GlassView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={String(t('home'))}
        onPress={goHome}
        style={{ alignSelf: 'flex-start' }}
      >
        {({ pressed }) => (
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="clear"
            style={{
              minHeight: 42,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 18,
              paddingHorizontal: 14,
              paddingVertical: 10,
              opacity: pressed ? 0.75 : 1,
            }}
          >
            <XStack style={{ alignItems: 'center', gap: 7 }}>
              <Ionicons name="home-outline" size={18} color={ios.primary} />
              <Text style={{ color: ios.primary, fontSize: 14, lineHeight: 20, fontWeight: '800' }}>
                {t('home')}
              </Text>
            </XStack>
          </GlassView>
        )}
      </Pressable>
    </YStack>
  );
}
