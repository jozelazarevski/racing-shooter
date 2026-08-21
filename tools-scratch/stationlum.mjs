/* HOW DARK IS THE ROAD, STATION BY STATION, ON A PHONE.
 *
 * TWO MEASUREMENT MISTAKES ARE DESIGNED OUT OF THIS, both made an hour ago:
 *
 * 1. DRIVING IS NOISY. `darkband.mjs` drove each world and took the worst of
 *    four frames, and the same untouched world (CLIFF KNOT) read 29.3% on one
 *    build and 100.0% on the other — world scatter uses bare `Math.random()`,
 *    so no two loads are the same lap. Nothing can be attributed from that.
 *    The car is PARKED at fixed stations here, so the two builds are compared
 *    at the same places on the same road.
 *
 * 2. THE COMPOSER IS NOT OPTIONAL. Comparing `g.frame()` (bloom + grade +
 *    OutputPass tone map) against `renderer.render()` (no tone map) made the
 *    fog look like it was crushing the frame 4x when the difference was the
 *    post chain. EVERY sample here goes through `g.frame()`.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const OUT = process.env.OUT ?? '';
const STATIONS = Number(process.env.STATIONS ?? 8);
if (OUT) fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.setDefaultTimeout(600000);
const all = [];
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const ok = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`${id} SKIP`); continue; }
  const r = await page.evaluate((STATIONS) => {
    const g = window.__game, t = g.track, p = g.player, N = t.center.length;
    g.clock.getDelta = () => 1 / 60;
    // THE SETTLE FRAMES DO NOT NEED PIXELS. 150 composed frames per station,
    // twelve stations, sixty-seven worlds is hours of swiftshader; the fog
    // lerp and the camera boom are sim state and run whether or not anything
    // is drawn. Only the measured frame is rendered.
    g.__realRender = g.composer.render.bind(g.composer);
      // AUTO-QUALITY OFF: it resizes the composer when it drops a tier, a
      // resize EMPTIES the canvas until the next render, and the stub below
      // swallows that render. Cost 52 blank frames of 432 in one sweep and
      // looked exactly like a severe rendering bug — see tour.mjs's note and
      // tools-scratch/resizeblank.mjs. The fps it measures is a number about
      // the harness anyway: these files step a fixed clock.
      g._autoQuality = () => {};
    g.composer.render = () => { if (g.__want) g.__realRender(); };
    const lum = (x0, y0, x1, y1) => {
      const cv = g.renderer.domElement;
      const c = document.createElement('canvas');
      c.width = 260; c.height = Math.round(260 * cv.height / cv.width);
      const cx = c.getContext('2d');
      cx.drawImage(cv, 0, 0, c.width, c.height);
      const X = Math.round(c.width * x0), Y = Math.round(c.height * y0);
      const W = Math.max(1, Math.round(c.width * (x1 - x0)));
      const H = Math.max(1, Math.round(c.height * (y1 - y0)));
      const px = cx.getImageData(X, Y, W, H).data;
      let s = 0;
      for (let i = 0; i < px.length; i += 4) s += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
      return s / (px.length / 4);
    };
    const rows = [];
    for (let k = 0; k < STATIONS; k++) {
      const i = Math.round(N * k / STATIONS);
      const c = t.center[i];
      p.pos.set(c.x, c.y + 1.2, c.z); p.y = c.y;
      p.vel.set(0, 0, 0); p.vy = 0; p.airborne = false;
      p.trackIndex = i; p.heading = t.headingAt(i);
      p.alive = true; p.health = p.maxHealth ?? 100;
      p._lostT = 0; p._wedgeT = 0; p._bogT = 0; g._blindT = 0;
      // settle the boom AND the fog lerp (2.2*dt reaches ~96% in 1.5 s)
      for (let f = 0; f < 150; f++) { g.input.analog.throttle = 0; g.input.analog.steer = 0; g.frame(); }
      g.__want = 1; g.frame(); g.__want = 0;
      const zone = (t.vizZones ?? []).find((z) => ((i - z.i0 + N) % N) <= z.len);
      // WHAT IS THE LIGHT AT THIS STATION, not just how dark the picture is.
      // A dark frame can be a low sun, a thin fill, fog pulled in over a dark
      // fog colour, or a shadow — and they are fixed in different places.
      // ...and the lights are NOT direct children of the scene on this
      // roster — the first cut read `scene.children` and printed `undefined`
      // for every world. Walk it.
      let sun = null, hemi = null, amb = null;
      g.scene.traverse((o) => {
        if (!sun && o.isDirectionalLight) sun = o;
        if (!hemi && o.isHemisphereLight) hemi = o;
        if (!amb && o.isAmbientLight) amb = o;
      });
      const tun = t.tunnelAt ? !!t.tunnelAt(p.pos, i, 10) : false;
      rows.push({ i,
        road: +lum(0.34, 0.42, 0.66, 0.72).toFixed(1),   // the carriageway ahead
        frame: +lum(0.02, 0.02, 0.98, 0.98).toFixed(1),  // everything
        zone: zone ? zone.kind : (tun ? 'bore' : ''),
        fog: [Math.round(g.scene.fog?.near ?? 0), Math.round(g.scene.fog?.far ?? 0)] });
    }
    return { name: t.level?.name ?? '?', rows };
  }, STATIONS);
  if (process.env.VERBOSE) {
    for (const x of r.rows) console.log(`      i=${String(x.i).padStart(4)} road ${String(x.road).padStart(6)}`
      + `  frame ${String(x.frame).padStart(6)}  fog ${x.fog[0]}/${x.fog[1]}  ${x.zone}`);
  }
  if (process.env.VERBOSE) for (const x of r.rows) {
    console.log(`      i=${String(x.i).padStart(4)} road ${String(x.road).padStart(6)} frame ${String(x.frame).padStart(6)}`
      + `  sun ${x.sun} (up ${x.sunY})  hemi ${x.hemi}  amb ${x.amb}  fog ${x.fogC} ${x.fog[0]}/${x.fog[1]}${x.zone ? '  zone:' + x.zone : ''}`);
  }
  const road = r.rows.map((x) => x.road).sort((a, c) => a - c);
  const med = road[road.length >> 1], lo = road[0];
  const dark = r.rows.filter((x) => x.road < 25);
  all.push({ id, name: r.name, med, lo, dark: dark.length, rows: r.rows });
  console.log(`${String(id).padStart(2)} ${r.name.padEnd(20)} road luminance median ${String(med).padStart(6)}`
    + `  darkest station ${String(lo).padStart(6)}   ${dark.length}/${r.rows.length} stations under 25`
    + (dark.length ? `   [${dark.map((x) => `${x.i}${x.zone ? ':' + x.zone : ''}`).join(' ')}]` : ''));
}
all.sort((a, c) => a.med - c.med);
console.log('\n===== DIMMEST ROADS =====');
for (const a of all.slice(0, 14)) {
  console.log(`  median ${String(a.med).padStart(6)}  darkest ${String(a.lo).padStart(6)}  ${a.dark}/${a.rows.length}  L${String(a.id).padStart(2, '0')} ${a.name}`);
}
await b.close();
