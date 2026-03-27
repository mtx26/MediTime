import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Toast from '../components/common/Toast';

interface AlertContextValue {
  showAlert: (type: string, message: string) => void;
  showConfirm: (type: string, title: string, message: string, onConfirm: () => void) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

interface AlertProviderProps {
  children: ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [alertType, setAlertType] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  const showAlert = useCallback((type: string, message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setOnConfirmAction(null);
  }, []);

  const showConfirm = useCallback((type: string, title: string, message: string, onConfirm: () => void) => {
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
        <Toast type={alertType} message={alertMessage} onClose={closeAlert} duration={4000} />
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
