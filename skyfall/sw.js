const CACHE_NAME = 'skyfall-cache-v4';

// Cai RELATIVE: aplicatia e servita dintr-un subfolder (/m3/), iar caile
// absolute ('/dashboard') dadeau 404 -> cache.addAll pica -> service
// worker-ul nu se instala deloc si PWA-ul ramanea fara offline.
// Fisierele panoului SI ale meniului clientilor: o data deschis, meniul
// ramane in telefon si se deschide si cu semnal slab (datele — produse,
// preturi, comenzi — vin mereu din baza si nu se pun niciodata in cache;
// clientul le tine el, in localStorage, ca rezerva).
const urlsToCache = [
  './dashboard.html',
  './index.html',
  './',
  './manifest.json',
  './config.js',
  '../fonturi/fonturi.css',
  '../vendor/supabase.js',
  './icons/logo.png',
  './icons/favicon.png',
  './icons/badge-96.png'
];
// scriptul Supabase e local (vendor/), dar pastram si varianta de pe CDN in cache
// pentru paginile vechi ramase deschise
const CDN_SUPABASE = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // Fiecare fisier separat: daca unul lipseste, instalarea continua.
      Promise.all([
        ...urlsToCache.map(url =>
          cache.add(url).catch(err => console.warn('SW: nu am putut pune in cache', url, err))
        ),
        fetch(CDN_SUPABASE, { mode: 'no-cors' }).then(r => cache.put(CDN_SUPABASE, r)).catch(() => {})
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
      }))
    )
  );
  self.clients.claim();
});

// Reteaua, cu un termen: daca nu raspunde in cateva secunde (semnal slab),
// dam copia din cache si lasam reteaua sa termine in fundal.
function reteaCuTermen(request, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('termen')), ms);
    fetch(request).then(r => { clearTimeout(t); resolve(r); }, e => { clearTimeout(t); reject(e); });
  });
}

// NETWORK-FIRST pentru fisierele proprii (si fonturi), cu cache ca rezerva.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Nu se pun NICIODATA in cache raspunsurile Supabase (comenzi, jurnal, sesiuni).
  // Altfel datele clientilor si ale personalului ramaneau stocate pe telefon.
  if (url.hostname.endsWith('supabase.co') || url.hostname.endsWith('supabase.in')) return;

  // scriptul Supabase de pe CDN: din cache daca il avem (se innoieste in fundal)
  if (event.request.url.startsWith(CDN_SUPABASE)) {
    event.respondWith(
      caches.match(event.request.url).then(cached => {
        const dinRetea = fetch(event.request.url, { mode: 'no-cors' })
          .then(r => { caches.open(CACHE_NAME).then(c => c.put(CDN_SUPABASE, r.clone())); return r; })
          .catch(() => cached);
        return cached || dinRetea;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // paginile (meniul, panoul): reteaua are 4 secunde, apoi copia din cache
  const ePagina = event.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  event.respondWith(
    reteaCuTermen(event.request, ePagina ? 4000 : 8000)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cacheCopy));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: ePagina }))
  );
});

// ---------------------------------------------------------------------------
// WEB PUSH
// Aici ajung notificarile trimise de Edge Function-ul `notifica-comanda`.
// Functioneaza si cu aplicatia inchisa complet, spre deosebire de vechea
// abordare care cerea ca pagina sa fie inca deschisa in fundal.
// ---------------------------------------------------------------------------

self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = {}; }

  const title = d.title || '🛎️ Skyfall';
  const options = {
    body: d.body || 'Comanda noua',
    icon: './icons/icon-192.png',
    badge: './icons/badge-96.png',   // monocrom, pe transparent: Android il arata in bara de stare (un PNG colorat iesea patrat alb)
    tag: d.tag || 'skyfall',
    renotify: true,              // suna din nou chiar daca exista deja una cu acelasi tag
    requireInteraction: true,    // ramane pe ecran pana o atinge cineva
    vibrate: [400, 200, 400, 200, 800],
    data: { url: d.url || './dashboard.html', comandaId: d.comandaId || null }
  };

  event.waitUntil(
    self.registration.getNotifications({ tag: options.tag }).then(list => {
      // pagina a aratat deja aceeasi comanda (acelasi tag): o inlocuim in liniste, fara al doilea sunet
      if (list.length) { options.renotify = false; delete options.vibrate; }
      return self.registration.showNotification(title, options);
    }).catch(() => self.registration.showNotification(title, options))
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || './dashboard.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // daca dashboard-ul e deja deschis undeva, il aducem in fata
      for (const c of list) {
        if (c.url.includes('dashboard') && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});

// Unele browsere invalideaza abonamentul periodic; il reinnoim tacut.
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then(sub => self.clients.matchAll().then(list =>
        list.forEach(c => c.postMessage({ tip: 'push-resubscribe', sub: sub.toJSON() }))
      ))
      .catch(() => {})
  );
});
