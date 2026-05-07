import { Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text, XStack, YStack } from 'tamagui';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();
  const goHome = () => {
    hapticSelection();
    router.replace('/');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <YStack
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          paddingHorizontal: 28,
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 24),
          backgroundColor: ios.background,
        }}
      >
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{
            alignItems: 'center',
            gap: 18,
            width: '100%',
            maxWidth: 360,
            borderRadius: 28,
            padding: 8,
          }}
        >
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="clear"
            style={{
              width: 112,
              height: 112,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 28,
            }}
          >
            <Ionicons name="warning-outline" size={58} color={ios.destructive} />
          </GlassView>

          <YStack style={{ alignItems: 'center', gap: 8, paddingHorizontal: 8 }}>
            <Text style={{ color: ios.foreground, fontSize: 56, lineHeight: 62, fontWeight: '900' }}>
              404
            </Text>
            <Text style={{ color: ios.foreground, textAlign: 'center', fontSize: 25, lineHeight: 31, fontWeight: '900' }}>
              {t('not_found.title')}
            </Text>
            <Text style={{ color: ios.mutedForeground, textAlign: 'center', fontSize: 16, lineHeight: 23 }}>
              {t('not_found.message')}
            </Text>
          </YStack>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={String(t('home'))}
            onPress={goHome}
          >
            {({ pressed }) => (
              <GlassView
                colorScheme={colorScheme}
                glassEffectStyle="clear"
                style={{
                  minHeight: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                  paddingHorizontal: 18,
                  opacity: pressed ? 0.82 : 1,
                }}
              >
                <XStack style={{ alignItems: 'center', gap: 8 }}>
                  <Ionicons name="home-outline" size={18} color={ios.primary} />
                  <Text style={{ color: ios.primary, fontSize: 16, fontWeight: '900' }}>
                    {t('home')}
                  </Text>
                </XStack>
              </GlassView>
            )}
          </Pressable>
        </GlassView>
      </YStack>
    </>
  );
}
