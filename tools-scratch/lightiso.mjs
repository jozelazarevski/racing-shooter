/* THE RIG ON ITS OWN. Same chase frame, but every mesh except the six lamp
 * quads is hidden — so where each quad actually lands is a picture, not a
 * guess. Second frame keeps the player's bodywork for scale. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '17', F = +(process.env.F ?? 0.2);
const RANGE = process.env.RANGE ?? '';   // "start,count" of vertices, to draw ONE quad
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:560} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const KEEPCAR = process.env.KEEPCAR ?? '';
const r = await p.evaluate(({F, RANGE, KEEPCAR}) => {
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
  g.camera.updateProjectionMatrix();
  const hidden = [];
  g.scene.traverse(o => {
    if ((o.isMesh || o.isInstancedMesh || o.isSprite || o.isPoints) && o.visible
        && o.name !== 'carLights'
        && !(KEEPCAR && pl.mesh.children.includes(o))) { o.visible = false; hidden.push(o); }
  });
  if (RANGE) { const [a, n] = RANGE.split(',').map(Number);
    g.scene.traverse(o => { if (o.name === 'carLights') o.geometry.setDrawRange(a, n); }); }
  g.renderer.render(g.scene, g.camera);
  return g.renderer.domElement.toDataURL('image/png');
}, { F, RANGE, KEEPCAR });
const fs = await import('fs');
fs.writeFileSync(`tools-scratch/shot-lightiso${RANGE?'-'+RANGE.replace(',','_'):''}${KEEPCAR?'-car':''}.png`, Buffer.from(r.split(',')[1], 'base64'));
console.log('wrote tools-scratch/shot-lightiso.png');
await b.close();
