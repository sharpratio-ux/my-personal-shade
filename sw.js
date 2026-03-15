const CACHE_NAME = 'myshade-v1';
const ASSETS = [
  './index.html',
  './script.js',
  './assets/basic.jpg',
  './assets/title.jpg',
  './assets/sub.jpg',
  './music/bgm.mp3',
  './music/Twinkle.mp3'
];

// 설치 시 파일 캐싱
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 네트워크 요청을 가로채서 캐시된 파일 먼저 제공 (로딩 속도 폭발)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});