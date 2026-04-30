import { Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, XStack, YStack } from 'tamagui';
import type { SharedUserRowProps } from '@meditime/types';
import { useIosTheme } from '../../theme/ios';
import { hapticImpact } from '../../utils/haptics';

export function SharedUserRow({
  label,
  photoUrl,
  status,
  onDelete,
}: SharedUserRowProps) {
  const ios = useIosTheme();
  const hasPhoto = typeof photoUrl === 'string' && photoUrl.trim().length > 0;

  return (
    <View
      style={{
        minHeight: 52,
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: ios.card,
      }}
    >
      <XStack style={{ alignItems: 'center', gap: 10 }}>
        {hasPhoto ? (
          <Image
            source={{ uri: photoUrl }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
            }}
          />
        ) : (
          <View
            style={{
              width: 38,
              height: 38,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 19,
              backgroundColor: ios.accentHover,
            }}
          >
            <Ionicons name="person-outline" size={18} color={ios.primary} />
          </View>
        )}

        <YStack style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 20, fontWeight: '600' }}>
            {label}
          </Text>
          <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 16 }}>
            {status}
          </Text>
        </YStack>

        <Pressable
          onPress={() => {
            hapticImpact();
            onDelete();
          }}
          accessibilityRole="button"
        >
          {({ pressed }) => (
            <View
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
              backgroundColor: ios.accentHover,
                opacity: pressed ? 0.8 : 1,
              }}
            >
              <Ionicons name="trash-outline" size={16} color={ios.destructive} />
            </View>
          )}
        </Pressable>
      </XStack>
    </View>
  );
}
