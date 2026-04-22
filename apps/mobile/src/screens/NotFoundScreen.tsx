import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button, Text, XStack, YStack } from 'tamagui';
import { useIosTheme } from '../theme/ios';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();

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
        <YStack
          style={{
            width: 112,
            height: 112,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 28,
            backgroundColor: ios.destructiveBg,
          }}
        >
          <Ionicons name="warning-outline" size={58} color={ios.destructive} />
        </YStack>

        <YStack style={{ alignItems: 'center', gap: 8 }}>
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

        <Button
          size="$5"
          onPress={() => router.replace('/')}
          style={{
            minHeight: 50,
            paddingHorizontal: 18,
            borderRadius: 14,
            backgroundColor: ios.primary,
          }}
        >
          <XStack style={{ alignItems: 'center', gap: 8 }}>
            <Ionicons name="home-outline" size={18} color={ios.primaryForeground} />
            <Text style={{ color: ios.primaryForeground, fontSize: 16, fontWeight: '900' }}>
              {t('home')}
            </Text>
          </XStack>
        </Button>
      </YStack>
    </>
  );
}
