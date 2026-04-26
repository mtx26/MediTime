import { Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { Text, XStack, YStack } from 'tamagui';
import type { SharedUserRowProps } from '@meditime/types';
import { useAppTheme, useIosTheme } from '../../theme/ios';

export function SharedUserRow({
  label,
  photoUrl,
  status,
  onDelete,
}: SharedUserRowProps) {
  const { colorScheme } = useAppTheme();
  const ios = useIosTheme();
  const hasPhoto = typeof photoUrl === 'string' && photoUrl.trim().length > 0;

  return (
    <GlassView
      colorScheme={colorScheme}
      glassEffectStyle="clear"
      style={{
        minHeight: 52,
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 10,
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
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="clear"
            style={{
              width: 38,
              height: 38,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 19,
            }}
          >
            <Ionicons name="person-outline" size={18} color={ios.primary} />
          </GlassView>
        )}

        <YStack style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: ios.foreground, fontSize: 15, lineHeight: 20, fontWeight: '600' }}>
            {label}
          </Text>
          <Text style={{ color: ios.mutedForeground, fontSize: 12, lineHeight: 16 }}>
            {status}
          </Text>
        </YStack>

        <Pressable onPress={onDelete} accessibilityRole="button">
          {({ pressed }) => (
            <GlassView
              colorScheme={colorScheme}
              glassEffectStyle="clear"
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                opacity: pressed ? 0.8 : 1,
              }}
            >
              <Ionicons name="trash-outline" size={16} color={ios.destructive} />
            </GlassView>
          )}
        </Pressable>
      </XStack>
    </GlassView>
  );
}
