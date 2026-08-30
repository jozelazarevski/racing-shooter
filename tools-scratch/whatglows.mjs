/* WHAT IS THE WHITE CONE ON THE ROAD? Reported from a phone on a night race
 * against the DEPLOYED build, which carries no car-lamp rig at all — so the
 * beam is something already in the world and naming it is the whole job.
 * Renders the phone's own framing, then hides one additive/emissive object at
 * a time and keeps whichever removal actually takes the bright pixels away.
 * PORT= picks which build to ask. */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? '8902';
const LV = process.env.LV ?? '17';
const MODE = +(process.env.MODE ?? 2);
const F = +(process.env.F ?? 0.2);   // the report was taken 2.5s into lap 1, i.e. the START
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 },
  isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto(`http://localhost:${PORT}/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>90?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
const out = await p.evaluate(({ MODE, F }) => {
  const g = window.__game, t = g.track, pl = g.player;
  const i = Math.floor(t.N * F) % t.N, c = t.center[i], c2 = t.center[(i + 14) % t.N];
  const place = () => { pl.pos.set(c.x, c.y, c.z);
    pl.heading = Math.atan2(c2.x - c.x, c2.z - c.z); pl.trackIndex = i;
    pl.mesh.position.set(c.x, c.y, c.z); pl.mesh.rotation.set(0, pl.heading, 0); };
  g.camMode = MODE;
  for (let k = 0; k < 40; k++) { place(); g._updateCamera(1 / 60); }
  const shot = () => { g.renderer.render(g.scene, g.camera);
    const cv = g.renderer.domElement, o = document.createElement('canvas');
    o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
    return o.getContext('2d').getImageData(0, 0, o.width, o.height).data; };
  // "bright" = well above what this dark world paints anywhere else
  const bright = (d) => { let n = 0;
    for (let k = 0; k < d.length; k += 4)
      if (d[k] > 150 && d[k+1] > 150 && d[k+2] > 150) n++;
    return n; };
  const base = bright(shot());
  // every candidate: additive or emissive, drawn, near the car
  const cands = [];
  g.scene.traverse((o) => {
    if (!(o.isMesh || o.isInstancedMesh || o.isSprite) || !o.visible) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m) return;
    const additive = m.blending === 2 /* AdditiveBlending */;
    const emissive = m.emissiveIntensity > 0 || m.type === 'MeshBasicMaterial';
    if (!additive && !emissive) return;
    const v = new (g.camera.position.constructor)(); o.getWorldPosition(v);
    const d = Math.hypot(v.x - c.x, v.z - c.z);
    if (d > 220 && !o.isInstancedMesh) return;
    cands.push({ o, name: o.name || o.type, additive, dist: Math.round(d),
      mat: m.type, parent: o.parent?.name || o.parent?.type });
  });
  const found = [];
  for (const cd of cands) {
    cd.o.visible = false;
    const n = bright(shot());
    cd.o.visible = true;
    const took = base - n;
    if (took > base * 0.06) found.push({ name: cd.name, parent: cd.parent, mat: cd.mat,
      additive: cd.additive, dist: cd.dist, brightPixelsRemoved: took,
      pctOfBright: +(100 * took / Math.max(1, base)).toFixed(1) });
  }
  found.sort((a, b2) => b2.brightPixelsRemoved - a.brightPixelsRemoved);
  g.renderer.render(g.scene, g.camera);
  return { candidates: cands.length, brightPixels: base, culprits: found.slice(0, 8),
    url: g.renderer.domElement.toDataURL('image/png') };
}, { MODE, F });
const fs = await import('fs');
fs.writeFileSync(`tools-scratch/shot-glow-${PORT}-${MODE}-${Math.round(F*100)}.png`, Buffer.from(out.url.split(',')[1], 'base64'));
delete out.url;
console.log(JSON.stringify(out, null, 1));
if (errs.length) console.log('ERR ' + errs.slice(0, 3).join(' | '));
await b.close();
