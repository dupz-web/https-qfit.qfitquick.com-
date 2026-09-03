const CACHE_NAME = 'qfit-v29'; // TODO(5단계): 빌드에서 자동 생성한다
const APP_SHELL = [
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './media/photos/lunge-1.webp',
  './media/photos/lunge-2.webp',
  './media/photos/lunge-3.webp',
  './media/photos/burpee-1.webp',
  './media/photos/burpee-2.webp',
  './media/photos/burpee-3.webp',
  './media/photos/squat-1.webp',
  './media/photos/squat-2.webp',
  './media/photos/hipbridge-1.webp',
  './media/photos/hipbridge-2.webp',
  './media/photos/jumpsquat-1.webp',
  './media/photos/jumpsquat-2.webp',
  './media/photos/plank-1.webp',
  './media/photos/crunch-1.webp',
  './media/photos/crunch-2.webp',
  './media/photos/legraise-1.webp',
  './media/photos/legraise-2.webp',
  './media/photos/pushup-1.jpg',
  './media/photos/pushup-2.jpg',
  './media/photos/pikepushup-1.jpg',
  './media/photos/pikepushup-2.jpg',
  './media/photos/runinplace-1.jpg',
  './media/photos/runinplace-2.jpg',
  './media/photos/armycrawl-1.jpg',
  './media/photos/armycrawl-2.jpg',
  './media/photos/armycrawl-3.jpg',
  './media/photos/armycrawl-4.jpg',
  './media/clips/warmup.mp4',
  './media/clips/clip-1.mp4',
  './media/clips/clip-2.mp4',
  './media/clips/clip-3.mp4',
  './media/clips/clip-4.mp4',
  './media/clips/clip-5.mp4',
  './media/clips/clip-6.mp4',
  './media/clips/clip-7.mp4',
  './media/clips/clip-8.mp4',
  './media/clips/clip-9.mp4',
  './media/clips/clip-10.mp4',
  './media/clips/clip-11.mp4',
  './media/clips/clip-12.mp4'
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
