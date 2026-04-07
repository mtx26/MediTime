import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConfirmDialogProps } from '@meditime/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

function ConfirmDialog({ type = 'confirm-danger', title, message, onClose, onConfirm }: ConfirmDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(Boolean(message));
  }, [message]);

  const isDanger = type === 'confirm-danger';

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const handleConfirm = () => {
    onConfirm?.();
    setOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title || t('confirmation')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant={isDanger ? 'destructive' : 'default'}
              onClick={handleConfirm}
            >
              {t('yes')}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDialog;
