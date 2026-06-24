const CACHE = 'court-role-cache-v1';
const ASSETS = [
  '.',
  'index.html',
  'style.css',
  'app.js'
];
// Basic install + cache
self.addEventListener('install', evt=>{
  evt.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', evt=>{
  evt.waitUntil(self.clients.claim());
});
// Serve cached then network
self.addEventListener('fetch', evt=>{
  const url = new URL(evt.request.url);
  // bypass analytics or external
  if(url.origin !== location.origin) return;
  evt.respondWith(
    caches.match(evt.request).then(r => r || fetch(evt.request).then(resp=>{
      return resp;
    })).catch(()=>caches.match('index.html'))
  );
});
