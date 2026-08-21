/* IS THE WHOLE WORLD ONE COLOUR?
 *
 * UNDERCITY SLIPSTREAM declares a stained-concrete `cliffPalette` (five greys)
 * and renders as a uniform green bowl — road, walls and sky the same hue. The
 * suspicion is its own relight: `hemiIntensity: 5.5` with `hemiSky: 0x8a9a5c`
 * is an enormous green hemisphere light, and grey concrete under a green flood
 * is green.
 *
 * Measure the frame, not the theme. For each world: the share of pixels whose
 * hue sits within +-15 degrees of the frame's dominant hue, and the mean
 * saturation. A world where one hue owns most of the screen is the defect.
 *
 * CONTROLS: other `cliffWalls` worlds, which have the same wall builder and
 * the same camera and differ only in their light. If they score the same, the
 * measure is reading the canyon shape, not the lighting.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '18').split(',').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 480, height: 280 } });
page.setDefaultTimeout(600000);
for (const id of IDS) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 600000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, t = g.track, p = g.player;
    g.clock.getDelta = () => 1 / 60;
    g._autoQuality = () => {};
    const real = g.composer.render.bind(g.composer);
    g.composer.render = () => {};
    // park at four stations and look along the road from the driver's seat,
    // so the sample is the world and not one corner of it
    const read = () => {
      real();
      const cv = g.renderer.domElement;
      const c = document.createElement('canvas');
      c.width = cv.width; c.height = cv.height;
      const cx = c.getContext('2d');
      cx.drawImage(cv, 0, 0);
      const px = cx.getImageData(0, 0, c.width, c.height).data;
      const hues = new Array(36).fill(0);
      let sat = 0, n = 0, lum = 0, clip = 0, dead = 0;
      for (let i = 0; i < px.length; i += 4) {
        const R = px[i] / 255, G = px[i + 1] / 255, B = px[i + 2] / 255;
        const mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn;
        lum += (R * 0.299 + G * 0.587 + B * 0.114) * 255;
        n++;
        // BLOWOUT, both ends: a channel pinned at the top has lost its
        // texture, and one pinned at the bottom never had any to lose.
        if (px[i] >= 252 || px[i + 1] >= 252 || px[i + 2] >= 252) clip++;
        if (mx > 0.15 && mn <= 0.02) dead++;
        if (d < 0.04) continue;                    // greys carry no hue
        sat += d / (mx || 1);
        let h;
        if (mx === R) h = ((G - B) / d + 6) % 6;
        else if (mx === G) h = (B - R) / d + 2;
        else h = (R - G) / d + 4;
        hues[Math.min(35, Math.floor(h * 60 / 10))] += 1;
      }
      const tot = hues.reduce((a, x) => a + x, 0) || 1;
      let best = 0, bi = 0;
      for (let k = 0; k < 36; k++) {
        const w = hues[k] + hues[(k + 1) % 36] + hues[(k + 35) % 36];
        if (w > best) { best = w; bi = k; }
      }
      return { dominantShare: +(best / tot * 100).toFixed(1),
        dominantHue: bi * 10, meanSat: +(sat / tot).toFixed(3),
        meanLum: +(lum / n).toFixed(1),
        clip: +(clip / n * 100).toFixed(1), dead: +(dead / n * 100).toFixed(1) };
    };
    const N = t.center.length;
    const outs = [];
    for (const frac of [0.05, 0.3, 0.55, 0.8]) {
      const i = Math.floor(N * frac);
      const c = t.center[i];
      p.pos.set(c.x, c.y + 1.2, c.z);
      p.speed = 0; p.trackIndex = i;
      p.heading = t.headingAt(i);
      for (let k = 0; k < 4; k++) g.frame();
      outs.push(read());
    }
    g.composer.render = real;
    const med = (a) => a.slice().sort((x, y) => x - y)[a.length >> 1];
    return { name: g.level?.name,
      dominantShare: med(outs.map((o) => o.dominantShare)),
      dominantHue: med(outs.map((o) => o.dominantHue)),
      meanSat: med(outs.map((o) => o.meanSat)),
      meanLum: med(outs.map((o) => o.meanLum)),
      clip: med(outs.map((o) => o.clip)), dead: med(outs.map((o) => o.dead)),
      hemi: t.T.hemiIntensity, hemiSky: t.T.hemiSky?.toString(16) };
  });
  console.log(`L${String(id).padStart(2)} ${String(r.name).padEnd(22)} sat ${String(r.meanSat).padStart(5)} | clipped ${String(r.clip).padStart(5)}% | starved ${String(r.dead).padStart(5)}% | lum ${String(r.meanLum).padStart(5)} | hemi ${r.hemi}`);
}
await b.close();
