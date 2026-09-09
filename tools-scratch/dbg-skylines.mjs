/* WHITE HORIZONTAL LINES IN THE SKY (owner r407, SERPENT PASS phone frame).
 * Step 1: does it still reproduce on HEAD? Screenshot the chase view.
 * Step 2: bisect. Hide each scene / track.group child in turn, re-render,
 * and report which one's removal changes the most sky pixels. The streaks
 * read THROUGH the translucent HUD in the owner's frame, so they are scene
 * geometry, not an overlay — this names which mesh. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 23), ST = Number(process.env.ST ?? 120);
const OUT = process.env.OUT ?? '/tmp/skylines.png';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 380 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`,
  { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const r = await p.evaluate(({ ST9 }) => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 500 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const i = ((ST9 % N) + N) % N, c = t.center[i], c2 = t.center[(i + 1) % N];
  const put = () => { const car = g.player;
    car.alive = true; car.health = 100; car.airborne = false; car.vy = 0;
    car.pos.set(c.x, c.y + 0.4, c.z); car.y = car.pos.y;
    car.trackIndex = i; car.lateral = 0;
    car.heading = Math.atan2(c2.x - c.x, c2.z - c.z);
    car.vel.set(0, 0, 0); car.speedAlong = 0; };
  put(); for (let k = 0; k < 90; k++) { put(); g.frame(); }
  g.frame = () => {};                       // freeze: the bisect needs one view
  const W = 640, H = 380;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d');
  // sky rectangle: the top strip, which on this world is sky and far ridge
  const RX = 0, RY = 0, RW = W, RH = Math.round(H * 0.30);
  const shot = () => {
    if (g.composer) g.composer.render(); else g.renderer.render(g.scene, g.camera);
    cx.drawImage(g.renderer.domElement, 0, 0, W, H);
    return cx.getImageData(RX, RY, RW, RH).data;
  };
  const base = shot();
  // candidates: every child of the scene and of the world group
  const kids = [];
  for (const o of g.scene.children) kids.push({ o, where: 'scene' });
  if (t.group) for (const o of t.group.children) kids.push({ o, where: 'group' });
  const rows = [];
  for (const { o, where } of kids) {
    if (!o.visible) continue;
    o.visible = false;
    const a = shot();
    o.visible = true;
    let diff = 0;
    for (let k = 0; k < a.length; k += 4) {
      if (Math.abs(a[k] - base[k]) > 6) diff++;
    }
    if (diff > 0) rows.push({ name: o.name || `(${o.type})`, where, diff,
      inst: o.isInstancedMesh ? o.count : undefined });
  }
  rows.sort((x, y) => y.diff - x.diff);
  // how streaky is the sky? row-wise deviation from the row median
  const streak = (() => {
    let n = 0;
    for (let y = 0; y < RH; y++) {
      const vals = [];
      for (let x = 0; x < RW; x++) vals.push(base[(y * RW + x) * 4]);
      const med = vals.slice().sort((a2, b2) => a2 - b2)[RW >> 1];
      for (const v of vals) if (v > med + 5) n++;
    }
    return n;
  })();
  return { world: g.level?.name, station: i, skyPixels: RW * RH, streakPixels: streak,
    top: rows.slice(0, 14) };
}, { ST9: ST });
await p.screenshot({ path: OUT, timeout: 300000 });
console.log(JSON.stringify(r, null, 1), OUT);
await browser.close();
