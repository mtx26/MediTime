import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { ToastProps } from '@meditime/types';

function Toast({ type = 'info', message, onClose, duration = 4000 }: ToastProps) {
  const { t } = useTranslation();
  const lastMessageRef = useRef('');

  useEffect(() => {
    // Ne déclencher que si c'est un nouveau message
    if (message && message !== lastMessageRef.current) {
      lastMessageRef.current = message;
      
      const translatedMessage = t(message);
      
      // Déclencher le toast selon le type
      switch (type) {
        case 'success':
          toast.success(translatedMessage, { duration, closeButton: true });
          break;
        case 'danger':
          toast.error(translatedMessage, { duration, closeButton: true });
          break;
        case 'warning':
          toast.warning(translatedMessage, { duration, closeButton: true });
          break;
        default:
          toast.info(translatedMessage, { duration, closeButton: true });
      }
      
      // Appeler onClose après la durée
      setTimeout(onClose, duration);
    } else if (!message) {
      lastMessageRef.current = '';
    }
  }, [message, type, t, onClose, duration]);

  return null;
}

export default Toast;
