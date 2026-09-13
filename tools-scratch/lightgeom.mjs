/* WHERE THE LAMP QUADS ACTUALLY ARE. Local + world boxes for each of the six
 * quads on the player's rig, and whether each lands on screen in the chase
 * shot — so a missing beam is read off numbers, not squinted at. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '17', F = +(process.env.F ?? 0.2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:560} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(({F}) => {
  const g = window.__game, t = g.track, i = Math.floor(t.N * F), pl = g.player;
  const c = t.center[i], c2 = t.center[(i + 14) % t.N];
  pl.mesh.position.set(c.x, c.y, c.z);
  pl.mesh.rotation.set(0, Math.atan2(c2.x - c.x, c2.z - c.z), 0);
  // THE GAME'S OWN CHASE RIG (CAM_MODES 'CHASE': back 17, h 11.5, look 19
  // ahead at 3.2). Judging headlights from an invented camera is how a beam
  // that the car's own roofline hides gets called fine.
  const dx = c2.x - c.x, dz = c2.z - c.z, L = Math.hypot(dx, dz) || 1;
  g.camera.position.set(c.x - dx / L * 17, c.y + 11.5, c.z - dz / L * 17);
  g.camera.lookAt(c.x + dx / L * 19, c.y + 3.2, c.z + dz / L * 19);
  g.camera.updateMatrixWorld(true); g.camera.updateProjectionMatrix();
  pl.mesh.updateMatrixWorld(true);
  const lt = pl.mesh.userData.carLights;
  const pos = lt.geometry.attributes.position, col = lt.geometry.attributes.color;
  const V = pl.mesh.position.constructor;
  const out = [];
  for (let q = 0; q < pos.count / 6; q++) {
    let lx=0,ly=0,lz=0; const bb = {x:[1e9,-1e9],y:[1e9,-1e9],z:[1e9,-1e9]};
    for (let k = q*6; k < q*6+6; k++) {
      lx+=pos.getX(k); ly+=pos.getY(k); lz+=pos.getZ(k);
      bb.x[0]=Math.min(bb.x[0],pos.getX(k)); bb.x[1]=Math.max(bb.x[1],pos.getX(k));
      bb.y[0]=Math.min(bb.y[0],pos.getY(k)); bb.y[1]=Math.max(bb.y[1],pos.getY(k));
      bb.z[0]=Math.min(bb.z[0],pos.getZ(k)); bb.z[1]=Math.max(bb.z[1],pos.getZ(k));
    }
    const cen = new V(lx/6, ly/6, lz/6);
    const w = cen.clone().applyMatrix4(lt.matrixWorld);
    const s = w.clone().project(g.camera);
    out.push({ q, local: [+cen.x.toFixed(2), +cen.y.toFixed(2), +cen.z.toFixed(2)],
      size: [ +(bb.x[1]-bb.x[0]).toFixed(2), +(bb.y[1]-bb.y[0]).toFixed(2), +(bb.z[1]-bb.z[0]).toFixed(2) ],
      colr: [col.getX(q*6), col.getY(q*6), col.getZ(q*6)].map(v=>+v.toFixed(2)),
      worldY: +w.y.toFixed(2),
      screen: [Math.round((s.x*0.5+0.5)*900), Math.round((-s.y*0.5+0.5)*560)],
      onScreen: s.x>-1&&s.x<1&&s.y>-1&&s.y<1&&s.z<1 });
  }
  const rd = t.center[i].y;
  return { rig: pl.mesh.userData.rig && {zFront:+pl.mesh.userData.rig.zFront.toFixed(2), zRear:+pl.mesh.userData.rig.zRear.toFixed(2)},
    roadY: +rd.toFixed(2), meshY: +pl.mesh.position.y.toFixed(2),
    scale: [pl.mesh.scale.x, pl.mesh.scale.y, pl.mesh.scale.z], quads: out };
}, { F }), null, 1));
await b.close();
