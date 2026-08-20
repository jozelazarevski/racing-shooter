/* DOES THE BONNET SWALLOW THE ROAD? Sampled at points around the lap, chosen
 * by ROAD GRADE — which is the variable that actually moves the seat's pitch.
 *
 * The seat aims at a point `look` units ahead at the ROAD's height there, so
 * on a crest the aim drops and the nose rises in frame. That is the mechanism
 * behind the report (bodywork meeting the horizon, no road in view), and it
 * cannot be reproduced parked on the start line, which is where every previous
 * measurement of this view was taken.
 *
 * The car is PLACED rather than driven: driving it under swiftshader takes
 * minutes per sample and adds nothing — the pitch is a function of where the
 * car is, not how it got there.
 */
import { chromium } from 'playwright-core';
import { promises as fs } from 'node:fs';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const CAR = process.env.CAR || '';
const LVL = process.env.LEVEL ?? '1';
const DIR = process.env.DIR ?? '/tmp';
const SHOT = process.env.SHOT || '';           // sample index to also save as a png
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 430, height: 830 }, hasTouch: true,
  isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
p.setDefaultTimeout(900000);
await p.addInitScript((c) => { window.__CAR = c; }, CAR);
await p.goto(`${BASE}/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 900000 });
const R = await p.evaluate(async (shot) => {
  const g = window.__game, t = g.track, p2 = g.player;
  const want = window.__CAR;
  if (want && g.cars) {
    g.cars.owned = [...new Set([...(g.cars.owned || []), want])];
    g.cars.selected = want;
    g.applyCar?.(want) ?? g._applyCar?.(want);
  }
  g.camMode = g.constructor.DRIVER_MODE;
  g.state = 'race';
  const N = t.center.length;
  // grade at each station, over the distance the seat actually aims across
  const look = 34, step = Math.max(1, Math.round(look / t.segLen));
  const grade = [];
  for (let i = 0; i < N; i++) {
    const a = t.center[i], c2 = t.center[(i + step) % N];
    grade.push({ i, g: (c2.y - a.y) / (step * t.segLen) });
  }
  const byG = grade.slice().sort((x, y) => x.g - y.g);
  // the steepest crest, the steepest dip, and three ordinary stations
  const picks = [byG[0], byG[Math.floor(N * 0.25)], byG[Math.floor(N * 0.5)],
    byG[Math.floor(N * 0.75)], byG[N - 1]];
  const cv = document.createElement('canvas');
  const out = [];
  for (const q of picks) {
    const c2 = t.center[q.i], nx = t.center[(q.i + 1) % N];
    p2.pos.set(c2.x, c2.y + 0.4, c2.z);
    p2.trackIndex = q.i;
    const dx = nx.x - c2.x, dz = nx.z - c2.z, m = Math.hypot(dx, dz) || 1;
    p2.forward.set(dx / m, 0, dz / m);
    p2.vel.set(0, 0, 0);
    if (p2.mesh) { p2.mesh.position.copy(p2.pos); }
    // drive the camera exactly as the game does, then read the pixels
    g._updateCamera(1 / 60);
    g.camera.position.copy(g.camPos);
    g.camera.lookAt(g.camLook);
    g.camera.updateMatrixWorld();
    const c = g.renderer.domElement;
    g.renderer.render(g.scene, g.camera);
    cv.width = c.width; cv.height = c.height;
    const cx = cv.getContext('2d');
    cx.drawImage(c, 0, 0);
    const col = cx.getImageData(Math.floor(c.width / 2), 0, 1, c.height).data;
    const at = (y) => [col[y * 4], col[y * 4 + 1], col[y * 4 + 2]];
    let y = c.height - 1, runs = 0;
    for (; y > 1; y--) {
      const a2 = at(y), b2 = at(y - 1);
      if (Math.abs(a2[0] - b2[0]) + Math.abs(a2[1] - b2[1]) + Math.abs(a2[2] - b2[2]) > 26) {
        if (++runs > 3) break;
      }
    }
    let hz = 0;
    for (let k = 0; k < y; k++) {
      const [r2, g2, b3] = at(k);
      if (!(b3 > r2 + 12 && b3 > 90)) { hz = k; break; }
    }
    out.push({ i: q.i, grade: +(q.g * 100).toFixed(1), h: c.height,
      interiorTop: y, hz, interiorPct: +((1 - y / c.height) * 100).toFixed(1),
      roadPct: +((Math.max(0, y - hz) / c.height) * 100).toFixed(1),
      png: String(out.length) === shot ? c.toDataURL('image/png') : null });
  }
  return out;
}, SHOT);
console.log(' station  grade%   horizon  interiorTop  interior%   road%');
for (const r of R) {
  console.log(`${String(r.i).padStart(8)} ${String(r.grade).padStart(7)} ${String(r.hz).padStart(9)} `
    + `${String(r.interiorTop).padStart(12)} ${String(r.interiorPct).padStart(10)} ${String(r.roadPct).padStart(7)}`);
  if (r.png) {
    await fs.writeFile(`${DIR}/seatgrade.png`, Buffer.from(r.png.split(',')[1], 'base64'));
    console.log(`  -> ${DIR}/seatgrade.png`);
  }
}
const worst = R.slice().sort((a, c) => a.roadPct - c.roadPct)[0];
console.log(`\nworst: ${worst.roadPct}% road at ${worst.grade}% grade, interior ${worst.interiorPct}%`);
await b.close();
