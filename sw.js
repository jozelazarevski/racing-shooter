/* IGNITE RALLY offline service worker.
 *
 * The whole game is static: an HTML file, ten ES modules, a vendored three.js,
 * two fonts and the world-card art. That means it can run with the radio off
 * entirely — on a plane, in a tunnel, anywhere — provided every one of those
 * files is already in the cache before the network disappears.
 *
 * Strategy:
 *   - install : precache the complete asset list, so one visit on wifi arms
 *               the game for a flight. Nothing is left to be fetched later.
 *   - fetch   : cache-first for our own files. Offline is the normal case,
 *               not the error case, so we never wait on the network when we
 *               already hold the bytes.
 *   - activate: drop caches from older releases and take over open tabs.
 *
 * CACHE is bumped by the release version. Bump it whenever ?v= in index.html
 * is bumped, or phones will keep serving the previous build forever.
 */
const CACHE = 'ignite-rally-r33';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/offline.js',
  './src/traffic.js',
  './src/main.js',
  './src/audio.js',
  './src/choppers.js',
  './src/hud.js',
  './src/input.js',
  './src/particles.js',
  './src/textures.js',
  './src/track.js',
  './src/vehicles.js',
  './src/weapons.js',
  './lib/three.module.min.js',
  './lib/postprocessing/EffectComposer.js',
  './lib/postprocessing/MaskPass.js',
  './lib/postprocessing/OutputPass.js',
  './lib/postprocessing/Pass.js',
  './lib/postprocessing/RenderPass.js',
  './lib/postprocessing/ShaderPass.js',
  './lib/postprocessing/UnrealBloomPass.js',
  './lib/shaders/CopyShader.js',
  './lib/shaders/LuminosityHighPassShader.js',
  './lib/shaders/OutputShader.js',
  './assets/fonts/baloo2-latin.woff2',
  './assets/fonts/luckiestguy-latin.woff2',
  ...Array.from({ length: 21 }, (_, i) => `./assets/previews/w${i + 1}.jpg`),
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Add individually: one 404 in addAll() rejects the whole install and
    // leaves the player with no offline copy at all. A missing world preview
    // must not cost us the game.
    const results = await Promise.allSettled(ASSETS.map((u) => cache.add(u)));
    const failed = results
      .map((r, i) => (r.status === 'rejected' ? ASSETS[i] : null))
      .filter(Boolean);
    if (failed.length) console.warn('[sw] not cached:', failed);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE && k.startsWith('ignite-rally-'))
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never proxy third parties

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // ignoreSearch so the ?v=rNN cache-buster still hits the cached module
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch (err) {
      // Offline and not precached: for a navigation, hand back the shell so
      // the game still opens instead of showing the browser's dinosaur.
      if (req.mode === 'navigate') {
        const shell = await cache.match('./index.html', { ignoreSearch: true });
        if (shell) return shell;
      }
      throw err;
    }
  })());
});

// The page asks "am I fully armed for a flight?" — answer with the count of
// precached entries so the menu can show an honest READY / PARTIAL badge.
self.addEventListener('message', async (e) => {
  if (e.data !== 'ignite-offline-status') return;
  const cache = await caches.open(CACHE);
  const have = await cache.keys();
  e.source?.postMessage({
    type: 'ignite-offline-status',
    cached: have.length,
    total: ASSETS.length,
    ready: have.length >= ASSETS.length - 2, // tolerate a stray preview
  });
});
