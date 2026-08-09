/* Does the component system actually work, end to end?
 *
 * The claim being tested is not "the palette draws". It is: a component is one
 * file carrying geometry, physical rules and a preview; you can place it from
 * the editor; and the thing you placed exists in the GAME as a real object with
 * the collider its file declared.
 *
 *   npx vite build          # the tool serves ../play-dustline itself
 *   node tools/components-smoke.mjs
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
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

const errors = [];
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.split('\n')[0]}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 140)}`); });
page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`); });

await page.goto(`${BASE}editor.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__editor?.preview?.terrain, null, { timeout: 60000 });
await page.waitForTimeout(1200);

// ---- 1. every component is discovered and previews itself ----
const palette = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.pitem')];
  return {
    count: items.length,
    categories: [...document.querySelectorAll('#palette h4')].map((h) => h.textContent),
    allHaveThumbs: items.every((el) => el.querySelector('img')?.src.startsWith('data:image/png')),
    names: items.map((el) => el.querySelector('span').textContent),
  };
});
check(palette.count >= 8 && palette.allHaveThumbs,
  'every component is discovered and renders its own preview',
  `${palette.count} components in ${palette.categories.length} categories`);
check(palette.categories.length >= 3, 'components are grouped by category', palette.categories.join(', '));

// ---- 2. the scattered world is built from components ----
const scattered = await page.evaluate(() => window.__editor.preview.componentCounts);
check(Object.keys(scattered).length >= 3 && (scattered.pine ?? 0) > 100,
  'scatter layers build through the component system',
  Object.entries(scattered).map(([k, v]) => `${k}=${v}`).join(' '));

// ---- 3. placing a component from the palette ----
const placed = await page.evaluate(async () => {
  const e = window.__editor;
  const before = (e.def.props ?? []).length;
  // the armed-click path, which is what the palette's click handler drives
  document.querySelector('.pitem').click();                 // arm the first component
  const canvas = document.getElementById('map');
  const r = canvas.getBoundingClientRect();
  canvas.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, clientX: r.left + r.width * 0.5, clientY: r.top + r.height * 0.5,
    button: 0, pointerId: 1,
  }));
  await new Promise((res) => setTimeout(res, 1200));
  const list = e.def.props ?? [];
  return { before, after: list.length, last: list[list.length - 1] ?? null };
});
check(placed.after === placed.before + 1 && placed.last,
  'clicking an armed component places it',
  placed.last ? `${placed.last.template} at (${placed.last.x}, ${placed.last.z}) scale ${placed.last.scale}` : '');

// ---- 4. it reaches the preview as real geometry ----
const inPreview = await page.evaluate(async () => {
  const e = window.__editor;
  await new Promise((r) => setTimeout(r, 900));
  const id = e.def.props[e.def.props.length - 1].template;
  return { id, count: e.preview.componentCounts[id] ?? 0 };
});
check(inPreview.count > 0, 'the placed component is built into the preview world',
  `${inPreview.id} instances: ${inPreview.count}`);

// ---- 5. EVERY component builds, previews and can be placed ----
//
// Not a sample. A library is only as good as its worst member, and the whole
// point of components-as-files is that adding one is cheap — which means the
// check has to cover whatever is in the folder today, not a list written when
// the folder had nine things in it.
const sweep = await page.evaluate(async () => {
  const e = window.__editor;
  const ids = e.templateIds();
  const broken = [];
  const thumbs = [];
  for (const id of ids) {
    try {
      const t = e.getTemplate(id);
      const parts = t.build();
      if (!parts.length) broken.push(`${id}: build() returned no parts`);
      for (const part of parts) {
        const pos = part.geometry?.getAttribute?.('position');
        if (!pos || pos.count === 0) broken.push(`${id}/${part.key}: empty geometry`);
        const arr = pos?.array ?? [];
        for (let i = 0; i < arr.length; i++) {
          if (!Number.isFinite(arr[i])) { broken.push(`${id}/${part.key}: NaN in geometry`); break; }
        }
        part.geometry?.dispose?.();
      }
      // physical rule must be answerable at both ends of its own scale range
      for (const s of t.authoring.scale) {
        const shape = t.physics.shape(s);
        if (!shape || !shape.kind) broken.push(`${id}: physics.shape(${s}) returned nothing`);
        if (shape.kind !== 'none') {
          const nums = shape.kind === 'box' ? [...shape.halfExtents, shape.centerY]
            : shape.kind === 'ball' ? [shape.radius, shape.centerY]
              : [shape.halfHeight, shape.radius, shape.centerY];
          if (nums.some((n) => !Number.isFinite(n) || n <= 0)) {
            broken.push(`${id}: physics.shape(${s}) has a non-positive dimension`);
          }
        }
      }
      const url = e.thumbnail(t, 64);
      if (!url.startsWith('data:image/png') || url.length < 400) broken.push(`${id}: no thumbnail`);
      thumbs.push(id);
    } catch (err) {
      broken.push(`${id}: threw ${err.message}`);
    }
  }
  return { ids, broken, thumbs: thumbs.length };
});
check(sweep.ids.length >= 30, 'the library is fully populated', `${sweep.ids.length} components`);
check(sweep.broken.length === 0, 'every component builds valid geometry, physics and a preview',
  sweep.broken.slice(0, 5).join(' | '));

// ---- 6. place one of EVERY component and load them all in the game ----
const placedAll = await page.evaluate(async () => {
  const e = window.__editor;
  const ids = e.templateIds();
  e.commit((d) => {
    // Clear the scatter layers. Without this the map is still full of 260
    // scattered pines and 150 rocks, and the collider count near a placed prop
    // picks up THEIR colliders — which is how this test first reported the
    // pallet as solid when it is not. Isolating the thing under test is the
    // difference between a check and a coincidence.
    d.scenery = [];
    d.props = [];
    // A GRID SIZED FROM THE LIBRARY, not from what the library happened to be
    // the day this was written. The first version stepped 34 m in rows of 8
    // from -380, which fits 64 components and walks straight off the ±419 m
    // buildable edge at 112 — so growing the library would have broken the
    // check that exists to cover a growing library.
    const cols = Math.ceil(Math.sqrt(ids.length));
    const step = Math.min(34, 760 / Math.max(1, cols - 1));
    const origin = -(step * (cols - 1)) / 2;
    ids.forEach((id, i) => {
      d.props.push({
        template: id,
        x: origin + (i % cols) * step,
        z: origin + Math.floor(i / cols) * step,
        rot: 0,
        scale: e.getTemplate(id).authoring.defaultScale,
      });
    });
  }, 'place every component');
  await new Promise((r) => setTimeout(r, 2500));
  return { count: e.def.props.length, built: e.preview.componentCounts };
});
check(placedAll.count === sweep.ids.length, 'one of every component placed', `${placedAll.count} props`);
const missingFromPreview = sweep.ids.filter((id) => !(placedAll.built[id] > 0));
check(missingFromPreview.length === 0, 'every placed component reaches the preview as geometry',
  missingFromPreview.join(', '));

const shareUrl = await page.evaluate(() => {
  const json = JSON.stringify(window.__editor.def);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return `index.html?t=${btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
});

const gamePage = await ctx.newPage();
const gameErrors = [];
gamePage.on('pageerror', (e) => gameErrors.push(e.message.split('\n')[0]));
await gamePage.goto(BASE + shareUrl, { waitUntil: 'load' });
await gamePage.waitForFunction(() => window.__dust?.track, null, { timeout: 120000 });

// Every SOLID component must have produced a collider at its own position, and
// every non-solid one must not have. This is the claim that matters: the rules
// written in the component file are the rules the car meets.
const verdicts = await gamePage.evaluate((ids) => {
  const d = window.__dust;
  const props = d.track.props ?? [];
  // ONLY THE COMPONENT COLLIDERS. The terrain is one big trimesh whose own
  // translation is the origin, so any prop that happens to land on (0, 0)
  // counts it and is reported solid whatever its file says. That was not
  // reachable while the grid started at -380 and stepped 34; it became
  // reachable the moment the grid was sized from the library instead.
  const cols = [];
  d.world.forEachCollider((c) => {
    const kind = c.shape?.type;
    // 1 = ball, 2 = cuboid, 10 = cylinder in rapier's ShapeType; trimesh is not
    // in that set, which is the whole point. Guard on a name where available.
    const name = c.shape?.constructor?.name ?? '';
    if (/TriMesh|HeightField/i.test(name)) return;
    if (kind !== undefined && ![1, 2, 10].includes(kind) && !/Ball|Cuboid|Cylinder/i.test(name)) return;
    const t = c.translation();
    cols.push([t.x, t.z]);
  });
  const near = (x, z, r) => cols.filter(([cx, cz]) => Math.hypot(cx - x, cz - z) < r).length;
  // Radius from the grid step, not a constant: at a tighter spacing a fixed
  // 8 m window starts counting the NEIGHBOUR's collider, which is exactly the
  // bug that once reported a non-solid pallet as solid.
  const r = Math.min(8, (d.track.props[1] ? Math.abs(d.track.props[1].x - d.track.props[0].x) : 8) * 0.45);
  return props.map((p) => ({ id: p.template, n: near(p.x, p.z, r) }));
}, sweep.ids);

const expectSolid = await page.evaluate((ids) => {
  const e = window.__editor;
  return ids.map((id) => {
    const t = e.getTemplate(id);
    const s = t.authoring.defaultScale;
    return { id, solid: typeof t.physics.solid === 'function' ? t.physics.solid(s) : t.physics.solid };
  });
}, sweep.ids);

const wrong = [];
for (const exp of expectSolid) {
  const got = verdicts.find((v) => v.id === exp.id);
  if (!got) { wrong.push(`${exp.id}: not in the game`); continue; }
  if (exp.solid && got.n === 0) wrong.push(`${exp.id}: declared solid, no collider`);
  if (!exp.solid && got.n > 0) wrong.push(`${exp.id}: declared NOT solid, got ${got.n} collider(s)`);
}
const solidCount = expectSolid.filter((e) => e.solid).length;
check(wrong.length === 0,
  'every component gets exactly the collider its file declares',
  wrong.length ? wrong.slice(0, 5).join(' | ')
    : `${solidCount} solid / ${expectSolid.length - solidCount} not, all correct`);
check(gameErrors.length === 0, 'no page errors in the game with the whole library placed',
  gameErrors.slice(0, 3).join(' | '));

// ---- 7. floating components actually float ---------------------------------
//
// The claim: a component declared `placement: 'water'` sits on the WATER
// SURFACE, not on the bed, wherever it is put — and one declared `shore` or
// `land` still sits on the ground. This is the only part of the system where
// the same coordinates give two different heights, so it is the only part where
// being wrong is invisible until a boat is discovered sitting in a crater.
//
// It also checks the harbour generator against the engine. That tool
// recomputes land height from the track's own octaves and ramps to find the
// shoreline; if its copy of the arithmetic ever drifts from `Terrain`, boats it
// believed were moored in 2 m of water turn up aground, and this fails.
const afloat = await page.evaluate(async () => {
  const e = window.__editor;
  const harbour = e.builtInTracks().find((t) => t.id === 'harbour');
  if (!harbour) return { error: 'harbour track is not built in' };
  e.def = harbour;                       // the editor's own load path
  await new Promise((r) => setTimeout(r, 3000));
  const t = e.preview.terrain;
  const level = t.waterLevel;

  // Read the WORLD, not the rule. Every instanced mesh is named
  // "<template>:<part>", so this pulls the real transform of the real instance
  // nearest each placed prop and asks where it actually ended up.
  const heightOfInstanceAt = (template, x, z) => {
    let best = null;
    let bestD = 1.0;
    for (const o of e.preview.objects) {
      if (!o.isInstancedMesh || !o.name.startsWith(`${template}:`)) continue;
      const m = new Float32Array(16);
      for (let i = 0; i < o.count; i++) {
        const a = o.instanceMatrix.array;
        m.set(a.subarray(i * 16, i * 16 + 16));
        const d = Math.hypot(m[12] - x, m[14] - z);
        if (d < bestD) { bestD = d; best = m[13]; }
      }
    }
    return best;
  };

  const wrong = [];
  let boats = 0;
  for (const p of harbour.props) {
    const tpl = e.getTemplate(p.template);
    const place = tpl.authoring.placement ?? 'land';
    const ground = t.heightAt(p.x, p.z);
    const y = heightOfInstanceAt(p.template, p.x, p.z);
    if (y === null) { wrong.push(`${p.template}@(${p.x},${p.z}) has no instance in the world`); continue; }
    if (place === 'water') {
      boats++;
      if (Math.abs(y - level) > 0.01) {
        wrong.push(`${p.template}@(${p.x},${p.z}) sits at y=${y.toFixed(2)}, water is ${level} `
          + `(bed ${ground.toFixed(2)})`);
      }
      const d = level - ground;
      if (d < (tpl.authoring.minDepth ?? 0.4)) {
        wrong.push(`${p.template}@(${p.x},${p.z}) aground: ${d.toFixed(2)} m of water, wants ${tpl.authoring.minDepth}`);
      }
    } else {
      if (Math.abs(y - ground) > 0.01) wrong.push(`${p.template}@(${p.x},${p.z}) is not on the ground`);
      if (ground < level - 0.35) {
        wrong.push(`${p.template}@(${p.x},${p.z}) is ${(level - ground).toFixed(1)} m under water`);
      }
    }
  }
  return { level, boats, wrong, counts: e.preview.componentCounts };
});
check(!afloat.error && afloat.boats > 0, 'the harbour track is built in and has boats on it',
  afloat.error ?? `${afloat.boats} floating components, water at ${afloat.level} m`);
check(!afloat.error && afloat.wrong.length === 0,
  'floating components sit on the water and land ones stay dry',
  (afloat.wrong ?? []).slice(0, 4).join(' | '));
// Scatter has its own placement rules, and a `water` layer that silently
// produced nothing would still pass every check above.
check(!afloat.error && (afloat.counts?.buoy ?? 0) > 0 && (afloat.counts?.willow ?? 0) > 0,
  'scatter places components onto water and along the shoreline',
  `buoy=${afloat.counts?.buoy ?? 0} (water) willow=${afloat.counts?.willow ?? 0} (shore)`);

check(errors.length === 0, 'no page errors in the editor', errors.slice(0, 4).join(' | '));

await browser.close();
await stopServer();
console.log(fails ? `\n${fails} FAILED` : '\ncomponent smoke passed');
process.exit(fails ? 1 : 0);
