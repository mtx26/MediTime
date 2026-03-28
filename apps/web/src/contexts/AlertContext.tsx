import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Toast from '../components/common/Toast';
import type { ConfirmDialogType, ToastType } from '@meditime/types';

type AlertType = ToastType | ConfirmDialogType | '';

interface AlertContextValue {
  showAlert: (type: ToastType, message: string) => void;
  showConfirm: (type: ConfirmDialogType, title: string, message: string, onConfirm: () => void) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

interface AlertProviderProps {
  children: ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [alertType, setAlertType] = useState<AlertType>('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  const showAlert = useCallback((type: ToastType, message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setOnConfirmAction(null);
  }, []);

  const showConfirm = useCallback((type: ConfirmDialogType, title: string, message: string, onConfirm: () => void) => {
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

  const isConfirm = alertType === 'confirm-safe' || alertType === 'confirm-danger';

  const value = useMemo<AlertContextValue>(
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
        <Toast type={alertType as ToastType} message={alertMessage} onClose={closeAlert} duration={4000} />
      )}
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextValue {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
}
