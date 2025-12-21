import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import * as ToastPrimitive from '@radix-ui/react-toast';

function Toast({ type = 'info', message, onClose, duration = 2000 }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const lastMessageRef = useRef('');

  useEffect(() => {
    // Ne rouvrir que si c'est un nouveau message
    if (message && message !== lastMessageRef.current) {
      lastMessageRef.current = message;
      setOpen(true);
    } else if (!message) {
      lastMessageRef.current = '';
      setOpen(false);
    }
  }, [message]);

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setOpen(false);
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="bi bi-check-circle-fill text-success"></i>;
      case 'danger':
        return <i className="bi bi-exclamation-circle-fill text-danger"></i>;
      case 'warning':
        return <i className="bi bi-exclamation-triangle-fill text-warning"></i>;
      default:
        return <i className="bi bi-info-circle-fill text-info"></i>;
    }
  };

  if (!message) return null;

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      <ToastPrimitive.Root
        open={open}
        onOpenChange={handleOpenChange}
        duration={duration}
        className="bg-white shadow-lg rounded-3 p-3 d-flex align-items-center gap-3"
        style={{
          border: '1px solid rgba(0,0,0,0.1)',
          minWidth: '300px',
          maxWidth: '450px',
        }}
      >
        <div style={{ fontSize: '1.25rem' }}>{getIcon()}</div>
        <ToastPrimitive.Description className="flex-grow-1 mb-0">
          {t(message)}
        </ToastPrimitive.Description>
        <ToastPrimitive.Close
          className="btn-close"
          aria-label={t('close')}
        />
      </ToastPrimitive.Root>

      <ToastPrimitive.Viewport
        className="position-fixed bottom-0 end-0 p-3 d-flex flex-column gap-2"
        style={{ zIndex: 9999 }}
      />
    </ToastPrimitive.Provider>
  );
}

Toast.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'danger']),
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number,
};

export default Toast;
