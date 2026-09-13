/* IS THE TUNNEL IN A MOUNTAIN, OR IN A BERM?
 * Stand at the bore's midpoint and ask how high the ground is over the road
 * directly above it, and how far out that hill still stands. A berm answers
 * "13 u and gone by 34"; a mountain does not. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);
for (const id of process.argv.slice(2).map(Number)) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const r = await page.evaluate(() => {
    const t = window.__game.track;
    const out = [];
    for (const T of (t._tunnels ?? [])) {
      const i = T.mid, c = t.center[i];
      // crown: straight up over the bore line. Sampled just off the corridor,
      // because inside it the ground is deliberately held BELOW the roadway.
      const prof = [];
      for (const d of [20, 40, 80, 140, 200]) {
        let hi = -1e9;
        for (const side of [1, -1]) {
          const p = t.pointAt(i, d * side);
          hi = Math.max(hi, t.terrainHeight(p.x, p.z) - c.y);
        }
        prof.push(`${d}u:${hi.toFixed(0)}`);
      }
      out.push({ mid: i, ridge: T.h, prof: prof.join('  '),
        halfWidth: +(t.widthAt ? t.widthAt(i) : 9).toFixed(1) });
    }
    return { name: t.level?.name, out,
      half: +(t.widthAt ? t.widthAt(0) : 9).toFixed(1) };
  });
  console.log(`\n${id} ${r.name}   road half-width ${r.half} u`);
  for (const o of r.out) {
    console.log(`   bore at ${o.mid}  ridge ${o.ridge} u   ground over road: ${o.prof}`);
  }
  if (!r.out.length) console.log('   no bores');
  for (const e of errs.slice(0, 2)) console.log('   PAGEERROR: ' + e);
}
await b.close();
