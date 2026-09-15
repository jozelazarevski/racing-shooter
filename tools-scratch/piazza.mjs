/* Where the squares ended up, and whether the street wall actually stopped for
 * them: lap fraction of each piazza, how many frontage blocks stand inside one
 * (must be zero), and how far its inner edge is from the driveable edge. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const V3 = g.camera.position.constructor, M4 = g.camera.matrixWorld.constructor,
    QT = g.camera.quaternion.constructor;
  const v = new V3(), s = new V3(), qq = new QT(), m4 = new M4();
  const bodies = [];
  g.scene.traverse(o => {
    if (!o.isInstancedMesh || o.name !== 'oldtown-frontage') return;
    for (let k = 0; k < o.count; k++) {
      o.getMatrixAt(k, m4); m4.decompose(v, qq, s);
      if (!s.x && !s.y && !s.z) continue;
      bodies.push({ x: v.x, z: v.z, r: Math.hypot(s.x, s.z) / 2 });
    }
  });
  const out = [];
  for (const pz of t._piazzas ?? []) {
    // nearest lap station, as a fraction
    let bi = 0, bd = Infinity;
    for (let i = 0; i < t.N; i++) {
      const c = t.center[i], d = Math.hypot(c.x - pz.x, c.z - pz.z);
      if (d < bd) { bd = d; bi = i; }
    }
    let inside = 0;
    for (const bo of bodies) if (t._inPiazza(bo.x, bo.z, -bo.r * 0.5)) inside++;
    out.push({ f: +(bi / t.N).toFixed(3), distToCentreline: +bd.toFixed(1),
      halfWidthThere: +(t.widthAt ? t.widthAt(bi).toFixed(1) : 0),
      innerEdgeClearOfRoad: +(bd - Math.min(-pz.x0, pz.x1) - (t.widthAt ? t.widthAt(bi) : 9)).toFixed(1),
      church: pz.x1 - pz.x0 > 30,   // the rect is extended outward for a church
      housesInsideThisAndEveryOther: inside });
  }
  return { piazzas: out, frontageBlocks: bodies.length };
}), null, 1));
await b.close();
