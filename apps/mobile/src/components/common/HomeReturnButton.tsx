import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, XStack } from 'tamagui';
import { useIosTheme } from '../../theme/ios';

export function HomeReturnButton() {
  const { t } = useTranslation();
  const router = useRouter();
  const ios = useIosTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={String(t('home'))}
      onPress={() => router.replace('/')}
    >
      {({ pressed }) => (
        <XStack
          style={{
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: 7,
            minHeight: 38,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: ios.blueInfoBg,
            opacity: pressed ? 0.75 : 1,
          }}
        >
          <Ionicons name="home-outline" size={18} color={ios.primary} />
          <Text style={{ color: ios.primary, fontSize: 14, lineHeight: 20, fontWeight: '800' }}>
            {t('home')}
          </Text>
        </XStack>
      )}
    </Pressable>
  );
}
