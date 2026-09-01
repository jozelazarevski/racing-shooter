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
const CACHE = 'ignite-rally-r312';

// ---- CORE vs EXTRA ---------------------------------------------------------
// CORE is everything the game needs to RUN with the radio off: the shell, the
// module graph, three.js and the two fonts. The page has already downloaded all
// of it by the time the worker installs, so caching it is nearly free — the
// requests come back out of the HTTP cache.
//
// EXTRA is the 21 world-preview jpgs: 1.15 MB, 40 % of everything the game
// ships, and pure menu decoration. Precaching those on install meant a first
// visit paid for art the player had not looked at yet. They are now stored only
// when asked for, in the background — see 'ignite-store-extras' below.
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/offline.js',
  './src/driving.js',
  './driving.json',
  './src/telemetry.js',
  './src/route.js',
  './src/traffic.js',
  './src/main.js',
  './src/audio.js',
  './src/choppers.js',
  './src/hostiles.js',
  './src/hud.js',
  './src/input.js',
  './src/particles.js',
  './src/textures.js',
  './src/track.js',
  './src/editor.js',
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
  // THE HOME-SCREEN ICONS BELONG IN THE PRECACHE TOO. The manifest and
  // iOS's apple-touch-icon both point at these, and an installed app that
  // cannot serve its own icon offline is the one asset the launcher asks
  // for when there is no radio. Two files, ~320 KB, fetched once.
  './assets/icon-192.png',
  './assets/icon-512.png',
];

// 32, and read from one place: this list was hardcoded at 21 when the roster
// was 21, and the eleven worlds added since shipped with previews the offline
// cache never carried.
const EXTRA = Array.from({ length: 58 }, (_, i) => `./assets/previews/w${i + 1}.jpg`);
const ASSETS = [...CORE, ...EXTRA];   // the full offline set, for status counts

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Add individually: one 404 in addAll() rejects the whole install and
    // leaves the player with no offline copy at all. A missing file must not
    // cost us the game.
    const results = await Promise.allSettled(CORE.map((u) => cache.add(u)));
    const failed = results
      .map((r, i) => (r.status === 'rejected' ? CORE[i] : null))
      .filter(Boolean);
    if (failed.length) console.warn('[sw] not cached:', failed);
    self.skipWaiting();
  })());
});

/** Store the optional art, ONE FILE AT A TIME and reporting as it goes.
 *  Sequential on purpose: 21 parallel image fetches is exactly the burst that
 *  made a first load feel long, and nobody is waiting on this. */
async function storeExtras(source) {
  const cache = await caches.open(CACHE);
  let done = 0;
  for (const url of EXTRA) {
    try {
      if (!(await cache.match(url, { ignoreSearch: true }))) await cache.add(url);
    } catch (err) { /* a missing preview must never abort the run */ }
    done++;
    source?.postMessage({ type: 'ignite-store-progress', done, total: EXTRA.length });
  }
}

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
  if (e.data === 'ignite-store-extras') {
    // ONE call, kept alive through waitUntil where the event supports it.
    // Calling it separately as well (as the first cut did) runs the whole
    // sequential store twice and doubles the progress messages.
    const job = storeExtras(e.source);
    e.waitUntil?.(job);
    return;
  }
  if (e.data !== 'ignite-offline-status') return;
  const cache = await caches.open(CACHE);
  const have = await cache.keys();
  // `playable` is the honest offline answer: the game RUNS once CORE is in.
  // `ready` means the world art is stored too — nice to have, not required.
  const n = have.length;
  e.source?.postMessage({
    type: 'ignite-offline-status',
    cached: n,
    total: ASSETS.length,
    core: CORE.length,
    playable: n >= CORE.length - 1,          // tolerate one stray
    ready: n >= ASSETS.length - 2,
  });
});
