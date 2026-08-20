/* HOW MUCH OF THE WALL'S DETAIL SURVIVES THE LIGHT?
 *
 * The cliff texture on UNDERCITY SLIPSTREAM is grey concrete — measured off
 * its own canvas at RGB (97,103,88), saturation 0.145 — and the wall on screen
 * is flat saturated green. The suspect is the fill: `hemiIntensity: 5.5` in
 * `hemiSky: #8a9a5c` against 0.8 on every other cliffWalls world.
 *
 * ISOLATE THE WALL, DON'T EYEBALL IT. Render the frame twice, once with the
 * cliff ribbons hidden, and difference the two: the pixels that changed ARE
 * the wall, exactly, with no threshold to tune. (The same trick that finally
 * measured the car after two magenta key-colour attempts failed.)
 *
 * Then two numbers about those pixels:
 *   sat  — mean saturation. The texture's own is 0.145; a wall rendering far
 *          above that is being coloured by the light, not by its material.
 *   sd   — standard deviation of luminance. This is the DETAIL. Concrete
 *          banding, seams and cracks are luminance variation; a wall blown to
 *          a flat wash has none, however colourful it is.
 *
 * Driven, in CHASE, through the real composer — `g.constructor.CAM_NAMES`, not
 * `g.CAM_NAMES`, which is undefined and silently leaves the intro camera on
 * (it did, and produced a whole table of numbers about the wrong frames).
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '18').split(',').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 380 } });
page.setDefaultTimeout(600000);
for (const id of IDS) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, t = g.track;
    if (!t.T.cliffWalls) return { name: g.level?.name, skip: 'no cliff walls' };
    const CN = g.constructor.CAM_NAMES ?? [];
    const ci = CN.indexOf('CHASE');
    if (ci >= 0) g.camMode = ci;
    g.clock.getDelta = () => 1 / 60;
    g._autoQuality = () => {};
    const real = g.composer.render.bind(g.composer);
    let stub = true;
    g.composer.render = () => { if (!stub) real(); };
    // the cliff ribbons: the big textured buffer geometries the walls are made of
    const ribbons = [];
    t.group.traverse((o) => {
      if (o.isMesh && o.material?.map && o.geometry?.attributes?.position?.count > 2000
          && o.name !== 'road-skirt') ribbons.push(o);
    });
    const grab = () => {
      const cv = g.renderer.domElement;
      const c = document.createElement('canvas');
      c.width = cv.width; c.height = cv.height;
      c.getContext('2d').drawImage(cv, 0, 0);
      return c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    };
    const samples = [];
    for (let f = 0; f < 45 * 60; f++) {
      g.input.analog.throttle = 1;
      g.frame();
      if (f < 600 || f % 300) continue;            // let the race actually start
      stub = false;
      real();
      const withWall = grab();
      const vis = ribbons.map((o) => o.visible);
      ribbons.forEach((o) => { o.visible = false; });
      real();
      const without = grab();
      ribbons.forEach((o, k) => { o.visible = vis[k]; });
      real();
      stub = true;
      let n = 0, sat = 0, lum = 0, lum2 = 0;
      for (let i = 0; i < withWall.length; i += 4) {
        const dr = Math.abs(withWall[i] - without[i]);
        const dg = Math.abs(withWall[i + 1] - without[i + 1]);
        const db = Math.abs(withWall[i + 2] - without[i + 2]);
        if (dr + dg + db < 12) continue;           // not a wall pixel
        const R = withWall[i], G = withWall[i + 1], B = withWall[i + 2];
        const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
        sat += mx ? (mx - mn) / mx : 0;
        const L = R * 0.299 + G * 0.587 + B * 0.114;
        lum += L; lum2 += L * L; n++;
      }
      if (n < 2000) continue;                      // wall barely in frame
      const mean = lum / n;
      samples.push({ n, sat: sat / n, mean, sd: Math.sqrt(Math.max(0, lum2 / n - mean * mean)) });
    }
    g.composer.render = real;
    if (!samples.length) return { name: g.level?.name, skip: 'wall never filled enough of a frame' };
    const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
    return { name: g.level?.name, frames: samples.length,
      wallPixels: med(samples.map((s) => s.n)),
      sat: +med(samples.map((s) => s.sat)).toFixed(3),
      lum: +med(samples.map((s) => s.mean)).toFixed(1),
      sd: +med(samples.map((s) => s.sd)).toFixed(1),
      texSat: null, hemi: t.T.hemiIntensity };
  });
  if (r.skip) console.log(`L${id} ${r.name}: SKIP ${r.skip}`);
  else console.log(`L${String(id).padStart(2)} ${String(r.name).padEnd(22)} `
    + `wall sat ${String(r.sat).padStart(5)} | lum ${String(r.lum).padStart(5)} `
    + `| detail sd ${String(r.sd).padStart(5)} | ${r.frames} frames, ${r.wallPixels} px | hemi ${r.hemi}`);
}
await b.close();
