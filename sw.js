// 離線快取：第一次開啟時把整個 App 存到裝置裡，之後沒網路也能用
const CACHE = 'duty-board-v37';   // 每次更新 App 都要改這個版本號（index.html 的 APP_VERSION 也要一起改）
const FILES = ['./', './index.html', './manifest.webmanifest', './pdfjs/pdf.min.mjs', './pdfjs/pdf.worker.min.mjs',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
// 安裝時一律從網路抓最新檔案（不用瀏覽器快取），避免存到舊版
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // 頁面：有網路就拿最新版並更新快取，沒網路就用快取
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request.url, {cache: 'no-store', credentials: 'same-origin'}).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })));
});
