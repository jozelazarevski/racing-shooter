/* NEEDLES IN THE GROUND. Reported with a photograph: a huge pale shard rising
 * out of an alpine meadow beside the road, with the terrain's own scatter rocks
 * sitting on its slope — which is what says it is the GROUND and not a prop.
 *
 * Samples `terrainHeight` on a grid either side of the racing line and reports
 * any point that stands far above the median of its neighbours. A hill is
 * gradual and its neighbours come with it; a spike does not.
 *
 *   LEVELS=6,19,20,21 node spikes.mjs
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
let bad = 0;
for (const lvl of (process.env.LEVELS ?? '6').split(',')) {
  const p = await b.newPage({ viewport: { width: 430, height: 800 } });
  p.setDefaultTimeout(600000);
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  const r = await p.evaluate(() => {
    const t = window.__game.track;
    const N = t.N, out = [];
    const H = (x, z) => t.terrainHeight(x, z);
    for (let i = 0; i < N; i += 4) {
      const c = t.center[i], n = t.nrm[i];
      for (let lat = -70; lat <= 70; lat += 10) {
        if (Math.abs(lat) < 14) continue;                  // the road itself
        const x = c.x + n.x * lat, z = c.z + n.z * lat;
        const h = H(x, z);
        if (!Number.isFinite(h)) { out.push({ i, lat, h, why: 'not a number' }); continue; }
        // TWO BASELINES. A needle stands clear of its neighbours at eight
        // metres; a MASSIF-sized shard is broad enough that its whole
        // eight-metre ring comes up with it and the near test sees nothing.
        // The reported shard filled half the frame from twenty units away, so
        // the ring that matters for it is forty.
        const ringAt = (r) => {
          const v = [];
          for (let a = 0; a < 8; a++) {
            const th = (a / 8) * Math.PI * 2;
            v.push(H(x + Math.cos(th) * r, z + Math.sin(th) * r));
          }
          return v.sort((p2, q) => p2 - q)[4];
        };
        const near = ringAt(8), far = ringAt(40);
        if (h - near > 22 || h - far > 60) {
          out.push({ i, lat, h: +h.toFixed(1),
            overNear: +(h - near).toFixed(1), overFar: +(h - far).toFixed(1),
            rise: Math.max(h - near, h - far), at: [Math.round(x), Math.round(z)] });
        }
      }
    }
    out.sort((a, c) => c.rise - a.rise);
    return { name: window.__game.level?.name, N, spikes: out.length, worst: out.slice(0, 6) };
  });
  const ok = r.spikes === 0;
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'} L${lvl} ${(r.name || '').padEnd(22)} ${r.spikes} spikes`);
  for (const s of r.worst) console.log(`     station ${s.i} lat ${s.lat}  height ${s.h} vs ${s.med} around it — rises ${s.rise} u   at ${JSON.stringify(s.at)}`);
  await p.close();
}
console.log(bad ? `FAIL: ${bad} level(s) with needles` : 'PASS: no needles');
await b.close();
process.exit(bad ? 1 : 0);
