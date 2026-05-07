import { useMemo, useRef, useState, type ElementRef, type ReactNode } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassView } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, XStack, YStack } from 'tamagui';
import { useAppTheme } from '../../theme/ios';
import { hapticImpact, hapticSelection } from '../../utils/haptics';

export type MobileContextMenuAction = {
  label?: string;
  title?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onClick?: () => void;
  linkTo?: string;
  danger?: boolean;
  separator?: boolean;
  dataTour?: string;
};

export type MobileContextMenuActionList = (MobileContextMenuAction[] | { separator: true })[];

type ContextMenuProps = {
  actions: MobileContextMenuActionList;
  buttonSize?: 'sm' | 'default';
  children?: ReactNode;
  dataTour?: string;
  onPress?: () => void;
  onNavigate?: (href: string) => void;
  variant?: 'clear' | 'plain';
  triggerMode?: 'button' | 'longPress';
};

type Anchor = { x: number; y: number; width: number; height: number };
type MenuPosition = { top: number; left: number };

function labelFor(action: MobileContextMenuAction) {
  return action.label ?? action.title ?? '';
}

function descriptionFor(action: MobileContextMenuAction) {
  const label = labelFor(action);
  return action.title && action.title !== label ? action.title : null;
}

function visibleMenuItems(actions: MobileContextMenuActionList) {
  return actions.filter((item) => 'separator' in item || item.length > 0);
}

function isCompact(section: MobileContextMenuAction[]) {
  return section.length >= 2
    && section.length <= 3
    && section.every((action) => !action.danger && !descriptionFor(action));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getMenuPosition({
  anchor,
  height,
  insets,
  menuHeight,
  menuWidth,
  width,
}: {
  anchor: Anchor;
  height: number;
  insets: { top: number; bottom: number };
  menuHeight: number;
  menuWidth: number;
  width: number;
}): MenuPosition {
  const padding = 12;
  const gap = 8;
  const minTop = insets.top + 8;
  const maxTop = Math.max(minTop, height - insets.bottom - menuHeight - 8);
  const minLeft = padding;
  const maxLeft = Math.max(minLeft, width - menuWidth - padding);
  const anchorCenterX = anchor.x + anchor.width / 2;
  const anchorCenterY = anchor.y + anchor.height / 2;

  const candidates = [
    {
      left: anchor.x + anchor.width + gap,
      top: anchorCenterY - menuHeight / 2,
      requiredSpace: menuWidth,
      space: width - padding - (anchor.x + anchor.width + gap),
    },
    {
      left: anchor.x - menuWidth - gap,
      top: anchorCenterY - menuHeight / 2,
      requiredSpace: menuWidth,
      space: anchor.x - gap - padding,
    },
    {
      left: anchorCenterX - menuWidth / 2,
      top: anchor.y + anchor.height + gap,
      requiredSpace: menuHeight,
      space: height - insets.bottom - padding - (anchor.y + anchor.height + gap),
    },
    {
      left: anchorCenterX - menuWidth / 2,
      top: anchor.y - menuHeight - gap,
      requiredSpace: menuHeight,
      space: anchor.y - gap - insets.top - padding,
    },
  ];

  const best = candidates.find((candidate) => candidate.space >= candidate.requiredSpace)
    ?? candidates.reduce((largest, candidate) => (candidate.space > largest.space ? candidate : largest), candidates[0]);

  return {
    top: clamp(best.top, minTop, maxTop),
    left: clamp(best.left, minLeft, maxLeft),
  };
}

function ContextMenu({
  actions,
  buttonSize = 'default',
  children,
  dataTour,
  onPress,
  onNavigate,
  variant = 'plain',
  triggerMode = 'button',
}: ContextMenuProps) {
  const { t } = useTranslation();
  const { ios, isDark, colorScheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const triggerRef = useRef<ElementRef<typeof Pressable>>(null);
  const longPressTriggered = useRef(false);
  const scale = useRef(new Animated.Value(1)).current;
  const menuItems = useMemo(() => visibleMenuItems(actions), [actions]);
  const itemCount = menuItems.reduce((sum, item) => sum + ('separator' in item ? 0 : item.length), 0);
  const separatorCount = menuItems.filter((item) => 'separator' in item).length;

  const menuWidth = Math.min(width - 32, 248);
  const maxMenuHeight = Math.max(220, Math.min(height - insets.top - insets.bottom - 24, 540));
  const estimatedHeight = Math.min(maxMenuHeight, 24 + itemCount * 50 + separatorCount * 14);
  const fallbackAnchor = { x: Math.max(12, width - menuWidth - 16), y: insets.top + 52, width: 36, height: 36 };
  const activeAnchor = anchor ?? fallbackAnchor;
  const { top, left } = getMenuPosition({
    anchor: activeAnchor,
    height,
    insets,
    menuHeight: estimatedHeight,
    menuWidth,
    width,
  });

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: toValue < 1 ? 28 : 24,
      bounciness: toValue < 1 ? 0 : 4,
    }).start();
  };

  const runAction = (action: MobileContextMenuAction) => {
    if (action.linkTo) {
      onNavigate?.(action.linkTo);
      return;
    }

    action.onClick?.();
  };

  const openMenu = (event?: GestureResponderEvent) => {
    if (itemCount === 0) return;

    hapticImpact(Haptics.ImpactFeedbackStyle.Light);

    if (event) {
      const { pageX, pageY } = event.nativeEvent;
      setAnchor({ x: pageX, y: pageY, width: 1, height: 1 });
      setOpen(true);
      return;
    }

    triggerRef.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
      setAnchor({ x, y, width: measuredWidth, height: measuredHeight });
      setOpen(true);
    }) ?? setAnchor(fallbackAnchor);
  };

  const closeMenu = (withFeedback = true) => {
    if (open && withFeedback) hapticSelection();
    setOpen(false);
  };

  const pressAction = (action: MobileContextMenuAction) => {
    hapticImpact(action.danger ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    closeMenu(false);
    setTimeout(() => runAction(action), 100);
  };

  const renderItem = (action: MobileContextMenuAction, compact = false) => {
    const label = labelFor(action);
    const description = descriptionFor(action);
    const color = action.danger ? ios.destructive : ios.foreground;

    return (
      <Pressable
        key={label}
        onPress={() => pressAction(action)}
        accessibilityRole="menuitem"
        accessibilityLabel={label}
        testID={action.dataTour}
        style={compact ? { flex: 1 } : undefined}
      >
        {({ pressed }) => compact ? (
          <YStack
            style={{
              minHeight: 66,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              borderRadius: 11,
              backgroundColor: pressed ? ios.accentHover : 'transparent',
              paddingHorizontal: 6,
              paddingVertical: 6,
            }}
          >
            <Ionicons name={action.iconName ?? 'chevron-forward-outline'} size={22} color={color} />
            <Text numberOfLines={2} style={{ color, textAlign: 'center', fontSize: 12, lineHeight: 15, fontWeight: '700' }}>
              {label}
            </Text>
          </YStack>
        ) : (
          <XStack
            style={{
              minHeight: 46,
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderRadius: 10,
              backgroundColor: pressed ? ios.accentHover : 'transparent',
            }}
          >
            <XStack style={{ width: 26, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={action.iconName ?? 'chevron-forward-outline'} size={20} color={color} />
            </XStack>
            <YStack style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={2} style={{ color, fontSize: 16, lineHeight: 21, fontWeight: '600' }}>
                {label}
              </Text>
              {description && (
                <Text numberOfLines={2} style={{ color: ios.mutedForeground, fontSize: 11, lineHeight: 15, fontWeight: '500' }}>
                  {description}
                </Text>
              )}
            </YStack>
          </XStack>
        )}
      </Pressable>
    );
  };

  const menu = (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => closeMenu()}>
      <YStack style={StyleSheet.absoluteFill}>
        <Pressable
          onPress={() => closeMenu()}
          accessibilityRole="button"
          accessibilityLabel={String(t('cancel'))}
          style={StyleSheet.absoluteFill}
        />
        <GlassView
          colorScheme={colorScheme}
          glassEffectStyle="regular"
          style={{
            position: 'absolute',
            top,
            left,
            width: menuWidth,
            maxHeight: maxMenuHeight,
            borderRadius: 20,
            paddingHorizontal: 8,
            paddingVertical: 8,
            shadowColor: ios.shadow,
            shadowOpacity: isDark ? 0.58 : 0.24,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 14 },
            elevation: 18,
          }}
        >
          <ScrollView
            style={{ maxHeight: maxMenuHeight - 16 }}
            contentContainerStyle={{ paddingVertical: 1 }}
            showsVerticalScrollIndicator={itemCount > 8}
            indicatorStyle={isDark ? 'white' : 'black'}
          >
            {menuItems.map((item, index) => {
              if ('separator' in item) {
                return (
                  <YStack
                    key={`separator-${index}`}
                    style={{ height: 1, marginVertical: 7, marginHorizontal: 10, backgroundColor: ios.border }}
                  />
                );
              }

              return isCompact(item) ? (
                <XStack key={index} style={{ gap: 6, paddingHorizontal: 2, paddingVertical: 3 }}>
                  {item.map((action) => renderItem(action, true))}
                </XStack>
              ) : (
                <YStack key={index}>
                  {item.map((action) => renderItem(action))}
                </YStack>
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
          onPressIn={() => animateScale(0.975)}
          onPressOut={() => animateScale(1)}
          onPress={() => {
            if (longPressTriggered.current) {
              longPressTriggered.current = false;
              return;
            }
            if (onPress) hapticSelection();
            onPress?.();
          }}
          onLongPress={(event) => {
            longPressTriggered.current = true;
            openMenu(event);
          }}
          delayLongPress={350}
          accessibilityRole="button"
          testID={dataTour}
        >
          <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
        </Pressable>
        {menu}
      </>
    );
  }

  const trigger = children ?? <MenuButton buttonSize={buttonSize} colorScheme={colorScheme} ios={ios} variant={variant} />;

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel={children ? undefined : t('Actions')}
        testID={dataTour}
      >
        {trigger}
      </Pressable>
      {menu}
    </>
  );
}

function MenuButton({
  buttonSize,
  colorScheme,
  ios,
  variant,
}: {
  buttonSize: 'sm' | 'default';
  colorScheme: 'light' | 'dark';
  ios: ReturnType<typeof useAppTheme>['ios'];
  variant: 'clear' | 'plain';
}) {
  const size = buttonSize === 'sm' ? 32 : 36;
  const iconSize = buttonSize === 'sm' ? 18 : 20;

  if (variant === 'clear') {
    return (
      <XStack style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}>
        <Ionicons name="ellipsis-horizontal" size={18} color={ios.primary} />
      </XStack>
    );
  }

  return (
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
      }}
    >
      <Ionicons name="ellipsis-horizontal" size={iconSize} color={ios.primary} />
    </GlassView>
  );
}

export type MobileActionSheetAction = MobileContextMenuAction;
export type MobileActionSheetActionList = MobileContextMenuActionList;
export default ContextMenu;
