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
import * as Haptics from 'expo-haptics';
import { GlassView } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, XStack, YStack } from 'tamagui';
import { useAppTheme } from '../../theme/ios';
import { hapticImpact, hapticSelection } from '../../utils/haptics';

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
  variant?: 'clear' | 'plain';
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
  const { ios, isDark, colorScheme } = useAppTheme();
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
  const maxSheetHeight = Math.max(260, Math.min(height - insets.top - 28, 560));
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
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    setOpen(true);
  };

  const closeActionSheet = (withFeedback = true) => {
    if (open && withFeedback) hapticSelection();
    setOpen(false);
  };

  const handleActionPress = (action: MobileActionSheetAction) => {
    hapticImpact(action.danger ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    closeActionSheet(false);
    setTimeout(() => {
      runAction(action);
    }, 120);
  };

  const renderActionSheetModal = () => (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => closeActionSheet()}
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
          onPress={() => closeActionSheet()}
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
          colorScheme={colorScheme}
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
                      backgroundColor: ios.border,
                    }}
                  />
                );
              }

              const label = action.label ?? action.title ?? '';
              const description = action.title && action.title !== label ? action.title : null;
              const color = action.danger ? ios.destructive : ios.foreground;
              const iconColor = action.danger ? ios.destructive : ios.foreground;
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
                            color: ios.mutedForeground,
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
            if (onPress) hapticSelection();
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

  if (variant === 'clear') {
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
            <XStack
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 16,
                opacity: pressed ? 0.72 : 1,
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={ios.primary} />
            </XStack>
          )}
        </Pressable>
        {renderActionSheetModal()}
      </>
    );
  }
  const size = buttonSize === 'sm' ? 32 : 36;
  const iconSize = buttonSize === 'sm' ? 18 : 20;
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
          <GlassView
            colorScheme={colorScheme}
            glassEffectStyle="regular"
            style={{
              width: size,
              height: size,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: size / 2,
              borderWidth: 0.5,
              borderColor: ios.border,
              overflow: 'hidden',
              opacity: pressed ? 0.72 : 1,
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={iconSize} color={ios.primary} />
          </GlassView>
        )}
      </Pressable>
      {renderActionSheetModal()}
    </>
  );
}

export default ActionSheet;
