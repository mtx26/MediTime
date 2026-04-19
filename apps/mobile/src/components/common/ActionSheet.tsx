import { useRef, type ReactNode } from 'react';
import { ActionSheetIOS, Alert, Animated, Platform, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { YStack } from 'tamagui';
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
  triggerMode?: 'button' | 'longPress';
};

function ActionSheet({
  actions,
  buttonSize = 'default',
  children,
  onPress,
  onNavigate,
  triggerMode = 'button',
}: ActionSheetProps) {
  const { t } = useTranslation();
  const { colorScheme, ios } = useAppTheme();
  const longPressTriggered = useRef(false);
  const longPressScale = useRef(new Animated.Value(1)).current;

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

  const openIosActionSheet = () => {
    const visibleActions = actions.filter((action) => !action.separator);
    const labels = visibleActions.map((action) => action.label ?? action.title ?? '');
    const cancelButtonIndex = labels.length;
    const destructiveButtonIndex = visibleActions.findIndex((action) => action.danger);

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...labels, t('cancel')],
        cancelButtonIndex,
        destructiveButtonIndex: destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
        userInterfaceStyle: colorScheme,
      },
      (buttonIndex) => {
        if (buttonIndex === cancelButtonIndex) return;

        const selected = visibleActions[buttonIndex];
        if (selected) runAction(selected);
      },
    );
  };

  const openFallbackNativeAlert = () => {
    const visibleActions = actions.filter((action) => !action.separator);

    Alert.alert(
      t('Actions'),
      undefined,
      [
        ...visibleActions.map((action) => ({
          text: action.label ?? action.title ?? '',
          style: action.danger ? 'destructive' as const : 'default' as const,
          onPress: () => runAction(action),
        })),
        { text: t('cancel'), style: 'cancel' as const },
      ],
    );
  };

  const openActionSheet = () => {
    if (Platform.OS === 'ios') {
      openIosActionSheet();
      return;
    }

    openFallbackNativeAlert();
  };

  if (triggerMode === 'longPress') {
    return (
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
      >
        <Animated.View style={{ transform: [{ scale: longPressScale }] }}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  const size = buttonSize === 'sm' ? 36 : 40;

  return (
    <Pressable
      onPress={openActionSheet}
      accessibilityRole="button"
      accessibilityLabel={t('Actions')}
    >
      {({ pressed }) => (
        <YStack
          style={{
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            backgroundColor: pressed ? ios.blueInfoBorder : ios.blueInfoBg,
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={ios.primary} />
        </YStack>
      )}
    </Pressable>
  );
}

export default ActionSheet;
