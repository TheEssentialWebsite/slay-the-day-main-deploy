// Slay The Day Service Worker
// Simple cache-first strategy for offline support

const CACHE_NAME = 'slay-the-day-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/app',
  '/deck', 
  '/journal',
  '/packs',
  '/settings',
  '/manifest.json',
  '/icon-192.png',
  '/icon-256.png', 
  '/icon-512.png'
];

// Install event - cache core resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request).catch(() => {
        // If both cache and network fail, show offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

// Background sync for future enhancements
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-entries') {
    // Future: sync local entries to cloud when back online
    console.log('Background sync triggered');
  }
});

// Push notifications for reminders (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Time for a moment...',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'reminder',
      requireInteraction: false,
      silent: true, // Keep it soft
      data: {
        url: '/app'
      }
    };

    event.waitUntil(
      self.registration.showNotification('Slay The Day', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});