/* How many people were placed, and whether the ones in a square are standing
 * ON it. The first cut seated square-goers on `_seatY` — the ground — and the
 * paving, which is seated on its HIGH corner, buried them to the shoulders in
 * their own piazza. This prints the figure's y against the plate's. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, t = g.track, out = { count: 0, inSquares: 0, sunk: 0 };
  const M4 = g.camera.matrixWorld.constructor, V3 = g.camera.position.constructor,
    QT = g.camera.quaternion.constructor;
  const m4 = new M4(), v = new V3(), s = new V3(), qq = new QT();
  const rows = [];
  g.scene.traverse(o => {
    if (o.name !== 'townsfolk') return;
    out.count = o.count;
    for (let k = 0; k < o.count; k++) {
      o.getMatrixAt(k, m4); m4.decompose(v, qq, s);
      let near = Infinity, plate = null;
      for (const pz of t._piazzas ?? []) {
        const d = Math.hypot(v.x - pz.x, v.z - pz.z);
        if (d < near) { near = d; plate = new M4().copy(pz.inv).invert().elements[13]; }
      }
      // IN a square — the rect test, not a radius. "Within 16 u" also catches
      // people standing on the lower ground BESIDE a raised plate, and counts
      // them as buried when they are simply not on it.
      if (t._inPiazza(v.x, v.z, 0)) {
        out.inSquares++;
        if (plate - v.y > 0.25) out.sunk++;
        if (rows.length < 4) rows.push({ y: +v.y.toFixed(2), plate: +plate.toFixed(2) });
      }
      // and nobody on the carriageway
      const half = t.widthAt ? t.widthAt(t.nearestIndex(v)) : 9;
      if (t._distToTrack(v.x, v.z) < half) out.inRoad = (out.inRoad ?? 0) + 1;
    }
  });
  return { ...out, sample: rows };
}), null, 1));
await b.close();
