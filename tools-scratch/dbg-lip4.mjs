import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=12&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 90000 });
const r = await p.evaluate(() => {
  const t = window.__game.track;
  const grab = () => {
    let geo = null;
    t.group.traverse((o) => { if (o.isMesh && o.geometry?.attributes?.color && o.geometry.attributes.position.count === 201*201) geo = o.geometry; });
    return geo;
  };
  const find = (geo) => {
    const pos = geo.attributes.position; const W = 201;
    let best = null;
    for (let iz = 1; iz < W-1; iz++) for (let ix = 1; ix < W-1; ix++) {
      const i = iz*W+ix;
      if (Math.max(Math.abs(pos.getX(i)), Math.abs(pos.getZ(i))) > 850) continue;
      const y0 = pos.getY(i);
      let fall = 0;
      for (const j of [i+1,i-1,i+W,i-W]) fall = Math.max(fall, y0 - pos.getY(j));
      if (!best || fall > best.fall) best = { i, fall };
    }
    return best;
  };
  const g1 = grab(); const b1 = find(g1);
  const c1 = [g1.attributes.color.getX(b1.i), g1.attributes.color.getY(b1.i), g1.attributes.color.getZ(b1.i)];
  t._buildTerrain();               // rebuild with the live (edited) code
  const g2 = grab(); const b2 = find(g2);
  const c2 = [g2.attributes.color.getX(b2.i), g2.attributes.color.getY(b2.i), g2.attributes.color.getZ(b2.i)];
  return { fall1: +b1.fall.toFixed(1), col1: c1.map(v=>+v.toFixed(3)),
           fall2: +b2.fall.toFixed(1), col2: c2.map(v=>+v.toFixed(3)),
           sameGeo: g1 === g2 };
});
console.log(JSON.stringify(r));
await b.close();
