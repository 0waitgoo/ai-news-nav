/* 杂盒 PWA Service Worker v1（第一百一十五轮）：只满足安装条件，不做缓存——
   请求全部直通网络，避免旧缓存挡住新版；后续如需离线能力再升级本文件版本号。 */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
