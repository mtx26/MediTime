import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Text, XStack } from 'tamagui';
import { useIosTheme } from '../../theme/ios';

type AddCalendarFooterProps = {
  onPress: () => void;
};

export function AddCalendarFooter({ onPress }: AddCalendarFooterProps) {
  const { t } = useTranslation();
  const ios = useIosTheme();

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {({ pressed }) => (
        <XStack
          style={{
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderTopWidth: 1,
            borderTopColor: ios.border,
            backgroundColor: pressed ? ios.accentHover : 'transparent',
          }}
        >
          <Ionicons name="add-circle-outline" size={19} color={ios.primary} />
          <Text style={{ color: ios.primary, fontSize: 16, fontWeight: '700' }}>
            {t('calendar.add_calendar')}
          </Text>
        </XStack>
      )}
    </Pressable>
  );
}
