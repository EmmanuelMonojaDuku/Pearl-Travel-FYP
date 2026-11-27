/* Pearl Travel service worker.
 * - App shell and built assets: cached so the app opens with no connection.
 * - Public guidance (rules snapshot, approved knowledge, QR public key): network first, cached copy when offline.
 * - Everything else under /api (accounts, passes, officer and admin data): never cached, always live.
 */
const VERSION = 'pt-v1';
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const GUIDANCE = `${VERSION}-guidance`;
const PUBLIC_GET = [/^\/api\/v1\/rules\/snapshot/, /^\/api\/v1\/assistant\/knowledge/, /^\/api\/v1\/qr\/public-key/];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icon-192.png', '/favicon.png', '/pearl-travel-logo.png'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheName, fallbackKey) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(fallbackKey || request, fresh.clone());
    return fresh;
  } catch (err) {
    const hit = await cache.match(fallbackKey || request);
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const fresh = await fetch(request);
  if (fresh.ok) cache.put(request, fresh.clone());
  return fresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    // Web fonts are safe to keep; nothing else cross-origin is touched.
    if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) event.respondWith(cacheFirst(request, ASSETS).catch(() => Response.error()));
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    if (PUBLIC_GET.some((re) => re.test(url.pathname))) event.respondWith(networkFirst(request, GUIDANCE));
    return; // private API traffic is never cached
  }
  if (url.pathname.startsWith('/videos/')) return; // large media streams straight from the network
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL, '/').catch(() => caches.match('/')));
    return;
  }
  if (url.pathname.startsWith('/assets/') || /\.(png|svg|webmanifest|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSETS));
  }
});
