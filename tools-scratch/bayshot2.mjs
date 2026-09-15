/* A photograph of the BUILD BAY as a player sees it on a phone: open the
 * garage, find the live 3D stage, and shoot the panel. The bay is the one
 * screen in the game whose whole job is to show you a car. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, hasTouch: true, isMobile: true,
  deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu(); document.getElementById('tab-btn-garage')?.click(); });
await p.waitForTimeout(2500);
// HIDE=wall|dado|floor — bisect what a mystery shape in the bay actually is
const HIDE = process.env.HIDE || '';
if (HIDE) await p.evaluate((h) => {
  const st = window.__game.__stage;
  const byIdx = { floor: 0, lineA: 1, lineB: 2, wall: 3, dado: 4 };
  for (const k of h.split(',')) if (byIdx[k] !== undefined) st.scene.children[byIdx[k]].visible = false;
}, HIDE);
console.log(JSON.stringify(await p.evaluate(() => {
  const st = window.__game.__stage; if (!st) return 'no stage';
  return st.scene.children.map((o) => `${o.type} ${o.name || ''} p=${o.position.toArray().map(n=>+n.toFixed(1))} ` +
    (o.geometry?.parameters ? JSON.stringify(o.geometry.parameters) : '') +
    (o.material?.color ? ' #' + o.material.color.getHexString() : '') +
    (o.visible ? '' : ' HIDDEN'));
})));
// HOW MUCH OF THE PANEL THE CAR ACTUALLY FILLS. "The car is small" is a
// framing multiplier, and a multiplier is a number — so measure it.
console.log('fill ' + JSON.stringify(await p.evaluate(() => {
  const st = window.__game.__stage; if (!st?.car) return 'no car';
  const V = st.cam.position.constructor;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  st.cam.updateMatrixWorld(true); st.pivot.updateMatrixWorld(true);
  st.car.traverse((o) => {
    if (!o.isMesh || !o.visible || !o.geometry?.attributes?.position) return;
    const a = o.geometry.attributes.position;
    for (let k = 0; k < a.count; k += Math.max(1, Math.floor(a.count / 24))) {
      const v = new V(a.getX(k), a.getY(k), a.getZ(k)).applyMatrix4(o.matrixWorld).project(st.cam);
      x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
    }
  });
  return { widthPct: +((x1 - x0) * 50).toFixed(1), heightPct: +((y1 - y0) * 50).toFixed(1),
    aspect: +st.cam.aspect.toFixed(2), camDist: +st.cam.position.length().toFixed(2) };
})));
// SPIN=rad parks the turntable at a fixed angle — the bay spins, and a
// grounding check has to be made at an angle where the floor under the car is
// actually visible.
if (process.env.SPIN) console.log('spin ' + await p.evaluate((a) => {
  const st = window.__game.__stage;
  st.pivot.rotation.y = +a;
  st.r.render(st.scene, st.cam);
  return JSON.stringify({ contact: !!st.contact,
    contactScale: st.contact && st.contact.scale.toArray().map(n => +n.toFixed(2)) });
}, process.env.SPIN));
const el = await p.$('.bp-stage');
if (el) {
  const box = await el.boundingBox();
  await p.screenshot({ path: 'tools-scratch/shot-bay.png',
    clip: { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8),
      width: Math.min(420, box.width + 16), height: Math.min(900, box.height + 16) } });
  console.log('shot-bay.png  stage', JSON.stringify(box));
} else {
  await p.screenshot({ path: 'tools-scratch/shot-bay.png' });
  console.log('shot-bay.png (full page — no .bp-stage found)');
}
if (errs.length) console.log('ERRORS', errs.slice(0, 3));
await b.close();
