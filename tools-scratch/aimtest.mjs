/* DOES RAISING THE AIM RESCUE THE HORIZON? Arithmetic only, no renders.
 *
 * `_fitDist` pushes the lens back as the aim rises, and the eye rises with it,
 * so the two nearly cancel. This walks the aim from the shipped blend up to
 * the tallest car's own box centre and past it, for whichever rig is in the
 * file, and prints the horizon's clip-space y at each. >= 1 is off the top.
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 900 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8916/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const out = await p.evaluate(async () => {
  const THREE = await import('three');
  const g = window.__game;
  const mod = await import('./src/vehicles.js');
  const rows = [];
  for (const [name, R] of [['shipped 3.9,3.3,7.4', [3.9, 3.3, 7.4]],
    ['new 8.0,2.5,3.2', [8.0, 2.5, 3.2]]]) {
    const rig = new THREE.Vector3(...R);
    const FRONT_OFF = Math.PI * 0.82 - Math.atan2(5.2, 6.2);
    const yaw = Math.atan2(rig.x, rig.z) + FRONT_OFF;
    const probe = new THREE.PerspectiveCamera(30, 148 / 96, 0.1, 600);
    const boxes = mod.CAR_CATALOG.map((car) => {
      const m = mod.buildCarMesh(car.spec);
      m.rotation.y = yaw;
      return new THREE.Box3().setFromObject(m);
    });
    const tall = boxes.reduce((a, c) => (c.max.y > a.max.y ? c : a));
    const mid = tall.getCenter(new THREE.Vector3()).y;
    for (const [what, aim] of [['shipped blend', 0.55 + (mid - 0.55) * 0.5],
      ['box centre', mid], ['box centre +1', mid + 1], ['roofline', tall.max.y]]) {
      let dist = 0;
      for (const bx of boxes) dist = Math.max(dist, g._fitDist(bx, probe, aim, 0.86, rig));
      const eye = rig.clone().normalize().multiplyScalar(dist);
      const pitch = Math.atan2(eye.y - aim, Math.hypot(eye.x, eye.z));
      rows.push({ name, what, aim: +aim.toFixed(2), dist: +dist.toFixed(2),
        eyeY: +eye.y.toFixed(2), pitch: +(pitch * 180 / Math.PI).toFixed(2),
        hNdc: +(Math.tan(pitch) / Math.tan(15 * Math.PI / 180)).toFixed(3) });
    }
  }
  return rows;
});
for (const r of out) console.log(`${r.name.padEnd(20)} aim ${String(r.aim).padStart(5)}  dist ${String(r.dist).padStart(5)}  eye y ${String(r.eyeY).padStart(5)}  pitch ${String(r.pitch).padStart(6)}  horizon ${String(r.hNdc).padStart(6)}${r.hNdc >= 1 ? '  OFF-TOP' : ''}   (${r.what})`);
await b.close();
