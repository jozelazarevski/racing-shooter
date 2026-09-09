/* Render FALKEN RIDGE from a chase pose and screenshot it, so the streaks can
 * be seen in a frame I control rather than theorised about. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 21), ST = Number(process.env.ST ?? 200);
const OUT = process.env.OUT ?? '/tmp/falken.png';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 560, height: 340 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,
  { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const info = await p.evaluate(async ({ ST9 }) => {
  const THREE9 = await import('three');
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60;
  // the drive does not need the post chain — that is where the swiftshader
  // time goes. Restored for the final frame so the shot is what ships.
  const realRender = g.composer?.render?.bind(g.composer);
  if (g.composer) g.composer.render = () => {};
  for (let k = 0; k < 500 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  // DRIVE, don't teleport: a placed car leaves the chase rig unsettled and
  // the ground-lift guard hauls the eye hundreds of units up (measured
  // camY 183 at FALKEN RIDGE station 200).
  const c9 = g.player;
  const su = Math.max(0.5, Math.hypot(t.center[1].x - t.center[0].x,
    t.center[1].z - t.center[0].z));
  for (let k = 0; k < ST9; k++) {
    const sp = Math.hypot(c9.vel.x, c9.vel.z);
    const idx = c9.trackIndex;
    const aim = t.center[(idx + Math.max(4, Math.round((9 + sp * 0.45) / su))) % N];
    let a = Math.atan2(aim.x - c9.pos.x, aim.z - c9.pos.z) - c9.heading;
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    g.input.analog.steer = Math.max(-1, Math.min(1, a * 2.2));
    g.input.analog.throttle = 1; g.input.analog.brake = 0;
    g.frame();
  }
  if (g.composer && realRender) { g.composer.render = realRender; }
  // TWO FRAMES: shadows on, shadows off. Regular parallel stripes that
  // vanish with the shadow map are acne/peter-panning, not stray geometry.
  const W = g.renderer.domElement.width, H = g.renderer.domElement.height;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d');
  const grab = () => { g.renderer.render(g.scene, g.camera);
    cx.drawImage(g.renderer.domElement, 0, 0);
    return cx.getImageData(0, 0, W, H).data; };
  const on = grab();
  // FIND THE STRIPES, THEN ASK WHAT IS DRAWN THERE. A coarse ray grid misses
  // a 1-2 px line; detect the lines first (a pixel clearly brighter than the
  // pixels above AND below it) and raycast through exactly those.
  const at = (x, y) => on[(y * W + x) * 4] + on[(y * W + x) * 4 + 1] + on[(y * W + x) * 4 + 2];
  const px = [];
  for (let y = 3; y < H - 3; y++) {
    for (let x = 2; x < W - 2; x += 2) {
      const v = at(x, y);
      if (v - at(x, y - 3) > 26 && v - at(x, y + 3) > 26
          && Math.abs(at(x - 2, y) - v) < 22) px.push([x, y]);
    }
  }
  const step = Math.max(1, Math.floor(px.length / 40));
  const picked = px.filter((_, k) => k % step === 0).slice(0, 40);
  const THREE2 = THREE9;
  const rc = new THREE2.Raycaster();
  const chain = (o) => { const q9 = []; let q = o; while (q) { if (q.name) q9.push(q.name); q = q.parent; } return q9.join('<'); };
  const hitNames = {};
  for (const [x, y] of picked) {
    rc.setFromCamera(new THREE2.Vector2((x / W) * 2 - 1, -((y / H) * 2 - 1)), g.camera);
    const h = rc.intersectObjects(g.scene.children, true).filter((z) => z.object.visible)[0];
    const nm = h ? (chain(h.object) || `(unnamed ${h.object.type})`) : 'sky/none';
    hitNames[nm] = (hitNames[nm] ?? 0) + 1;
  }
  const hidNames = null, diff = px.length;
  if (!window.__KEEPSHADOWS) {
    if (g.composer) g.composer.render();      // leave shadows OFF for the shot
  } else {
    g.renderer.shadowMap.enabled = wasOn;
    g.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
    if (g.composer) g.composer.render();
  }
  return { stripePixels: diff, sampled: picked.length, whatIsThere: hitNames,
    world: g.level?.name, station: c9.trackIndex,
    camY: +g.camera.position.y.toFixed(1), carY: +c9.pos.y.toFixed(1),
    kmh: Math.round(Math.hypot(c9.vel.x, c9.vel.z) * 3.6) };
}, { ST9: ST });
await p.screenshot({ path: OUT, timeout: 300000 });
console.log(JSON.stringify(info), OUT);
await browser.close();
