/* HOW MUCH OF YOUR OWN CAR CAN YOU SEE? Reported from a phone on CANYON RUN:
 * half the frame a flat slab of cliff, the car shoved into the bottom-right
 * corner behind the buttons. The existing watchdog (`_watchCarVisible`) does
 * not fire on that, and is right not to — it tests hidden, buried and OFF
 * SCREEN, and the car was none of those. It was on screen and behind a rock.
 *
 * So measure the symptom the watchdog is missing, without a raycaster:
 *   pass A  car keyed magenta, normal depth        -> what you can actually see
 *   pass B  car keyed magenta, depthTest off, on top -> its full silhouette
 * occluded = 1 - A/B. Plus where the car lands in NDC, because a car parked in
 * the corner is a badly aimed camera even when nothing is in front of it.
 *
 *   LEVEL=4 LATS=0,4,8,10,12 node camstuck.mjs
 */
import { chromium } from 'playwright-core';
const LEVEL = process.env.LEVEL ?? '4';
const LATS = (process.env.LATS ?? '0,6,10,13').split(',').map(Number);
const CAMS = (process.env.CAMS ?? '0,2,3').split(',').map(Number);
// SWEEP THE LAP, not one station. Parking at a single place and pushing the
// car sideways showed nothing: the lateral clamp held out to 30 u off the line
// and the car stayed dead centre of frame. Whatever puts the camera inside a
// cliff is a property of WHERE ON THE LAP you are, so walk the whole thing.
const STATIONS = process.env.STATIONS
  ? process.env.STATIONS.split(',').map(Number)
  : Array.from({ length: +(process.env.NSTA ?? 24) }, (_, i) => i / +(process.env.NSTA ?? 24));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 800 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LEVEL}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
await p.evaluate(async () => {
  const g = window.__game;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
  const t = g.track, pl = g.player;
  window.__hold = (lat, frac) => {
    const HOME = Math.floor(t.N * (frac ?? 0.42));
    const c = t.pointAt(HOME, lat);
    pl.heading = t.headingAt(HOME); pl.pos.x = c.x; pl.pos.z = c.z;
    if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
    pl.vy = 0; pl.airborne = false; pl.trackIndex = HOME;
    pl.vel.copy(pl.forward).multiplyScalar(6);
  };
  window.__key = (on, ignoreDepth) => {
    const car = g.player.mesh;
    if (on) {
      car.__saved ??= [];
      if (!car.__saved.length) car.traverse((o) => { if (o.isMesh && o.material) car.__saved.push([o, o.material]); });
      for (const [o, m] of car.__saved) {
        const c2 = m.clone();
        c2.color?.setHex(0xff00ff); c2.emissive?.setHex(0xff00ff);
        c2.map = null; c2.emissiveMap = null; c2.transparent = false; c2.opacity = 1;
        c2.toneMapped = false; c2.fog = false;
        c2.depthTest = !ignoreDepth;
        o.material = c2;
        o.renderOrder = ignoreDepth ? 999 : 0;
      }
    } else {
      for (const [o, m] of car.__saved || []) { o.material.dispose?.(); o.material = m; o.renderOrder = 0; }
      car.__saved = [];
    }
  };
});
const shot = async () => (await p.screenshot({ clip: { x: 0, y: 0, width: 430, height: 700 } })).toString('base64');
const count = async (d) => p.evaluate(async (dd) => {
  const img = new Image();
  await new Promise((r) => { img.onload = r; img.src = 'data:image/png;base64,' + dd; });
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  cv.getContext('2d').drawImage(img, 0, 0);
  const px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let n = 0, sx = 0, sy = 0;
  for (let q = 0; q < cv.width * cv.height; q++) {
    const i = q * 4;
    if (px[i] > 170 && px[i+2] > 170 && px[i+1] < 110) { n++; sx += q % cv.width; sy += (q / cv.width) | 0; }
  }
  return { n, cx: n ? sx / n / cv.width : null, cy: n ? sy / n / cv.height : null };
}, d);
const rows = [];
for (const cam of CAMS) {
  await p.evaluate(async (c) => {
    const g = window.__game;
    while (g.camMode !== c) g.cycleCamera();
  }, cam);
  for (const st of STATIONS) for (const lat of LATS) {
    await p.evaluate(async ([l, s2]) => {
      const g = window.__game;
      const f = () => new Promise((r) => requestAnimationFrame(r));
      for (let i = 0; i < 26; i++) { window.__hold(l, s2); await f(); }
    }, [lat, st]);
    await p.evaluate(() => { window.__key(true, false); });
    await p.evaluate(async (s2) => { const f = () => new Promise((r) => requestAnimationFrame(r)); window.__hold(0, s2); await f(); await f(); }, st);
    const seen = await count(await shot());
    // HOLD ON EVERY FRAME OF BOTH PASSES. The first cut held the car for the
    // `seen` pass and then let two frames run free before the `full` pass, so
    // the car and the camera both moved between the two images and the ratio
    // was comparing different moments. Under swiftshader a "frame" can be a
    // tenth of a second, which is metres.
    await p.evaluate(async (s2) => {
      window.__key(false); window.__key(true, true);
      const f = () => new Promise((r) => requestAnimationFrame(r));
      window.__hold(0, s2); await f(); window.__hold(0, s2); await f();
    }, st);
    const full = await count(await shot());
    // ...and take the FRAMING from the game rather than from pixels. Where the
    // car projects and how far the camera is from it are exact and free; only
    // the occlusion needs an image.
    const geo = await p.evaluate(() => {
      const g = window.__game, pl = g.player;
      const v = pl.mesh.position.clone().project(g.camera);
      const c = g.camera.position;
      return { ndc: [+v.x.toFixed(2), +v.y.toFixed(2)],
        camDist: +c.distanceTo(pl.mesh.position).toFixed(1),
        camY: +c.y.toFixed(1), carY: +pl.pos.y.toFixed(1) };
    });
    await p.evaluate(() => { window.__key(false); });
    rows.push({ cam, lat, station: +st.toFixed(3), seenPx: seen.n, fullPx: full.n,
      occludedPct: full.n ? +(100 * (1 - seen.n / full.n)).toFixed(1) : null, ...geo });
    if (process.env.SHOT) {
      await p.evaluate(async () => { const f = () => new Promise((r) => requestAnimationFrame(r)); await f(); });
      await p.screenshot({ path: `tools-scratch/shot-stuck-s${Math.round(st * 100)}.png`, clip: { x: 0, y: 0, width: 430, height: 700 } });
    }
  }
}
console.log(JSON.stringify(rows));
await b.close();
