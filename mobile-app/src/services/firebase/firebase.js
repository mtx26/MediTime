import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { log } from '../../utils/logger';
import { 
  FIREBASE_API_KEY, 
  FIREBASE_AUTH_DOMAIN, 
  FIREBASE_PROJECT_ID, 
  FIREBASE_STORAGE_BUCKET, 
  FIREBASE_MESSAGING_SENDER_ID, 
  FIREBASE_APP_ID, 
  FIREBASE_MEASUREMENT_ID,
  FCM_VAPID_KEY 
} from '@env';

// 🔐 Configuration Firebase
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

// 🚀 Initialisation
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let messaging;
let onMessageFn;

// 🔔 Récupérer le token de notifications
export const requestPermissionAndGetToken = async (uid) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Permission refusée');

    const { getMessaging, getToken } = await import('firebase/messaging');
    messaging = messaging || getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: FCM_VAPID_KEY,
    });

    log.info('[FCM] Token reçu :', {
      uid: uid,
      token: token,
      origin: 'FCM_TOKEN_RECEIVED',
    });
    return token;
  } catch (err) {
    log.error('[FCM] Erreur permission ou token', {
      uid: uid,
      origin: 'FCM_TOKEN_ERROR',
      error: err,
    });
    return null;
  }
};

const analyticsPromise = (async () => {
  const { getAnalytics, isSupported } = await import('firebase/analytics');
  return (await isSupported()) ? getAnalytics(app) : null;
})();

const getMessagingModule = async () => {
  if (!messaging) {
    const { getMessaging, onMessage } = await import('firebase/messaging');
    messaging = getMessaging(app);
    onMessageFn = onMessage;
  }
  return { messaging, onMessage: onMessageFn };
};

// 📤 Exportation
export { db, analyticsPromise, getMessagingModule };
