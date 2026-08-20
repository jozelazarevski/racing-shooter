/* Point at a dark pixel and ask the scene what is there. Bracketing by hiding
 * named meshes only finds things that HAVE names; a raycast finds whatever is
 * actually in front of the camera. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '75', F = +(process.env.F ?? 0.35);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>24?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
const PT = (process.env.PT||'').split(',').map(Number);
const r = await p.evaluate(async ({F, PT}) => {
  const g = window.__game, t = g.track;
  const THREE = await import('./lib/three.module.min.js');
  const i = Math.floor(t.N * F), c = t.center[i], c2 = t.center[(i + 12) % t.N];
  g.camera.position.set(c.x, c.y + 2.6, c.z);
  g.camera.lookAt(c2.x, c2.y + 1.9, c2.z);
  g.camera.updateProjectionMatrix();
  g.renderer.render(g.scene, g.camera);
  // read the framebuffer, find the darkest non-sky pixels in the upper half,
  // and raycast through each cluster centre
  const cv = g.renderer.domElement;
  const c2d = document.createElement('canvas');
  c2d.width = cv.width; c2d.height = cv.height;
  const ctx = c2d.getContext('2d'); ctx.drawImage(cv, 0, 0);
  const W = c2d.width, H = c2d.height;
  const d = ctx.getImageData(0, 0, W, H).data;
  const hits = [];
  const rc = new THREE.Raycaster();
  const seen = new Set();
  const ys = PT.length === 2 ? [PT[1]] : null;
  for (let y = ys ? ys[0] : 20; y < (ys ? ys[0]+1 : H * 0.62); y += 9) {
    for (let x = ys ? PT[0] : 10; x < (ys ? PT[0]+1 : W); x += 9) {
      const o = (y * W + x) * 4;
      const R = d[o], G = d[o+1], B = d[o+2];
      const lum = 0.299*R + 0.587*G + 0.114*B;
      if (!ys && lum > 78) continue;        // not dark
      if (!ys && B > R + 24) continue;      // sky / glass
      rc.setFromCamera(new THREE.Vector2((x / W) * 2 - 1, -(y / H) * 2 + 1), g.camera);
      const is = rc.intersectObjects(g.scene.children, true);
      if (!is.length) continue;
      const ob = is[0].object;
      const key = (ob.name || '(anon)') + '|' + (ob.geometry?.type || '?') + '|' +
        (ob.material?.color?.getHexString?.() || '?');
      if (!seen.has(key)) { seen.set ? 0 : 0; seen.add(key); hits.push({ key, x, y, dist: +is[0].distance.toFixed(1), count: 1 }); }
      else { const h = hits.find(h => h.key === key); if (h) h.count++; }
    }
  }
  return hits.sort((a,b) => b.count - a.count);
}, {F, PT});
for (const h of r) console.log(String(h.count).padStart(4), h.key, ` @${h.x},${h.y} d=${h.dist}`);
await b.close();
