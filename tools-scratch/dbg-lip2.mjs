import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=12&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 90000 });
const r = await p.evaluate(async () => {
  const src = await (await fetch('/src/track.js')).text();
  const hasLip = src.includes('LIP WEARS ROCK');
  const g = window.__game, t = g.track;
  let geo = null, meshes = [];
  t.group.traverse((o) => { if (o.isMesh && o.geometry?.attributes?.color) meshes.push(o.geometry.attributes.position.count);
    if (o.isMesh && o.geometry?.attributes?.color && o.geometry.attributes.position.count === 201*201) geo = o.geometry; });
  const pos = geo.attributes.position, col = geo.attributes.color;
  const W = 201;
  // find top-fall vertex
  let best = null;
  for (let iz = 1; iz < W-1; iz++) for (let ix = 1; ix < W-1; ix++) {
    const i = iz*W+ix;
    if (Math.max(Math.abs(pos.getX(i)), Math.abs(pos.getZ(i))) > 850) continue;
    const y0 = pos.getY(i);
    let fall = 0;
    for (const j of [i+1,i-1,i+W,i-W]) fall = Math.max(fall, y0 - pos.getY(j));
    if (!best || fall > best.fall) best = { i, fall };
  }
  const before = [col.getX(best.i), col.getY(best.i), col.getZ(best.i)];
  // run the lip law again by hand on this vertex
  const c = t.T.terrainScree ?? t.T.terrainDirt;
  const n = parseInt(String(c).replace('#',''),16);
  const s = [((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255];
  const cell = 10;
  const k = Math.max(0.35, Math.min(1, (best.fall - cell*0.9)/(cell*0.9)) * 0.8);
  const after = before.map((v, j) => v + (s[j]-v)*k);
  return { hasLip, meshes: meshes.slice(0,6), fall: +best.fall.toFixed(1),
    before: before.map(v=>+v.toFixed(3)), wouldBe: after.map(v=>+v.toFixed(3)),
    screeHex: c };
});
console.log(JSON.stringify(r));
await b.close();
