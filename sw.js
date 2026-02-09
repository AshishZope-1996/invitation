// Service Worker for Caching
const CACHE_NAME = 'wedding-invitation-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    './Videos/engagement.mp4',
    './Photos/01.jpg',
    './Photos/02.jpg',
    './Photos/03.jpg',
    './Photos/04.jpg',
    './Photos/05.jpg',
    './Photos/06.jpg',
    './Photos/07.jpg',
    './Photos/08.jpg',
    './Photos/09.jpg',
    './Photos/10.jpg',
    './Photos/11.jpg',
    './Photos/Ashish_001.jpg',
    './Photos/Ashish_002.jpg',
    './Photos/Ashish_003.jpg',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&family=Great+Vibes&display=swap',
    'https://i.ibb.co/7QpKsCX/heart.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Caching assets...');
            return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                console.log('Cache addAll error:', err);
                // Continue even if some assets fail to cache
            });
        })
    );
    self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Only cache GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Strategy: Cache first for videos and images, Network first for HTML
    if (url.pathname.includes('/Videos/') || url.pathname.includes('/Photos/')) {
        // Cache first strategy for videos and photos
        event.respondWith(
            caches.match(request).then(response => {
                if (response) {
                    console.log('Serving from cache:', request.url);
                    return response;
                }
                return fetch(request).then(response => {
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                    console.log('Caching new asset:', request.url);
                    return response;
                }).catch(() => {
                    return caches.match(request);
                });
            })
        );
    } else {
        // Network first strategy for HTML and other files
        event.respondWith(
            fetch(request).then(response => {
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, responseToCache);
                });
                return response;
            }).catch(() => {
                return caches.match(request);
            })
        );
    }
});
