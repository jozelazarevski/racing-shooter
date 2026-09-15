/* Owner, on THE HEADLANDS: "I am stuck here" -- car on the embankment face at
 * 2 km/h in neutral, below a road that runs along the crest of an 89-degree
 * wall (measured: 63% of this world's stations carry such a face).
 *
 * TWO SEPARATE QUESTIONS, and the second one is the one that matters tonight:
 *   1. can the car drive back up that face?  (expected: no -- 3.3 says a wheel
 *      above maxClimbDeg makes no drive, and 89 degrees is far past it)
 *   2. does the SOS button get the player out?  E-25 (r431) made the button
 *      the ONLY thing that repositions the player, so if it does not fire here
 *      the owner has no way home at all and that is a P0.
 *
 * Put the car on the face the way the frame shows it, hold throttle, then
 * press UNSTUCK, and report both answers.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
const errs = []; p.on('pageerror', (e) => errs.push(String(e.message)));
await p.goto(`${BASE}/?level=45&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.__game?.player && window.__game.state === 'race',
  undefined, { timeout: 300000 });
const R = await p.evaluate(async () => {
  const g = window.__game, tk = g.track, pl = g.player, C = tk.center, N = C.length;
  if (g.composer) g.composer.render = () => {};
  let el = g.clock.elapsedTime;
  g.clock = { getDelta: () => { el += 1/60; return 1/60; }, get elapsedTime() { return el; } };

  // find a station with a steep face and put the car partway down it
  let best = null;
  for (let i = 0; i < N; i++) {
    const c = C[i], n = C[(i+1)%N];
    let tx = n.x-c.x, tz = n.z-c.z; const tl = Math.hypot(tx,tz)||1; tx/=tl; tz/=tl;
    const half = Number(tk.widthAt ? tk.widthAt(i) : 9);
    for (const s of [1,-1]) {
      const nx = -tz*s, nz = tx*s;
      const y0 = tk.terrainHeight(c.x+nx*(half+1), c.z+nz*(half+1));
      const y1 = tk.terrainHeight(c.x+nx*(half+9), c.z+nz*(half+9));
      const deg = Math.atan2(Math.abs(y0-y1), 8)*180/Math.PI;
      if ((y0-y1) > 0 && (!best || deg > best.deg)) best = { i, nx, nz, half, deg, c };
    }
  }
  const b = best;
  const px = b.c.x + b.nx*(b.half+7), pz = b.c.z + b.nz*(b.half+7);
  pl.pos.set(px, tk.terrainHeight(px,pz)+1.0, pz);
  pl.y = tk.terrainHeight(px,pz)+1.0;
  if (pl.vel) pl.vel.set(0,0,0);
  pl.speed = 0;
  g.input.autoThrottle = false; g.input.analog.throttle = 1; g.input.analog.brake = 0; g.input.analog.steer = 0;

  const road = () => { let d = Infinity; for (let i=0;i<N;i++){const dx=pl.pos.x-C[i].x, dz=pl.pos.z-C[i].z; const q=dx*dx+dz*dz; if(q<d)d=q;} return Math.sqrt(d); };
  const startD = road();
  for (let f = 0; f < 300; f++) g._frameBody();       // 5 s of held throttle
  const afterThrottle = { d: road(), speed: pl.speed, y: pl.y };

  // now the button
  pl._unstuckReq = true; pl.unstuckCool = 0;
  for (let f = 0; f < 240; f++) g._frameBody();       // 4 s
  const afterSOS = { d: road(), speed: pl.speed, y: pl.y };
  return { face: +b.deg.toFixed(1), startD: +startD.toFixed(1),
    afterThrottle: { d:+afterThrottle.d.toFixed(1), speed:+afterThrottle.speed.toFixed(1) },
    afterSOS: { d:+afterSOS.d.toFixed(1), speed:+afterSOS.speed.toFixed(1) },
    halfW: b.half };
});
console.log(JSON.stringify(R, null, 1));
if (errs.length) console.log('PAGE ERRORS:', errs.slice(0,3));
await browser.close();
