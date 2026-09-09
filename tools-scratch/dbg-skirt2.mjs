/* Minimal: pose the camera as a chase view (so sky is in frame), then name
 * what each pixel-ray hits and diff the frame with world-skirt hidden. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 25), ST = Number(process.env.ST ?? 300);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 480, height: 300 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,
  { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const info = await p.evaluate(async ({ ST9 }) => {
  const g = window.__game, t = g.track, N = t.center.length;
  const THREE = await import('three');
  const i = ((ST9 % N) + N) % N, c = t.center[i], c2 = t.center[(i + 4) % N];
  const fx = c2.x - c.x, fz = c2.z - c.z;
  const L = Math.hypot(fx, fz) || 1;
  const ux = fx / L, uz = fz / L;
  const cam = g.camera;
  cam.position.set(c.x - ux * 16, c.y + 6, c.z - uz * 16);
  cam.lookAt(c.x + ux * 40, c.y + 3, c.z + uz * 40);
  cam.updateMatrixWorld(true);
  const W = 480, H = 300;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d');
  const shot = () => { g.renderer.render(g.scene, cam);
    cx.drawImage(g.renderer.domElement, 0, 0, W, H);
    return cx.getImageData(0, 0, W, H).data; };
  const skirt = []; g.scene.traverse((o) => { if (o.name === 'world-skirt') skirt.push(o); });
  const a = shot();
  for (const s of skirt) s.visible = false;
  const b = shot();
  for (const s of skirt) s.visible = true;
  let diff = 0;
  for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k] - b[k]) > 6) diff++;
  const rc = new THREE.Raycaster();
  const chain = (o) => { const q9 = []; let q = o; while (q) { if (q.name) q9.push(q.name); q = q.parent; } return q9.join('<'); };
  const seen = {};
  for (let gx = -0.95; gx <= 0.95; gx += 0.19) {
    for (let gy = -0.95; gy <= 0.95; gy += 0.19) {
      rc.setFromCamera(new THREE.Vector2(gx, gy), cam);
      const hit = rc.intersectObjects(g.scene.children, true).filter((h) => h.object.visible)[0];
      const nm = hit ? (chain(hit.object) || hit.object.type) : 'sky';
      seen[nm] = (seen[nm] ?? 0) + 1;
    }
  }
  return { world: g.level?.name, station: i, skirts: skirt.length,
    changedByHidingSkirt: diff, pctOfFrame: +(100 * diff / (W * H)).toFixed(1),
    rayHits: seen };
}, { ST9: ST });
console.log(JSON.stringify(info, null, 1));
await browser.close();
