import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Toast from '../components/common/Toast';
import PropTypes from 'prop-types';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [alertType, setAlertType] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState(null);

  const showAlert = useCallback((type, message) => {
    setAlertType(type);
    setAlertMessage(message);
    setOnConfirmAction(null);
  }, []);

  const showConfirm = useCallback((type, title, message, onConfirm) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setOnConfirmAction(() => onConfirm);
  }, []);

  const closeAlert = useCallback(() => {
    setAlertMessage('');
    setAlertTitle('');
    setAlertType('');
    setOnConfirmAction(null);
  }, []);

  const isConfirm = alertType.startsWith('confirm');

  const value = useMemo(
    () => ({ showAlert, showConfirm, closeAlert }),
    [showAlert, showConfirm, closeAlert]
  );

  return (
    <AlertContext.Provider value={value}>
      {children}
      {alertMessage && isConfirm && (
        <ConfirmDialog
          type={alertType}
          title={alertTitle}
          message={alertMessage}
          onClose={closeAlert}
          onConfirm={() => {
            if (onConfirmAction) {
              onConfirmAction();
            }
          }}
        />
      )}
      {alertMessage && !isConfirm && (
        <Toast
          type={alertType}
          message={alertMessage}
          onClose={closeAlert}
          duration={8000}
        />
      )}
    </AlertContext.Provider>
  );
}

AlertProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
}
