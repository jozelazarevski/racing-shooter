/* Which contact-shadow decals reach into a carriageway, and by how much. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '19';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const M4 = g.camera.matrixWorld.constructor, V3 = g.camera.position.constructor,
    QT = g.camera.quaternion.constructor;
  const m4 = new M4(), v = new V3(), s = new V3(), qq = new QT();
  const out = [];
  g.scene.traverse(o => {
    if (o.name !== 'contact-shadows') return;
    for (let k = 0; k < o.count; k++) {
      o.getMatrixAt(k, m4); m4.decompose(v, qq, s);
      const dt = t._distToTrack(v.x, v.z);
      const ni = t.nearestIndex(v);
      const half = t.widthAt ? t.widthAt(ni) : 9;
      const bite = half - (dt - s.x);
      if (bite > 0.3) {
        out.push({ r: +s.x.toFixed(2), dt: +dt.toFixed(2), half: +half.toFixed(2),
          bite: +bite.toFixed(2), dy: +(v.y - t.center[ni].y).toFixed(2),
          tiltY: +qq.y.toFixed(2), sy: +s.y.toFixed(2) });
      }
    }
  });
  out.sort((a, c) => c.bite - a.bite);
  return { count: out.length, worst: out.slice(0, 5) };
}), null, 1));
await b.close();
