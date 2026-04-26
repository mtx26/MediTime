import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Text, XStack } from 'tamagui';
import { useAppTheme, useIosTheme } from '../../theme/ios';
import { hapticImpact } from '../../utils/haptics';

type AddCalendarFooterProps = {
  onPress: () => void;
};

export function AddCalendarFooter({ onPress }: AddCalendarFooterProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();
  const handlePress = () => {
    hapticImpact();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} accessibilityRole="button">
      {({ pressed }) => (
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="clear"
          style={{
            borderRadius: 18,
            padding: 8,
            opacity: pressed ? 0.84 : 1,
          }}
        >
          <XStack
            style={{
              minHeight: 34,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="add-circle-outline" size={19} color={ios.primary} />
            <Text style={{ color: ios.primary, fontSize: 16, fontWeight: '700' }}>
              {t('calendar.add_calendar')}
            </Text>
          </XStack>
        </GlassView>
      )}
    </Pressable>
  );
}
