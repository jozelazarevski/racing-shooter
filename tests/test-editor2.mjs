/* WORLD EDITOR, second pass: delete, recombine, weather, road features.
 *
 * Each of these can look like it works while doing nothing — a clear zone
 * that does not actually strip the wood, a palette swap that leaves the old
 * colours, a weather deck the physics never hears about. So every check here
 * measures the REBUILT world, not the editor's own intentions.
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
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 300000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const out = {};
  const { WorldEditor } = await import('./src/editor.js');
  const ed = new WorldEditor(g);
  g.editor = ed;
  ed.enter();

  // count what the world scatters inside a disc, before and after a clear zone
  const c = g.track.center[30];
  const h = g.track.headingAt(30);
  const px = c.x + Math.cos(h) * 120, pz = c.z - Math.sin(h) * 120;
  const R0 = 70;
  const countIn = (t) => {
    let n = 0;
    for (const tr of t.trees || []) {
      if (Math.hypot(tr.x - px, tr.z - pz) < R0) n++;
    }
    return n;
  };
  out.treesBefore = countIn(g.track);
  out.themeBefore = g.track.T.foliageLow;

  // --- CLEAR AREA ---------------------------------------------------------
  ed.radius = R0;
  ed._eraseWorldAt({ x: px, z: pz });
  g.editScene = ed.buildPayload();
  g.rebuildWorld();
  out.treesAfter = countIn(g.track);
  out.zonesSeen = (g.track.edit && g.track.edit.erase || []).length;

  // trees elsewhere must survive — a clear zone is local, not a bulldozer
  const far = g.track.center[300];
  out.treesFar = (g.track.trees || []).filter((t) =>
    Math.hypot(t.x - far.x, t.z - far.z) < 120).length;

  // --- WORLD RECIPE: another world's look on this route --------------------
  ed.themeName = 'desert';
  g.editScene = ed.buildPayload();
  g.rebuildWorld();
  out.themeAfter = g.track.T.foliageLow;
  out.levelUnchanged = g.level.id;
  out.routeSame = g.track.center.length;

  // --- WEATHER -------------------------------------------------------------
  ed.weather = 'snow';
  g.editScene = ed.buildPayload();
  g.rebuildWorld();
  out.weather = g.track.T.weather && g.track.T.weather.type;
  out.surface = g.track.T.surface;
  ed.weather = 'clear';
  g.editScene = ed.buildPayload();
  g.rebuildWorld();
  out.weatherCleared = g.track.T.weather;

  // --- ROAD FEATURES -------------------------------------------------------
  // These used to be COUNTS — "one more tunnel, somewhere" — and the builder
  // chose the site, which is why tapping the ground appeared to do nothing.
  // They are now SITED: the tap picks the nearest point on the lap and the
  // bore is cut there, so the test has to hand _roadAt a place.
  ed.roadMode = 'tunnel';
  const tk = g.track, nn = tk.center.length;
  const lenS = Math.round(80 / tk.segLen);
  let straight = -1, sc = Infinity;
  for (let i = 0; i < nn; i++) {
    if (tk._circDist(i, 0) < 120) continue;
    let m = 0;
    for (let w = -lenS; w <= lenS; w++) m = Math.max(m, tk.curvature[(i + w + nn) % nn]);
    if (m < sc) { sc = m; straight = i; }
  }
  out.straightCurv = sc;
  ed._roadAt({ x: tk.center[straight].x, z: tk.center[straight].z });
  out.tunnelsAsked = ed.roadFeat.tunnels.length;
  g.editScene = ed.buildPayload();
  g.rebuildWorld();
  out.tunnelsInTheme = g.track.T.tunnels && g.track.T.tunnels.count;
  out.tunnelsSited = !!(g.track.T.tunnels && g.track.T.tunnels.at);

  // --- round trip ----------------------------------------------------------
  const json = JSON.stringify(ed.serialize());
  const ed2 = new WorldEditor(g);
  ed2.load(JSON.parse(json));
  out.rtZones = ed2.erase.length;
  out.rtTheme = ed2.themeName;
  out.rtTunnels = ed2.roadFeat.tunnels.length;
  out.bytes = json.length;

  // --- and a scene with nothing set must leave the world alone -------------
  g.editScene = null;
  g.rebuildWorld();
  out.cleanTrees = countIn(g.track);
  out.cleanTheme = g.track.T.foliageLow;
  return out;
});

console.log('\n--- world editor: delete, recombine, weather, road ---');
ok(R.treesBefore > 0, 'the test disc had trees to begin with', R.treesBefore);
ok(R.treesAfter === 0, 'CLEAR AREA strips the world\'s own scenery',
  `${R.treesBefore} -> ${R.treesAfter}`);
ok(R.zonesSeen === 1, 'the rebuilt Track receives the clear zones', R.zonesSeen);
ok(R.treesFar > 0, 'a clear zone is local — the rest of the wood survives', R.treesFar);
ok(R.themeAfter !== R.themeBefore, 'WORLD RECIPE swaps the palette',
  `${R.themeBefore} -> ${R.themeAfter}`);
ok(R.levelUnchanged === 1 && R.routeSame > 0,
  'the recipe keeps the route it was built on', `level ${R.levelUnchanged}`);
ok(R.weather === 'snow' && R.surface === 'snow',
  'WEATHER reaches the theme the world and physics read', `${R.weather}/${R.surface}`);
ok(!R.weatherCleared, 'CLEAR weather removes a deck the theme shipped with',
  String(R.weatherCleared));
// PINE VALLEY may have no straight long enough to bore — that refusal is the
// correct answer, and the tool now says so at tap time rather than building
// nothing at APPLY. Assert whichever outcome the route actually earns.
if (R.straightCurv <= 0.013) {
  ok(R.tunnelsAsked === 1 && R.tunnelsInTheme === 1 && R.tunnelsSited,
    'ROAD features reach the builder, sited where they were asked for',
    `${R.tunnelsAsked}/${R.tunnelsInTheme}/at:${R.tunnelsSited}`);
} else {
  ok(R.tunnelsAsked === 0,
    'a route with no straight long enough refuses the bore instead of faking it',
    `curv ${R.straightCurv.toFixed(4)} > 0.013, asked ${R.tunnelsAsked}`);
}
ok(R.rtZones === 1 && R.rtTheme === 'desert' && R.rtTunnels === R.tunnelsAsked,
  'a saved scene reloads its zones, recipe and road features',
  `${R.rtZones}/${R.rtTheme}/${R.rtTunnels}`);
ok(R.bytes < 8000, 'the extended scene still serialises small', R.bytes);
ok(R.cleanTrees === R.treesBefore && R.cleanTheme === R.themeBefore,
  'clearing every edit restores the original world exactly',
  `${R.cleanTrees}/${R.treesBefore}`);
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
