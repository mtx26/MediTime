/* -------------------------------------------------------------------------- */
/* App Component Props Types                                                   */
/* -------------------------------------------------------------------------- */

export interface ArrowControlsProps {
  onLeft: () => void;
  onRight: () => void;
}

export interface ThemeToggleProps {
  className?: string;
}

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipsProps<TNode = unknown> {
  children: TNode;
  content?: TNode;
  side?: TooltipSide;
  className?: string;
  propagation?: boolean;
}