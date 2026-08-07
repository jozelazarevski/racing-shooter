/* THE RIVER RULES.
 *
 * THE COMPLAINT: "Fix the rivers. Something I keep on asking. Make a scalable
 * template and rules."
 *
 * The "keep on asking" is the important half. Each previous round fixed the
 * artefact in the screenshot — the disconnected quads, the sloped drape, the
 * ford sitting below the deck — and none of them wrote down what a river IS,
 * so the next world found a new way to break. This file is that specification,
 * as assertions, applied to every world that has water.
 *
 * A river in this game is:
 *
 *   R1  A PATH THAT NEVER BENDS TIGHTER THAN IT IS WIDE. The ribbon is built
 *       by offsetting the centreline by its own half-width, which is only a
 *       valid construction while the turning radius exceeds that offset. Below
 *       it the edges cross and the strip folds through itself. PINE VALLEY
 *       shipped a 6.7 u radius on a reach needing 10 — the hard V, with the
 *       bank showing through the crease, that was reported.
 *
 *   R2  A SURFACE THE GROUND DOES NOT SWALLOW. The water is level bank to
 *       bank and holds along a reach (that is what makes the falls vertical);
 *       the ground it crosses does neither. Measured before the fix, 84 % of
 *       the water's vertices sat BELOW the terrain at their own position, the
 *       worst by 35 u, while the bank band was at 0 % — which is what made a
 *       river read as blue shards with grass growing through them.
 *
 *   R3  A CHANNEL CUT TO THE WATER, NOT TO THE HILLSIDE. The carve and the
 *       ribbon must be the same shape. They were not: the water's half-width
 *       breathes up to 1.36x and the channel was cut flat only to the
 *       unwobbled half, leaving the widest sixth of the water standing on the
 *       bank ramp.
 *
 *   R4  A BANK THAT FOLLOWS THE GROUND. This one was already true and is
 *       asserted so it stays true — it is the control that proves R2 is a real
 *       finding about the water and not a broken probe.
 *
 * Everything is measured on the BUILT MESHES and the planned curve, not on the
 * constants that produced them.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

// One per surface family that carries the world-spanning river.
const WORLDS = [[1, 'PINE VALLEY'], [13, 'LOG FLUME FURY'], [31, 'HEDGEROW DASH'],
                [9, 'AMAZON RAPIDS'], [29, 'OLIVE COAST']];

let withRiver = 0;
for (const [id, name] of WORLDS) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const ok = await p.waitForFunction(() => window.__game?.track?.center,
    undefined, { timeout: 300000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${name}`); await p.close(); continue; }

  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track, R = t._river;
    if (!R?.curve) return { river: false };

    // ---- R1: minimum turning radius along the planned curve ----
    const N = 400, pts = [];
    for (let i = 0; i <= N; i++) pts.push(R.curve.getPointAt(i / N));
    const widest = R.halfAt ? Math.max(...R.halfAt) : R.half;
    const need = widest + (R.bank ?? 0);
    let minR = Infinity, tight = 0;
    for (let i = 1; i < N; i++) {
      const a = pts[i - 1], c = pts[i], d = pts[i + 1];
      const ab = Math.hypot(c.x - a.x, c.z - a.z);
      const bc = Math.hypot(d.x - c.x, d.z - c.z);
      const ac = Math.hypot(d.x - a.x, d.z - a.z);
      const area = Math.abs((c.x - a.x) * (d.z - a.z) - (d.x - a.x) * (c.z - a.z)) / 2;
      const rad = area < 1e-6 ? Infinity : (ab * bc * ac) / (4 * area);
      if (rad < minR) minR = rad;
      if (rad < need) tight++;
    }

    // ---- R2/R3/R4: the built meshes against the ground under them ----
    const survey = (mesh) => {
      const pos = mesh.geometry.attributes.position;
      let above = 0, below = 0, wa = 0, wb = 0, n = 0, proud = 0;
      const step = Math.max(1, Math.floor(pos.count / 1600));
      for (let i = 0; i < pos.count; i += step) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        if (Math.hypot(x, z) > 1500) continue;            // tails past the world rim
        // Skip the ford band: across the road the wash deliberately rides the
        // DECK, which is metres above the surrounding field, so measuring it
        // as "floating" would be measuring the feature, not a defect.
        if (t._distToTrackCoarse(x, z) < 30) continue;
        const d = y - t.terrainHeight(x, z);
        n++;
        if (d > 0.15) { above++; wa = Math.max(wa, d); }
        if (d > 7.8) proud++;                              // 3x channel depth
        if (d < -0.15) { below++; wb = Math.min(wb, d); }
      }
      return { n, pctProud: +(100 * proud / Math.max(1, n)).toFixed(1),
        pctAbove: +(100 * above / Math.max(1, n)).toFixed(1), worstAbove: +wa.toFixed(2),
        pctBelow: +(100 * below / Math.max(1, n)).toFixed(1), worstBelow: +wb.toFixed(2) };
    };
    const meshes = {};
    g.scene.traverse((o) => { if (o.isMesh && /^river-/.test(o.name || '')) meshes[o.name] = o; });
    const water = meshes['river-water'] ? survey(meshes['river-water']) : null;
    const bank = meshes['river-bank'] ? survey(meshes['river-bank']) : null;

    return { river: true, half: R.half, widest: +widest.toFixed(2), bank: R.bank, depth: R.depth,
      minRadius: +minR.toFixed(1), needRadius: +need.toFixed(1), tight, water, bankSurvey: bank };
  });

  if (!r.river) { console.log(`NOTE  ${name}: no world-spanning river`); await p.close(); continue; }
  withRiver++;

  // R1 — no fold is possible if this holds.
  check(`${name}: the reach never bends tighter than it is wide`, r.tight === 0,
    `min radius ${r.minRadius} u against ${r.needRadius} u needed (${r.tight} tight samples)`);

  // R4 first — the control. If the bank is not conformed, the probe is wrong
  // and nothing else measured here means anything.
  check(`${name}: the bank follows the ground`,
    r.bankSurvey && r.bankSurvey.pctAbove < 2 && r.bankSurvey.pctBelow < 2,
    r.bankSurvey ? `${r.bankSurvey.pctAbove}% above / ${r.bankSurvey.pctBelow}% below` : 'no bank mesh');

  // R2 — the water is not swallowed. Not zero: the lower vertex of a vertical
  // FALL sits below the ground at the lip by construction, and that is the
  // feature, not a defect. 25 % is set above the measured 15-16 % with room,
  // and well under the 84 % that was shipping.
  check(`${name}: the ground does not swallow the water`, r.water && r.water.pctBelow <= 25,
    r.water ? `${r.water.pctBelow}% of vertices buried, worst ${r.water.worstBelow} u` : 'no water mesh');

  // R3 — and it is not a slab laid on the field either.
  //
  // Measured as the FRACTION standing well clear of the ground, not the
  // maximum. The maximum is always a WATERFALL LIP: at a fall the station is
  // doubled, and the upper vertex sits at the upstream level directly over the
  // drop — 32 u of it on HEDGEROW DASH, which is the feature working, not a
  // slab. An earlier version of this check asserted on the max and failed that
  // world for having a waterfall in it.
  check(`${name}: the water is not a slab on the field`, r.water && r.water.pctProud <= 4,
    r.water ? `${r.water.pctProud}% stands over 3 depths clear (worst ${r.water.worstAbove} u — the fall lips)`
      : 'no water mesh');

  await p.close();
}

check('the roster still has rivers', withRiver >= 3, `${withRiver} worlds with a world-spanning river`);
await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe rivers obey their rules');
process.exit(fail ? 1 : 0);
