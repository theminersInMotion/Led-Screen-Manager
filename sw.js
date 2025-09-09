const CACHE_NAME = 'led-screen-manager-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './constants.ts',
  './i18n.tsx',
  './en.json',
  './zh.json',
  './components/CalculatorForm.tsx',
  './components/ResultsDisplay.tsx',
  './components/WiringDiagram.tsx',
  './components/LanguageSwitcher.tsx',
  './components/ui/Card.tsx',
  './components/ui/Input.tsx',
  './components/ui/Select.tsx',
  './components/ui/ResultCard.tsx',
  './components/ui/Toggle.tsx',
  './components/icons/index.tsx',
  './components/icons/PixelIcon.tsx',
  './components/icons/RatioIcon.tsx',
  './components/icons/PowerIcon.tsx',
  './components/icons/BreakerIcon.tsx',
  './components/icons/CableIcon.tsx',
  './components/icons/Logo.tsx',
  './components/icons/DataFlowIcon.tsx',
  './components/icons/DimensionIcon.tsx',
  './components/icons/ProcessorIcon.tsx',
  './components/icons/CabinetIcon.tsx',
  './components/icons/PriceIcon.tsx',
  './components/icons/PlayerIcon.tsx',
  './manifest.json',
  './icons/icon-192x192.svg',
  './icons/icon-512x512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => {
      console.error('Failed to cache assets:', err);
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests, use a network-first strategy.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // For other requests, use a cache-first strategy.
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        // We don't cache external resources from cdns.
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        return response;
      });
    })
  );
});