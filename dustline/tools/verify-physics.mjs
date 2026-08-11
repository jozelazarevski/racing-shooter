/* DOES THE COLLIDER MATCH THE THING YOU CAN SEE?
 *
 * `components-smoke` proves a component DECLARES a collider, that its extents
 * are positive, and that one really appears in the physics world. None of that
 * asks the only question a driver cares about: is the invisible shape the same
 * size as the visible one. Both ways of being wrong are bugs, and they feel
 * completely different:
 *
 *   UNDER-COVERED — the collider is smaller than the geometry. You clip through
 *     the corner of a church. Reads as "the game is broken".
 *   OVER-COVERED — the collider is bigger. You hit something that is not there.
 *     Worse, because there is nothing on screen to blame.
 *
 * MEASURED IN METRES, NOT RATIOS. The first version of this flagged on the
 * ratio of collider to geometry and spent all its time crying wolf about signs:
 * a chevron board 12 cm thick inside a 24 cm collider is "192% over" and also
 * six centimetres, which nobody will ever feel. What matters is how far the
 * invisible edge is from the visible one, in metres, so that is what is
 * checked.
 *
 * MEASURED AT THE COLLIDER'S OWN HEIGHT, not against the whole bounding box.
 * This is the difference between a check that works and one everybody switches
 * off. A campanile is a 7.4 m shaft under a 9.4 m cornice forty metres up; a
 * cottage's eaves oversail its walls. Against full extents both look like a
 * collider that has lost a third of its object, and the correct fix for both is
 * to change nothing.
 *
 * The obvious repair — measure only what is under bumper height — is also
 * wrong, and a bridge is the counter-example: its deck is the drivable surface
 * FOUR METRES UP, and everything below the bumper line is trestle legs. So the
 * footprint is taken from the geometry lying within the collider's own vertical
 * span, which asks the question that actually matters: at the height where this
 * collider sits, is there something there.
 *
 * A SMALLER COLLIDER IS STILL NOT AUTOMATICALLY A FAULT, so the component can
 * say so itself: `physics.coverage` is 'full' (the default, must match), 'trunk'
 * (a narrow core inside a much wider shape) or 'partial' (covers part of the
 * mass on purpose, with a comment saying which). Intent that is only in
 * someone's head is indistinguishable from a bug.
 *
 *   npx vite build
 *   node tools/verify-physics.mjs
 *   node tools/verify-physics.mjs --table    # every component, worst first
 */
import { chromium } from 'playwright-core';
import { ensureServer } from './serve.mjs';

const TABLE = process.argv.includes('--table');

// How far the invisible edge may sit from the visible one, per side.
const SLACK_OUT = 0.35;  // m a collider may stick out — you brush thin air
const SLACK_IN = 0.60;   // m a collider may fall short — you clip the corner
// ...but ONLY on something big enough for 0.6 m to be a detail. A flat
// tolerance is nonsense at both ends of the scale, and mutation testing caught
// it: a crate collider shrunk from 0.57 to 0.10 half-extent — 83% of the box
// gone, a crate you drive straight through — passed, because 0.5 m of shortfall
// on a 1.2 m crate is under a 0.6 m allowance. So the allowance is a FRACTION
// of the object, floored at nothing and capped at SLACK_IN: strict on a crate,
// still forgiving of a barn's eaves.
const SLACK_FRAC = 0.3;
// A 'trunk' collider is meant to be narrow, but it still has to BE there and
// still has to stand up: a trunk you can drive through is not a trunk.
const TRUNK_MIN = 0.12;  // m — real sign posts are 76-89 mm, so this is generous
const TALL_MIN = 0.5;    // fraction of visible height a full collider must reach


const BASE = process.env.BASE || 'http://localhost:8906/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const stopServer = await ensureServer(BASE, '../play-dustline');

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message.split('\n')[0]));
await page.goto(`${BASE}editor.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__editor?.preview?.terrain, null, { timeout: 90000 });

const rows = await page.evaluate(() => {
  const e = window.__editor;
  const out = [];
  for (const id of e.templateIds()) {
    const t = e.getTemplate(id);
    // the collider first — its vertical span decides which geometry to measure
    const shape0 = t.physics.shape(1);
    const k0 = shape0?.kind ?? 'none';
    const cy0 = shape0?.centerY ?? 0;
    const half = k0 === 'box' ? shape0.halfExtents[1]
      : k0 === 'ball' ? shape0.radius : k0 === 'cylinder' ? shape0.halfHeight : 0;
    const bandLo = cy0 - half - 0.05, bandHi = cy0 + half + 0.05;

    let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    let rx0 = Infinity, rx1 = -Infinity, rz0 = Infinity, rz1 = -Infinity;
    for (const part of t.build()) {
      part.geometry.computeBoundingBox();
      const bb = part.geometry.boundingBox;
      if (bb) {
        lo = [Math.min(lo[0], bb.min.x), Math.min(lo[1], bb.min.y), Math.min(lo[2], bb.min.z)];
        hi = [Math.max(hi[0], bb.max.x), Math.max(hi[1], bb.max.y), Math.max(hi[2], bb.max.z)];
      }
      const pos = part.geometry.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < bandLo || y > bandHi) continue;
        const x = pos.getX(i), z = pos.getZ(i);
        if (x < rx0) rx0 = x; if (x > rx1) rx1 = x;
        if (z < rz0) rz0 = z; if (z > rz1) rz1 = z;
      }
      part.geometry.dispose();
    }
    if (!Number.isFinite(lo[0])) continue;
    // nothing in the band at all: fall back to the whole shape rather than
    // report a footprint of zero
    if (!Number.isFinite(rx0)) { rx0 = lo[0]; rx1 = hi[0]; rz0 = lo[2]; rz1 = hi[2]; }

    const shape = shape0;
    const solid = typeof t.physics.solid === 'function' ? t.physics.solid(1) : !!t.physics.solid;
    const kind = shape?.kind ?? 'none';
    const cx = shape?.centerX ?? 0, cz = shape?.centerZ ?? 0, cy = shape?.centerY ?? 0;

    let hx = 0, hz = 0, ctop = 0;
    if (kind === 'box') { hx = shape.halfExtents[0]; hz = shape.halfExtents[2]; ctop = cy + shape.halfExtents[1]; }
    else if (kind === 'ball') { hx = hz = shape.radius; ctop = cy + shape.radius; }
    else if (kind === 'cylinder') { hx = hz = shape.radius; ctop = cy + shape.halfHeight; }

    out.push({
      id, kind, solid, coverage: t.physics.coverage ?? 'full', category: t.category,
      // per-side gaps in METRES: positive = collider sticks OUT past the
      // geometry, negative = it falls short of it
      outX: +(cx + hx - rx1).toFixed(2), outX0: +(rx0 - (cx - hx)).toFixed(2),
      outZ: +(cz + hz - rz1).toFixed(2), outZ0: +(rz0 - (cz - hz)).toFixed(2),
      gw: +(hi[0] - lo[0]).toFixed(2), gd: +(hi[2] - lo[2]).toFixed(2), gtop: +hi[1].toFixed(2),
      // where the visible shape actually sits, which is what a box collider
      // has to be centred on — several components are not centred on their own
      // origin and that is invisible until you measure it
      gcx: +((rx0 + rx1) / 2).toFixed(2), gcz: +((rz0 + rz1) / 2).toFixed(2),
      rw: +(rx1 - rx0).toFixed(2), rd: +(rz1 - rz0).toFixed(2),
      cw: +(hx * 2).toFixed(2), cd: +(hz * 2).toFixed(2), ctop: +ctop.toFixed(2),
    });
  }
  return out;
});

await browser.close();
await stopServer?.();

check(errs.length === 0, 'no page errors measuring the library', errs.slice(0, 3).join(' | '));

const solid = rows.filter((r) => r.solid);
const worst = (r) => Math.max(r.outX, r.outX0, r.outZ, r.outZ0);   // most it sticks out
const short = (r) => Math.max(-r.outX, -r.outX0, -r.outZ, -r.outZ0); // most it falls short

if (TABLE) {
  const hdr = 'id'.padEnd(17) + 'cov'.padEnd(9) + 'reach w×d / h'.padEnd(20)
    + 'collider w×d×top'.padEnd(21) + 'geom mid x,z'.padEnd(15) + 'out(m)  short(m)';
  console.log(`\n${hdr}\n${'-'.repeat(hdr.length)}`);
  for (const r of [...rows].sort((a, b) => short(b) - short(a))) {
    console.log(r.id.padEnd(17) + (r.solid ? r.coverage : '-').padEnd(9)
      + `${r.rw}×${r.rd}×${r.gtop}`.padEnd(20)
      + `${r.cw}×${r.cd}×${r.ctop}`.padEnd(21)
      + `${r.gcx},${r.gcz}`.padEnd(15)
      + `${worst(r).toFixed(2)}    ${short(r).toFixed(2)}`);
  }
  console.log('');
}

// ---- 1. nothing sticks out further than a driver would forgive --------------
// This one applies to EVERY solid component whatever its coverage: 'trunk' and
// 'partial' excuse a collider for being small, never for being too big.
const sticking = solid.filter((r) => worst(r) > SLACK_OUT)
  .map((r) => `${r.id} +${worst(r).toFixed(2)}m`);
check(sticking.length === 0,
  `no solid component has an invisible edge more than ${SLACK_OUT} m outside itself`,
  sticking.join(', '));

// ---- 2. a 'full' collider really covers the shape ---------------------------
const full = solid.filter((r) => r.coverage === 'full');
// per-axis, because a long thin thing may be generous along its length and
// still be missing across its width
const allowX = (r) => Math.min(SLACK_IN, SLACK_FRAC * Math.max(r.rw / 2, 0.05));
const allowZ = (r) => Math.min(SLACK_IN, SLACK_FRAC * Math.max(r.rd / 2, 0.05));
const clips = (r) => Math.max(-r.outX - allowX(r), -r.outX0 - allowX(r),
  -r.outZ - allowZ(r), -r.outZ0 - allowZ(r));
const clipping = full.filter((r) => clips(r) > 0)
  .map((r) => `${r.id} -${short(r).toFixed(2)}m (allowed ${Math.min(allowX(r), allowZ(r)).toFixed(2)})`);
check(clipping.length === 0,
  `every full-coverage collider covers its own footprint to within ${SLACK_FRAC * 100}% (max ${SLACK_IN} m) — ${full.length} components`,
  clipping.join(', '));

const stumpy = full.filter((r) => r.gtop > 0 && r.ctop / r.gtop < TALL_MIN)
  .map((r) => `${r.id} ${(100 * r.ctop / r.gtop).toFixed(0)}%`);
check(stumpy.length === 0,
  `every full-coverage collider reaches at least ${TALL_MIN * 100}% of its own height`,
  stumpy.join(', '));

// ---- 3. a 'trunk' is still something you hit --------------------------------
const trunks = solid.filter((r) => r.coverage === 'trunk');
const ghosts = trunks.filter((r) => Math.min(r.cw, r.cd) < TRUNK_MIN)
  .map((r) => `${r.id} ${Math.min(r.cw, r.cd)}m`);
check(ghosts.length === 0,
  `every trunk collider is at least ${TRUNK_MIN} m across (${trunks.length} components)`,
  ghosts.join(', '));

// ---- 4. and the excuses are actually used -----------------------------------
// A component marked 'trunk' or 'partial' that in fact covers itself is a
// stale declaration — the geometry changed and the note did not.
// SAME `clips()` AS THE CHECK ABOVE. It used the flat 0.6 m before, so the two
// disagreed the moment the allowance started scaling: four components were told
// they needed a 'trunk' declaration by one check and that it was redundant by
// the next.
const unneeded = solid.filter((r) => r.coverage !== 'full' && clips(r) <= 0
  && (r.gtop === 0 || r.ctop / r.gtop >= TALL_MIN))
  .map((r) => `${r.id} (${r.coverage})`);
check(unneeded.length === 0,
  'no component claims reduced coverage it does not need',
  unneeded.join(', '));

console.log(`\n${solid.length} solid, ${rows.length - solid.length} not — `
  + `${full.length} full, ${trunks.length} trunk, `
  + `${solid.filter((r) => r.coverage === 'partial').length} partial`);
console.log(fails ? `\n${fails} FAILED` : '\nevery collider matches what it is declared to cover');
process.exit(fails ? 1 : 0);
