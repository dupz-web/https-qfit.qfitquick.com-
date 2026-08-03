const CACHE_NAME = 'zip-v28';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './lunge-1.webp',
  './lunge-2.webp',
  './lunge-3.webp',
  './burpee-1.webp',
  './burpee-2.webp',
  './burpee-3.webp',
  './squat-1.webp',
  './squat-2.webp',
  './hipbridge-1.webp',
  './hipbridge-2.webp',
  './jumpsquat-1.webp',
  './jumpsquat-2.webp',
  './plank-1.webp',
  './crunch-1.webp',
  './crunch-2.webp',
  './legraise-1.webp',
  './legraise-2.webp',
  './pushup-1.jpg',
  './pushup-2.jpg',
  './pikepushup-1.jpg',
  './pikepushup-2.jpg',
  './runinplace-1.jpg',
  './runinplace-2.jpg',
  './armycrawl-1.jpg',
  './armycrawl-2.jpg',
  './armycrawl-3.jpg',
  './armycrawl-4.jpg',
  './warmup.mp4',
  './clip-1.mp4',
  './clip-2.mp4',
  './clip-3.mp4',
  './clip-4.mp4',
  './clip-5.mp4',
  './clip-6.mp4',
  './clip-7.mp4',
  './clip-8.mp4',
  './clip-9.mp4',
  './clip-10.mp4',
  './clip-11.mp4',
  './clip-12.mp4'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Cache each file individually instead of cache.addAll(), which aborts
      // the ENTIRE install (leaving the app stuck on the old service worker
      // / old cached assets) if even a single file 404s. This way one
      // missing/renamed file can't silently block every other update from
      // ever taking effect.
      Promise.all(APP_SHELL.map((url) =>
        cache.add(url).catch((err) => console.warn('sw: failed to cache', url, err))
      ))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for the HTML shell so edits show up on next reload without
// waiting for a stale cache to expire; cache-first for everything else.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
