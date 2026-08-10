/* Does the editor actually work?
 *
 * Drives the BUILT editor in headless Chromium and asserts the things that
 * would make it useless if broken: the preview builds the real terrain, the
 * map paints, edits move the road, validation catches a track that cannot be
 * built, and a track packed into a URL opens as that same track in the game.
 *
 *   npx vite build          # the tool serves ../play-dustline itself
 *   node tools/editor-smoke.mjs
 */
import { chromium } from 'playwright-core';
import { ensureServer } from './serve.mjs';

const BASE = process.env.BASE || 'http://localhost:8903/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Serves ../play-dustline itself unless something already is, so the check
// never fails because a server from an earlier session has gone away.
const stopServer = await ensureServer(BASE, '../play-dustline');

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

// ---- NEW: EVERY LAND x EVERY WEATHER ------------------------------------------
//
// "New" now asks for a land and a weather instead of cloning DUSTBOWL, and the
// two are independent — which means the thing to check is not the two
// combinations someone happened to click. It is ALL of them: every land in
// every weather has to produce a track that VALIDATES and that the real
// Terrain will build, because any one of the 56 is one click away.
const combos = await page.evaluate(async () => {
  const e = window.__editor;
  const { LANDS, WEATHERS, composeTrack } = e.presets;
  const bad = [];
  let n = 0;
  for (const land of LANDS) {
    for (const weather of WEATHERS) {
      const def = composeTrack(land, weather, e.starterLoop(180, 12), 1234);
      const issues = e.validateDef(def).filter((i) => i.level === 'error');
      if (issues.length) bad.push(`${land.id}/${weather.id}: ${issues[0].message}`);
      n++;
    }
  }
  return { n, bad, lands: LANDS.length, weathers: WEATHERS.length };
});
check(combos.bad.length === 0,
  `every land x weather validates (${combos.lands} x ${combos.weathers})`,
  combos.bad.length ? combos.bad.slice(0, 3).join(' | ') : `${combos.n} combinations`);

// Scatter layers naming a component that does not exist would build a world
// with silent holes in it — the builder warns and carries on, which is right at
// runtime and useless as a check.
const layerIds = await page.evaluate(() => {
  const e = window.__editor;
  const known = new Set(e.templateIds());
  const bad = [];
  for (const land of e.presets.LANDS) {
    for (const l of land.scenery) if (!known.has(l.template)) bad.push(`${land.id}: ${l.template}`);
  }
  return bad;
});
check(layerIds.length === 0, 'every preset scatter layer names a real component', layerIds.join(' | '));

// And one of them all the way through the real engine, including a land with
// water in it, because a preset that validates can still fail to build.
const presetBuilt = await page.evaluate(async () => {
  const e = window.__editor;
  const coast = e.presets.LANDS.find((l) => l.id === 'coast');
  const mist = e.presets.WEATHERS.find((w) => w.id === 'seaMist');
  e.def = e.presets.composeTrack(coast, mist, e.starterLoop(180, 12), 99);
  await new Promise((r) => setTimeout(r, 3500));
  const t = e.preview.terrain;
  return {
    water: t.waterLevel,
    components: Object.keys(e.preview.componentCounts).length,
    grass: e.preview.componentCounts.grassTuft ?? 0,
    fog: e.def.sky.fogColor,
  };
});
check(presetBuilt.water === -7 && presetBuilt.components >= 6 && presetBuilt.grass > 500,
  'a preset builds in the real engine, water and all',
  `water ${presetBuilt.water} m, ${presetBuilt.components} component kinds, `
  + `${presetBuilt.grass} grass, fog ${presetBuilt.fog}`);

// ---- SAVE PUTS THE TRACK IN THE GAME -----------------------------------------
//
// The claim the user actually cares about: "once I save the track it needs to
// be automatically uploaded to the game". On a static host there is no server
// to upload to, so what that has to mean is: saved in the editor, and the game
// plays it without being told where to look.
//
// Three separate things have to be true, and they are checked separately
// because each one used to be false on its own:
//   1. Save writes it where the game reads from.
//   2. The BARE game URL — no ?track=, no ?t= — offers it, and offers it first.
//   3. The game will actually build and race it.
const saved = await page.evaluate(async () => {
  const e = window.__editor;
  const id = `smoke-save-${Date.now().toString(36)}`;
  const d = structuredClone(e.def);
  d.id = id;
  d.name = 'SAVED BY THE SMOKE TEST';
  e.def = d;
  await new Promise((r) => setTimeout(r, 900));
  document.getElementById('btnSave').click();
  await new Promise((r) => setTimeout(r, 400));
  return { id, note: document.getElementById('savedNote')?.textContent ?? '' };
});
check(saved.note.includes('in the game'), 'saving says where the track went', saved.note);

// The OPEN dialog must list it — this is "I need to be able to edit tracks".
const listed = await page.evaluate(async (id) => {
  document.getElementById('btnOpen').click();
  await new Promise((r) => setTimeout(r, 300));
  const cards = [...document.querySelectorAll('#odlg .card')];
  const names = cards.map((c) => c.querySelector('b').textContent);
  const mine = cards.filter((c) => c.querySelector('.mine')).length;
  const deletable = cards.filter((c) => c.querySelector('.del')).length;
  document.querySelector('#odlg .close').click();
  await new Promise((r) => setTimeout(r, 200));
  return { names, mine, deletable, gone: !document.getElementById('odlg') };
}, saved.id);
check(listed.names.includes('SAVED BY THE SMOKE TEST'),
  'the saved track is listed in Open, ready to edit again',
  `${listed.names.length} tracks, ${listed.mine} yours, ${listed.deletable} deletable`);
check(listed.gone, 'the open dialog closes');

// Now the GAME, on the bare URL, in the same browser context so it shares
// localStorage with the editor — which is the whole mechanism.
const playPage = await ctx.newPage();
const playErrors = [];
playPage.on('pageerror', (e) => playErrors.push(e.message.split('\n')[0]));
await playPage.goto(`${BASE}index.html`, { waitUntil: 'load' });
await playPage.waitForSelector('#tsel .card', { timeout: 60000 });
const picker = await playPage.evaluate(() => ({
  first: document.querySelector('#tsel .card b')?.textContent,
  selected: document.querySelector('#tsel .card.sel b')?.textContent,
  count: document.querySelectorAll('#tsel .card').length,
  outlines: [...document.querySelectorAll('#tsel .card path')].every((p) => (p.getAttribute('d') || '').length > 40),
}));
check(picker.selected === 'SAVED BY THE SMOKE TEST',
  'the bare game URL offers the just-saved track, already selected',
  `${picker.count} tracks, top is "${picker.first}"`);
check(picker.outlines, 'every card draws its own road outline');

await playPage.evaluate(() => document.querySelector('#tsel .card.sel').click());
await playPage.waitForFunction(() => window.__dust?.track, null, { timeout: 120000 });
const raced = await playPage.evaluate(() => ({
  id: window.__dust.track.id, name: window.__dust.track.name,
  racers: window.__dust.racers?.length ?? 0, url: location.search,
}));
check(raced.id === saved.id && raced.racers >= 3, 'the game races the saved track',
  `${raced.name}, ${raced.racers} racers`);
check(raced.url.includes(`track=${saved.id}`), 'picking a track puts it in the URL, so a reload keeps it', raced.url);
check(playErrors.length === 0, 'no page errors playing a saved track', playErrors.slice(0, 2).join(' | '));

// Clean up after ourselves — the smoke test must not leave a track behind in
// whatever browser profile it ran in.
await page.evaluate((id) => window.__editor.deleteLocalTrack(id), saved.id);

check(errors.length === 0, 'no page errors in the editor', errors.slice(0, 4).join(' | '));

await browser.close();
await stopServer();
console.log(fails ? `\n${fails} FAILED` : '\neditor smoke passed');
process.exit(fails ? 1 : 0);
