/* Two renders: with world-skirt, without. If the pale slabs/slivers are the
 * skirt, they vanish in the second and the diff is large. Also raycasts a
 * grid of pixels and names whatever is hit, so the answer does not rest on
 * a pixel diff alone. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 25), ST = Number(process.env.ST ?? 300);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 560, height: 340 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,
  { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const info = await p.evaluate(async ({ ST9 }) => {
  const g = window.__game, t = g.track, N = t.center.length;
  const THREE = await import('three');
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 500 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const i = ((ST9 % N) + N) % N, c = t.center[i], c2 = t.center[(i + 1) % N];
  const put = () => { const car = g.player;
    car.alive = true; car.health = 100; car.airborne = false; car.vy = 0;
    car.pos.set(c.x, c.y + 0.4, c.z); car.y = car.pos.y;
    car.trackIndex = i; car.lateral = 0;
    car.heading = Math.atan2(c2.x - c.x, c2.z - c.z);
    car.vel.set(0, 0, 0); car.speedAlong = 0; };
  const gf = g.frame.bind(g);
  put(); for (let k = 0; k < 90; k++) { put(); g.frame(); }
  const W = 560, H = 340;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d');
  const shot = () => {
    if (g.composer) g.composer.render(); else g.renderer.render(g.scene, g.camera);
    cx.drawImage(g.renderer.domElement, 0, 0, W, H);
    return cx.getImageData(0, 0, W, H).data;
  };
  const skirt = [];
  g.scene.traverse((o) => { if (o.name === 'world-skirt') skirt.push(o); });
  const rc = new THREE.Raycaster();
  const chain = (o) => { const q9 = []; let q = o; while (q) { if (q.name) q9.push(q.name); q = q.parent; } return q9.join('<'); };
  const modes = [];
  for (let mode = 0; mode < 7; mode++) {
    g.camMode = mode;
    g.frame = gf; put(); for (let k = 0; k < 40; k++) { put(); g.frame(); }
    g.frame = () => {};
    const a = shot();
    for (const s of skirt) s.visible = false;
    const b = shot();
    for (const s of skirt) s.visible = true;
    let diff = 0;
    for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k] - b[k]) > 6) diff++;
    const seen = {};
    for (let gx = -0.9; gx <= 0.9; gx += 0.3) {
      for (let gy = -0.9; gy <= 0.9; gy += 0.3) {
        rc.setFromCamera(new THREE.Vector2(gx, gy), g.camera);
        const hit = rc.intersectObjects(g.scene.children, true).filter((h) => h.object.visible)[0];
        const nm = hit ? (chain(hit.object) || hit.object.type) : 'sky';
        seen[nm] = (seen[nm] ?? 0) + 1;
      }
    }
    modes.push({ mode, camY: +g.camera.position.y.toFixed(1),
      changedByHidingSkirt: diff, pctOfFrame: +(100 * diff / (W * H)).toFixed(1),
      rayHits: seen });
  }
  return { world: g.level?.name, station: i, skirts: skirt.length, pixels: W * H, modes };
}, { ST9: ST });
console.log(JSON.stringify(info, null, 1));
await browser.close();
