import React, { useEffect, useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

function AlertSystem({
  type = 'info',
  message,
  onClose,
  onConfirm = null,
  duration = 2000,
}) {
  const { t } = useTranslation();
  const isConfirm = type.startsWith('confirm');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true); // déclenche l'animation d'apparition

    if (!isConfirm) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 400);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, isConfirm, onClose]);

  if (!message) return null;

  let bootstrapType;

  if (type === 'confirm-danger') {
    bootstrapType = 'danger';
  } else if (type === 'confirm-safe') {
    bootstrapType = 'success';
  } else {
    bootstrapType = type;
  }

  // For confirmation dialogs, use Radix UI Alert Dialog
  if (isConfirm) {
    return (
      <AlertDialog.Root open={visible} onOpenChange={(open) => {
        if (!open) {
          setVisible(false);
          setTimeout(onClose, 400);
        }
      }}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ zIndex: 1050 }}
          />
          <AlertDialog.Content
            className={`alert alert-${bootstrapType} position-fixed top-50 start-50 translate-middle shadow-lg`}
            style={{
              zIndex: 1051,
              maxWidth: '500px',
              width: '90%',
            }}
          >
            <AlertDialog.Title className="h5 mb-3">
              {t(message)}
            </AlertDialog.Title>
            <div className="d-flex flex-row flex-wrap gap-2 justify-content-center justify-content-sm-end">
              <AlertDialog.Action asChild>
                <button
                  className={`btn btn-sm btn-${bootstrapType}`}
                  aria-label={t('yes')}
                  title={t('yes')}
                  onClick={() => {
                    onConfirm?.();
                    setVisible(false);
                    setTimeout(onClose, 400);
                  }}
                >
                  {t('yes')}
                </button>
              </AlertDialog.Action>
              <AlertDialog.Cancel asChild>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  aria-label={t('cancel')}
                  title={t('cancel')}
                >
                  {t('cancel')}
                </button>
              </AlertDialog.Cancel>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    );
  }

  // For non-confirmation alerts, use the original Bootstrap alert
  return (
    <div className={`alert-wrapper ${visible ? 'show' : ''}`}>
      <div
        className={`alert alert-${bootstrapType} alert-dismissible no-dismiss-padding`}
        role="alert"
      >
        <div className="d-flex flex-column flex-sm-row justify-content-between gap-3">
          <div className="flex-fill">{t(message)}</div>
          <button
            className="btn-close"
            aria-label={t('close')}
            title={t('close')}
            onClick={() => {
              setVisible(false);
              setTimeout(onClose, 400);
            }}
          ></button>
        </div>
      </div>
    </div>
  );
}

AlertSystem.propTypes = {
  type: PropTypes.oneOf([
    'info',
    'success',
    'warning',
    'danger',
    'confirm-safe',
    'confirm-danger',
  ]),
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  duration: PropTypes.number,
};

export default AlertSystem;
