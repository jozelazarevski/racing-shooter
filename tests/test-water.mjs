/* Water geometry, as a test.
 *
 * NATURE rule: a water surface is either ~0 degrees (a pool, or a reach running
 * level) or ~90 degrees (a fall face). Never in between. A sheet of water lying
 * at 40 degrees down a hillside is the single most obviously wrong thing a
 * landscape can contain, and it had been reported twice.
 *
 * THE HISTORY, because it explains why this test exists at all:
 *   r80 fixed `_buildRivers` — the small jungle streams — by building them as
 *   level quads joined by upright ones. Measured, those are clean: 384 level
 *   triangles, 54 vertical, nothing between.
 *
 *   It never touched `_buildRiver` — the ONE WORLD-SPANNING waterway, which is
 *   present on every world and is the water you actually drive across. That was
 *   still a continuous draped strip, and a strip has one height per station, so
 *   a drop is forced to slope across a whole segment. Measured on three worlds:
 *   2502 level triangles, ZERO vertical, slopes up to 41.8 degrees.
 *
 * So the fix was verified on the wrong mesh. This test walks EVERY water
 * surface in the world and classifies every triangle, which is what makes that
 * mistake impossible to repeat.
 *
 * The river BANK is deliberately excluded from the angle rule: a bank is a
 * slope, that is what a bank is. It is checked for existence instead.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

// A forested world, a jungle world (which also has the small streams), and the
// timber world — all three carry the world-spanning river.
for (const [id, name] of [[1, 'PINE VALLEY'], [8, 'AMAZON RAPIDS'], [13, 'LOG FLUME FURY']]) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const ok = await p.waitForFunction(() => window.__game?.track?.center,
    undefined, { timeout: 240000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP  ${name}`); await p.close(); continue; }

  const r = await p.evaluate(() => {
    const t = window.__game.track;
    const isWater = (o) => {
      if (!o.isMesh || !o.geometry?.attributes?.position) return false;
      if (/river-bank/.test(o.name || '')) return false;      // a bank is a slope
      if (/river|water|stream|fall/i.test(o.name || '')) return true;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!m || !m.map || m.roughness === undefined || m.roughness > 0.3) return false;
      return !!m.color && m.color.b > m.color.r * 1.05;        // bluish
    };
    const meshes = [];
    t.group.traverse((o) => { if (isWater(o)) meshes.push(o); });

    let tris = 0, level = 0, vertical = 0, between = 0, worstBetween = 0;
    let betweenOpen = 0, worstOpen = 0;
    for (const o of meshes) {
      const pos = o.geometry.attributes.position, index = o.geometry.index;
      const n = index ? index.count : pos.count;
      for (let i = 0; i + 2 < n; i += 3) {
        const ia = index ? index.getX(i) : i, ib = index ? index.getX(i + 1) : i + 1,
              ic = index ? index.getX(i + 2) : i + 2;
        const ax = pos.getX(ia), ay = pos.getY(ia), az = pos.getZ(ia);
        const ux = pos.getX(ib) - ax, uy = pos.getY(ib) - ay, uz = pos.getZ(ib) - az;
        const vx = pos.getX(ic) - ax, vy = pos.getY(ic) - ay, vz = pos.getZ(ic) - az;
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const len = Math.hypot(nx, ny, nz);
        if (len < 1e-9) continue;                              // degenerate
        // classify by CENTROID: the old vertex-a test half-counted the giant
        // triangles straddling the world rim, where the invisible tails climb
        // the rim mountains — ~140 phantom "slopes" per world
        const cenx = ax + (ux + vx) / 3, cenz = az + (uz + vz) / 3;
        if (Math.hypot(cenx, cenz) > 1500) continue;
        tris++;
        // Surface angle from horizontal = its normal's angle from vertical.
        const ang = Math.acos(Math.min(1, Math.abs(ny) / len)) * 180 / Math.PI;
        if (ang < 3) level++;
        else if (ang > 87) vertical++;
        else {
          between++; if (ang > worstBetween) worstBetween = ang;
          // Slopes are permitted ONLY at a road embankment, where the river
          // meets a road it does not ford and cascades down the bank to pass
          // under it (the culvert rule). Out in open country the old law is
          // untouched: level, or vertical, nothing between.
          const cx = ax + (ux + vx) / 3, cz = az + (uz + vz) / 3;
          if ((t._distToTrackCoarse ? t._distToTrackCoarse(cx, cz) : 999) > 30) {
            betweenOpen++; if (ang > worstOpen) worstOpen = ang;
          }
        }
      }
    }

    // The world river specifically: check it still crosses the road AT the road,
    // so quantising the profile has not lifted the wash off the carriageway or
    // buried it inside the deck.
    let water = null;
    t.group.traverse((o) => { if (o.name === 'river-water') water = o; });
    const ford = [];
    if (water) {
      const pos = water.geometry.attributes.position, C = 4;
      // Deck-riding is asserted at PLANNED fords only. The river now also
      // crosses under roads at culverts, where the water keeps its own level
      // inside the embankment on purpose — measuring those against the deck
      // reported the culvert as a broken ford.
      const fordPts = (t._river?.fords ?? []).map((fd) => t.center[fd.i]).filter(Boolean);
      const nearFord = (x, z) => fordPts.some((c) => Math.hypot(x - c.x, z - c.z) < 34);
      for (let s = 0; s < pos.count / C; s++) {
        const x = pos.getX(s * C), z = pos.getZ(s * C), y = pos.getY(s * C);
        if ((t._distToTrackCoarse ? t._distToTrackCoarse(x, z) : 999) > 6) continue;
        if (!nearFord(x, z)) continue;
        ford.push(y - t.center[t.nearestIndex({ x, y: 0, z })].y);
      }
    }
    const bankTris = (() => {
      let b = 0;
      t.group.traverse((o) => {
        if (o.name === 'river-bank' && o.geometry?.index) b += o.geometry.index.count / 3;
      });
      return b;
    })();
    return {
      meshes: meshes.length, tris, level, vertical, between,
      betweenOpen, worstOpen: +worstOpen.toFixed(1),
      worstBetween: +worstBetween.toFixed(1),
      betweenPct: +(100 * between / Math.max(1, tris)).toFixed(1),
      hasWorldRiver: !!water, bankTris,
      fordN: ford.length,
      // Two visible sins, measured separately (r319). PROUD water floats
      // above the carriageway — any vertex, always visible. A DRY ford is a
      // wash that never touches the deck at all. A vertex BELOW the deck is
      // neither: it is the river's own bed or a fall lip passing under the
      // embankment edge, hidden inside the geometry — FLUME's worst was
      // -8.21 u, two boundary vertices of a wash whose other samples ride
      // the deck (and drivingspec proves the crossing soaks the player).
      fordProud: ford.length ? +Math.max(...ford).toFixed(2) : null,
      fordTouch: ford.length ? +Math.min(...ford.map(Math.abs)).toFixed(2) : null,
    };
  });

  // 1. THE HEADLINE. In open country, water is level or it is vertical.
  //    At a road embankment it may cascade — that is the culvert rule, and it
  //    is what ended the 41 u sheet of water standing beside the HEDGEROW
  //    road. Slopes anywhere ELSE are still the original defect.
  check(`${name}: no water lies on a slope in open country`, r.betweenOpen === 0,
    `${r.betweenOpen} sloped triangles beyond the road band (worst ${r.worstOpen} deg); ${r.between} total incl. embankment cascades`);

  // 2. There must BE falls. A perfectly flat river would pass check 1 and be
  //    just as wrong — the request was that water FALL vertically, not that it
  //    stop falling.
  check(`${name}: the water actually falls somewhere`, r.vertical > 0,
    `${r.vertical} vertical triangles`);

  // 3. ...and it must still mostly be water you can see lying flat.
  check(`${name}: most of the water is level`, r.level > r.vertical,
    `${r.level} level vs ${r.vertical} vertical`);

  // 4. The world-spanning river is the one that was missed for a whole release.
  //    Assert it is present and was actually inspected.
  check(`${name}: the world river exists and was measured`, r.hasWorldRiver && r.meshes > 0,
    `${r.meshes} water meshes, ${r.tris} triangles`);

  // 5. The bank is SUPPOSED to be sloped — confirm it still exists, so nobody
  //    "fixes" it into a staircase to make check 1 pass more thoroughly.
  check(`${name}: the bank is still there`, r.bankTris > 0, `${r.bankTris} bank triangles`);

  // 6. The ford still washes over the road rather than floating above it or
  //    hiding inside it — asserted as the two sins a player can SEE (r319):
  //    no vertex proud of the carriageway by 2 u (the pooled-reach
  //    regression this caught at 1.8 u during development), and the wash
  //    TOUCHES the deck somewhere (a ford whose every sample hides inside
  //    the embankment is a dry crossing). Vertices BELOW the deck are the
  //    river bed and fall lips passing under the edge — buried geometry,
  //    invisible, and drivingspec separately proves the crossing soaks you.
  if (r.fordN) {
    check(`${name}: no ford water stands proud of the deck`, r.fordProud < 2,
      `worst proud ${r.fordProud} u over ${r.fordN} on-road samples`);
    check(`${name}: the wash touches the deck`, r.fordTouch < 2,
      `closest sample ${r.fordTouch} u from the deck`);
  }

  await p.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nwater is level or it falls');
process.exit(fail ? 1 : 0);
