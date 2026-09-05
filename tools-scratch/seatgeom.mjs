/* WHERE IS THE EYE, RELATIVE TO THE CAR IT IS SITTING IN?
 *
 * The seat's own comment claims the eye is inside the glasshouse, so the roof
 * and the far panels are back-facing and cull. A phone screenshot says
 * otherwise — a solid black band across the top of the frame — so the claim is
 * measured here rather than argued with: for every car, the rig's cabin box
 * and the eye the seat computes, and whether one is actually inside the other.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 830 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const rows = await p.evaluate(async () => {
  const g = window.__game;
  const { CAR_CATALOG, buildCarMesh } = await import('./src/vehicles.js');
  const out = [];
  const T = { up: 0.18, fwd: 0.38 };
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  for (const c of CAR_CATALOG) {
    const mesh = buildCarMesh(c.spec ?? c);
    const r = mesh?.userData?.rig;
    if (!r) { out.push({ key: c.key, err: 'no rig' }); continue; }
    const { cabY, cabH, cabZ, cabL, capTop, zFront, zRear } = r;
    const eyeY = clamp(cabY + cabH * T.up, cabY - cabH * 0.35, cabY + cabH * 0.45);
    const eyeZ = cabZ + Math.min(cabL * 0.42, cabL * T.fwd);
    out.push({ key: c.key,
      cabY: +cabY.toFixed(2), cabH: +cabH.toFixed(2),
      cabTop: +(cabY + cabH / 2).toFixed(2), capTop: +capTop.toFixed(2),
      eyeY: +eyeY.toFixed(2),
      // how far BELOW the cabin roof the eye sits — negative means it is above
      headroom: +((cabY + cabH / 2) - eyeY).toFixed(2),
      capGap: +(capTop - eyeY).toFixed(2),
      cabZ: +cabZ.toFixed(2), cabL: +cabL.toFixed(2),
      cabFront: +(cabZ + cabL / 2).toFixed(2), eyeZ: +eyeZ.toFixed(2),
      // how far BEHIND the windscreen the eye sits
      screenGap: +((cabZ + cabL / 2) - eyeZ).toFixed(2),
      zFront: +zFront.toFixed(2) });
  }
  return out;
});
console.log('car        cabY  cabH  cabTop capTop  eyeY  headroom capGap | cabFront  eyeZ  screenGap  noseZ');
for (const r of rows) {
  if (r.err) { console.log(`${r.key.padEnd(10)} ${r.err}`); continue; }
  console.log(`${r.key.padEnd(10)} ${String(r.cabY).padStart(5)} ${String(r.cabH).padStart(5)} `
    + `${String(r.cabTop).padStart(6)} ${String(r.capTop).padStart(6)} ${String(r.eyeY).padStart(5)} `
    + `${String(r.headroom).padStart(8)} ${String(r.capGap).padStart(6)} | `
    + `${String(r.cabFront).padStart(8)} ${String(r.eyeZ).padStart(5)} `
    + `${String(r.screenGap).padStart(9)} ${String(r.zFront).padStart(6)}`);
}
await b.close();
