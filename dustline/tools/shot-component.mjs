/* CLOSE-UP OF ONE COMPONENT, IN THE REAL ENGINE.
 *
 * The contact sheets in `docs/sets` answer "how big is it" — nine components in
 * a row, framed so a car reads as a car. That framing is useless for the other
 * question, "what is it made of": at set-sheet distance a hand-painted masonry
 * tile and a flat grey fill are the same handful of pixels, which is exactly
 * how the stale marine sheet went unnoticed for as long as it did.
 *
 * So this frames ONE component to fill the shot. It exists because texture work
 * cannot be verified any other way — you cannot review a material you cannot
 * see, and "it should look like stone now" is not a check.
 *
 *   npx vite build
 *   node tools/shot-component.mjs quayWall crate cone
 *   node tools/shot-component.mjs --out /tmp/shots quayWall
 *   node tools/shot-component.mjs --water quayWall     # flood it, to see a face
 *                                                      # that is buried on land
 *
 * Writes <out>/<id>.png, default `docs/close`.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { ensureServer } from './serve.mjs';

const argv = process.argv.slice(2);
const outIdx = argv.indexOf('--out');
const OUT = outIdx >= 0 ? argv[outIdx + 1] : 'docs/close';
const WATER = argv.includes('--water');
// look-down angle in radians; the default matches the set sheets. Pass a
// steeper one to judge a roof or an awning — the chase camera looks DOWN, so
// the top of a canopy is what a player actually sees of it.
const pitchIdx = argv.indexOf('--pitch');
const PITCH_ARG = pitchIdx >= 0 ? Number(argv[pitchIdx + 1]) : 0.26;
const ids = argv.filter((a, i) => !a.startsWith('--') && i !== outIdx + 1 && i !== pitchIdx + 1);
if (!ids.length) {
  console.error('usage: node tools/shot-component.mjs [--out DIR] <componentId>...');
  process.exit(2);
}

const BASE = process.env.BASE || 'http://localhost:8904/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const stopServer = await ensureServer(BASE, '../play-dustline');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
page.on('pageerror', (e) => console.log('ERR', e.message.split('\n')[0]));

await page.goto(`${BASE}editor.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__editor?.preview?.terrain, null, { timeout: 90000 });
await page.evaluate(() => { document.getElementById('views').className = 'd3-only'; });

for (const id of ids) {
  const info = await page.evaluate(async ({ id, water, pitch }) => {
    const e = window.__editor;
    const t = e.getTemplate(id);
    if (!t) return { error: `no component "${id}"` };
    const base = structuredClone(e.def);
    base.id = `close-${id}`;
    base.name = `CLOSE — ${id}`;
    base.scenery = [];
    base.props = [];
    // Dead flat, one ground type, no zones — same reasoning as the set sheets:
    // a component photographed wherever the search happens to land is a
    // component photographed against whatever colour happens to be there.
    base.terrain = { ...base.terrain, octaves: [], ramps: [] };
    base.surfaces = { ...base.surfaces, zones: [], bands: [], offroad: 'gravel' };
    base.start = { ...base.start, padRadius: 18, tuningRings: false };
    delete base.water;
    // Anything that floats or stands in the shallows is authored against the
    // waterline, so it has to be shot afloat or the shot is of its underside.
    if (water || t.placement === 'water' || t.placement === 'shore') {
      base.water = { level: 0.25, color: '#2f7f99', deep: '#0f3348', deepAt: 1, opacity: 0.86 };
    }

    const t0 = e.preview.terrain;
    let spot = { x: 0, z: 250 }, bestD = -1;
    for (let z = -300; z <= 300; z += 20) {
      for (let x = -240; x <= 240; x += 20) {
        const d = t0.distToRoad(x, z);
        if (d > bestD) { bestD = d; spot = { x, z }; }
      }
    }

    const scale = t.authoring.defaultScale;
    base.props = [{ template: id, x: spot.x, z: spot.z, rot: 0.6, scale }];
    e.def = base;
    await new Promise((r) => setTimeout(r, 2600));

    // measure the thing itself, then frame to it
    let w = 1, hgt = 1;
    for (const part of t.build()) {
      part.geometry.computeBoundingBox();
      const bb = part.geometry.boundingBox;
      if (bb) {
        w = Math.max(w, (bb.max.x - bb.min.x) * scale, (bb.max.z - bb.min.z) * scale);
        hgt = Math.max(hgt, bb.max.y * scale);
      }
      part.geometry.dispose();
    }
    const r = e.preview.renderer.domElement.getBoundingClientRect();
    const halfW = Math.atan(Math.tan((55 * Math.PI) / 360) * (r.width / Math.max(1, r.height)));
    const o = e.preview.orbit;
    o.target.set(spot.x, hgt * 0.45, spot.z);
    // fit the LARGER of width and height, with a small margin
    o.dist = Math.max(3.5, (Math.max(w, hgt) / 2) / Math.tan(halfW) * 1.9);
    o.pitch = pitch;
    o.yaw = 0.7;
    e.preview.carMarker.position.set(spot.x + w / 2 + 2.2, 0.45, spot.z);
    return { w: Math.round(w * 100) / 100, h: Math.round(hgt * 100) / 100, dist: Math.round(o.dist) };
  }, { id, water: WATER, pitch: PITCH_ARG });

  if (info?.error) { console.log(`SKIP  ${id} — ${info.error}`); continue; }
  await page.waitForTimeout(1500);
  // CLIP TO THE PREVIEW CANVAS. A full-page shot is nine tenths editor chrome,
  // and the component — the entire subject — ends up a thumbnail in the corner.
  const clip = await page.evaluate(() => {
    const r = window.__editor.preview.renderer.domElement.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top),
      width: Math.round(r.width), height: Math.round(r.height) };
  });
  await page.screenshot({ path: `${OUT}/${id}.png`, clip });
  console.log(`${OUT}/${id}.png  ${info.w} x ${info.h} m, camera ${info.dist} m`);
}

await browser.close();
await stopServer?.();
