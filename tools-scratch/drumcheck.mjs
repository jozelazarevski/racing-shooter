/* THE DRUM: A FULL-HEIGHT CLIFF STANDING ON THE KERB OF A HAIRPIN.
 *
 * On the INSIDE of a tight corner a wall set back further than the corner's
 * radius would fold through itself, so `_buildCliffCaps` correctly refuses and
 * pulls it in — often all the way to its floor, `widthAt + 2.3`. But it only
 * moves the wall SIDEWAYS. The height is untouched, so what gets built is the
 * theme's full cliff (28 u on ravine, 30 on canyon) standing about 11 u from
 * the centreline and wrapped round an 18 u radius: a closed drum the car sits
 * inside, with the road invisible from above.
 *
 * Measure the combination, because neither half alone is a defect: a wall at
 * the kerb is fine if it is low, and a tall wall is fine if it is far away.
 * Report stations where the cap pulled the base most of the way in AND the
 * wall is still full height, and how tall it is relative to how far away.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '4,7,10,18,27,44').split(',').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 240 } });
p.setDefaultTimeout(600000);
console.log('  world                 drums  worst h/dist   at   radius  base  height  natural base');
for (const id of IDS) {
  await p.goto(`${BASE}/?level=${id}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track, N = t.center.length;
    if (!t.T.cliffWalls || !t._cliffCap) return null;
    const WALL_OFF = 10.4;
    let drums = 0, worst = 0, at = -1, info = null;
    for (let j = 0; j < N; j++) {
      const tt = j * (Math.PI * 2 / N);
      for (let s = 0; s < 2; s++) {
        const side = s ? -1 : 1, ph = side * 2.13;
        const raw = WALL_OFF + 0.65 + (t.T.cliffSetback ?? 0)
          + 0.24 * (Math.sin(31 * tt + 2.2 + ph) + 1);
        const got = t._cliffCap[j * 2 + s];
        if (got >= raw - 1e-6) continue;                 // cap did not bind
        const P = t._cliffProfile(j, side);
        // a wall is a DRUM when it is tall compared with how far off it stands
        const ratio = P.h / Math.max(got, 0.1);
        if (got < raw * 0.55 && ratio > 1.4) drums++;
        if (ratio > worst) {
          worst = ratio; at = j;
          info = { radius: +(1 / Math.max(t.curvature?.[j] ?? 1e-6, 1e-6)).toFixed(1),
            base: +got.toFixed(1), h: +P.h.toFixed(1), raw: +raw.toFixed(1) };
        }
      }
    }
    return { name: g.level?.name, drums, worst: +worst.toFixed(2), at, ...info };
  });
  if (!r) continue;
  console.log(`  L${String(id).padStart(2)} ${String(r.name).padEnd(20)} ${String(r.drums).padStart(4)} `
    + `${String(r.worst).padStart(11)}  ${String(r.at).padStart(4)} ${String(r.radius).padStart(7)} `
    + `${String(r.base).padStart(6)} ${String(r.h).padStart(6)} ${String(r.raw).padStart(10)}`);
}
await b.close();
