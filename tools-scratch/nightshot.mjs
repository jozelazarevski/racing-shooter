/* A chase-camera frame on a night world, and the list of what is drawn near
 * the player — the shot the headlight work is judged from. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '17', F = +(process.env.F ?? 0.2);
const HIDE = (process.env.HIDE ?? '').split(',').filter(Boolean);
const CAM = process.env.CAM ?? 'chase';   // chase | front (oncoming, what a lamp looks like head on)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:560} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>90?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
const out = await p.evaluate(({F, HIDE, CAM}) => {
  const g = window.__game, t = g.track, i = Math.floor(t.N * F);
  const pl = g.player;
  const c = t.center[i], c2 = t.center[(i + 14) % t.N];
  pl.pos?.copy ? pl.pos.copy(c) : null;
  const head = Math.atan2(c2.x - c.x, c2.z - c.z);
  if (pl.mesh) { pl.mesh.position.set(c.x, c.y, c.z); pl.mesh.rotation.set(0, head, 0); }
  // Park two rivals ahead: one running away, one coming at the camera, so the
  // shot shows what a following driver sees AND what an oncoming one does.
  const ahead = (n) => t.center[(i + n) % t.N];
  const en = g.enemies ?? [];
  if (en[0]?.mesh) { const a = ahead(46), a2 = ahead(60);
    en[0].mesh.position.set(a.x + 3, a.y, a.z);
    en[0].mesh.rotation.set(0, Math.atan2(a2.x - a.x, a2.z - a.z), 0); }
  if (en[1]?.mesh) { const a = ahead(70), a2 = ahead(56);
    en[1].mesh.position.set(a.x - 5, a.y, a.z);
    en[1].mesh.rotation.set(0, Math.atan2(a2.x - a.x, a2.z - a.z), 0); }
  for (const h of HIDE) g.scene.traverse(o => { if ((o.name || '') === h) o.visible = false; });
  // chase camera: behind and above the player, looking down the road
  // THE GAME'S OWN CHASE RIG (CAM_MODES 'CHASE': back 17, h 11.5, look 19
  // ahead at 3.2). Judging headlights from an invented camera is how a beam
  // that the car's own roofline hides gets called fine.
  const dx = c2.x - c.x, dz = c2.z - c.z, L = Math.hypot(dx, dz) || 1;
  if (CAM === 'rear') {           // low and close behind: the tail-lamp check
    g.camera.position.set(c.x - dx / L * 9, c.y + 1.7, c.z - dz / L * 9);
    g.camera.lookAt(c.x, c.y + 1.0, c.z);
  } else if (CAM === 'front') {          // standing up the road, the pack coming at you
    g.camera.position.set(c.x + dx / L * 12, c.y + 1.9, c.z + dz / L * 12 + 2.5);
    g.camera.lookAt(c.x, c.y + 1.0, c.z);
  } else {
    g.camera.position.set(c.x - dx / L * 17, c.y + 11.5, c.z - dz / L * 17);
    g.camera.lookAt(c.x + dx / L * 19, c.y + 3.2, c.z + dz / L * 19);
  }
  g.camera.updateProjectionMatrix();
  g.renderer.render(g.scene, g.camera);
  const near = [];
  g.scene.traverse(o => {
    if (!o.isMesh && !o.isInstancedMesh && !o.isSprite && !o.isLight) return;
    const v = new (g.camera.position.constructor)();
    o.getWorldPosition(v);
    if (Math.hypot(v.x - c.x, v.z - c.z) < 18) {
      near.push(`${o.name || o.type}${o.isLight ? ' [LIGHT ' + o.type + ']' : ''}`);
    }
  });
  const lit = [];
  g.scene.traverse(o => { if (o.name === 'carLights') lit.push(o.visible ? 'on' : 'OFF'); });
  return { url: g.renderer.domElement.toDataURL('image/png'), near: [...new Set(near)].slice(0, 25),
    skyTop: t.T.skyTop, rigs: lit.join(','), cars: (g.rivals ?? []).length,
    playerLitFor: g.player?._litFor === undefined ? 'never-updated' : 'updated',
    hasRig: !!g.player?.mesh?.userData?.carLights,
    fields: Object.keys(g).filter((k) => /car|rival|traffic|opponent|ai/i.test(k)).slice(0, 8) };
}, { F, HIDE, CAM });
const fs = await import('fs');
fs.writeFileSync(`tools-scratch/shot-night-${LV}${CAM!=='chase'?'-'+CAM:''}.png`, Buffer.from(out.url.split(',')[1], 'base64'));
console.log('player', out.playerLitFor, 'rig', out.hasRig, 'fields', (out.fields||[]).join(','));
console.log('skyTop', out.skyTop, '| carLights:', out.rigs || '(none)', '| rivals', out.cars);
console.log(out.near.join('\n'));
await b.close();
