export interface ArrowControlsProps {
  onLeft: () => void;
  onRight: () => void;
}

export interface ThemeToggleProps {
  className?: string;
}

export interface ForcedLandscapeWrapperProps<TNode = unknown> {
  children: TNode;
}

export interface IconButtonProps<TIcon = unknown> {
  className?: string;
  icon?: TIcon;
  text: string;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  helpDisabled?: string;
}

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipsProps<TNode = unknown> {
  children: TNode;
  content?: TNode;
  side?: TooltipSide;
  className?: string;
  propagation?: boolean;
}

export interface ViewportDimensions {
  width: number;
  height: number;
}

export type LoadingIndicatorVariant = 'inline' | 'screen';

export interface LoadingIndicatorProps {
  label: string;
  variant?: LoadingIndicatorVariant;
}

export interface TabIconProps<TIconName = string> {
  color: string;
  focused: boolean;
  iconName: TIconName;
  focusedIconName: TIconName;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export type AuthMode = 'login' | 'register';

export interface AuthScreenProps {
  initialMode: AuthMode;
}

export interface AuthModeToggleProps {
  activeMode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

export interface SocialProviderButtonProps<TIconName = string> {
  label: string;
  iconName: TIconName;
  color: string;
  disabled?: boolean;
  onPress: () => void;
}

// ─── Terms ───────────────────────────────────────────────────────────────────

export interface TermsSectionProps {
  titleKey: string;
  paragraphs?: string[];
  list?: string[];
  conclusionKey?: string;
}

// ─── Privacy ────────────────────────────────────────────────────────────────

export interface PrivacySectionProps {
  titleKey: string;
  paragraphs?: string[];
  list?: string[];
  conclusionKey?: string;
  highlightKey?: string;
  withDivider?: boolean;
}

export interface PrivacyDataGroupProps<TIconName = string> {
  titleKey: string;
  itemKeys: string[];
  iconName: TIconName;
}
