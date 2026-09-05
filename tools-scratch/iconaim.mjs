/* WITHDRAWN — THIS PROBE'S RENDERS DID NOT SHOW WHAT IT CLAIMED.
 *
 * `_shoot` reads the module-scope `SHOT_RIG_GROUND` directly and takes only
 * `dist` and `look` from a caller. The rig vectors swept below therefore never
 * reached the camera: every render in the resulting contact sheet was the
 * SHIPPED azimuth at a different zoom, labelled with an azimuth it did not
 * have. The horizon arithmetic printed alongside was computed independently and
 * is sound; the pictures were not evidence for it.
 *
 * To try a rig you must WRITE the constant and reload — see `rigdrive.sh` and
 * `rigmeas.mjs`, which reads the rig back out of the served `/src/main.js` and
 * throws if it is not there, so its arithmetic and its picture cannot disagree.
 *
 * Kept only as the record of the mistake.
 */
/* CANDIDATE ICON RIGS, RENDERED SIDE BY SIDE, WITH THE HORIZON AS A NUMBER.
 *
 * A shelf icon is 82% flat green because the camera tilts 16.5 degrees down
 * against a 15 degree half-FOV: the horizon sits ABOVE the top edge, so every
 * pixel in the frame is ground and nothing standing can ever appear. That is
 * arithmetic, not taste — `hNdc` below is where the horizon lands in clip
 * space, and anything at or over +1.0 is a frame that cannot show a skyline.
 *
 * Renders the same car through the game's own `_shoot` for each candidate and
 * writes a contact sheet, because the number says which rigs are POSSIBLE and
 * only looking says which one is good.
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
  const RIGS = [
    ['A current      ', [3.9, 3.3, 7.4], 0.55 + (mid.y - 0.55) * 0.5],
    ['B box centre   ', [3.9, 3.3, 7.4], mid.y],
    ['C aim above    ', [3.9, 3.3, 7.4], mid.y + 0.9],
    ['D lower eye    ', [3.9, 2.3, 7.4], mid.y],
    ['E lower + above', [3.9, 2.3, 7.4], mid.y + 0.7],
  ];
  const rows = [];
  for (const [label, r, aim] of RIGS) {
    const rig = new THREE.Vector3(...r);
    const fit = g._fitDist(bx, probe, aim, 0.86, rig);
    const at = rig.clone().normalize().multiplyScalar(fit);
    const pitch = Math.atan2(at.y - aim, Math.hypot(at.x, at.z));
    const hNdc = Math.tan(pitch) / Math.tan((30 * Math.PI / 180) / 2);
    const mesh = mod.buildCarMesh(car.spec);
    mesh.rotation.y = Math.PI * 0.82 - Math.atan2(3.9, 7.4)
      + Math.atan2(r[0], r[2]) - Math.atan2(3.9, 7.4);
    rows.push({ label, aim: +aim.toFixed(2), fit: +fit.toFixed(2),
      pitchDeg: +(pitch * 180 / Math.PI).toFixed(1), hNdc: +hNdc.toFixed(2),
      url: g._shoot(mesh, W, H, { ground: true, dist: fit, look: aim }) });
  }
  return { W, H, rows };
});
let html = '<body style="margin:0;background:#1a1a1a;font:13px system-ui;color:#ddd">';
for (const r of out.rows) {
  const off = r.hNdc >= 1 ? ' — HORIZON OFF THE TOP' : '';
  html += `<div style="padding:6px"><div>${r.label} aim ${r.aim} dist ${r.fit} `
    + `pitch ${r.pitchDeg}° horizon ndc ${r.hNdc}${off}</div>`
    + `<img src="${r.url}" style="width:${out.W}px"></div>`;
  console.log(`${r.label} aim ${String(r.aim).padStart(5)} dist ${String(r.fit).padStart(6)}`
    + ` pitch ${String(r.pitchDeg).padStart(5)}°  horizon ndc ${String(r.hNdc).padStart(6)}${off}`);
}
writeFileSync('/tmp/iconaim.html', html + '</body>');
await b.close();
