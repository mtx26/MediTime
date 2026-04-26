import { useMemo, useRef, useState, type ElementRef, type ReactNode } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
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
  const triggerRef = useRef<ElementRef<typeof Pressable>>(null);
  const visibleActionCount = useMemo(
    () => actions.filter((action) => !action.separator).length,
    [actions],
  );
  const isWideLayout = width >= 720;
  const maxSheetHeight = Math.max(240, Math.min(height - insets.top - 28, 480));
  const panelWidth = Math.min(width - 56, 280);
  const panelTop = Math.max(insets.top + 40, isWideLayout ? 92 : 74);

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
          alignItems: 'center',
          paddingTop: panelTop,
          backgroundColor: 'transparent',
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

        <GlassView
          colorScheme="dark"
          glassEffectStyle="regular"
          style={{
            width: panelWidth,
            maxHeight: maxSheetHeight,
            borderRadius: 24,
            paddingHorizontal: 14,
            paddingVertical: 10,
            shadowColor: ios.shadow,
            shadowOpacity: isDark ? 0.55 : 0.28,
            shadowRadius: 32,
            shadowOffset: { width: 0, height: 18 },
            elevation: 20,
          }}
        >
          <ScrollView
            style={{ maxHeight: maxSheetHeight - 20 }}
            contentContainerStyle={{ paddingVertical: 2 }}
            showsVerticalScrollIndicator={visibleActionCount > 7}
            indicatorStyle="white"
          >
            {actions.map((action, index) => {
              if (action.separator) {
                return (
                  <YStack
                    key={`separator-${index}`}
                    style={{
                      height: 1,
                      marginVertical: 7,
                      marginLeft: 36,
                      backgroundColor: 'rgba(255, 255, 255, 0.16)',
                    }}
                  />
                );
              }

              const label = action.label ?? action.title ?? '';
              const description = action.title && action.title !== label ? action.title : null;
              const color = action.danger ? '#ff5f57' : '#f5f5f7';
              const iconColor = action.danger ? '#ff5f57' : '#f5f5f7';
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
                        minHeight: 44,
                        alignItems: 'center',
                        gap: 10,
                        borderRadius: 14,
                        opacity: pressed ? 0.62 : 1,
                      }}
                    >
                      <XStack
                        style={{
                          width: 26,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name={action.iconName ?? 'chevron-forward-outline'}
                          size={20}
                          color={iconColor}
                        />
                      </XStack>

                      <YStack style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          numberOfLines={2}
                          style={{
                            color,
                            fontSize: 17,
                            lineHeight: 22,
                            fontWeight: '500',
                          }}
                        >
                          {label}
                        </Text>
                        {description && (
                          <Text
                            numberOfLines={2}
                            style={{
                              color: 'rgba(245, 245, 247, 0.72)',
                              fontSize: 12,
                              lineHeight: 16,
                              fontWeight: '500',
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
        </GlassView>
      </YStack>
    </Modal>
  );

  if (triggerMode === 'longPress') {
    return (
      <>
        <Pressable
          ref={triggerRef}
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
        ref={triggerRef}
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
