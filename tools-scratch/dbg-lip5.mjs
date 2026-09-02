import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
p.on('console', (m) => console.log('[page]', m.text().slice(0,200)));
await p.goto('http://localhost:8901/?level=12&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 90000 });
const r = await p.evaluate(() => {
  const t = window.__game.track;
  let geo = null;
  t.group.traverse((o) => { if (o.isMesh && o.geometry?.attributes?.color && o.geometry.attributes.position.count === 201*201) geo = o.geometry; });
  const pos = geo.attributes.position, colAttr = geo.attributes.color;
  const colors = colAttr.array;
  const W = 201, cell = 10;
  // replicate the lip block exactly
  const THREE = t.group.children[0].position.constructor ? null : null;
  const scree = t.T.terrainScree !== undefined ? t.T.terrainScree : t.T.terrainDirt;
  const n = parseInt(String(scree).replace('#',''),16);
  const s = [((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255];
  let touched = 0, sample = null;
  for (let iz = 0; iz < W; iz++) for (let ix = 0; ix < W; ix++) {
    const i = iz*W+ix;
    const y0 = pos.getY(i);
    let fall = 0;
    if (ix+1<W) fall = Math.max(fall, y0 - pos.getY(i+1));
    if (ix>0) fall = Math.max(fall, y0 - pos.getY(i-1));
    if (iz+1<W) fall = Math.max(fall, y0 - pos.getY(i+W));
    if (iz>0) fall = Math.max(fall, y0 - pos.getY(i-W));
    if (fall < cell*0.9) continue;
    const k = Math.max(0.35, Math.min(1, (fall - cell*0.9)/(cell*0.9)) * 0.8);
    const before = colors[i*3];
    for (let c2 = 0; c2 < 3; c2++) colors[i*3+c2] += (s[c2]-colors[i*3+c2])*k;
    touched++;
    if (!sample && fall > 30) sample = { fall:+fall.toFixed(1), before:+before.toFixed(3), after:+colors[i*3].toFixed(3) };
  }
  return { touched, sample, scree };
});
console.log(JSON.stringify(r));
await b.close();
