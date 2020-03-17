importScripts('/src/js/idb.js');

const CACHE_STATIC_NAME = 'static-v8';
const CACHE_DYNAMIC_NAME = 'dynamic-v2';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/idb.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
 ];

 let dbPromise = idb.open('posts-store', 1, db => {
     db.createObjectStore('posts', { keyPath: 'id' });
 });

 self.addEventListener('install', function(e) {
    e.waitUntil(
      caches.open(CACHE_STATIC_NAME)
       .then(function(cache) {
           console.log('[Service Worker] Installing Service Worker ...');
              cache.addAll(STATIC_FILES);
       })
    );
 });

 self.addEventListener('activate', function(e) {
    console.log('[Service Worker] Activating Service Worker ...');

    // clear old cache
    e.waitUntil(
        caches.keys()
          .then(function(cachedKeys) {
              return Promise.all(cachedKeys.map(function(key) {
                  if(key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                    return caches.delete(key);
                  }
              }))
          })
    );
// Tell the active service worker to take control of the page immediately.
    return self.clients.claim(); // to ensure that activating is correctly done
});

//After install, fetch event is triggered for every page request
self.addEventListener('fetch', function(event) {
  let url = 'https://pwa-training-4a918.firebaseio.com/posts.json';
console.log('request', event.request)
  if(event.request.url === url) {
    event.respondWith( 
      fetch(event.request).then(res => {
        let clonedRes = res.clone();

        clonedRes.json().then(data => {
            for(let key in data) {
                dbPromise.then(db => {
                    let tx = db.transaction('posts', 'readwrite');
                    let store = tx.objectStore('posts');

                    store.put(data[key]);
        
                    return tx.complete;
                });
            }
        })

          return res;
        })
      );
    // USE Cache only Strategy if the request is in the static Files
  } else if(STATIC_FILES.includes(event.request.url)) {
    event.respondWith(
      caches.match(event.request)
    ); 
  } else {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(response => {
          return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
            cache.put(event.request, response.clone());
  
            return response;
          })
        })
      })
      .catch(err => {
        return caches.open(CACHE_STATIC_NAME).then(cache => {
          // i need to show offline page only if the failure is in the help Page
          // because it does not make any sence if i show this page in case of the failure in files like css 
          if(event.request.headers.get('accept').includes('text/html')) {
            return cache.match('/offline.html');
          }
        })
      })
    );
  }
});

// [ ====== Strategy 1 - Cache-Only ======] 
// self.addEventListener('fetch', e => {
//     e.respondWith(
//         caches.match(e.request)
//     );
// })

// [ ===== Strategy 2 - Network-Only =====] 
// self.addEventListener('fetch', e => {
//     e.respondWith(fetch(e.request));
// })

// [ ===== Strategy 3 - Network falling back to cache =====] 
// it's bad in case of poor connection imagine that theconnection took
// 60 s and fails the user have to wait 60 s to see the result 
// self.addEventListener('fetch', e => {
//     e.respondWith(
//         fetch(e.request)
//           .catch(err => {
//               return caches.match(e.request);
//           })
//     );
// })

// [ ===== Strategy 4 - Cache [ From Normal Js ] then network  =====]
/** @Expected
 *    @returns {1/ FIRSTLY - return the cache value to the page}
 *    @returns {2/ call the fetch and gets its value for the same request and Override The response receieved From Cache in UI [ additional: i can cache its response ] }
 * 
 * @But
 * 
 * @param { if the network response was faster than cache response [ then, the cache will override the network respose - { You Need To Handle This Case } ]  } 
 * */ 
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.open(CACHE_DYNAMIC_NAME).then(cache => {
//       return fetch(e.request).then(res => {
//         cache.put(e.request, res.clone());

//         return res;
//       })
//     })
//   );
// });


// [ Genaral Strategy { Cache then network falling to offline page } ]
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response) {
//         if (response) {
//           return response;
//         } else {
//           return fetch(event.request)
//             .then(res => {
//                 return caches.open(CACHE_DYNAMIC_NAME)
//                   .then(cache => {
//                       cache.put(event.request.url, res.clone());

//                       return res
//                   })
//             })
//             // FallBack in Order To Show An Offline Page 
//             // In Case That The Visited Page Not Cached 
//             // when trying access it in offline Mode
//             .catch(err => {
//               return caches.open(CACHE_STATIC_NAME)
//                   .then(cache => {
//                       return cache.match('/offline.html')
//                   });
//             });
//         }
//       })
//   );
// });