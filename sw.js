// 🌟 파일이 수정될 때마다 이 숫자를 v2 -> v3 -> v4로 올려주세요!
const CACHE_NAME = 'myshade-v8'; 

const ASSETS = [
  './',
  './index.html',
  './script.js',
  './manifest.json', // PWA 필수 파일 추가
  './assets/basic.jpg',
  './assets/title.jpg',
  './assets/sub.jpg',
  './music/bgm.mp3',
  './music/Twinkle.mp3',
  './music/Success.mp3' // 기획자님이 추가하신 성공 사운드 추가!
];

// 1. 설치 시: 새 파일을 캐시에 저장 (즉시 교체)
self.addEventListener('install', (e) => {
  self.skipWaiting(); // 🔥 핵심 1: 대기하지 않고 즉시 새 버전으로 갈아탐!
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. 활성화 시: 옛날 버전 캐시 싹 다 지우기 (찌꺼기 청소)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        // 현재 버전(myshade-v2)이 아닌 옛날 버전(myshade-v1)은 다 지워버려라!
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] 이전 버전 캐시 삭제완료:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim(); // 🔥 핵심 2: 브라우저 제어권을 즉시 뺏어옴!
});

// 3. 실행 시: 캐시에 있으면 캐시를, 없으면 인터넷에서 가져오기
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
