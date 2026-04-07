import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import type { AlertSystemProps, ConfirmDialogType, ToastType } from '@meditime/types';

function AlertSystem({
  type = 'info',
  title,
  message,
  onClose,
  onConfirm = null,
  duration = 2000,
}: AlertSystemProps) {
  const isConfirm = type === 'confirm-safe' || type === 'confirm-danger';

  if (!message) return null;

  if (isConfirm) {
    return (
      <ConfirmDialog
        type={type as ConfirmDialogType}
        title={title}
        message={message}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
  }

  return (
    <Toast
      type={type as ToastType}
      message={message}
      onClose={onClose}
      duration={duration}
    />
  );
}

export default AlertSystem;
