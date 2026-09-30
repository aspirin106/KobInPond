const CACHE_NAME = 'kob-in-kala-v5-finish-ring';

const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './game.js',
    './textures.js',
    './manifest.json',
    './images/icon-192.png',
    './images/icon-512.png',
    './images/well_stone_basecolor.webp',
    './images/well_stone_normal.webp',
    './images/well_stone_roughness.webp',
    './images/well_stone_ao.webp',
    './images/generated/brick-albedo.webp',
    './images/generated/brick-normal.webp',
    './images/generated/brick-roughness.webp',
    './images/generated/rock-albedo.webp',
    './images/generated/rock-normal.webp',
    './images/generated/rock-roughness.webp',
    './images/generated/leaf-albedo.webp',
    './images/generated/vine-albedo.webp',
    './images/generated/vine-normal.webp',
    './images/generated/vine-roughness.webp'
];

// Install: Cache all critical assets for full offline play
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate: Clean up old cache versions
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Stale-while-revalidate for local assets, network-first for API
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Bypass API calls from cache
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                // Fetch in background to update cache
                fetch(event.request).then(response => {
                    if (response && response.status === 200) {
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
                    }
                }).catch(() => {});
                return cached;
            }

            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type === 'opaque') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            }).catch(() => {
                // Offline fallback for navigation
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
