/* Service worker: кэш оболочки приложения, чтобы работало офлайн.
   Данные визитов хранятся в localStorage (см. index.html), сеть нужна
   только для обратного геокодирования и отправки в CRM. */
const CACHE = 'visits-v2';
const SHELL = ['index.html', 'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Внешние запросы (геокодирование, CRM) — только сеть, без кэша
  if (url.origin !== location.origin) return;
  // Сначала сеть (всегда свежая версия), кэш — только офлайн.
  // Иначе после обновления приложения телефоны продолжают видеть старую версию.
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match('index.html')))
  );
});
