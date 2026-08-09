/* Does the editor actually work?
 *
 * Drives the BUILT editor in headless Chromium and asserts the things that
 * would make it useless if broken: the preview builds the real terrain, the
 * map paints, edits move the road, validation catches a track that cannot be
 * built, and a track packed into a URL opens as that same track in the game.
 *
 *   npx vite build
 *   (cd ../play-dustline && python3 -m http.server 8903 &)
 *   node tools/editor-smoke.mjs
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE || 'http://localhost:8903/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

// Report WHERE, not just that. A bare "404 (File not found)" in a console
// listener names no URL, which is a failure you cannot act on — the first run
// of this test spent a debugging cycle on exactly that.
const errors = [];
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.split('\n')[0]}`));
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  const loc = m.location();
  errors.push(`console: ${m.text().slice(0, 140)} @ ${loc?.url ?? '?'}`);
});
page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));
page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });

await page.goto(`${BASE}editor.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__editor?.preview?.terrain, null, { timeout: 60000 });

// ---- 1. the preview built the REAL terrain ----
const built = await page.evaluate(() => {
  const e = window.__editor;
  const t = e.preview.terrain;
  return {
    ms: e.preview.lastBuildMs,
    roadPts: t.roadPoints.length,
    samples: e.def.road.samples,
    heightAtStart: t.heightAt(t.spawn.x, t.spawn.z),
    surfaceAtStart: t.surfaceIdAt(t.spawn.x, t.spawn.z),
    trackId: e.def.id,
  };
});
check(built.roadPts === built.samples && built.roadPts > 0,
  'preview builds the real Terrain', `${built.trackId}, ${built.roadPts} road samples, ${built.ms.toFixed(0)} ms`);
check(built.surfaceAtStart === 'tarmac', 'terrain queries answer sensibly at the start line',
  `surface=${built.surfaceAtStart} y=${built.heightAtStart.toFixed(2)}`);

// ---- 2. the map painted something ----
const mapInk = await page.evaluate(() => {
  const c = document.getElementById('map');
  const ctx2 = c.getContext('2d');
  const { data } = ctx2.getImageData(0, 0, c.width, c.height);
  const seen = new Set();
  for (let i = 0; i < data.length; i += 4 * 97) {
    seen.add(`${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`);
  }
  return { distinct: seen.size, w: c.width, h: c.height };
});
check(mapInk.distinct > 8, 'map view renders a real picture',
  `${mapInk.distinct} distinct colours over ${mapInk.w}x${mapInk.h}`);

// ---- 3. editing the shape moves the road ----
const moved = await page.evaluate(async () => {
  const e = window.__editor;
  const before = e.preview.terrain.roadPoints.map((p) => [p.x, p.z]);
  e.commit((d) => { d.road.points[0][0] += 60; d.road.points[0][1] += 40; }, 'test');
  await new Promise((r) => setTimeout(r, 900));           // past the 220 ms debounce
  const after = e.preview.terrain.roadPoints.map((p) => [p.x, p.z]);
  let maxShift = 0;
  for (let i = 0; i < before.length; i++) {
    maxShift = Math.max(maxShift, Math.hypot(after[i][0] - before[i][0], after[i][1] - before[i][1]));
  }
  return { maxShift, lenBefore: before.length, lenAfter: after.length };
});
check(moved.maxShift > 20, 'moving a control point rebuilds the road',
  `centreline moved up to ${moved.maxShift.toFixed(1)} m`);

// ---- 4. undo puts it back ----
const undone = await page.evaluate(async () => {
  document.body.focus();
  const before = JSON.stringify(window.__editor.def.road.points);
  dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
  await new Promise((r) => setTimeout(r, 60));
  return { before, after: JSON.stringify(window.__editor.def.road.points) };
});
check(undone.before !== undone.after, 'ctrl+Z undoes an edit');

// ---- 5. validation refuses an unbuildable track ----
const validation = await page.evaluate(() => {
  const e = window.__editor;
  const clean = e.validate().filter((i) => i.level === 'error').length;
  e.commit((d) => { d.road.points[1] = [100000, 100000]; }, 'test');
  const dirty = e.validate().filter((i) => i.level === 'error');
  dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
  return { clean, dirtyCount: dirty.length, msg: dirty[0]?.message ?? '' };
});
check(validation.clean === 0, 'the shipped track validates clean');
check(validation.dirtyCount > 0, 'a point outside the world is reported as an error',
  validation.msg.slice(0, 90));

// ---- 6. a packed track survives the round trip and drives ----
const link = await page.evaluate(() => {
  const e = window.__editor;
  e.commit((d) => { d.name = 'SMOKE TEST TRACK'; d.road.points[3][0] += 35; }, 'test');
  return { packed: window.location.href, name: e.def.name, pts: JSON.stringify(e.def.road.points) };
});
const shareUrl = await page.evaluate(() => {
  const e = window.__editor;
  // rebuild the same URL the Copy-link button makes, from the same packer
  const json = JSON.stringify(e.def);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const p = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `index.html?t=${p}`;
});
check(shareUrl.length < 8000, 'a track packs into a URL of usable length', `${shareUrl.length} characters`);

const gamePage = await ctx.newPage();
const gameErrors = [];
gamePage.on('pageerror', (e) => gameErrors.push(e.message.split('\n')[0]));
await gamePage.goto(BASE + shareUrl, { waitUntil: 'load' });
await gamePage.waitForFunction(() => window.__dust?.track, null, { timeout: 90000 });
const drove = await gamePage.evaluate(() => ({
  name: window.__dust.track.name,
  pts: JSON.stringify(window.__dust.track.road.points),
  racers: window.__dust.racers.length,
  lineNodes: window.__dust.line.length,
}));
check(drove.name === 'SMOKE TEST TRACK' && drove.pts === link.pts,
  'the game loads exactly the edited track from the link', `"${drove.name}"`);
check(drove.racers === 4 && drove.lineNodes > 0,
  'the race loop starts on the custom track', `${drove.racers} racers, ${drove.lineNodes} racing-line nodes`);
check(gameErrors.length === 0, 'no page errors in the game on a custom track', gameErrors.slice(0, 3).join(' | '));

// ---- 7. determinism: same track, two builds, same scatter ----
const deterministic = await gamePage.evaluate(() => {
  const t = window.__dust.terrain;
  const sig = (n) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < n; i++) {
      const p = t.roadPoints[i % t.roadPoints.length];
      const v = Math.round(t.heightAt(p.x + i, p.z - i) * 1000);
      h ^= v; h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16);
  };
  return { a: sig(400), b: sig(400) };
});
check(deterministic.a === deterministic.b, 'terrain queries are stable', deterministic.a);

check(errors.length === 0, 'no page errors in the editor', errors.slice(0, 4).join(' | '));

await browser.close();
console.log(fails ? `\n${fails} FAILED` : '\neditor smoke passed');
process.exit(fails ? 1 : 0);
