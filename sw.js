const CACHE_NAME = 'cigarette-counter-v6';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Устанавливаем кеш при первом запуске
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Активация – удаляем старые кеши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Стратегия: для index.html – сначала сеть, потом кеш (остальное – из кеша)
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Если запрос на главную страницу (или на /) – сначала пробуем сеть
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Если сеть ответила успешно – обновляем кеш (опционально)
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          // Если сеть недоступна – берём из кеша
          return caches.match(request);
        })
    );
  } else {
    // Для всех остальных ресурсов – сначала кеш, потом сеть
    event.respondWith(
      caches.match(request)
        .then(response => response || fetch(request))
    );
  }
});
