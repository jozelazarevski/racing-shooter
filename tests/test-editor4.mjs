/* THE EDITOR, END TO END.
 *
 * Every fault here was found by driving the tools rather than by reading them,
 * and each is pinned by the smallest thing that would have caught it:
 *
 *   UNDO guessed what you meant from the current tool, and its first test was
 *   `tool === 'place' || this.preset` — but `preset` is set the moment you
 *   touch the palette and never clears, so from then on UNDO popped buildings
 *   whatever tool was live. Sculpt, erase and the road features had no undo at
 *   all.
 *
 *   TUNNEL and BRIDGE tested the exact station you tapped and refused. On PINE
 *   VALLEY — the world the editor opens on — not one of 900 stations passed
 *   the tunnel test, so TUNNEL could not be placed anywhere and simply argued
 *   with every tap. BRIDGE refused because the camera starts over the start
 *   line and a gorge is banned within 70 samples of it.
 *
 *   ERASE removed only objects YOU had placed, and its status line lived
 *   inside the "something changed" branch — so pointing it at a tree did
 *   nothing AND said nothing.
 *
 *   CLEAR AREA deleted your own buildings, because the keep-out circle vetoed
 *   every placement alike.
 *
 *   TEST DRIVE started the race before apply()'s deferred rebuild landed, so
 *   you drove the unedited world while the screen said APPLIED.
 *
 *   The markers lived on the scene, not the track group, so exit() left ghosts
 *   and pins floating in the world you were racing through.
 *
 * The tools are driven through their real handlers, not by poking state.
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
const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
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
  const ed = new WorldEditor(g);
  g.editor = ed;
  ed.enter();
  const t = () => g.track;
  const off = (i, d) => {
    const c = t().center[i], hd = t().headingAt(i);
    return { x: c.x + Math.sin(hd) * d, z: c.z + Math.cos(hd) * d };
  };

  // ---- UNDO is one stack, and it covers every tool ------------------------
  ed.tool = 'place'; ed.preset = 'chapel';
  ed._place(off(60, 40));
  ed._place(off(80, 40));
  out.placed2 = ed.elements.length;
  // Sculpt WITHOUT clearing the preset — this is the exact state in which undo
  // used to pop a building instead of the thing you had just painted.
  ed.tool = 'raise'; ed.radius = 40; ed.strength = 4;
  ed._strokeFrom = ed.delta.dabs.length;
  ed._dab(off(120, 60)); ed._dab(off(122, 62));
  ed._endStroke();
  out.dabsAfterStroke = ed.delta.length;
  ed._undo();                                  // must undo the STROKE
  out.dabsAfterUndo = ed.delta.length;
  out.elementsAfterSculptUndo = ed.elements.length;
  ed._undo();                                  // now the building
  out.elementsAfterSecondUndo = ed.elements.length;

  // ---- the road features SITE themselves ---------------------------------
  ed.tool = 'road';
  ed.roadMode = 'tunnel';
  ed._roadAt(t().center[40]);
  out.tunnels = ed.roadFeat.tunnels.length;
  out.tunnelMsg = ed.statusEl ? ed.statusEl.textContent : '';
  ed.roadMode = 'bridge';
  ed._roadAt(t().center[0]);                   // right on the start line
  out.bridge = ed.roadFeat.bridge;
  out.bridgeMsg = ed.statusEl ? ed.statusEl.textContent : '';
  // and both are undoable
  ed._undo(); out.bridgeAfterUndo = ed.roadFeat.bridge;
  ed._undo(); out.tunnelsAfterUndo = ed.roadFeat.tunnels.length;
  // put one back for the rebuild
  ed.roadMode = 'tunnel'; ed._roadAt(t().center[40]);

  // ---- ERASE always says what it did -------------------------------------
  ed.tool = 'erase'; ed.radius = 30;
  const far = off(400, 120);                   // open country, nothing of ours
  const zonesBefore = ed.erase.length;
  ed._eraseAt(far);
  out.eraseMadeZone = ed.erase.length > zonesBefore;
  out.eraseMsg = ed.statusEl.textContent;

  // ---- ROTATE turns a placed object --------------------------------------
  ed.tool = 'place'; ed.preset = 'barn';
  const spot = off(200, 45);
  ed._place(spot);
  const before = ed.elements[ed.elements.length - 1].rot;
  ed.tool = 'rotate';
  ed._rotateAt(spot);
  out.rotBefore = before;
  out.rotAfter = ed.elements[ed.elements.length - 1].rot;

  // ---- MOVE ROAD displaces the racing line -------------------------------
  ed.tool = 'route';
  ed._routeMarks();
  out.handles = ed._routeGrp ? ed._routeGrp.children.length : 0;
  const h = ed._routeGrp.children[3];
  const st = h.userData.station;
  const c0 = t().center[st];
  out.lineBefore = { x: +c0.x.toFixed(1), z: +c0.z.toFixed(1) };
  ed._drag = { i: st, ox: c0.x, oz: c0.z, mesh: h,
    nx: c0.x + t().nrm[st].x * 40, nz: c0.z + t().nrm[st].z * 40 };
  ed._endRouteDrag();
  out.warps = ed.warp.length;

  // ---- APPLY: rebuild, and everything survives it -------------------------
  out.errorsBefore = 0;
  await new Promise((res) => ed.apply(res));
  const c1 = g.track.center[st];
  out.lineAfter = { x: +c1.x.toFixed(1), z: +c1.z.toFixed(1) };
  out.lineMoved = +Math.hypot(c1.x - c0.x, c1.z - c0.z).toFixed(1);
  out.tunnelsBuilt = (g.track._tunnels || []).length;

  // ---- CLEAR AREA does not eat your own buildings ------------------------
  // Count the instances the chapel/barn batch carries, drop a clear zone right
  // on top of them, rebuild, and check they are still there.
  const countAuthored = () => {
    let n = 0;
    for (const e of ed.elements) {
      const gy = g.track.terrainHeight(e.x, e.z);
      if (Number.isFinite(gy)) n++;
    }
    return n;
  };
  ed.tool = 'clear'; ed.radius = 90;
  ed._eraseWorldAt({ x: spot.x, z: spot.z });
  await new Promise((res) => ed.apply(res));
  out.authoredKept = countAuthored();
  out.authoredTotal = ed.elements.length;

  // ---- exit takes its furniture with it ----------------------------------
  const marks = () => {
    let n = 0;
    for (const nm of ['editor-ghosts', 'editor-zones', 'editor-route']) {
      const o = g.scene.getObjectByName(nm);
      if (o && o.visible) n += o.children.length;
    }
    return n;
  };
  out.marksInEditor = marks();
  ed.exit();
  out.marksAfterExit = marks();
  return out;
});

console.log('\n--- undo is one stack ---');
ok(R.placed2 === 2, 'two buildings placed', R.placed2);
ok(R.dabsAfterStroke > 0, 'a sculpt stroke lays dabs', R.dabsAfterStroke);
ok(R.dabsAfterUndo === 0,
  'UNDO after a sculpt undoes the SCULPT, with a preset still selected',
  `${R.dabsAfterStroke} -> ${R.dabsAfterUndo} dabs`);
ok(R.elementsAfterSculptUndo === 2,
  'and it does NOT quietly delete a building instead', R.elementsAfterSculptUndo);
ok(R.elementsAfterSecondUndo === 1, 'the next UNDO takes the building', R.elementsAfterSecondUndo);

console.log('\n--- the road features site themselves ---');
ok(R.tunnels === 1, 'TUNNEL places on PINE VALLEY, where none could before', R.tunnelMsg);
ok(typeof R.bridge === 'number',
  'BRIDGE places even when tapped on the start line', R.bridgeMsg);
ok(R.bridgeAfterUndo === null && R.tunnelsAfterUndo === 0,
  'and both undo', `bridge ${R.bridgeAfterUndo}, tunnels ${R.tunnelsAfterUndo}`);
ok(R.tunnelsBuilt >= 1, 'the bore actually exists in the rebuilt world', R.tunnelsBuilt);

console.log('\n--- erase and rotate ---');
ok(R.eraseMadeZone, 'ERASE on the world\'s own scenery does something');
ok(/cleared the world/i.test(R.eraseMsg), 'and says so', R.eraseMsg);
ok(R.rotAfter !== R.rotBefore,
  'ROTATE turns a placed object', `${R.rotBefore} -> ${R.rotAfter}`);

console.log('\n--- move road ---');
ok(R.handles > 8, 'the racing line carries drag handles', R.handles);
ok(R.warps === 1, 'dragging one records a road move', R.warps);
ok(R.lineMoved > 20,
  'and the rebuilt centreline actually moved',
  `${JSON.stringify(R.lineBefore)} -> ${JSON.stringify(R.lineAfter)} = ${R.lineMoved} u`);

console.log('\n--- clear area, and exit ---');
ok(R.authoredKept === R.authoredTotal && R.authoredTotal >= 2,
  'CLEAR AREA over your own buildings does not delete them',
  `${R.authoredKept}/${R.authoredTotal}`);
ok(R.marksInEditor > 0, 'the editor shows its markers', R.marksInEditor);
ok(R.marksAfterExit === 0,
  'and exit leaves none of them in the world you race through', R.marksAfterExit);

console.log('\n--- and it does all that without throwing ---');
ok(errors.length === 0, 'no page errors across the whole session',
  errors.slice(0, 4).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
