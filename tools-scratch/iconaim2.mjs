/* ICON RIG SWEEP, AZIMUTH x ELEVATION, with the car at its real shelf yaw.
 *
 * The first sweep (`iconaim`) established the arithmetic — the shipped rig
 * tilts 16.8 degrees down against a 15 degree half-FOV, so the horizon is off
 * the top of the frame and every pixel is ground — and then showed that aim
 * alone cannot fix it: `_fitDist` pushes the lens back as the aim rises, which
 * lifts the eye by almost as much as the aim did. Pitch barely moves.
 *
 * It also showed the other wall. Flatten the pitch while the lens still looks
 * ALONG the trail and the trail fills the middle of the frame as a vertical
 * brown band — the exact failure r276's comment predicted. So the free
 * variable is AZIMUTH: look across the trail rather than down it, and the trail
 * becomes a diagonal under the car with grass, treeline and sky stacked beyond.
 *
 * Car yaw is `_carIcons`' own formula, so these are shelf icons and not a
 * side elevation the way the first sweep accidentally rendered them.
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 900 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const out = await p.evaluate(async () => {
  const THREE = await import('three');
  const g = window.__game;
  const mod = await import('./src/vehicles.js');
  const S = 3, W = 148 * S, H = 96 * S;
  const car = mod.CAR_CATALOG[1];
  const probe = new THREE.PerspectiveCamera(30, W / H, 0.1, 600);
  const bx = new THREE.Box3().setFromObject(mod.buildCarMesh(car.spec));
  const mid = bx.getCenter(new THREE.Vector3());
  // `_carIcons`' own yaw: SHOT_RIG is (5.2, 3.2, 6.2)
  const FRONT_OFF = Math.PI * 0.82 - Math.atan2(5.2, 6.2);
  const rows = [];
  for (const azDeg of [28, 55, 80]) {
    for (const elDeg of [14, 21]) {
      const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
      const rig = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el),
        Math.cos(az) * Math.cos(el)).multiplyScalar(10);
      const aim = mid.y;
      const fit = g._fitDist(bx, probe, aim, 0.86, rig);
      const at = rig.clone().normalize().multiplyScalar(fit);
      const pitch = Math.atan2(at.y - aim, Math.hypot(at.x, at.z));
      const hNdc = Math.tan(pitch) / Math.tan(15 * Math.PI / 180);
      const mesh = mod.buildCarMesh(car.spec);
      mesh.rotation.y = Math.atan2(rig.x, rig.z) + FRONT_OFF;
      rows.push({ label: `az ${azDeg}° el ${elDeg}°`,
        pitchDeg: +(pitch * 180 / Math.PI).toFixed(1), hNdc: +hNdc.toFixed(2),
        fit: +fit.toFixed(1),
        url: g._shoot(mesh, W, H, { ground: true, dist: fit, look: aim }) });
    }
  }
  return { W, rows };
});
let html = '<body style="margin:0;background:#1a1a1a;font:13px system-ui;color:#ddd;'
  + 'display:flex;flex-wrap:wrap;width:960px">';
for (const r of out.rows) {
  const off = r.hNdc >= 1 ? ' OFF-TOP' : '';
  html += `<div style="padding:5px"><div>${r.label} · pitch ${r.pitchDeg}° · horizon ${r.hNdc}${off}</div>`
    + `<img src="${r.url}" style="width:444px"></div>`;
  console.log(`${r.label}  pitch ${String(r.pitchDeg).padStart(5)}°  horizon ndc ${String(r.hNdc).padStart(6)}  dist ${r.fit}${off}`);
}
writeFileSync('/tmp/iconaim2.html', html + '</body>');
await b.close();
