/* eslint-disable */
// Push handler imported by the vite-plugin-pwa-generated service worker.
//
// Receives push events from the FrenchUp backend (web-push) and:
//  1. Shows a system notification.
//  2. On click, focuses an existing tab on the target URL or opens a new one.
//
// Payload shape (must match push.service.ts → PushPayload):
//   { title, body, url?, tag?, icon? }

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'FrenchUp', body: event.data.text() };
  }

  const title = data.title || 'FrenchUp';
  const options = {
    body: data.body || '',
    icon: data.icon || '/pwa-icon-192.png',
    badge: '/pwa-icon-192.png',
    tag: data.tag || 'frenchup-default',
    data: { url: data.url || '/dashboard' },
    renotify: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';

  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // If a window is already open on our origin, focus it and navigate.
    for (const client of clientsList) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) {
          try { await client.navigate(targetUrl); } catch { /* cross-origin guard */ }
        }
        return;
      }
    }
    // Otherwise open a new tab.
    await self.clients.openWindow(targetUrl);
  })());
});
