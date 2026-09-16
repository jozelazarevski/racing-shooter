import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 640, height: 400 } });
await p.goto('http://localhost:8901/?level=12&go=1&unlockall=1', { waitUntil: 'load', timeout: 120000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 90000 });
const r = await p.evaluate(() => {
  const t = window.__game.track;
  let mesh = null;
  t.group.traverse((o) => { if (o.isMesh && o.geometry?.attributes?.color && o.geometry.attributes.position.count === 201*201) mesh = o; });
  const geo = mesh.geometry;
  const pos = geo.attributes.position, colors = geo.attributes.color.array;
  const W = 201;
  let best = null;
  for (let iz = 1; iz < W-1; iz++) for (let ix = 1; ix < W-1; ix++) {
    const i = iz*W+ix;
    if (Math.max(Math.abs(pos.getX(i)), Math.abs(pos.getZ(i))) > 850) continue;
    const y0 = pos.getY(i);
    let fall = 0;
    for (const j of [i+1,i-1,i+W,i-W]) fall = Math.max(fall, y0 - pos.getY(j));
    if (!best || fall > best.fall) best = { i, fall };
  }
  const cHigh = mesh.material.color.clone().setRGB(0.5,0.5,0.5);
  const before = colors[best.i*3];
  t._slopeRock(pos, colors, cHigh);
  const after = colors[best.i*3];
  return { fall: +best.fall.toFixed(1), before: +before.toFixed(3), after: +after.toFixed(3),
    cell: +(Math.abs(pos.getX(1) - pos.getX(0))).toFixed(2) };
});
console.log(JSON.stringify(r));
await b.close();
