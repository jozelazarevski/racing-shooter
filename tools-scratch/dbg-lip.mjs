import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=12&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 90000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  let geo = null;
  t.group.traverse((o) => { if (o.isMesh && o.geometry?.attributes?.color && o.geometry.attributes.position.count === 201*201) geo = o.geometry; });
  const pos = geo.attributes.position, col = geo.attributes.color;
  const W = 201;
  const c = t.T.terrainScree ?? t.T.terrainDirt;
  const n = parseInt(String(c).replace('#',''),16);
  const s = { r:((n>>16)&255)/255, g:((n>>8)&255)/255, b:(n&255)/255 };
  const rows = [];
  const falls = [];
  for (let iz = 1; iz < W-1; iz++) for (let ix = 1; ix < W-1; ix++) {
    const i = iz*W+ix;
    if (Math.max(Math.abs(pos.getX(i)), Math.abs(pos.getZ(i))) > 850) continue;
    const y0 = pos.getY(i);
    let fall = 0;
    for (const j of [i+1,i-1,i+W,i-W]) fall = Math.max(fall, y0 - pos.getY(j));
    if (fall > 11) falls.push({ i, fall });
  }
  falls.sort((a,b2)=>b2.fall-a.fall);
  for (const {i, fall} of falls.slice(0, 10)) {
    rows.push({ fall:+fall.toFixed(1),
      col: [col.getX(i),col.getY(i),col.getZ(i)].map(v=>+v.toFixed(2)),
      scree: [s.r,s.g,s.b].map(v=>+v.toFixed(2)) });
  }
  return { scree: c, lips: falls.length, rows: rows.slice(0,6) };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
