// Offline cache: serve the app shell from cache, refresh it in the background.
const CACHE = 'hineni-v13';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/app.js', 'js/dial.js', 'js/zmanim.js', 'js/solar.js', 'js/hebrew.js', 'js/calendar.js', 'js/lore.js', 'js/art.js', 'js/levels.js', 'js/parshah.js', 'js/intro.js', 'js/sky.js', 'js/places.js', 'icon.svg', 'manifest.webmanifest'];

self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const net = fetch(e.request).then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
