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
             [31, 'HEDGEROW DASH', 'farmland'], [32, 'RED CENTRE RUN', 'outback']];

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
check('the four new worlds are at the END of the array',
  ids.slice(-4).join(',') === '29,30,31,32', `tail is ${ids.slice(-6).join(',')}`);

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
      drop: +(g.player.pos.y - t.groundHeightAtPos(g.player.pos)).toFixed(2),
      theme: t.T?.surface ?? 'dry',
      props: (t.props ?? []).length,
      solids: (t.solids ?? []).length,
    };
  });

  check(`${name}: the lap is a closed loop`, r.closed < 3 * r.segMax,
    `${r.n} samples, ends ${r.closed} u apart (seg ${r.segMax})`);
  check(`${name}: the player starts on the road`, r.lateral < 9 && Math.abs(r.drop) < 3,
    `lateral ${r.lateral} u, ${r.drop} u above the ground`);
  check(`${name}: built without a console error`, errs.length === 0,
    errs.length ? errs.slice(0, 2).join(' | ') : 'clean');
  console.log(`NOTE  ${name}: ${r.props} props, ${r.solids} solids, surface ${r.theme}`);

  await p.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nall four new worlds build');
process.exit(fail ? 1 : 0);
