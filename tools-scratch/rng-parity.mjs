/* DOES THE FIRST BUILD DRAW THE SAME SEEDED STREAM AS A REBUILD?
 *
 * The instrument that found the cold-cache determinism bug: every page-
 * lifetime cache that lazily constructs INSIDE the first seeded build (the
 * noise tile's 65,536 dither draws, PROP_ASSETS, three's own Sprite
 * geometry) consumes draws that no rebuild repeats — same seed, different
 * world, and the editor's CLEAR ALL "restores" a forest that never existed.
 *
 * It traps every install of a seeded generator (rng.js assigns Math.random),
 * records the call-site SEQUENCE of the boot build and of one rebuild, and
 * prints the first index where they part. Healthy output: divergeAt equals
 * both lengths. The fix it verifies: all page-lifetime caches pre-warm at
 * module load (foot of textures.js and track.js), never mid-build.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
await page.addInitScript(() => {
  let cur = Math.random;
  window.__rngLog = [];
  window.__phase = 'boot';
  Object.defineProperty(Math, 'random', {
    configurable: true,
    get() { return cur; },
    set(fn) {
      if (fn.name !== '') { cur = fn; return; }
      const entry = { phase: window.__phase, seq: [] };
      window.__rngLog.push(entry);
      cur = function __wrap() {
        if (entry.seq.length < 40000) {
          const s = (new Error().stack || '').split('\n')[2] || '?';
          entry.seq.push(s.replace(/.*\//, '').replace(/\)?$/, ''));
        }
        return fn();
      };
    },
  });
});
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
const r = await page.evaluate(() => {
  const g = window.__game;
  g.showMenu();
  window.__phase = 'rebuild';
  g.rebuildWorld();
  const boot = window.__rngLog.find((e) => e.phase === 'boot').seq;
  const rb = window.__rngLog.find((e) => e.phase === 'rebuild').seq;
  let i = 0;
  while (i < boot.length && i < rb.length && boot[i] === rb[i]) i++;
  return { divergeAt: i, bootLen: boot.length, rbLen: rb.length,
    bootAround: boot.slice(Math.max(0, i - 4), i + 24),
    rbAround: rb.slice(Math.max(0, i - 4), i + 24) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
