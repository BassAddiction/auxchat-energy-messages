import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration - эти данные можно хранить в клиенте
const firebaseConfig = {
  apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Заменить на реальный
  authDomain: "auxchat-XXXXX.firebaseapp.com",
  projectId: "auxchat-XXXXX",
  storageBucket: "auxchat-XXXXX.appspot.com",
  messagingSenderId: "XXXXXXXXXXX",
  appId: "1:XXXXXXXXXXX:web:XXXXXXXXXXXXXXXXXXXX"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging };

// Запросить разрешение на уведомления и получить FCM токен
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('[FCM] Notification permission granted');
      
      // Получаем FCM токен
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY_HERE' // Заменить на реальный VAPID key
      });
      
      console.log('[FCM] Token:', token);
      return token;
    } else {
      console.log('[FCM] Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error requesting permission:', error);
    return null;
  }
}

// Слушать входящие push-уведомления (когда приложение открыто)
export function onMessageListener() {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('[FCM] Message received:', payload);
      resolve(payload);
    });
  });
}
