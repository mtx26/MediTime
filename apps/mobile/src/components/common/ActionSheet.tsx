import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Modal, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, XStack, YStack } from 'tamagui';
import { useAppTheme } from '../../theme/ios';

export type MobileActionSheetAction = {
  label?: string;
  title?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onClick?: () => void;
  linkTo?: string;
  danger?: boolean;
  separator?: boolean;
  dataTour?: string;
};

type ActionSheetProps = {
  actions: MobileActionSheetAction[];
  buttonSize?: 'sm' | 'default';
  children?: ReactNode;
  dataTour?: string;
  onPress?: () => void;
  onNavigate?: (href: string) => void;
  variant?: 'filled' | 'plain';
  triggerMode?: 'button' | 'longPress';
};

function ActionSheet({
  actions,
  buttonSize = 'default',
  children,
  dataTour,
  onPress,
  onNavigate,
  variant = 'plain',
  triggerMode = 'button',
}: ActionSheetProps) {
  const { t } = useTranslation();
  const { ios, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const longPressTriggered = useRef(false);
  const longPressScale = useRef(new Animated.Value(1)).current;
  const visibleActionCount = useMemo(
    () => actions.filter((action) => !action.separator).length,
    [actions],
  );
  const isWideLayout = width >= 720;
  const maxSheetHeight = Math.max(280, Math.min(height - insets.top - 24, 560));
  const sheetBottomPadding = Math.max(insets.bottom, 12);

  const animateLongPressIn = () => {
    Animated.spring(longPressScale, {
      toValue: 0.975,
      useNativeDriver: true,
      speed: 28,
      bounciness: 0,
    }).start();
  };

  const animateLongPressOut = () => {
    Animated.spring(longPressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  };

  const runAction = (action: MobileActionSheetAction) => {
    if (action.linkTo) {
      onNavigate?.(action.linkTo);
      return;
    }

    action.onClick?.();
  };

  const openActionSheet = () => {
    if (visibleActionCount === 0) return;
    setOpen(true);
  };

  const closeActionSheet = () => {
    setOpen(false);
  };

  const handleActionPress = (action: MobileActionSheetAction) => {
    closeActionSheet();
    setTimeout(() => {
      runAction(action);
    }, 120);
  };

  const renderActionSheetModal = () => (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={closeActionSheet}
    >
      <YStack
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: isWideLayout ? 24 : 0,
          paddingTop: 24,
          paddingBottom: isWideLayout ? 24 : 0,
          backgroundColor: ios.overlay,
        }}
      >
        <Pressable
          onPress={closeActionSheet}
          accessibilityRole="button"
          accessibilityLabel={String(t('cancel'))}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        />

        <YStack
          style={{
            width: '100%',
            maxWidth: 520,
            maxHeight: maxSheetHeight,
            alignSelf: 'center',
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

          <ScrollView
            style={{ maxHeight: Math.max(160, maxSheetHeight - 96) }}
            contentContainerStyle={{ gap: 4 }}
            showsVerticalScrollIndicator={visibleActionCount > 7}
            indicatorStyle={isDark ? 'white' : 'black'}
          >
            {actions.map((action, index) => {
              if (action.separator) {
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

              const label = action.label ?? action.title ?? '';
              const description = action.title && action.title !== label ? action.title : null;
              const color = action.danger ? ios.destructive : ios.foreground;
              const iconColor = action.danger ? ios.destructive : ios.primary;
              const iconBackground = action.danger ? ios.destructiveBg : ios.blueInfoBg;

              return (
                <Pressable
                  key={`${label}-${index}`}
                  onPress={() => handleActionPress(action)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  testID={action.dataTour}
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
                          name={action.iconName ?? 'chevron-forward-outline'}
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
                        {description && (
                          <Text
                            numberOfLines={2}
                            style={{
                              color: ios.mutedForeground,
                              fontSize: 13,
                              lineHeight: 18,
                              fontWeight: '600',
                            }}
                          >
                            {description}
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
            onPress={closeActionSheet}
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
      </YStack>
    </Modal>
  );

  if (triggerMode === 'longPress') {
    return (
      <>
        <Pressable
          onPressIn={animateLongPressIn}
          onPressOut={animateLongPressOut}
          onPress={() => {
            if (longPressTriggered.current) {
              longPressTriggered.current = false;
              return;
            }
            onPress?.();
          }}
          onLongPress={() => {
            longPressTriggered.current = true;
            openActionSheet();
          }}
          delayLongPress={350}
          accessibilityRole="button"
          testID={dataTour}
        >
          <Animated.View style={{ transform: [{ scale: longPressScale }] }}>
            {children}
          </Animated.View>
        </Pressable>
        {renderActionSheetModal()}
      </>
    );
  }

  const isPlain = variant === 'plain';
  const size = isPlain ? 36 : buttonSize === 'sm' ? 36 : 40;
  const iconSize = isPlain ? 24 : 18;
  const triggerShadowOpacity = isPlain ? 0 : (isDark ? 0.22 : 0.08);

  return (
    <>
      <Pressable
        onPress={openActionSheet}
        accessibilityRole="button"
        accessibilityLabel={t('Actions')}
        testID={dataTour}
      >
        {({ pressed }) => (
          <YStack
            style={{
              width: size,
              height: size,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: isPlain ? 8 : size / 2,
              backgroundColor: isPlain
                ? 'transparent'
                : pressed ? ios.blueInfoBorder : ios.blueInfoBg,
              opacity: pressed ? 0.75 : 1,
              shadowColor: ios.shadow,
              shadowOpacity: triggerShadowOpacity,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 3 },
              elevation: isPlain ? 0 : 1,
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={iconSize} color={ios.primary} />
          </YStack>
        )}
      </Pressable>
      {renderActionSheetModal()}
    </>
  );
}

export default ActionSheet;
