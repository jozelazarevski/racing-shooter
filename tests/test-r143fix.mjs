/* THE TWO FAULTS THAT HELD r143 BACK.
 *
 * 1. The editor's lake was wound backwards. Every face pointed at the seabed,
 *    the material is FrontSide, so from a car you saw straight through the
 *    water to the grass — a pale green disc where every river in the game is
 *    blue. Harmless until r143 made deep water fatal; then it was a drowning
 *    pool disguised as a field.
 *
 * 2. The r143 picture palette is 236 px wide and up to 52vh tall, parked at
 *    right:8px — the same column as #ed-world. Open the palette and it covered
 *    the ROAD row, so TUNNEL and BRIDGE were unreachable.
 *
 * Both are things you SEE, so both are checked by measurement rather than by
 * reading the code back: real vertex normals off a real built lake, and real
 * on-screen rectangles off the live editor DOM.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const errors = [];
const open = async (w, h) => {
  const pg = await browser.newPage({ viewport: { width: w, height: h } });
  pg.setDefaultTimeout(600000);
  pg.on('pageerror', (e) => errors.push(String(e.message)));
  await pg.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await pg.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });
  return pg;
};
const page = await open(1100, 720);

// ---- 1. the lake faces the sky -------------------------------------------
const L = await page.evaluate(async () => {
  const g = window.__game, t = g.track;
  const out = {};
  // Dig it with the EDITOR'S OWN TOOL. A hand-rolled payload once cost me a
  // whole afternoon on the thumbnail baker; `delta` is a TerrainDelta, not an
  // array, so a literal builds no bowl, and a lake with no bowl is discarded
  // by design (`wet < 6`) — the test would have read as "no lake" either way.
  const { WorldEditor } = await import('./src/editor.js');
  const c = t.center[40], hd = t.headingAt(40);
  const x = c.x + Math.cos(hd) * 150, z = c.z - Math.sin(hd) * 150;
  const ground = t.terrainHeight(x, z);
  const ed = new WorldEditor(g);
  ed.enter();
  ed.radius = 40;
  ed._waterAt({ x, z });
  g.editScene = ed.buildPayload();
  g.rebuildWorld();
  ed._clearGhosts?.(); ed._clearZoneMarks?.(); ed.exit();
  out.waters = (g.editScene.waters || []).length;

  // find it: the only mesh whose material carries the sea tint and which is
  // not the river ribbon or the sea plane
  // BY NAME, not by vertex count. The first cut counted 1 + 14*30 vertices to
  // identify the disc, so re-tessellating the lake (RINGS/SEG changed when the
  // rim was fitted to the shoreline) made the test report "no lake built"
  // rather than anything about winding.
  let found = null;
  g.track.group.traverse((o) => {
    if (o.isMesh && o.name === 'edit-lake') found = o;
  });
  if (!found) return { built: false };
  const n = found.geometry.attributes.normal;
  let up = 0, down = 0, nan = 0;
  for (let i = 0; i < n.count; i++) {
    const y = n.getY(i);
    if (!Number.isFinite(y)) nan++;
    else if (y > 0.05) up++;
    else if (y < -0.05) down++;
  }
  out.built = true;
  out.verts = n.count;
  out.up = up; out.down = down; out.nan = nan;
  out.side = found.material.side;                    // 0 = FrontSide
  out.frontSide = found.material.side === 0;
  out.color = '#' + found.material.color.getHexString();

  // AND THE REAL QUESTION: does a camera above it see water, or grass?
  // Point straight down at the middle of the lake and raycast — the first hit
  // must be the lake, not the ground under it.
  const THREE = await import('three');
  const rc = new THREE.Raycaster();
  rc.set(new THREE.Vector3(x, ground + 40, z), new THREE.Vector3(0, -1, 0));
  const hits = rc.intersectObject(found, false);
  out.seenFromAbove = hits.length > 0;
  out.hitY = hits.length ? +hits[0].point.y.toFixed(2) : null;
  out.waterY = +(ground - 3.2).toFixed(2);
  return out;
});

console.log('\n--- the editor lake ---');
ok(L.built, 'the editor lake builds at all', JSON.stringify(L));
if (L.built) {
  ok(L.nan === 0, 'no non-finite normals', L.nan);
  ok(L.up === L.verts && L.down === 0,
    'every vertex normal points at the SKY', `up ${L.up} / down ${L.down} of ${L.verts}`);
  ok(L.frontSide, 'the material is still FrontSide (so winding is what decides)', L.side);
  ok(L.seenFromAbove,
    'a ray from above hits the water surface, not the bed',
    `hitY ${L.hitY} vs water ${L.waterY}`);
}

// ---- 2. the palette does not cover the ROAD row ---------------------------
const sizes = [{ w: 1100, h: 720, name: 'desktop' }, { w: 430, h: 860, name: 'phone' }];
for (const s of sizes) {
  // A FRESH PAGE PER SIZE. Reusing one and calling setViewportSize looked
  // tidier and lied: the second editor came up with every panel at 0x0 because
  // the first exit() had taken the root down, and a zero-size panel overlaps
  // nothing, so the layout check would have passed no matter what the CSS said.
  const pg = await open(s.w, s.h);
  const P = await pg.evaluate(async () => {
    const g = window.__game;
    const { WorldEditor } = await import('./src/editor.js');
    const ed = new WorldEditor(g);
    ed.enter();
    ed.tool = 'place';
    ed._syncUI?.();
    document.getElementById('ed-palette')?.classList.add('open');
    const r = (id) => {
      const e = document.getElementById(id);
      if (!e) return null;
      const b = e.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom };
    };
    const out = { pal: r('ed-palette'), world: r('ed-world'), sliders: r('ed-sliders') };
    // and the buttons that were actually lost
    const btns = [...document.querySelectorAll('#ed-roadrow .ed-mini')];
    out.roadBtns = btns.map((e) => {
      const b = e.getBoundingClientRect();
      // is the palette on top of the button's own centre?
      const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return { label: e.textContent.trim(), covered: !e.contains(hit) && hit !== e };
    });
    out.palOnScreen = out.pal && out.pal.w > 0 && out.pal.x >= 0 && out.pal.r <= innerWidth;
    return out;
  });
  await pg.close();
  const overlap = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
  console.log(`\n--- editor panels @ ${s.name} ${s.w}x${s.h} ---`);
  console.log('  palette', JSON.stringify(P.pal), '\n  world  ', JSON.stringify(P.world));
  ok(!overlap(P.pal, P.world), 'palette does not overlap the WORLD panel');
  ok(!overlap(P.pal, P.sliders), 'palette does not overlap the sliders');
  ok(P.palOnScreen, 'palette is fully on screen', JSON.stringify(P.pal));
  const covered = P.roadBtns.filter((b) => b.covered).map((b) => b.label);
  ok(P.roadBtns.length >= 2, 'the ROAD row has its buttons', P.roadBtns.length);
  ok(covered.length === 0, 'no ROAD button is covered by the palette', covered.join(', '));
}

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
