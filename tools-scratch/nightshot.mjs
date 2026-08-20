/* A night world from the chase camera, which is the view the headlights are
 * actually for — a lap shot from driver height sees the pool of light but not
 * the lamps throwing it. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '17', F = +(process.env.F ?? 0.3);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
const errs = [];
p.on('pageerror', e => errs.push(String(e)));
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>40?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
const r = await p.evaluate((F) => {
  const g = window.__game, t = g.track, pl = g.player;
  const i = Math.floor(t.N * F);
  // put the car on the road at that point, facing along it, then let the game
  // place its own chase camera — the headlights follow the player, so the
  // player has to actually be there
  pl.index = i; pl.progress = i;
  const c = t.center[i], c2 = t.center[(i + 10) % t.N];
  pl.pos?.set?.(c.x, c.y, c.z);
  pl.mesh.position.set(c.x, c.y + 0.4, c.z);
  pl.heading = Math.atan2(c2.x - c.x, c2.z - c.z);
  pl.mesh.rotation.y = pl.heading;
  g._syncHeadlights?.();
  const f = { x: Math.sin(pl.heading), z: Math.cos(pl.heading) };
  g.camera.position.set(c.x - f.x * 11, c.y + 4.4, c.z - f.z * 11);
  g.camera.lookAt(c.x + f.x * 14, c.y + 1.0, c.z + f.z * 14);
  g.camera.updateProjectionMatrix();
  g.renderer.render(g.scene, g.camera);
  return { url: g.renderer.domElement.toDataURL('image/png'),
    hl: g._headlight ? g._headlight.intensity : 'none',
    lit: !!pl.mesh.userData.lit, night: !!t.T.night };
}, F);
const fs = await import('fs');
fs.writeFileSync(`tools-scratch/night-${LV}.png`, Buffer.from(r.url.split(',')[1],'base64'));
console.log(`night=${r.night} headlight=${r.hl} lamps=${r.lit}` + (errs.length ? `\nERRORS: ${errs.join(' | ')}` : ''));
await b.close();
