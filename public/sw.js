// Puja Fund Service Worker for Mobile Notifications
const CACHE_NAME = 'puja-fund-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Handle incoming push notification event
self.addEventListener('push', event => {
  let data = { title: 'পূজা ফান্ড', body: 'মাসিক চাঁদার রিমাইন্ডার' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: data.tag || 'puja-fund-notification',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    data: data.data || { url: '/?tab=bkash-pay' },
    actions: [
      { action: 'pay', title: 'চাঁদা দিন' },
      { action: 'close', title: 'বন্ধ করুন' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification tap on mobile screen
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', tab: 'bkash-pay' });
          return;
        }
      }
      // If not open, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/#bkash-pay');
      }
    })
  );
});
