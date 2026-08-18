// Service Worker Proxy Interceptor (SW-Proxy / WSM)
// Intercepts and de-restricts requests, strips framing constraints, and spoofs browser identity

const CACHE_NAME = 'wsm-stealth-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept proxy requests with prefix /proxy-sub/
  if (url.pathname.startsWith('/proxy-sub/')) {
    const rawTarget = url.searchParams.get('url');
    if (!rawTarget) return;

    event.respondWith(
      (async () => {
        try {
          const proxiedUrl = `/api/proxy?url=${encodeURIComponent(rawTarget)}`;
          const response = await fetch(proxiedUrl, {
            headers: {
              'X-WSM-Intercept': 'true',
              'X-Spoofed-Worker': 'active',
            },
          });

          const newHeaders = new Headers(response.headers);
          newHeaders.set('Access-Control-Allow-Origin', '*');
          newHeaders.delete('X-Frame-Options');
          newHeaders.delete('Content-Security-Policy');

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        } catch (err) {
          return new Response('WSM Proxy Interception Error: ' + err.message, {
            status: 502,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      })()
    );
  }
});
