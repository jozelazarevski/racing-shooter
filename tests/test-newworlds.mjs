/* THE FOUR NEW WORLDS ACTUALLY BUILD.
 *
 * These four (OLIVE COAST, LANTERN QUARTER, HEDGEROW DASH, RED CENTRE RUN) were
 * authored in four separate worktrees against the same base and then merged in
 * sequence, which means every shared table — the level array, THEMES, the
 * element kits, the prop mixes — was hand-resolved. A union resolution that
 * drops one line produces a world that looks fine in the level list and throws
 * the moment you try to build it.
 *
 * So this asserts the cheapest thing that could possibly catch that: the world
 * builds, the track closes, the player lands on it, and no console error was
 * raised on the way. Nothing here is about art direction — the per-world tests
 * do that. This is the smoke test for the merge itself.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const NEW = [[29, 'OLIVE COAST', 'medterrace'], [30, 'LANTERN QUARTER', 'oldtown'],
             [31, 'HEDGEROW DASH', 'farmland'], [32, 'RED CENTRE RUN', 'outback'],
             [33, 'RED BULL RING', 'alpine'], [34, 'MONACO STREETS', 'medterrace'],
             [35, 'SILVERSTONE', 'farmland'], [36, 'SPA-FRANCORCHAMPS', 'forest'],
             [37, 'SUZUKA', 'redwood'], [38, 'NORDSCHLEIFE', 'forest'],
             [39, 'MONZA', 'medterrace'], [40, 'MARINA BAY', 'neon'],
             [41, 'MOUNT PANORAMA', 'outback'], [42, 'RALLYCROSS ARENA', 'flume'],
             [43, 'OULTON PARK', 'farmland'], [44, 'LAGUNA SECA', 'canyon'],
             [45, 'TOUR DE CORSE', 'medterrace']];

// The roster must agree with what we think we merged, before any of it is built.
const probe = await browser.newPage({ viewport: { width: 640, height: 400 } });
await probe.goto(`${BASE}/?unlockall=1`, { waitUntil: 'load' });
await probe.waitForFunction(() => window.__LEVELS, undefined, { timeout: 120000 });
const roster = await probe.evaluate(() => window.__LEVELS.map((l) => ({ id: l.id, name: l.name, theme: l.theme, region: l.region })));
await probe.close();
for (const [id, name, theme] of NEW) {
  const l = roster.find((r) => r.id === id);
  check(`${name} is on the roster`, !!l && l.name === name && l.theme === theme,
    l ? JSON.stringify(l) : 'missing');
}
// Career order is the array, and starCost prices by INDEX — an id collision or
// a duplicate would silently re-price a save.
const ids = roster.map((r) => r.id);
check('no duplicate level ids', new Set(ids).size === ids.length,
  `${ids.length} levels, ${new Set(ids).size} distinct`);
check('the new worlds are appended at the END of the array, in order',
  ids.slice(-17).join(',') === NEW.map(([id]) => id).join(','),
  `tail is ${ids.slice(-6).join(',')}`);

for (const [id, name] of NEW) {
  const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });

  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load' });
  const built = await p.waitForFunction(() => window.__game?.track?.center?.length && window.__game.player,
    undefined, { timeout: 300000 }).then(() => 1).catch(() => 0);
  check(`${name}: the world builds`, !!built, built ? '' : 'timed out — see errors below');
  if (!built) {
    if (errs.length) console.log('      ' + errs.slice(0, 3).join('\n      '));
    await p.close();
    continue;
  }

  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track, c = t.center;
    const seg = [];
    for (let i = 0; i < c.length; i++) {
      const n = c[(i + 1) % c.length];
      seg.push(Math.hypot(n.x - c[i].x, n.z - c[i].z));
    }
    // The player must be ON the built road, not at the origin or under it.
    const i = t.nearestIndex(g.player.pos);
    return {
      n: c.length,
      closed: +Math.hypot(c[0].x - c[c.length - 1].x, c[0].z - c[c.length - 1].z).toFixed(1),
      segMax: +Math.max(...seg).toFixed(2),
      lateral: +Math.abs(t.lateralOffset(g.player.pos, i)).toFixed(2),
      // groundHeightAtPos needs the caller's index hint — it interpolates from
      // that sample, it does not search.
      drop: +(g.player.pos.y - t.groundHeightAtPos(g.player.pos, i)).toFixed(2),
      theme: t.T?.surface ?? 'dry',
      props: (t.props ?? []).length,
      solids: (t.solids ?? []).length,
    };
  });

  check(`${name}: the lap is a closed loop`, r.closed < 3 * r.segMax,
    `${r.n} samples, ends ${r.closed} u apart (seg ${r.segMax})`);
  check(`${name}: the player starts on the road`, r.lateral < 9 && Math.abs(r.drop) < 3,
    `lateral ${r.lateral} u, ${r.drop} u above the ground`);

  const terrain = await p.evaluate(() => {
    let big = null, bigN = 0;
    window.__game.scene.traverse((o) => {
      const n = o.isMesh ? (o.geometry?.attributes?.position?.count ?? 0) : 0;
      if (n > bigN) { bigN = n; big = o; }           // the ground plane is the biggest mesh
    });
    const col = big?.geometry?.attributes?.color;
    if (!col) return { meanL: -1, minL: -1, maxL: -1 };
    const a = col.array, s = col.itemSize;
    let sum = 0, min = 1, max = 0;
    for (let i = 0; i < col.count; i++) {
      const L = 0.2126 * a[i * s] + 0.7152 * a[i * s + 1] + 0.0722 * a[i * s + 2];
      sum += L; if (L < min) min = L; if (L > max) max = L;
    }
    return { meanL: +(sum / col.count).toFixed(3), minL: +min.toFixed(3), maxL: +max.toFixed(3) };
  });
  check(`${name}: built without a console error`, errs.length === 0,
    errs.length ? errs.slice(0, 2).join(' | ') : 'clean');

  // THE GROUND HAS TO BE VISIBLE.
  //
  // HEDGEROW DASH shipped from its worktree with terrainLow/High/Dirt at
  // relative luminances 0.102 / 0.234 / 0.061 — the whole palette below the
  // DARK end of every other world (forest 0.201-0.381), paired with the
  // roster's second-weakest sun and, at 0.58, its lowest hemisphere light.
  // Each colour is a fair sample of a wet field; together they rendered a
  // world you could not see to drive in, and nothing in the build, the
  // geometry or the placement tests noticed, because all of those passed.
  //
  // Measured on the terrain's vertex colours, which is where the world's tone
  // actually comes from — a screenshot would fold in the HUD, the fog and the
  // time of day. The floor is deliberately loose: this is a "can you see the
  // ground" gate, not an art-direction change-detector. Night worlds are
  // exempt, which is why only LANTERN QUARTER carries a lower bar.
  const night = await p.evaluate(() => (window.__game.track.T.hemiIntensity ?? 1) > 2);
  const floor = night ? 0.03 : 0.15;
  check(`${name}: the terrain is bright enough to drive on`, terrain.meanL >= floor,
    `mean vertex luminance ${terrain.meanL} (min ${terrain.minL}, max ${terrain.maxL}), floor ${floor}`);
  console.log(`NOTE  ${name}: ${r.props} props, ${r.solids} solids, surface ${r.theme}`);

  await p.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nall four new worlds build');
process.exit(fail ? 1 : 0);
