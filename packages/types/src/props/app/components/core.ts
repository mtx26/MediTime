export interface ArrowControlsProps {
  onLeft: () => void;
  onRight: () => void;
}

export interface ThemeToggleProps {
  className?: string;
}

export type DateLike = string | number | Date;

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
