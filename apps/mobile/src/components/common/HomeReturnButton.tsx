import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, XStack } from 'tamagui';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticSelection } from '../../utils/haptics';

export function HomeReturnButton() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();
  const handlePress = () => {
    hapticSelection();
    router.replace('/');
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={String(t('home'))}
      onPress={handlePress}
      style={{ alignSelf: 'flex-start' }}
    >
      {({ pressed }) => (
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 38,
            paddingHorizontal: 12,
            borderRadius: 18,
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
  );
}
