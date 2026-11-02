// Utsab Sonchay - Mobile Push & Notification Click Worker
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const data = event.notification.data || {};
  const targetUrl = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (data.tab) {
            client.postMessage({
              type: 'NAVIGATE',
              tab: data.tab,
              subTab: data.subTab || 'pending'
            });
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle incoming system push if triggered via Web Push
self.addEventListener('push', event => {
  let data = {
    title: 'উৎসব সঞ্চয়',
    body: 'নতুন অনুমোদনের আবেদন এসেছে',
    tag: 'admin-approval'
  };

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
    tag: data.tag || 'admin-approval',
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    renotify: true,
    data: data.data || { url: '/#members', tab: 'members', subTab: 'pending' },
    actions: [
      { action: 'open', title: 'যাচাই ও অনুমোদন করুন' },
      { action: 'close', title: 'পরে দেখুন' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
