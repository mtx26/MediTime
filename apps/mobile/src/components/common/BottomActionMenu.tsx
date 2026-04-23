import { useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, XStack, YStack } from 'tamagui';
import { useAppTheme } from '../../theme/ios';

export type BottomActionMenuItem = {
  label?: string;
  description?: string | null;
  iconName?: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
  separator?: boolean;
  testID?: string;
  onPress?: () => void;
};

type BottomActionMenuProps = {
  visible: boolean;
  title: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  items: BottomActionMenuItem[];
  onClose: () => void;
};

export function BottomActionMenu({
  visible,
  title,
  iconName = 'ellipsis-horizontal',
  items,
  onClose,
}: BottomActionMenuProps) {
  const { t } = useTranslation();
  const { ios, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const animation = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const visibleItemCount = items.filter((item) => !item.separator).length;
  const isWideLayout = width >= 720;
  const availableHeight = Math.max(220, height - insets.top - 24);
  const sheetMaxHeight = Math.min(availableHeight, 560);
  const sheetBottomPadding = Math.max(insets.bottom, 12);
  const sheetTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });
  const iosActionItems = items.filter((item) => !item.separator && item.label);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      if (!visible) {
        setMounted(false);
        return;
      }

      const options = iosActionItems.map((item) => item.label ?? '');
      const cancelButtonIndex = options.length;
      const destructiveButtonIndex = iosActionItems.findIndex((item) => item.danger);

      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          options: [...options, String(t('cancel'))],
          cancelButtonIndex,
          destructiveButtonIndex: destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
          userInterfaceStyle: isDark ? 'dark' : 'light',
        },
        (buttonIndex) => {
          onClose();

          if (buttonIndex === cancelButtonIndex) {
            return;
          }

          iosActionItems[buttonIndex]?.onPress?.();
        },
      );
      setMounted(false);
      return;
    }

    if (visible) {
      setMounted(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(animation, {
      toValue: 0,
      duration: 150,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [animation, visible]);

  const handleItemPress = (item: BottomActionMenuItem) => {
    onClose();
    setTimeout(() => item.onPress?.(), 120);
  };

  if (Platform.OS === 'ios' || !mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <YStack
        accessibilityViewIsModal
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: isWideLayout ? 24 : 0,
          paddingTop: 24,
          paddingBottom: isWideLayout ? 24 : 0,
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: ios.overlay,
              opacity: animation,
            },
          ]}
        />
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={String(t('cancel'))}
          style={StyleSheet.absoluteFillObject}
        />

        <Animated.View
          style={{
            width: '100%',
            maxWidth: 520,
            maxHeight: sheetMaxHeight,
            alignSelf: 'center',
            opacity: animation,
            transform: [{ translateY: sheetTranslateY }],
          }}
        >
          <YStack
            style={{
              width: '100%',
              maxHeight: sheetMaxHeight,
              paddingHorizontal: 12,
              paddingTop: 10,
              paddingBottom: sheetBottomPadding,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              borderBottomLeftRadius: isWideLayout ? 8 : 0,
              borderBottomRightRadius: isWideLayout ? 8 : 0,
              backgroundColor: ios.card,
              shadowColor: ios.shadow,
              shadowOpacity: isDark ? 0.45 : 0.16,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: -8 },
              elevation: 16,
            }}
          >
            <YStack style={{ alignItems: 'center', paddingBottom: 10 }}>
              <YStack
                style={{
                  width: 42,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: ios.border,
                }}
              />
            </YStack>

            <XStack
              style={{
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 8,
                paddingTop: 2,
                paddingBottom: 12,
              }}
            >
              <YStack
                style={{
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  backgroundColor: ios.blueInfoBg,
                }}
              >
                <Ionicons name={iconName} size={18} color={ios.primary} />
              </YStack>
              <Text
                numberOfLines={1}
                style={{ flex: 1, color: ios.foreground, fontSize: 18, lineHeight: 24, fontWeight: '800' }}
              >
                {title}
              </Text>
            </XStack>

            <ScrollView
              style={{ maxHeight: Math.max(120, sheetMaxHeight - 134) }}
              contentContainerStyle={{ gap: 4 }}
              showsVerticalScrollIndicator={visibleItemCount > 7}
              indicatorStyle={isDark ? 'white' : 'black'}
            >
              {items.map((item, index) => {
                if (item.separator) {
                  return (
                    <YStack
                      key={`separator-${index}`}
                      style={{
                        height: 1,
                        marginVertical: 6,
                        marginHorizontal: 8,
                        backgroundColor: ios.border,
                      }}
                    />
                  );
                }

                const label = item.label ?? '';
                const color = item.danger ? ios.destructive : ios.foreground;
                const iconColor = item.danger ? ios.destructive : ios.primary;
                const iconBackground = item.danger ? ios.destructiveBg : ios.blueInfoBg;

                return (
                  <Pressable
                    key={`${label}-${index}`}
                    onPress={() => handleItemPress(item)}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    testID={item.testID}
                  >
                    {({ pressed }) => (
                      <XStack
                        style={{
                          minHeight: 54,
                          alignItems: 'center',
                          gap: 12,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          borderRadius: 8,
                          backgroundColor: pressed ? ios.accentHover : 'transparent',
                        }}
                      >
                        <YStack
                          style={{
                            width: 36,
                            height: 36,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 8,
                            backgroundColor: iconBackground,
                          }}
                        >
                          <Ionicons
                            name={item.iconName ?? 'chevron-forward-outline'}
                            size={19}
                            color={iconColor}
                          />
                        </YStack>

                        <YStack style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              color,
                              fontSize: 16,
                              lineHeight: 22,
                              fontWeight: '800',
                            }}
                          >
                            {label}
                          </Text>
                          {item.description && (
                            <Text
                              numberOfLines={2}
                              style={{
                                color: ios.mutedForeground,
                                fontSize: 13,
                                lineHeight: 18,
                                fontWeight: '600',
                              }}
                            >
                              {item.description}
                            </Text>
                          )}
                        </YStack>
                      </XStack>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={String(t('cancel'))}
              style={{ marginTop: 10 }}
            >
              {({ pressed }) => (
                <YStack
                  style={{
                    minHeight: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: pressed ? ios.blueInfoBorder : ios.blueInfoBg,
                  }}
                >
                  <Text style={{ color: ios.primary, fontSize: 16, fontWeight: '900' }}>
                    {t('cancel')}
                  </Text>
                </YStack>
              )}
            </Pressable>
          </YStack>
        </Animated.View>
      </YStack>
    </Modal>
  );
}
