/* THE COLOUR CAST OF A WORLD, from the camera it is played from. A phone shot
 * of NEO-KYOTO came back at mean RGB (65, 82, 16) — the blue channel all but
 * dead, the whole frame one olive tone. "Too green" is not a finding; this is.
 *
 *   LEVELS=18 node worldcast.mjs          one world
 *   LEVELS=1,6,18,19 node worldcast.mjs   compare against worlds that are fine
 *
 * It pins the car to a FIXED station (physics carries it on otherwise, and then
 * every reading is from a different corner) and reports the frame's mean RGB,
 * the green excess over the red/blue average, how much is blown to white, and
 * the theme's own light constants beside them, so a cast can be traced to the
 * numbers that cause it rather than guessed at. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const LEVELS = (process.env.LEVELS ?? '18').split(',');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const out = [];
for (const lvl of LEVELS) {
  const p = await b.newPage({ viewport: { width: 430, height: 800 } });
  p.setDefaultTimeout(600000);
  if (process.env.NOPIN) await p.addInitScript(() => { window.__NOPIN = 1; });
  await p.goto(`${BASE}/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  const info = await p.evaluate(async () => {
    const g = window.__game, pl = g.player, t = g.track;
    // the theme block lives on the TRACK, not the game (track.js:6233)
    const T = t.T || g.T || {};
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const HOME = Math.floor(t.N * 0.30);
    const pin = () => {
      const c = t.pointAt(HOME, 0);
      pl.heading = t.headingAt(HOME);
      pl.pos.x = c.x; pl.pos.z = c.z;
      if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
      pl.vy = 0; pl.airborne = false; pl.trackIndex = HOME;
      pl.vel.copy(pl.forward).multiplyScalar(30);
    };
    // WAIT FOR THE LIGHTS. `?go=1` still runs a countdown, and during it the
    // world is not drawn at all — the first reading of NEO-KYOTO came back at
    // luminance 9 with 77% black, which was the grid sequence, not the world.
    g.startRace?.();
    for (let i = 0; i < 600 && g.state !== 'race'; i++) await frame();
    // NOPIN=1 lets the car drive itself instead. Pinning parks the car at a
    // fixed station so two tunes are read at the same corner, but in a SEALED
    // world it can also park the chase camera inside the tunnel roof, and then
    // the reading is 77% black because the camera is inside a wall.
    if (window.__NOPIN) { for (let i = 0; i < 240; i++) await frame(); }
    else for (let i = 0; i < 60; i++) { pin(); await frame(); }
    const hex = (v) => (v === undefined ? null : '#' + v.toString(16).padStart(6, '0'));
    return { level: g.level ?? null, state: g.state, raceT: +(g.raceTime ?? -1).toFixed(1),
      light: { hemiSky: hex(T.hemiSky), hemiGround: hex(T.hemiGround),
        hemiIntensity: T.hemiIntensity, sunColor: hex(T.sunColor),
        sunIntensity: T.sunIntensity, fogColor: hex(T.fogColor),
        fogNear: T.fogNear, fogFar: T.fogFar,
        exposure: +g.renderer.toneMappingExposure.toFixed(2) } };
  });
  // READ THE FRAME THROUGH THE COMPOSITOR, not off the canvas. The renderer
  // has no `preserveDrawingBuffer`, so `drawImage(renderer.domElement)` after
  // the frame is presented returns a blank — the first two cuts of this probe
  // reported every world at mean (0,0,0) and 100% dark, which is a readback
  // bug and not a world. Re-running `composer.render()` first did not help
  // either. A screenshot has the presented pixels; measure those.
  const png = await p.screenshot({ clip: { x: 0, y: 0, width: 430, height: 800 } });
  const stat = await p.evaluate(async (d) => {
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.src = d; });
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const x = cv.getContext('2d');
    x.drawImage(img, 0, 0);
    const px = x.getImageData(0, 0, cv.width, cv.height).data;
    let r = 0, gg = 0, bl = 0, n = 0, blown = 0, dark = 0;
    for (let k = 0; k < px.length; k += 4) {
      r += px[k]; gg += px[k+1]; bl += px[k+2]; n++;
      if (px[k] > 244 && px[k+1] > 244 && px[k+2] > 244) blown++;
      if (0.2126 * px[k] + 0.7152 * px[k+1] + 0.0722 * px[k+2] < 18) dark++;
    }
    r /= n; gg /= n; bl /= n;
    return { mean: [r, gg, bl].map((v) => +v.toFixed(1)),
      greenExcess: +(gg - (r + bl) / 2).toFixed(1),
      lum: +(0.2126 * r + 0.7152 * gg + 0.0722 * bl).toFixed(1),
      blownPct: +(100 * blown / n).toFixed(2), darkPct: +(100 * dark / n).toFixed(1) };
  }, 'data:image/png;base64,' + png.toString('base64'));
  if (process.env.SHOT) await p.screenshot({ path: `tools-scratch/shot-world-${lvl}.png`,
    clip: { x: 0, y: 0, width: 430, height: 800 } });
  out.push({ ...info, ...stat });
  await p.close();
}
console.log(JSON.stringify(out, null, 1));
await b.close();
