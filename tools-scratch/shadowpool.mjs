/* IS THE BLACK PATCH ON THE ROAD A POOL OF CONTACT SHADOWS?
 *
 * `_buildContactShadows` draws one soft radial decal per tree, rock, hut and
 * prop at opacity 0.4. One is a gentle darkening. They are not clipped against
 * each other, so N overlapping decals multiply: five of them leave 8% of the
 * light. AMAZON RAPIDS parks the car in a black ellipse in the middle of its
 * carriageway at station 675 (road luminance 20.2 against its own 48.4
 * median). Toggled off and re-measured, same frame, same camera. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.setDefaultTimeout(600000);
for (const arg of process.argv.slice(2)) {
  const [id, station] = arg.split(':');
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  const r = await page.evaluate((i) => {
    const g = window.__game, t = g.track, p = g.player;
    g.clock.getDelta = () => 1 / 60;
    const lum = () => {
      const cv = g.renderer.domElement;
      const c = document.createElement('canvas');
      c.width = 260; c.height = Math.round(260 * cv.height / cv.width);
      const cx = c.getContext('2d');
      cx.drawImage(cv, 0, 0, c.width, c.height);
      const px = cx.getImageData(Math.round(c.width * 0.34), Math.round(c.height * 0.42),
        Math.round(c.width * 0.32), Math.round(c.height * 0.30)).data;
      let s = 0;
      for (let k = 0; k < px.length; k += 4) s += 0.2126 * px[k] + 0.7152 * px[k + 1] + 0.0722 * px[k + 2];
      return +(s / (px.length / 4)).toFixed(1);
    };
    const c0 = t.center[i];
    p.pos.set(c0.x, c0.y + 1.2, c0.z); p.y = c0.y;
    p.vel.set(0, 0, 0); p.vy = 0; p.airborne = false;
    p.trackIndex = i; p.heading = t.headingAt(i);
    p.alive = true; p.health = p.maxHealth ?? 100;
    for (let f = 0; f < 150; f++) { g.input.analog.throttle = 0; g.input.analog.steer = 0; g.frame(); }
    const out = { name: t.level?.name, on: lum() };
    // find them by NAME, and say how many decals and how many of them land in
    // the carriageway at this station
    let sh = null;
    t.group.traverse((o) => { if (o.name === 'contact-shadows') sh = o; });
    if (!sh) return { ...out, found: false };
    sh.visible = false; g.frame(); out.off = lum();
    sh.visible = true; g.frame();
    // ...and the OTHER two candidates, each isolated the same way: the real
    // shadow map, and the wet-road puddle/gleam layer baked into the texture.
    const wasShadow = g.renderer.shadowMap.enabled;
    g.renderer.shadowMap.enabled = false;
    g.scene.traverse((o) => { if (o.material && o.material.needsUpdate !== undefined) o.material.needsUpdate = true; });
    g.frame(); g.frame(); out.noShadowMap = lum();
    g.renderer.shadowMap.enabled = wasShadow;
    g.scene.traverse((o) => { if (o.material && o.material.needsUpdate !== undefined) o.material.needsUpdate = true; });
    g.frame(); g.frame();
    // count decals whose disc overlaps the road here
    const half = t.widthAt ? t.widthAt(i) : 9;
    let near = 0;
    for (const s of (t._shadows ?? [])) {
      const d = Math.hypot(s.x - c0.x, s.z - c0.z);
      if (d < s.r + half + 6) near++;
    }
    return { ...out, found: true, decals: sh.count ?? (t._shadows ?? []).length, near, half: +half.toFixed(1) };
  }, Number(station));
  console.log(`${id}@${station} ${(r.name ?? '?').padEnd(20)} road luminance ${r.on}`
    + (r.found ? `  ->  ${r.off} no contact shadows  ->  ${r.noShadowMap} no shadow map   (${r.near} decals reach this station of ${r.decals}; half-width ${r.half})`
      : '  (no contact-shadows mesh found)'));
}
await b.close();
