/* THE HORIZON IS SOLID TOO.
 *
 * r148 made the drivable massif solid and measured 18 runs at its peaks. The
 * skyline rings placed by `_buildHorizon` were never part of that: they
 * registered no collider at all, and nothing fences the field, so a car driven
 * ~900 u off the track sailed straight into a mountain range. Reported with a
 * photograph taken from inside a hillside: "Still can enter."
 *
 * Audited before the fix: 51 of 60 worlds had EVERY horizon mountain bare —
 * typically ~75 instances per world with no solid anywhere in their
 * footprints. (The other 9 use mesa / dune / city horizons or drop the rings.)
 *
 * Two checks, deliberately different in kind:
 *
 *   1. STATIC, EVERY WORLD: each placed horizon instance has a stone solid
 *      with a height inside its own drawn footprint. This is the coverage
 *      check — driving at all ~4,500 of them is not a thing a test can do.
 *   2. DRIVEN, ONE WORLD: on PINE VALLEY (where it was photographed), start
 *      90 u off a horizon mountain's rim, hold the throttle for 7 s, and ask
 *      where the car ended up — the same harness test-mountains uses, because
 *      a registered collider that the height gate skips would pass a static
 *      check and still let the car in. That is exactly how r148's bug lived.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg, extra); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 480, height: 320 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

// ---- 1. every world: every ring instance is covered -------------------------
const audit = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  const out = [];
  for (const L of LEVELS) {
    g.state = 'title'; g.editScene = null;
    try { g.swapLevel(L, true, null); } catch (e) {
      out.push({ id: L.id, name: L.name, err: String(e).slice(0, 80) }); continue;
    }
    const t = g.track;
    const solids = (t.solids || []).filter((s) => s.mat === 'stone' && s.h !== undefined);
    // MESA HORIZONS have the same hole and no named mesh to traverse, so they
    // are checked by census: `_buildMesaHorizon` places 56 mesas past 750 u,
    // and each must have registered a far stone solid with a height.
    const mesaFar = t.T.horizon === 'mesa'
      ? solids.filter((s) => Math.hypot(s.x, s.z) > 700).length : -1;
    let bare = 0, total = 0;
    t.group.traverse((o) => {
      if (!o.isInstancedMesh) return;
      if (o.name !== 'horizon-hills' && o.name !== 'horizon-peaks') return;
      const a = o.instanceMatrix.array;
      for (let i = 0; i < o.count; i++) {
        const o16 = i * 16;
        // scale = column lengths, position = elements 12-14
        const sx = Math.hypot(a[o16], a[o16 + 1], a[o16 + 2]);
        const sz = Math.hypot(a[o16 + 8], a[o16 + 9], a[o16 + 10]);
        const px = a[o16 + 12], pz = a[o16 + 14];
        total++;
        const rad = Math.max(sx, sz) * 0.5;
        if (!solids.some((sd) => (sd.x - px) ** 2 + (sd.z - pz) ** 2 < (rad * 0.8) ** 2)) bare++;
      }
    });
    out.push({ id: L.id, name: L.name, total, bare, mesaFar });
  }
  return out;
});

const withRings = audit.filter((w) => !w.err && w.total > 0);
const bareWorlds = withRings.filter((w) => w.bare > 0);
ok(audit.filter((w) => w.err).length === 0, 'every world builds',
  JSON.stringify(audit.filter((w) => w.err).slice(0, 2)));
ok(withRings.length >= 50, `most worlds place horizon rings (${withRings.length})`);
ok(bareWorlds.length === 0,
  `every horizon mountain in every world registers a collider (${withRings.reduce((n, w) => n + w.total, 0)} instances)`,
  bareWorlds.slice(0, 5).map((w) => `${w.name} ${w.bare}/${w.total}`).join(', '));

const mesaWorlds = audit.filter((w) => w.mesaFar >= 0);
const mesaBare = mesaWorlds.filter((w) => w.mesaFar < 40);
ok(mesaWorlds.length === 0 || mesaBare.length === 0,
  `every mesa-horizon world registers its far mesas (${mesaWorlds.length} worlds)`,
  mesaBare.map((w) => `${w.name} ${w.mesaFar}`).join(', '));

// ---- 2. and the car actually bounces off one --------------------------------
const drive = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  g.state = 'title'; g.editScene = null;
  g.swapLevel(LEVELS.find((x) => x.id === 1), true, null);
  const t = g.track, p = g.player;
  // nearest ring mountains, the ones a wandering car reaches first
  const hills = (t.solids || [])
    .filter((s) => s.mat === 'stone' && s.h !== undefined && Math.hypot(s.x, s.z) > 700)
    .sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
  const out = { name: g.level.name, hills: hills.length, runs: 0, entered: 0, worstDepth: 0 };
  const step = (n) => {
    for (let i = 0; i < n; i++) {
      p.update(1 / 60, { throttle: 1, brake: 0, steer: 0, drift: false,
        fire: false, justPressed: () => false });
    }
  };
  for (const c of hills.slice(0, 4)) {
    const a = Math.atan2(c.z, c.x);
    const sx = c.x + Math.cos(a) * (c.r + 90);
    const sz = c.z + Math.sin(a) * (c.r + 90);
    p.alive = true; p.health = p.maxHealth; p.mesh.visible = true;
    p.respawnTimer = 0; p.invuln = 999;
    g.state = 'race';
    p.pos.set(sx, t.terrainHeight(sx, sz), sz);
    p.y = p.pos.y;
    p.vel.set(0, 0, 0); p.speed = 0; p.airborne = false;
    p.heading = Math.atan2(-(c.x - sx), -(c.z - sz));
    p.trackIndex = t.nearestIndex(p.pos);
    step(420);
    const depth = c.r - Math.hypot(p.pos.x - c.x, p.pos.z - c.z);
    out.runs++;
    if (depth > 2) { out.entered++; out.worstDepth = Math.max(out.worstDepth, depth); }
  }
  out.worstDepth = +out.worstDepth.toFixed(1);
  p.invuln = 0; g.state = 'title';
  return out;
});

ok(drive.hills > 20, `${drive.name}: the skyline registers colliders`, `${drive.hills} of them`);
ok(drive.runs > 0 && drive.entered === 0,
  `${drive.name}: a car driven flat out at a horizon mountain does not get inside it`,
  `${drive.entered}/${drive.runs} entered, deepest ${drive.worstDepth} u`);

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
