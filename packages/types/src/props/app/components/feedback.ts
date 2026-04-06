export interface ActionSheetAction<TLabel = unknown> {
  label?: TLabel;
  title?: string;
  onClick?: () => void;
  linkTo?: string;
  danger?: boolean;
  separator?: boolean;
  dataTour?: string;
}

export interface ActionSheetProps<TLabel = unknown> {
  actions: ActionSheetAction<TLabel>[];
  buttonSize?: 'sm' | 'default' | string;
  dataTour?: string;
}

export type ToastType = 'info' | 'success' | 'warning' | 'danger';

export type ConfirmDialogType = 'confirm-safe' | 'confirm-danger';

export type AlertType = ToastType | ConfirmDialogType;

export interface ConfirmDialogProps {
  type?: ConfirmDialogType;
  title?: string;
  message: string;
  onClose: () => void;
  onConfirm?: (() => void) | null;
}

export interface AlertSystemProps {
  type?: AlertType;
  title?: string;
  message: string;
  onClose: () => void;
  onConfirm?: (() => void) | null;
  duration?: number;
}

export interface ToastProps {
  type?: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

/* ------------------------------------------------------------------ */
/* Alert Context                                                      */
/* ------------------------------------------------------------------ */

export interface AlertContextValue {
  showAlert: (type: ToastType, message: string) => void;
  showConfirm: (type: ConfirmDialogType, title: string, message: string, onConfirm: () => void) => void;
  closeAlert: () => void;
}

export interface AlertProviderProps<TNode = unknown> {
  children: TNode;
}
