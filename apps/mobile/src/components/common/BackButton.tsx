import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, XStack } from 'tamagui';
import { useIosTheme } from '../../theme/ios';

type BackButtonProps = {
  fallbackHref?: Href;
  variant?: 'pill' | 'header';
};

export function BackButton({ fallbackHref = '/', variant = 'pill' }: BackButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const ios = useIosTheme();
  const isHeader = variant === 'header';
  const contentColor = isHeader ? ios.foreground : ios.primary;

  const handlePress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={String(t('back'))}
      onPress={handlePress}
    >
      {({ pressed }) => (
        <XStack
          style={{
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: isHeader ? 2 : 7,
            minHeight: isHeader ? 36 : 38,
            paddingHorizontal: isHeader ? 0 : 12,
            borderRadius: 8,
            borderWidth: isHeader ? 0 : 1,
            borderColor: isHeader ? 'transparent' : ios.blueInfoBorder,
            backgroundColor: isHeader ? 'transparent' : ios.blueInfoBg,
            opacity: pressed ? 0.75 : 1,
          }}
        >
          <Ionicons name="chevron-back-outline" size={isHeader ? 24 : 18} color={contentColor} />
          <Text style={{ color: contentColor, fontSize: isHeader ? 16 : 14, lineHeight: 20, fontWeight: '800' }}>
            {t('back')}
          </Text>
        </XStack>
      )}
    </Pressable>
  );
}
