/* Is every balcony ON a house — at one of its storeys, inside its frontage,
 * under its eaves? "The balcony is all over the place" was a placement made
 * of three fractions that knew nothing about the facade under it; this counts
 * the ones that miss so the answer is a number rather than a squint. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(async ({ SET }) => {
  const g = window.__game;
  // the painter's own storey lines, straight out of the module the running
  // page loaded — a balcony is either ON one of these or it is not
  const M = await import('/src/textures.js');
  // `townhouseAnchors` is r245's; fall back to the bay table so the same probe
  // can be run against an older build for a baseline (which is the only way to
  // tell a fix from a number that was always green).
  const SILLS = new Set();
  for (let v = 0; v < 4; v++) {
    if (M.townhouseAnchors) {
      for (const sv of M.townhouseAnchors(v, SET).sills) SILLS.add(+sv.toFixed(3));
    } else {
      const VB = M.townhouseBays(v, SET);
      for (const y of VB.rows || []) SILLS.add(+(1 - (y + (VB.bh ?? 40)) / 256).toFixed(3));
    }
  }
  const V3 = g.camera.position.constructor, M4 = g.camera.matrixWorld.constructor,
    QT = g.camera.quaternion.constructor;
  const v = new V3(), s = new V3(), qq = new QT(), m4 = new M4();
  const grab = (pred) => {
    const out = [];
    g.scene.traverse(o => {
      if (!o.isInstancedMesh || !pred(o.name || '')) return;
      for (let k = 0; k < o.count; k++) {
        o.getMatrixAt(k, m4); m4.decompose(v, qq, s);
        if (!s.x && !s.y && !s.z) continue;
        out.push({ x: v.x, y: v.y, z: v.z, sx: s.x, sy: s.y, sz: s.z });
      }
    });
    return out;
  };
  const bodies = grab(n => n === 'oldtown-frontage');
  const balc = grab(n => n === 'frontage-balconies');
  const awn = grab(n => n === 'frontage-awnings');
  const judge = (items) => {
    let above = 0, off = 0, n = 0; const fr = [];
    for (const it of items) {
      let best = null, bd = Infinity;
      for (const bo of bodies) {
        const d = Math.hypot(bo.x - it.x, bo.z - it.z);
        if (d < bd) { bd = d; best = bo; }
      }
      if (!best) continue;
      n++;
      // the body is base-anchored, so its eaves are y + sy
      if (it.y > best.y + best.sy) above++;
      // and nothing hung on it may sit outside its own frontage
      if (bd > best.sz * 0.5 + best.sx * 0.5 + 0.6) off++;
      fr.push(+((it.y - best.y) / best.sy).toFixed(2));
    }
    fr.sort((a, c) => a - c);
    // ON A STOREY: the height fraction matches one of the painted sills to
    // within a centimetre or two of a 14 u wall. The nearest-body match is
    // approximate (a cottage beside a merchant house can claim its
    // neighbour's balcony), so this is a floor on the true figure.
    let onStorey = 0;
    for (const f of fr) {
      for (const sv of SILLS) if (Math.abs(f - sv) < 0.02) { onStorey++; break; }
    }
    return { n, aboveEaves: above, offBuilding: off,
      lowest: fr[0], highest: fr[fr.length - 1],
      distinctHeights: new Set(fr).size,
      onAPaintedStorey: `${onStorey}/${n}` };
  };
  return { sills: [...SILLS].sort((a, c) => a - c),
    bodies: bodies.length, balconies: judge(balc), awnings: judge(awn) };
}, { SET: process.env.SET ?? 'liguria' }), null, 1));
await b.close();
