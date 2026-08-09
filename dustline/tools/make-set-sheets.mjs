/* Renders one contact sheet per component category into `docs/sets/`.
 *
 * WHY THIS IS A TOOL AND NOT A FOLDER OF PNGs SOMEBODY MADE ONCE.
 * COMPONENTS.md lists 34 components in a table. A table tells you a component
 * exists; it does not tell you a barn is nine metres wide, or that a marshal
 * post is chest height on a car. Pictures do — and a picture made by hand is
 * accurate on the day it is made and quietly wrong forever after. These are
 * rendered by the real engine from whatever is in `src/world/props/` right now,
 * so they cannot describe a library that no longer exists.
 *
 * Every choice here is measured rather than fixed, because a set sheet has one
 * job — showing you how big things are — and every constant that gets guessed
 * breaks exactly that job:
 *
 *   - SPACING comes from each component's own bounding box. A constant step
 *     either overlaps the 26 m pit building or strands the 0.4 m cone half a
 *     screen away.
 *   - THE CROP comes from the set's measured height. A fixed frame makes the
 *     debris sheet mostly sky and decapitates the water tower.
 *   - THE CAMERA DISTANCE is solved from the row width and the preview's own
 *     field of view, so every sheet is framed the same way regardless of how
 *     many components a category has.
 *
 *   npx vite build          # the tool serves ../play-dustline itself
 *   node tools/make-set-sheets.mjs
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { ensureServer } from './serve.mjs';

const BASE = process.env.BASE || 'http://localhost:8903/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Serves ../play-dustline itself unless something already is, so the check
// never fails because a server from an earlier session has gone away.
const stopServer = await ensureServer(BASE, '../play-dustline');
const OUT = process.env.OUT || 'docs/sets';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', (e) => console.log('ERR', e.message.split('\n')[0]));

await page.goto(`${BASE}editor.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__editor?.preview?.terrain, null, { timeout: 90000 });
await page.evaluate(() => { document.getElementById('views').className = 'd3-only'; });

const categories = await page.evaluate(() => {
  const e = window.__editor;
  const by = {};
  for (const id of e.templateIds()) {
    const t = e.getTemplate(id);
    (by[t.category] ??= []).push({ id, name: t.name, scale: t.authoring.defaultScale });
  }
  for (const list of Object.values(by)) list.sort((a, b) => a.name.localeCompare(b.name));
  return by;
});

const manifest = [];

for (const [cat, items] of Object.entries(categories).sort()) {
  const info = await page.evaluate(async ({ cat, items }) => {
    const e = window.__editor;
    const base = structuredClone(e.def);

    base.id = `set-${cat}`;
    base.name = `SET — ${cat.toUpperCase()}`;
    base.scenery = [];
    // Dead flat land: no octaves and no ramps means y = 0 everywhere except
    // where the road profile pulls it, which gives a level shelf to line things
    // up on without inventing a new kind of track.
    base.terrain = { ...base.terrain, octaves: [], ramps: [] };
    base.start = { ...base.start, padRadius: 18, tuningRings: false };
    // Uniform ground. Without this the sheet is shot wherever the search lands,
    // which the first version discovered was inside the snow zone — white
    // components on white ground, which is a catalogue nobody can read.
    base.surfaces = { ...base.surfaces, zones: [], bands: [], offroad: 'gravel' };
    base.sky = {
      ...base.sky, clouds: 5,
      mountains: { count: 18, radius: 900, height: 55, snowline: -1 },
    };
    // THE MARINE SHEET IS SHOT AFLOAT. Everything in that category either
    // floats or stands at the edge of the water, and a rowboat photographed on
    // a lawn shows you the two inches of gunwale that clear the grass rather
    // than the boat. The land here is dead flat at y = 0, so a water level a
    // hair above it floods the whole shelf — the boats then sit at their own
    // waterline, which is the only height any of them are ever seen at.
    //
    // `base` is cloned from whatever the preview is showing, which is the
    // PREVIOUS category's sheet — so the water has to be cleared explicitly or
    // every set after the marine one is shot underwater.
    delete base.water;
    if (cat === 'marine') {
      // A QUARTER OF A METRE, not two centimetres. The first attempt put the
      // surface a hair above the flat shelf and the sheet came back mottled:
      // over 900 m of coplanar geometry viewed nearly edge-on, a 2 cm gap is
      // inside the depth buffer's resolution and the plane and the ground
      // fight. 25 cm is out of the fight and still shallow enough to leave the
      // quayside components — pots, bollards, the jetty — standing dry-ish in
      // the shallows, which is where they belong.
      base.water = { level: 0.25, color: '#2f7f99', deep: '#0f3348', deepAt: 1, opacity: 0.86 };
    }

    // open ground, well clear of the road
    const t0 = e.preview.terrain;
    let spot = { x: 0, z: 250 };
    let bestD = -1;
    for (let z = -300; z <= 300; z += 20) {
      for (let x = -240; x <= 240; x += 20) {
        const d = t0.distToRoad(x, z);
        if (d > bestD) { bestD = d; spot = { x, z }; }
      }
    }

    // spacing from each component's own measured footprint
    const GAP = 4;
    const widths = items.map((it) => {
      const t = e.getTemplate(it.id);
      let w = 1;
      for (const part of t.build()) {
        part.geometry.computeBoundingBox();
        const bb = part.geometry.boundingBox;
        if (bb) w = Math.max(w, (bb.max.x - bb.min.x) * it.scale, (bb.max.z - bb.min.z) * it.scale);
        part.geometry.dispose();
      }
      return w;
    });
    const CAR_W = 2.2;
    const total = CAR_W + widths.reduce((a, b) => a + b, 0) + GAP * items.length;
    const x0 = spot.x - total / 2;
    let cursor = x0 + CAR_W;
    base.props = items.map((it, i) => {
      cursor += GAP + widths[i] / 2;
      const x = Math.round(cursor * 10) / 10;
      cursor += widths[i] / 2;
      return { template: it.id, x, z: spot.z, rot: 0.5, scale: it.scale };
    });

    e.def = base;
    await new Promise((r) => setTimeout(r, 2600));

    // the car is the scale reference and belongs IN the row, not beside it
    e.preview.carMarker.position.set(x0 + CAR_W / 2, 0.45, spot.z);

    const r = e.preview.renderer.domElement.getBoundingClientRect();
    const halfW = Math.atan(Math.tan((55 * Math.PI) / 360) * (r.width / Math.max(1, r.height)));
    const o = e.preview.orbit;
    o.target.set(spot.x, 2.2, spot.z);
    o.dist = Math.max(24, (total / 2) / Math.tan(halfW) * 1.12);
    o.pitch = 0.19;
    o.yaw = 0.05;

    let maxH = 1;
    for (const it of items) {
      const t = e.getTemplate(it.id);
      for (const part of t.build()) {
        part.geometry.computeBoundingBox();
        maxH = Math.max(maxH, (part.geometry.boundingBox?.max.y ?? 1) * it.scale);
        part.geometry.dispose();
      }
    }
    return { spot, span: total, x0, maxH: Math.round(maxH * 10) / 10, dist: Math.round(o.dist) };
  }, { cat, items });

  await page.waitForTimeout(1400);

  // Project the set's bounding box into screen space and clip to it. Note the
  // clip must be PAGE-absolute and passed to page.screenshot —
  // elementHandle.screenshot ignores `clip` entirely, which silently returned
  // the whole canvas the first time.
  const clip = await page.evaluate(({ spot, span, x0, maxH }) => {
    const e = window.__editor;
    const r = e.preview.renderer.domElement.getBoundingClientRect();
    const pts = [
      e.preview.project(x0 - 3, 0, spot.z),
      e.preview.project(x0 + span + 3, 0, spot.z),
      e.preview.project(spot.x, maxH + 2, spot.z),
      e.preview.project(spot.x, -1.5, spot.z),
    ].filter(Boolean);
    if (pts.length < 4) return null;
    const xs = pts.map((p) => p.sx), ys = pts.map((p) => p.sy);
    const x = Math.max(0, Math.min(...xs));
    const y = Math.max(0, Math.min(...ys));
    return {
      x: Math.round(r.left + x), y: Math.round(r.top + y),
      width: Math.max(64, Math.round(Math.min(r.width - x, Math.max(...xs) - x))),
      height: Math.max(48, Math.round(Math.min(r.height - y, Math.max(...ys) - y))),
    };
  }, info);

  const file = `${OUT}/${cat}.png`;
  if (clip) await page.screenshot({ path: file, clip });
  else await (await page.$('#preview3d')).screenshot({ path: file });

  manifest.push({ cat, count: items.length, names: items.map((i) => i.name), maxH: info.maxH });
  console.log(`${file} — ${items.length} components, tallest ${info.maxH} m, camera ${info.dist} m`);
}

console.log('\nleft to right in each sheet (after the car):');
for (const m of manifest) console.log(`  ${m.cat.padEnd(10)} ${m.names.join(' · ')}`);

await browser.close();
await stopServer();
