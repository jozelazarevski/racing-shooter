/* WORLD EDITOR — the contract that makes the tool trustworthy.
 *
 * The editor's whole promise is that what you sculpt is what the car drives
 * on. That promise breaks silently: this game has TWO ground functions
 * (terrainHeight for physics and scatter, _terrainMeshHeight for the mesh the
 * player sees), and a sculpt wired into one of them produced a world where
 * the numbers said "34 u hill" and the screen showed flat grass. So the
 * headline test here checks the DRAWN mesh and the PHYSICS ground together,
 * and fails if they ever disagree.
 */
import { chromium } from 'playwright-core';

// same contract as every other suite: a static server is already up
const BASE = process.env.BASE ?? 'http://localhost:8901';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 420 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const out = {};
  const { WorldEditor, TerrainDelta } = await import('./src/editor.js');

  // --- the falloff shape, before anything is built ------------------------
  const d = new TerrainDelta([{ x: 0, z: 0, r: 100, dh: 10, mode: 'raise' }]);
  out.centre = d.at(0, 0);
  out.rim = d.at(99.5, 0);
  out.outside = d.at(140, 0);
  out.monotonic = d.at(20, 0) > d.at(50, 0) && d.at(50, 0) > d.at(80, 0);

  // --- enter / exit --------------------------------------------------------
  g.editor = new WorldEditor(g);
  g.editor.enter();
  out.stateIn = g.state;
  out.uiUp = !document.getElementById('editor-ui').classList.contains('off');
  g.editor.exit();
  out.stateOut = g.state;
  out.uiDown = document.getElementById('editor-ui').classList.contains('off');
  g.editor.enter();

  // --- sculpt somewhere clear of the road ---------------------------------
  const c = g.track.center[30];
  const h = g.track.headingAt(30);
  const px = c.x + Math.cos(h) * 150, pz = c.z - Math.sin(h) * 150;
  out.offRoad = g.track._distToTrack(px, pz) > 60;
  out.meshBefore = sampleMesh(g.track, px, pz);
  out.physBefore = g.track.terrainHeight(px, pz);
  out.roadBefore = g.track.terrainHeight(c.x, c.z);

  g.editor.delta.add({ x: px, z: pz, r: 120, dh: 30, mode: 'raise' });
  g.editor.preset = 'barn';
  g.editor._place({ x: px + 30, z: pz + 30 });
  g.editScene = { delta: g.editor.delta, elements: g.editor.elements };
  g.rebuildWorld();

  out.meshAfter = sampleMesh(g.track, px, pz);
  out.physAfter = g.track.terrainHeight(px, pz);
  out.roadAfter = g.track.terrainHeight(c.x, c.z);

  // --- persistence round trip ---------------------------------------------
  const json = JSON.stringify(g.editor.serialize());
  const ed2 = new WorldEditor(g);
  ed2.load(JSON.parse(json));
  out.rtDelta = ed2.delta.at(px, pz);
  out.rtElems = ed2.elements.length;
  out.bytes = json.length;

  // --- a world with NO edits must be untouched ----------------------------
  g.editScene = null;
  g.rebuildWorld();
  out.cleanPhys = g.track.terrainHeight(px, pz);
  return out;

  function sampleMesh(track, x, z) {
    // the ground planes are pre-rotated: x -> x, y -> HEIGHT, z -> z
    let best = Infinity, bestY = null;
    track.group.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh) return;
      const gp = o.geometry && o.geometry.parameters;
      if (!gp || gp.width < 1200 || gp.width > 2500 || gp.widthSegments < 40) return;
      const pos = o.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const dd = (pos.getX(i) - x) ** 2 + (pos.getZ(i) - z) ** 2;
        if (dd < best) { best = dd; bestY = pos.getY(i); }
      }
    });
    return bestY;
  }
});

console.log('\n--- world editor ---');
ok(Math.abs(R.centre - 10) < 0.01, 'brush falloff: full strength at the centre', R.centre);
ok(R.rim < 0.05, 'brush falloff: meets zero at the rim (no crease)', R.rim);
ok(R.outside === 0, 'brush falloff: nothing outside the radius', R.outside);
ok(R.monotonic, 'brush falloff: falls away monotonically');
ok(R.stateIn === 'editor' && R.uiUp, 'enter: takes the state and puts its UI up');
ok(R.stateOut === 'title' && R.uiDown, 'exit: gives the state back and hides its UI');
ok(R.offRoad, 'test spot is clear of the road clamps', R.offRoad);

const physRise = R.physAfter - R.physBefore;
const meshRise = R.meshAfter - R.meshBefore;
ok(physRise > 25, 'APPLY moves the ground the physics stands on', physRise);
ok(meshRise > 25, 'APPLY moves the ground the player SEES', meshRise);
// the one that matters: the two grounds must never diverge
ok(Math.abs(physRise - meshRise) < 4,
  'the drawn ground and the physics ground agree (no silent split)',
  `phys ${physRise.toFixed(2)} vs mesh ${meshRise.toFixed(2)}`);
ok(Math.abs(R.roadAfter - R.roadBefore) < 0.5,
  'a sculpt beside the road leaves the carriageway alone',
  `${R.roadBefore} -> ${R.roadAfter}`);
ok(Math.abs(R.rtDelta - 30) < 0.01 && R.rtElems === 1,
  'a saved scene reloads to the same ground and the same objects');
ok(R.bytes < 4000, 'a scene serialises small enough for localStorage', R.bytes);
ok(Math.abs(R.cleanPhys - R.physBefore) < 0.01,
  'clearing the edits restores the original world exactly',
  `${R.physBefore} -> ${R.cleanPhys}`);
ok(errors.length === 0, 'no page errors while editing', errors.slice(0, 3).join(' | '));

await browser.close();

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
