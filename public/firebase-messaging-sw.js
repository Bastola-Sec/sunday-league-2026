// Firebase Messaging PWA Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase App in Service Worker
firebase.initializeApp({
  projectId: 'optical-zepplin-j1ttq',
  appId: '1:3263044952:web:53d81467249b536db4d92d',
  apiKey: 'AIzaSyDxhW8HM_fbzA-OUGkHtpIN15Bq1OZ_6pc',
  authDomain: 'optical-zepplin-j1ttq.firebaseapp.com',
  messagingSenderId: '3263044952',
  storageBucket: 'optical-zepplin-j1ttq.firebasestorage.app'
});

const messaging = firebase.messaging();

// Handle Background Push Notifications when App is Closed / In Background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background push payload:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || '⚽ Sunday League Alert';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Match event updated live in Sunday League 2026!',
    icon: payload.notification?.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: payload.data?.url || '/'
    },
    actions: [
      {
        action: 'view-match',
        title: '⚽ View Live Match'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle Notification Click Action to open App directly
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
