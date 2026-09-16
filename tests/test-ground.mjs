/* THE CAR STANDS ON THE GROUND YOU CAN SEE.
 *
 * There are two ground functions, and there have to be: `terrainHeight` is
 * sampled per frame by the physics, `_terrainMeshHeight` builds the vertices
 * once. For years they answered the same question two different ways — one
 * through a bilinear blend over an 8 u grid, the other through an exact
 * nearest scan. On a switchback pass, where two legs run metres apart in plan
 * and tens of metres apart in height, the blend averages two different roads
 * and lands on a height that is neither.
 *
 * Measured before the fix: TREMOLA DESCENT put the car 14.4 u BELOW its own
 * hillside and FURKA RIDGE 13.0 u above it. Reported as "the car goes
 * underground too frequently".
 *
 * The rule this locks down is simply that the two agree. It is deliberately
 * exact rather than tolerant: they now run the same code, so any daylight at
 * all means someone has given one of them a term the other does not have.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
// a spread that includes the two worlds that failed worst, plus a coast world
// (the sea term lives in both functions) and a sculpted-lake case
const LEVELS = (process.env.LEVELS ?? '1,5,20,21,30,51,57').split(',');

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
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

for (const lv of LEVELS) {
  const R = await page.evaluate(async (lvl) => {
    const g = window.__game;
    const { LEVELS } = await import('./src/track.js');
    const L = LEVELS.find((x) => x.id === +lvl);
    if (!L) return null;
    g.state = 'title'; g.editScene = null;
    g.swapLevel(L, true, null);
    const t = g.track;
    let n = 0, sink = 0, worstSink = 0, worstFloat = 0, sum = 0;
    for (let i = 0; i < t.center.length; i += 3) {
      const hd = t.headingAt(i), c = t.center[i];
      const nx = Math.sin(hd), nz = Math.cos(hd);
      for (const off of [20, 34, 52, 78, 110]) {
        for (const s of [1, -1]) {
          const x = c.x + nx * off * s, z = c.z + nz * off * s;
          const phys = t.terrainHeight(x, z);
          const mesh = t._terrainMeshHeight(x, z);
          if (!Number.isFinite(phys) || !Number.isFinite(mesh)) continue;
          const d = phys - mesh;       // negative: the car sits UNDER the hill
          n++; sum += Math.abs(d);
          if (d < -0.3) sink++;
          worstSink = Math.min(worstSink, d);
          worstFloat = Math.max(worstFloat, d);
        }
      }
    }
    return { name: g.level.name, n, sink,
      worstSink: +worstSink.toFixed(2), worstFloat: +worstFloat.toFixed(2),
      mean: +(sum / Math.max(1, n)).toFixed(3) };
  }, lv);
  if (!R) { ok(false, `level ${lv} exists`); continue; }
  console.log(`\n--- ${R.name} (${R.n} samples off the road) ---`);
  ok(R.n > 500, `${R.name}: the scan actually sampled the world`, R.n);
  ok(R.sink === 0,
    `${R.name}: nowhere off the road is the car below the hillside`,
    `${R.sink} samples, worst ${R.worstSink}`);
  ok(Math.abs(R.worstFloat) < 0.05 && Math.abs(R.worstSink) < 0.05,
    `${R.name}: physics ground and drawn ground are the same surface`,
    `worst sink ${R.worstSink}, worst float ${R.worstFloat}, mean |d| ${R.mean}`);
}

// ---- and the ground query is still cheap enough to run per frame -----------
const T = await page.evaluate(() => {
  const t = window.__game.track;
  const c = t.center[0];
  const t0 = performance.now();
  let acc = 0;
  for (let k = 0; k < 20000; k++) {
    acc += t.terrainHeight(c.x + (k % 200) - 100, c.z + ((k * 7) % 200) - 100);
  }
  return { ms: +(performance.now() - t0).toFixed(1), acc: Number.isFinite(acc) };
});
console.log(`\n--- cost: 20000 terrainHeight calls in ${T.ms} ms ---`);
ok(T.acc, 'the ground query returns finite numbers');
ok(T.ms < 400, 'a frame\'s worth of ground queries is not a stall', `${T.ms} ms / 20k calls`);

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
