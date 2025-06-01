const CACHE_NAME = 'cubs-ems-v1.0.0';
const STATIC_CACHE = 'cubs-static-v1';
const DYNAMIC_CACHE = 'cubs-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/index.js',
  '/tailwind.css',
  '/assets/appicon.png',
  '/assets/splash.png',
  '/public/manifest.json',
  // Add other critical static assets
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/employees/,
  /\/api\/companies/,
  /\/api\/dashboard/,
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('🔧 Service Worker Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Static files cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('❌ Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker Activated');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Cache cleanup complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 1. Static files - Cache First strategy
    if (isStaticFile(url.pathname)) {
      return cacheFirst(request, STATIC_CACHE);
    }
    
    // 2. API requests - Network First with fallback
    if (isApiRequest(url.pathname)) {
      return networkFirstWithFallback(request);
    }
    
    // 3. Images and assets - Cache First
    if (isAssetFile(url.pathname)) {
      return cacheFirst(request, DYNAMIC_CACHE);
    }
    
    // 4. Everything else - Network First
    return networkFirst(request);
    
  } catch (error) {
    console.error('🚨 Request failed:', error);
    return getOfflinePage();
  }
}

// Cache First strategy (for static files)
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('📋 Serving from cache:', request.url);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
      console.log('📥 Cached new file:', request.url);
    }
    return response;
  } catch (error) {
    console.log('⚠️ Network failed, no cache available for:', request.url);
    throw error;
  }
}

// Network First strategy (for dynamic content)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      console.log('🌐 Fresh from network:', request.url);
    }
    
    return response;
  } catch (error) {
    console.log('📱 Network failed, trying cache for:', request.url);
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('📋 Fallback from cache:', request.url);
      return cached;
    }
    
    throw error;
  }
}

// Network First with fallback for API requests
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      console.log('🔄 API response cached:', request.url);
    }
    
    return response;
  } catch (error) {
    console.log('📱 API request failed, checking cache:', request.url);
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('📋 Serving cached API response:', request.url);
      return cached;
    }
    
    // Return offline API response
    return new Response(
      JSON.stringify({
        offline: true,
        message: 'This data was cached while offline',
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Helper functions
function isStaticFile(pathname) {
  return pathname === '/' || 
         pathname.endsWith('.html') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.json');
}

function isApiRequest(pathname) {
  return pathname.startsWith('/api/') || 
         pathname.includes('supabase.co') ||
         API_CACHE_PATTERNS.some(pattern => pattern.test(pathname));
}

function isAssetFile(pathname) {
  return pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.gif') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.webp') ||
         pathname.endsWith('.ico');
}

function getOfflinePage() {
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>CUBS EMS - Offline</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #DC143C 0%, #FF6B6B 100%);
            color: white;
            text-align: center;
            padding: 20px;
          }
          .offline-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          .retry-btn {
            background: white;
            color: #DC143C;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="offline-icon">📱</div>
        <h1>You're Offline</h1>
        <p>No internet connection detected.<br>Please check your connection and try again.</p>
        <button class="retry-btn" onclick="window.location.reload()">Retry</button>
      </body>
    </html>`,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'employee-sync') {
    event.waitUntil(syncEmployeeData());
  }
});

async function syncEmployeeData() {
  // Implement background sync logic here
  console.log('📊 Syncing employee data in background...');
}

// Push notifications (if needed)
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/assets/appicon.png',
    badge: '/assets/appicon.png',
    tag: data.tag || 'cubs-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/assets/appicon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'CUBS EMS', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('🎯 CUBS EMS Service Worker loaded successfully!'); 