

if('serviceWorker' in navigator) {
    navigator.serviceWorker
     .register('/service-worker.js')
     .then(regestration => {
         console.log('[ Service Worker ] Registered Success ... ');
     })
}