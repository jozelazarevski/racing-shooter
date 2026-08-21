/* WHAT THE LAMPS ACTUALLY CONTRIBUTE. Renders the same chase frame twice —
 * rig hidden, rig shown — and reports the per-pixel delta: how many pixels
 * changed, by how much, and where the brightest change sits. A beam nobody
 * can see shows up here as a delta of nothing. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '17', F = +(process.env.F ?? 0.2);
const LIFT = +(process.env.LIFT ?? 0);  // raise the rig, to tell 'not drawn' from 'buried in the road'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:560} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
const r = await p.evaluate(({F, LIFT}) => {
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
  const rigs = []; g.scene.traverse(o => { if (o.name === 'carLights') rigs.push(o); });
  const grab = () => { g.renderer.render(g.scene, g.camera);
    const cv = g.renderer.domElement, o = document.createElement('canvas');
    o.width = cv.width; o.height = cv.height;
    o.getContext('2d').drawImage(cv, 0, 0);
    return o.getContext('2d').getImageData(0, 0, o.width, o.height); };
  for (const o of rigs) o.visible = false; const off = grab();
  for (const o of rigs) { o.visible = true; o.position.y += LIFT; }
  const on = grab();
  const W = off.width, H = off.height;
  let n = 0, sum = 0, best = 0, bx = 0, by = 0;
  const box = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 };
  for (let k = 0; k < off.data.length; k += 4) {
    const d = Math.abs(on.data[k] - off.data[k]) + Math.abs(on.data[k+1] - off.data[k+1])
            + Math.abs(on.data[k+2] - off.data[k+2]);
    if (d > 6) { const px = (k / 4) % W, py = Math.floor((k / 4) / W);
      n++; sum += d;
      box.x0 = Math.min(box.x0, px); box.x1 = Math.max(box.x1, px);
      box.y0 = Math.min(box.y0, py); box.y1 = Math.max(box.y1, py);
      if (d > best) { best = d; bx = px; by = py; } }
  }
  return { rigs: rigs.length, W, H, changed: n, pctOfFrame: +(100 * n / (W * H)).toFixed(2),
    meanDelta: n ? +(sum / n).toFixed(1) : 0, peak: best, peakAt: [bx, by], box,
    url: g.renderer.domElement.toDataURL('image/png') };
}, { F, LIFT });
const fs = await import('fs');
fs.writeFileSync(`tools-scratch/shot-night-${LV}.png`, Buffer.from(r.url.split(',')[1], 'base64'));
delete r.url; console.log(JSON.stringify(r));
await b.close();
