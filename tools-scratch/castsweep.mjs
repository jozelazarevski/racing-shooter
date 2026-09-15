/* TUNE THE LIGHT WITHOUT RELOADING THE WORLD. NEO-KYOTO takes ninety seconds
 * to build, so trying six light tunes by editing the theme and reloading is an
 * afternoon. The lights are objects in the scene: patch them in place, render,
 * measure, repeat, and only then write the winner into `THEMES`.
 *
 * Reports mean RGB, the green excess over the red/blue average, luminance and
 * the dark fraction. The target is a world that is still SICKLY — that is the
 * theme's whole identity — without being monochrome: blue back off the floor,
 * green excess down to roughly what a forest reads, luminance held. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 800 } });
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${process.env.LEVEL ?? 18}&go=1&unlockall=1`,
  { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
await p.evaluate(async () => {
  const g = window.__game, t = g.track, pl = g.player;
  g.startRace?.();
  const f = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
  window.__pin = () => {
    const HOME = Math.floor(t.N * 0.30);
    const c = t.pointAt(HOME, 0);
    pl.heading = t.headingAt(HOME);
    pl.pos.x = c.x; pl.pos.z = c.z;
    if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
    pl.vy = 0; pl.airborne = false; pl.trackIndex = HOME;
    pl.vel.copy(pl.forward).multiplyScalar(30);
  };
  for (let i = 0; i < 60; i++) { window.__pin(); await f(); }
});
const TUNES = JSON.parse(process.env.TUNES);
const out = [];
for (const T of TUNES) {
  await p.evaluate(async (t) => {
    const g = window.__game;
    // CAM=3 is CHASE (main.js CAM_MODES). The default TOP-DOWN looks straight
    // down and `fadeCarLights` cuts the beam there by design, so a headlight
    // complaint cannot be measured from it at all.
    // Use the game's OWN cycler, not `camMode = n`. Writing the index
    // directly skipped `_syncViewBtn` and left the view in a reset state — the
    // frame came back entirely black with a "VIEW RESET" toast on it.
    if (t.cam !== undefined) while (g.camMode !== t.cam) g.cycleCamera();
    const hemi = g.scene.children.find((o) => o.isHemisphereLight);
    const sun = g.scene.children.find((o) => o.isDirectionalLight);
    if (t.hemiSky !== undefined) hemi.color.setHex(t.hemiSky);
    if (t.hemiGround !== undefined) hemi.groundColor.setHex(t.hemiGround);
    if (t.hemiIntensity !== undefined) hemi.intensity = t.hemiIntensity;
    if (t.sunColor !== undefined) sun.color.setHex(t.sunColor);
    if (t.sunIntensity !== undefined) sun.intensity = t.sunIntensity;
    if (t.fogColor !== undefined) g.scene.fog.color.setHex(t.fogColor);
    const f = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < 8; i++) { window.__pin(); await f(); }
  }, T);
  const png = await p.screenshot({ clip: { x: 0, y: 0, width: 430, height: 800 } });
  out.push({ tune: T.label, ...await p.evaluate(async (d) => {
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.src = d; });
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const x = cv.getContext('2d'); x.drawImage(img, 0, 0);
    const px = x.getImageData(0, 0, cv.width, cv.height).data;
    let r = 0, gg = 0, bl = 0, n = 0, dark = 0, blown = 0;
    for (let k = 0; k < px.length; k += 4) {
      r += px[k]; gg += px[k+1]; bl += px[k+2]; n++;
      if (0.2126*px[k] + 0.7152*px[k+1] + 0.0722*px[k+2] < 18) dark++;
      if (px[k] > 244 && px[k+1] > 244 && px[k+2] > 244) blown++;
    }
    r /= n; gg /= n; bl /= n;
    return { mean: [r, gg, bl].map((v) => +v.toFixed(1)),
      greenExcess: +(gg - (r + bl) / 2).toFixed(1),
      lum: +(0.2126*r + 0.7152*gg + 0.0722*bl).toFixed(1),
      darkPct: +(100*dark/n).toFixed(1), blownPct: +(100*blown/n).toFixed(2) };
  }, 'data:image/png;base64,' + png.toString('base64')) });
  if (process.env.SHOT) await p.screenshot({ path: `tools-scratch/shot-cast-${T.label}.png`,
    clip: { x: 0, y: 0, width: 430, height: 800 } });
}
console.log(JSON.stringify(out));
await b.close();
