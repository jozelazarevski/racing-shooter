/* Census of every big body near the finish area — no name filter. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 32);
const ST  = Number(process.env.ST ?? 890);
const RAD = Number(process.env.RAD ?? 260);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const r = await p.evaluate(({ ST, RAD }) => {
  const g = window.__game, t = g.track;
  const C = t.center[ST % t.center.length];
  const gy = (x, z) => (t._drawnGroundY ? t._drawnGroundY(x, z) : null) ?? t.terrainHeight(x, z);
  const out = [];
  g.scene.traverse((o) => {
    if (!o.isMesh) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox;
    const e = o.matrixWorld.elements;
    const sx = Math.hypot(e[0],e[1],e[2]), sy = Math.hypot(e[4],e[5],e[6]), sz = Math.hypot(e[8],e[9],e[10]);
    const size = { x:+((bb.max.x-bb.min.x)*sx).toFixed(1), y:+((bb.max.y-bb.min.y)*sy).toFixed(1), z:+((bb.max.z-bb.min.z)*sz).toFixed(1) };
    const wx=e[12], wy=e[13], wz=e[14];
    const d = Math.hypot(wx-C.x, wz-C.z);
    if (d > RAD) return;
    if (Math.max(size.x,size.z) < 12) return;
    if (Math.max(size.x,size.z) > 900) return;
    const s9 = t._nearestSample(wx, wz);
    out.push({ name:o.name||o.type, mat:o.material?.name||'', inst:o.isInstancedMesh?o.count:1,
      size, pos:{x:Math.round(wx),y:+wy.toFixed(1),z:Math.round(wz)},
      gy:+gy(wx,wz).toFixed(1), above:+(wy-gy(wx,wz)).toFixed(1),
      dRoad:+s9.d.toFixed(0), st:s9.i, dCam:Math.round(d) });
  });
  return { world:g.level?.name, N:t.center.length, st:ST,
    items: out.sort((a,b)=>Math.max(b.size.x,b.size.z)-Math.max(a.size.x,a.size.z)).slice(0,30) };
}, { ST, RAD });
console.log(JSON.stringify(r, null, 1));
await browser.close();
