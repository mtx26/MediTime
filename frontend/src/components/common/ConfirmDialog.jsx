import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';

function ConfirmDialog({ type = 'confirm-danger', title, message, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(Boolean(message));
  }, [message]);

  const isDanger = type === 'confirm-danger';
  const buttonColor = isDanger ? 'btn-danger' : 'btn-success';

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
    <AlertDialogPrimitive.Root open={open} onOpenChange={handleClose}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 9998 }}
        />
        <AlertDialogPrimitive.Content 
          className="position-fixed top-50 start-50 translate-middle bg-white rounded-3 shadow-lg p-4"
          style={{ 
            zIndex: 9999,
            width: '90vw',
            maxWidth: '450px',
            maxHeight: '85vh',
          }}
        >
          <AlertDialogPrimitive.Title className="h5 fw-bold mb-3">
            {title || t('confirmation')}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mb-4 text-secondary">
            {message}
          </AlertDialogPrimitive.Description>

          <div className="d-flex gap-2 justify-content-end">
            <AlertDialogPrimitive.Cancel asChild>
              <button className="btn btn-outline-secondary">
                {t('cancel')}
              </button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <button 
                className={`btn ${buttonColor}`}
                onClick={handleConfirm}
              >
                {t('yes')}
              </button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

ConfirmDialog.propTypes = {
  type: PropTypes.oneOf(['confirm-safe', 'confirm-danger']),  title: PropTypes.string,  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
};

export default ConfirmDialog;
