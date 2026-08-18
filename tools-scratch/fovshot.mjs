/* HOW WIDE SHOULD THE SEAT BE? "Make the view a bit wider."
 * Portrait base is 68 degrees and the seat adds 6 (=74), plus up to +11 with
 * speed. Widening also shrinks the bonnet, so this reports the same three
 * shares as the aim sweep — bodywork, sky, and the road left over — plus the
 * actual camera.fov, because the number in the config is not the number the
 * lens ends up at once the speed stretch is in. Fixed mid-lap station, pinned
 * every frame, at speed. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 932 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });

console.log(' fov+/fwd | camera.fov | bonnet    sky     ROAD');
for (const add of (process.env.FOVS ?? '6,12,18,24').split(',')) {
  const r = await p.evaluate(async (add) => {
    const g = window.__game, pl = g.player, t = g.track;
    if (g.state !== 'race') g.startRace?.();
    g.setDriverView(true);
    const [fovAdd, fwd] = String(add).split('/').map(Number);
    g._driverTune = { up: 0.45, fwd: fwd ?? 0.14, lookH: 1.15, fov: fovAdd };
    const frame = () => new Promise((r2) => requestAnimationFrame(r2));
    const HOME = Math.floor(t.N * 0.18);
    const pin = () => {
      const c = t.pointAt(HOME, 0);
      pl.heading = t.headingAt(HOME);
      pl.pos.x = c.x; pl.pos.z = c.z;
      if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
      pl.vy = 0; pl.airborne = false; pl.trackIndex = HOME;
      pl.vel.copy(pl.forward).multiplyScalar(38);
    };
    for (let k = 0; k < 24; k++) { pin(); await frame(); }

    const grab = () => {
      const src = g.renderer?.domElement ?? document.querySelector('canvas');
      const c2 = document.createElement('canvas');
      c2.width = 215; c2.height = 466;
      const cx = c2.getContext('2d');
      cx.drawImage(src, 0, 0, c2.width, c2.height);
      return { d: cx.getImageData(0, 0, c2.width, c2.height).data, w: c2.width, h: c2.height };
    };
    // sky first, with the car drawn normally
    let g1 = grab(), sky = 0;
    for (let i = 0; i < g1.d.length; i += 4) {
      if (g1.d[i + 2] > 150 && g1.d[i + 2] > g1.d[i] + 20 && g1.d[i + 1] > 100) sky++;
    }
    // then the bodywork, painted a key colour
    const saved = [];
    pl.mesh.traverse((o) => {
      if (!o.geometry || !o.material) return;
      saved.push([o, o.material]);
      const M = o.material.constructor === Array ? o.material[0] : o.material;
      const flat = new M.constructor({ color: 0xff00ff });
      if ('map' in flat) flat.map = null;
      if ('transparent' in flat) flat.transparent = false;
      o.material = flat;
    });
    pin(); await frame(); pin(); await frame();
    let g2 = grab(), body = 0;
    for (let i = 0; i < g2.d.length; i += 4) {
      if (g2.d[i] > 180 && g2.d[i + 1] < 90 && g2.d[i + 2] > 180) body++;
    }
    for (const [o, m] of saved) o.material = m;
    pin(); await frame();
    const px = g1.w * g1.h;
    return { add, fwd: fwd ?? 0.14, fov: +g.camera.fov.toFixed(1),
      body: +(body / px * 100).toFixed(1), sky: +(sky / px * 100).toFixed(1) };
  }, add);
  const road = +(100 - r.body - r.sky).toFixed(1);
  console.log(` ${String(r.add).padStart(8)} | ${String(r.fov).padStart(10)} | `
    + `${String(r.body).padStart(5)}%  ${String(r.sky).padStart(5)}%  ${String(road).padStart(5)}%`);
  await p.screenshot({ path: `/tmp/claude-0/-home-user-racing-shooter/5dbf1129-99d6-5790-8c20-c8eb78d4cc72/scratchpad/fov-${add}.png` });
}
await b.close();
