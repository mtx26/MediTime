import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { H2, ScrollView, Text, YStack } from 'tamagui';
import { useAppTheme, useIosTheme } from '../../theme/ios';

type AuthPageShellProps = {
  children: ReactNode;
  description?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
};

export function AuthPageShell({
  children,
  description,
  iconName,
  title,
}: AuthPageShellProps) {
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();
  const { colorScheme } = useAppTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: ios.background }}
    >
      <ScrollView
        flex={1}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, backgroundColor: ios.background }}
      >
        <YStack
          flex={1}
          style={{
            minHeight: '100%',
            justifyContent: 'center',
            paddingHorizontal: 18,
            paddingTop: 18,
            paddingBottom: Math.max(insets.bottom, 18) + 20,
            backgroundColor: ios.background,
          }}
        >
          <YStack
            style={{
              width: '100%',
              maxWidth: 460,
              alignSelf: 'center',
              gap: 14,
            }}
          >
            <GlassView
              colorScheme={colorScheme}
              glassEffectStyle="clear"
              style={{
                borderRadius: 24,
                padding: 8,
              }}
            >
              <YStack style={{ gap: 18, padding: 10 }}>
                <YStack style={{ alignItems: 'center', gap: 10 }}>
                  <YStack
                    style={{
                      width: 58,
                      height: 58,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      backgroundColor: ios.blueInfoBg,
                    }}
                  >
                    <Ionicons name={iconName} size={30} color={ios.primary} />
                  </YStack>
                  <H2 style={{ textAlign: 'center', color: ios.foreground }}>
                    {title}
                  </H2>
                  {description ? (
                    <Text
                      style={{
                        textAlign: 'center',
                        color: ios.mutedForeground,
                        fontSize: 15,
                        lineHeight: 22,
                      }}
                    >
                      {description}
                    </Text>
                  ) : null}
                </YStack>

                {children}
              </YStack>
            </GlassView>
          </YStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
