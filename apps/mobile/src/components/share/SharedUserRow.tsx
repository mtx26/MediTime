import { Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import type { SharedUserRowProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';

export function SharedUserRow({
  label,
  photoUrl,
  status,
  onDelete,
}: SharedUserRowProps) {
  const ios = useIosTheme();
  const hasPhoto = typeof photoUrl === 'string' && photoUrl.trim().length > 0;

  return (
    <XStack
      style={{
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: ios.border,
        backgroundColor: ios.background,
      }}
    >
      {hasPhoto ? (
        <Image
          source={{ uri: photoUrl }}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: ios.blueInfoBg,
          }}
        />
      ) : (
        <YStack
          style={{
            width: 38,
            height: 38,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 19,
            backgroundColor: ios.blueInfoBg,
          }}
        >
          <Ionicons name="person-outline" size={18} color={ios.primary} />
        </YStack>
      )}

      <YStack style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: ios.foreground, fontSize: 14, lineHeight: 20, fontWeight: '800' }}>
          {label}
        </Text>
        <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 16, fontWeight: '700' }}>
          {status}
        </Text>
      </YStack>

      <Pressable onPress={onDelete} accessibilityRole="button">
        {({ pressed }) => (
          <XStack
            style={{
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              backgroundColor: ios.destructiveBg,
              opacity: pressed ? 0.8 : 1,
            }}
          >
            <Ionicons name="trash-outline" size={16} color={ios.destructive} />
          </XStack>
        )}
      </Pressable>
    </XStack>
  );
}
