/* MOVE ROAD CANNOT KNOT A LAP.
 *
 * A world was reported that looked broken: the racing line pulled into a nest
 * of overlapping loops, made with nothing worse than a dozen ordinary MOVE
 * ROAD drags. Driven fixed-step it turned out to be raceable — a lap completed
 * at unchanged average speed and no rival stalled — but it was ugly, 70%
 * longer than the lap it started as, and carried a 100.8 degree per-station
 * cusp on a roster whose census is otherwise zero worlds over 20.
 *
 * Two defects made it, and each is pinned here:
 *
 *   THE STEERING CAP WAS BYPASSED. `_applyRouteWarp` ran AFTER the kink
 *   relaxation, so the one thing in the game that can move the racing line at
 *   will was the one thing the rule never saw. It runs before it now, and the
 *   pass budget grew to match — a warp cusp is deeper than the hand-drawn Vs
 *   the pass was written for.
 *
 *   A WARP WAS ANCHORED TO A PLACE, NOT A STATION. The editor recorded the
 *   pull's centre from the road as drawn — which after the first drag is the
 *   WARPED road — and the builder replayed it against the pristine one.
 *   Measured over ten drags, the tenth pull's centre sat 192 u from the spline
 *   it was replayed against: aim at 72% of the lap, move 19% of it.
 *
 * And the repair path, because a scene already knotted has to be fixable: a
 * road move is selectable and deletable, which UNDO alone could not reach.
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
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const { WorldEditor } = await import('./src/editor.js');
  const out = {};

  /** Worst per-station tangent turn on the current lap, in degrees, plus how
   *  many stations exceed the builder's own 13-degree cap. */
  const census = () => {
    const t = g.track, N = t.center.length;
    let worst = 0, over = 0;
    for (let i = 0; i < N; i++) {
      const p0 = t.center[(i - 1 + N) % N], p1 = t.center[i], p2 = t.center[(i + 1) % N];
      const a1 = Math.atan2(p1.x - p0.x, p1.z - p0.z);
      const a2 = Math.atan2(p2.x - p1.x, p2.z - p1.z);
      let d = a2 - a1;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      d = Math.abs(d) * 180 / Math.PI;
      if (d > worst) worst = d;
      if (d > 13.5) over++;
    }
    return { worst: +worst.toFixed(2), over };
  };

  /** Places where the lap runs back over itself: close in world space, far
   *  apart along the lap, and at the same height (a flyover is not a knot). */
  const crossings = () => {
    const t = g.track, N = t.center.length;
    let n = 0;
    for (let i = 0; i < N; i += 3) {
      for (let j = i + 60; j < N - 3; j += 3) {
        if (Math.min(j - i, N - (j - i)) < 60) continue;
        const a = t.center[i], b = t.center[j];
        if (Math.abs(a.y - b.y) > 4) continue;
        if (Math.hypot(a.x - b.x, a.z - b.z) < 20) { n++; break; }
      }
    }
    return n;
  };

  const rebuild = (ed) => new Promise((res) => {
    g.editScene = ed ? ed.buildPayload() : null;
    g.rebuildWorld();
    res();
  });

  // ---- the shipped lap is the control -------------------------------------
  await rebuild(null);
  out.shipped = census();
  out.shippedCross = crossings();

  // ---- TEN ORDINARY DRAGS ---------------------------------------------------
  // Driven through the real handler: grab a handle, drop it 120 u off the
  // road, let go. This is the gesture that produced the reported world.
  const ed = new WorldEditor(g);
  g.editor = ed;
  ed.enter();
  ed._pickTool('route');
  const drags = [];
  for (let k = 0; k < 10; k++) {
    ed._routeMarks();
    const st = (60 + k * 79) % g.track.center.length;
    const c = g.track.center[st], nr = g.track.nrm[st];
    const side = k % 2 ? -1 : 1;
    ed._drag = { i: st, ox: c.x, oz: c.z, mesh: { position: { set() {} } },
      nx: c.x + nr.x * 120 * side, nz: c.z + nr.z * 120 * side };
    ed._endRouteDrag();
    drags.push(st);
    await rebuild(ed);
  }
  out.warps = ed.warp.length;
  out.warped = census();
  out.warpedCross = crossings();

  // EVERY warp is anchored to the station it grabbed, and that station's
  // PRISTINE position — the drift that made the knot is what this measures.
  const pre = g.track._preWarp;
  out.anchorsCarryStation = ed.warp.every((w) => w.i != null);
  out.worstAnchorDrift = +Math.max(...ed.warp.map((w) => {
    const p = pre[w.i];
    return p ? Math.hypot(p.x - w.x, p.z - w.z) : 999;
  })).toFixed(2);

  // ---- the repair path: a road move can be taken back ---------------------
  ed._pickTool('select');
  const victim = ed.warp[4];
  ed._selectAt({ x: victim.x, z: victim.z });
  out.warpSelectable = ed.sel && ed.sel.kind === 'warp';
  out.warpNamed = ed._selName();
  const before = ed.warp.length;
  ed.deleteSelection();
  out.warpDeleted = ed.warp.length === before - 1;
  ed._undo();
  out.warpDeleteUndone = ed.warp.length === before;

  // and clearing them all puts the lap back exactly
  ed._act('clearing the road moves', () => { ed.warp = []; });
  await rebuild(ed);
  out.repaired = census();
  out.repairedCross = crossings();

  // ---- CHECK now looks at the lap, not just at what stands beside it ------
  // Deliberately mangled rather than warped: with the cap in front of the
  // warp, ten drags no longer knot anything — which is the point of the fix,
  // and means the knot has to be built by hand to prove the DETECTOR works.
  // A scene loaded from an older build, or a future tool, can still present a
  // lap like this, and CHECK used to call it "nothing to report".
  await rebuild(null);
  {
    const t = g.track, N = t.center.length;
    // a cusp: fold three stations back on themselves
    const a = t.center[200], b = t.center[201], c = t.center[202];
    b.x = a.x + (a.x - c.x) * 0.9; b.z = a.z + (a.z - c.z) * 0.9;
    // and a self-crossing: drag a distant stretch on top of station 100
    const target = t.center[100];
    for (let k = -6; k <= 6; k++) {
      const q = t.center[((400 + k) % N + N) % N];
      q.x = target.x + k * 1.5; q.z = target.z + k * 1.5;
      q.y = target.y;
    }
    const eC = new WorldEditor(g);
    eC._check();
    out.checkKnot = eC.root.querySelector('#ed-modal-body').textContent;
    eC.dispose();
  }

  // ---- CHECK reads the LOCAL half-width, not the constant -----------------
  await rebuild(null);
  const eW = new WorldEditor(g);
  eW.radius = 60; eW.strength = 8; eW._widenStep = 8;
  const st300 = g.track.center[300];
  for (let k = 0; k < 4; k++) eW._widenAt({ x: st300.x, z: st300.z });
  await rebuild(eW);
  const halfNow = g.track.widthAt(300);
  const nr300 = g.track.nrm[300];
  const c300 = g.track.center[300];
  eW.preset = 'shed'; eW.tool = 'place';
  eW._place({ x: c300.x + nr300.x * (halfNow - 3), z: c300.z + nr300.z * (halfNow - 3) });
  eW._check();
  out.widenHalf = +halfNow.toFixed(1);
  out.checkWiden = eW.root.querySelector('#ed-modal-body').textContent;
  eW.dispose();

  // ---- the editor gates tunnels on the BUILDER's separation rule ----------
  await rebuild(null);
  const eT = new WorldEditor(g);
  eT.roadMode = 'tunnel';
  const N2 = g.track.center.length;
  for (const st of [120, 240, 360, 480]) {
    const c = g.track.center[st];
    eT._roadAt({ x: c.x, z: c.z });
  }
  out.tunnelsAsked = eT.roadFeat.tunnels.length;
  await rebuild(eT);
  out.tunnelsBuilt = (g.track._tunnels || []).length;
  out.tunnelSep = N2;
  eT.dispose();

  ed.exit();
  ed.dispose();
  g.editScene = null;
  g.rebuildWorld();
  return out;
});

console.log('\n--- the shipped lap is clean, and stays that way ---');
ok(R.shipped.over === 0 && R.shipped.worst < 20,
  'PINE VALLEY turns no faster than a car can steer',
  `worst ${R.shipped.worst}°, ${R.shipped.over} over cap`);
ok(R.shippedCross === 0, 'and never runs back over itself', R.shippedCross);

console.log('\n--- ten ordinary MOVE ROAD drags ---');
ok(R.warps === 10, 'all ten pulls are recorded', R.warps);
ok(R.anchorsCarryStation, 'each is anchored to the station it grabbed');
ok(R.worstAnchorDrift < 1,
  'and to that station\'s PRISTINE position — no drift, whatever came before',
  `worst ${R.worstAnchorDrift} u`);
ok(R.warped.over === 0,
  'the warped lap still turns no faster than a car can steer — the cap now sees the warp',
  `worst ${R.warped.worst}°, ${R.warped.over} over cap`);
ok(R.warped.worst < 20,
  'so no cusp survives the rebuild', `worst ${R.warped.worst}°`);

console.log('\n--- a road move can be taken back ---');
ok(R.warpSelectable && R.warpNamed === 'a road move',
  'SELECT picks up a road move', `${R.warpNamed}`);
ok(R.warpDeleted, 'DELETE removes it');
ok(R.warpDeleteUndone, 'and that undoes');
ok(R.repaired.over === 0 && R.repairedCross === 0,
  'clearing every road move restores a clean lap',
  `worst ${R.repaired.worst}°, ${R.repairedCross} crossings`);

console.log('\n--- CHECK looks at the lap itself ---');
ok(!/Nothing to report/i.test(R.checkKnot),
  'a knotted lap is not called clean', R.checkKnot.slice(0, 90));
ok(/turns faster/i.test(R.checkKnot) && /runs back over itself/i.test(R.checkKnot),
  'it names BOTH the cusp and the self-crossing', R.checkKnot.slice(0, 190));
ok(R.widenHalf > 12,
  'WIDEN really opened the carriageway past the 9 u constant', `${R.widenHalf} u`);
ok(/carriageway/i.test(R.checkWiden),
  'and a shed inside the WIDENED road is reported, not measured against ROAD_HALF',
  R.checkWiden.slice(0, 120));

console.log('\n--- the editor gates tunnels on the builder\'s own rule ---');
ok(R.tunnelsAsked === R.tunnelsBuilt,
  'every tunnel the editor accepts is a tunnel the world builds',
  `asked ${R.tunnelsAsked}, built ${R.tunnelsBuilt}`);

console.log('\n--- and none of it throws ---');
ok(errors.length === 0, 'no page errors', errors.slice(0, 4).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
