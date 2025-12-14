// Service Worker для Firebase Cloud Messaging
// Этот файл запускается в фоне и получает push-уведомления даже когда сайт закрыт

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration
firebase.initializeApp({
  apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Заменить на реальный
  authDomain: "auxchat-XXXXX.firebaseapp.com",
  projectId: "auxchat-XXXXX",
  storageBucket: "auxchat-XXXXX.appspot.com",
  messagingSenderId: "XXXXXXXXXXX",
  appId: "1:XXXXXXXXXXX:web:XXXXXXXXXXXXXXXXXXXX"
});

const messaging = firebase.messaging();

// Обработка фоновых уведомлений (когда сайт закрыт)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'Новое сообщение';
  const notificationOptions = {
    body: payload.notification?.body || 'У вас новое сообщение в AuxChat',
    icon: '/icon-192x192.png', // Добавить иконку приложения
    badge: '/badge-72x72.png',
    tag: 'auxchat-message',
    requireInteraction: true,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  event.notification.close();
  
  // Открыть чат с пользователем
  const chatUrl = event.notification.data?.chatUrl || '/messages';
  event.waitUntil(
    clients.openWindow(chatUrl)
  );
});
