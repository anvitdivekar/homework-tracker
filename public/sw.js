const CACHE_NAME = "hw-tracker-v1";
const STATIC_ASSETS = ["/", "/login", "/dashboard", "/progress"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(res => {
        const cloned = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned)).catch(() => {});
        return res;
      });
    }).catch(() => caches.match("/"))
  );
});
