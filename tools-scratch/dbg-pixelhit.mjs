/* Which mesh projects onto a given screen point, from the same camera as the
 * lookat shot. Reports candidates ordered by distance from that point. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 32), ST = Number(process.env.ST ?? 870);
const AHEAD = Number(process.env.AHEAD ?? 50), UP = Number(process.env.UP ?? 10);
const NX = Number(process.env.NX ?? 0.11), NY = Number(process.env.NY ?? 0.365);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 900, height: 520 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const r = await p.evaluate(({ ST9, AHEAD9, UP9, NX9, NY9 }) => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 200 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const i = ((ST9 % N) + N) % N, c = t.center[i], aim = t.center[(i + AHEAD9) % N];
  g.frame = () => {};
  g.camera.position.set(c.x, c.y + UP9, c.z);
  g.camera.lookAt(aim.x, aim.y + 2, aim.z);
  g.camera.updateMatrixWorld();
  const cam = g.camera;
  const out = [];
  g.scene.traverse((o) => {
    if (!o.isMesh || o.visible === false) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const bs = o.geometry.boundingSphere;
    const v = o.position.clone();
    v.set(bs.center.x, bs.center.y, bs.center.z).applyMatrix4(o.matrixWorld);
    const wx = v.x, wy = v.y, wz = v.z;
    v.project(cam);
    if (v.z > 1) return;
    const d = Math.hypot(v.x - NX9, v.y - NY9);
    const e = o.matrixWorld.elements;
    const s = Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10]));
    out.push({ name: o.name || (o.parent?.name || o.type), d: +d.toFixed(3),
      ndc: [+v.x.toFixed(2), +v.y.toFixed(2)], r: Math.round(bs.radius * s),
      world: [Math.round(wx), Math.round(wy), Math.round(wz)],
      col: o.material?.color ? '#' + o.material.color.getHexString() : null,
      mat: o.material?.type, fog: o.material?.fog, lights: !!o.material?.lights,
      vcol: !!o.material?.vertexColors });
  });
  return { world: g.level?.name, hits: out.sort((a, b) => a.d - b.d).slice(0, 8) };
}, { ST9: ST, AHEAD9: AHEAD, UP9: UP, NX9: NX, NY9: NY });
console.log(JSON.stringify(r, null, 1));
await browser.close();
