// Service worker : l'appli s'ouvre hors ligne ; les images du guide se mettent en cache à la première vue.
const SHELL = 'silksong-shell-202610281610';
const IMGS = 'silksong-img-v2';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/hornet-192.png', 'icons/hornet-512.png', 'icons/hornet-180.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => ![SHELL, IMGS].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin && req.destination === 'image') {   // images du guide : cache d'abord
    e.respondWith(caches.open(IMGS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; });   // se rafraîchit en arrière-plan : une image remplacée finit par arriver
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    }));
    return;
  }
  if (url.origin === location.origin) {                                  // appli : réseau d'abord, cache en secours
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok) { const copy = r.clone(); caches.open(SHELL).then(c => c.put(req, copy)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
  }
});
