import type { ReactElement, ReactNode } from 'react';
import type { RefreshControlProps, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, Text, XStack, YStack } from 'tamagui';
import { useIosTheme } from '../../theme/ios';

type PageProps = {
  children: ReactNode;
  contentContainerStyle?: ViewStyle;
  gap?: number;
  horizontalPadding?: number;
  keyboardShouldPersistTaps?: 'always' | 'handled' | 'never';
  refreshControl?: ReactElement<RefreshControlProps>;
  screen?: ReactNode;
  scrollable?: boolean;
  topPadding?: number;
  withBottomTabInset?: boolean;
  withTopInset?: boolean;
};

type PageTitleProps = {
  iconName?: keyof typeof Ionicons.glyphMap;
  subtitle?: string;
  title: string;
};

type PageHeaderOptionsInput = {
  headerBackButtonDisplayMode?: 'default' | 'generic' | 'minimal';
  headerBackTitle?: string;
  headerBackTitleVisible?: boolean;
  headerLeft?: () => ReactNode;
  headerLeftContainerStyle?: { paddingLeft?: number };
  headerRight?: () => ReactNode;
  headerRightContainerStyle?: { paddingRight?: number };
  headerShown?: boolean;
  headerStyle?: { backgroundColor?: string };
  headerTintColor?: string;
  headerTitle?: string | (() => ReactNode);
  headerTitleAlign?: 'left' | 'center';
  headerTitleStyle?: {
    color?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: TextStyle['fontWeight'];
  };
  title?: string;
};

export function Page({
  children,
  contentContainerStyle,
  gap = 16,
  horizontalPadding = 16,
  keyboardShouldPersistTaps = 'handled',
  refreshControl,
  screen,
  scrollable = true,
  topPadding = 16,
  withBottomTabInset = false,
  withTopInset = false,
}: PageProps) {
  const insets = useSafeAreaInsets();
  const ios = useIosTheme();

  const resolvedPaddingTop = withTopInset ? Math.max(insets.top, topPadding) : topPadding;
  const resolvedPaddingBottom = withBottomTabInset
    ? 56 + insets.bottom + 18
    : Math.max(insets.bottom, 18) + 6;

  const containerStyle: ViewStyle = {
    flex: 1,
    minHeight: '100%',
    gap,
    paddingHorizontal: horizontalPadding,
    paddingTop: resolvedPaddingTop,
    paddingBottom: resolvedPaddingBottom,
    backgroundColor: ios.background,
    ...contentContainerStyle,
  };

  if (!scrollable) {
    return (
      <>
        {screen}
        <YStack style={containerStyle}>
          {children}
        </YStack>
      </>
    );
  }

  return (
    <>
      {screen}
      <ScrollView
        flex={1}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        style={{ flex: 1, backgroundColor: ios.background }}
        refreshControl={refreshControl}
      >
        <YStack style={containerStyle}>
          {children}
        </YStack>
      </ScrollView>
    </>
  );
}

export function PageTitle({ iconName, subtitle, title }: PageTitleProps) {
  const ios = useIosTheme();

  return (
    <YStack style={{ gap: 6 }}>
      <XStack style={{ alignItems: 'center', gap: 10 }}>
        {iconName ? (
          <YStack
            style={{
              width: 38,
              height: 38,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              backgroundColor: ios.blueInfoBg,
            }}
          >
            <Ionicons name={iconName} size={20} color={ios.primary} />
          </YStack>
        ) : null}
        <Text style={{ flex: 1, color: ios.foreground, fontSize: 28, lineHeight: 34, fontWeight: '900' }}>
          {title}
        </Text>
      </XStack>
      {subtitle ? (
        <Text style={{ color: ios.mutedForeground, fontSize: 14, lineHeight: 20 }}>
          {subtitle}
        </Text>
      ) : null}
    </YStack>
  );
}

export function usePageHeaderOptions({
  headerBackButtonDisplayMode,
  headerBackTitle,
  headerBackTitleVisible,
  headerLeft,
  headerLeftContainerStyle,
  headerRight,
  headerRightContainerStyle,
  headerShown = true,
  headerStyle,
  headerTintColor,
  headerTitle,
  headerTitleAlign,
  headerTitleStyle,
  title,
}: PageHeaderOptionsInput) {
  const ios = useIosTheme();

  return {
    headerShown,
    title,
    headerTitle,
    headerTitleAlign,
    headerLeft,
    headerLeftContainerStyle: {
      paddingLeft: 8,
      ...headerLeftContainerStyle,
    },
    headerRight,
    headerRightContainerStyle: {
      paddingRight: 8,
      ...headerRightContainerStyle,
    },
    headerBackButtonDisplayMode,
    headerBackTitle,
    headerBackTitleVisible,
    headerTintColor: headerTintColor ?? ios.primary,
    headerStyle: {
      backgroundColor: ios.background,
      ...headerStyle,
    },
    headerShadowVisible: false,
    headerTitleStyle: {
      color: ios.foreground,
      fontWeight: '700' as const,
      ...headerTitleStyle,
    },
  };
}
