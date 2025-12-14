const CACHE_NAME = 'pillie-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Installatie - cache alle bestanden
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache geopend');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activatie - oude caches opruimen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Oude cache verwijderd:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - cache-first strategie
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone de request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check of we een geldig response hebben
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone de response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Offline fallback
          return caches.match('./index.html');
        });
      })
  );
});

// Push notificaties (voor toekomstig gebruik)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Tijd voor je medicijn!',
    icon: './icons/icon-192.png',
    badge: './icons/icon-72.png',
    vibrate: [200, 100, 200],
    tag: 'pillie-reminder',
    requireInteraction: true,
    actions: [
      { action: 'take', title: 'Ingenomen' },
      { action: 'snooze', title: 'Later' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Pillie', options)
  );
});

// Notificatie click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'take') {
    // Open app met take actie
    event.waitUntil(
      clients.openWindow('./?action=take')
    );
  } else {
    // Open app normaal
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});
