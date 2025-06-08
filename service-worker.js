/**
 * テトリスアプリのサービスワーカー
 * PWA対応とオフライン機能を提供
 */

// キャッシュ名とバージョン
const CACHE_NAME = 'tetris-cache-v1';

// キャッシュするリソースのリスト
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/tetromino.js',
  '/js/game.js',
  '/js/ui.js',
  '/js/main.js'
  // 音声ファイルや画像がある場合はここに追加
];

// インストール時の処理
self.addEventListener('install', event => {
  console.log('Service Worker: インストール中');
  
  // キャッシュの設定
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: キャッシュをオープン');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// アクティベート時の処理
self.addEventListener('activate', event => {
  console.log('Service Worker: アクティベート');
  
  // 古いキャッシュを削除
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: 古いキャッシュを削除', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// フェッチ時の処理
self.addEventListener('fetch', event => {
  console.log('Service Worker: フェッチ', event.request.url);
  
  // ネットワークファーストの戦略
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // レスポンスのコピーをキャッシュに保存
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone);
          });
        
        return response;
      })
      .catch(() => {
        // オフラインの場合はキャッシュから取得
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // キャッシュにもない場合の処理
            // 例えば、オフラインページを表示するなど
          });
      })
  );
}); 
