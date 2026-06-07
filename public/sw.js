const CACHE_NAME = 'kulika-v1';
const RUNTIME_CACHE = 'kulika-runtime';
const IMAGE_CACHE = 'kulika-images';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Message listener for manual activation
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== IMAGE_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - network first, fallback to cache
  if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || new Response('Offline - Data not available', { status: 503 });
          });
        })
    );
  }

  // Images - cache first, fallback to placeholder
  else if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE)
        .then((cache) => {
          return cache.match(request).then((response) => {
            if (response) return response;

            return fetch(request).then((response) => {
              if (response.ok) {
                const clone = response.clone();
                cache.put(request, clone);
              }
              return response;
            });
          });
        })
        .catch(() => {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#ddd" width="200" height="200"/></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        })
    );
  }

  // Static assets - cache first
  else if (request.method === 'GET' && 
           (request.destination === 'style' ||
            request.destination === 'script' ||
            request.destination === 'font')) {
    event.respondWith(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.match(request).then((response) => {
            if (response) return response;
            return fetch(request).then((response) => {
              if (response.ok) {
                const clone = response.clone();
                cache.put(request, clone);
              }
              return response;
            });
          });
        })
    );
  }

  // Default - network first
  else {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || new Response('Offline', { status: 503 });
          });
        })
    );
  }
});

// Background sync for offline changes
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-changes') {
    event.waitUntil(
      syncOfflineChanges()
    );
  }
});

async function syncOfflineChanges() {
  try {
    const db = await openIndexedDB();
    const changes = await getOfflineChanges(db);

    for (const change of changes) {
      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(change),
        });

        if (response.ok) {
          await removeOfflineChange(db, change.id);
        }
      } catch (error) {
        console.error('Sync failed for change:', change.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Helper functions for IndexedDB (Simplified for the snippet)
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kulika-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getOfflineChanges(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingChanges'], 'readonly');
    const store = transaction.objectStore('pendingChanges');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removeOfflineChange(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingChanges'], 'readwrite');
    const store = transaction.objectStore('pendingChanges');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
