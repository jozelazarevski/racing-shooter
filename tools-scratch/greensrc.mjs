/* WHERE IS THE GREEN COMING FROM?
 *
 * Halving the fill barely moved the wall's saturation (0.98 -> 0.76) while its
 * luminance collapsed 48 -> 20, and clipping measured 0% all along. So the
 * wall is not a blown-out grey — it is being *coloured* green by something,
 * and at low light that something dominates completely.
 *
 * Enumerate every candidate rather than test a favourite: every light in the
 * scene with its colour and intensity, the fog, the tone mapping, and any
 * full-screen overlay. Then knock each one out in turn and report the wall's
 * mean RGB. Whatever moves it is the source; whatever does not, is not.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const ID = Number(process.env.ID ?? 18);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 380 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=${ID}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const r = await page.evaluate(async () => {
  const g = window.__game, t = g.track;
  const CN = g.constructor.CAM_NAMES ?? [];
  const ci = CN.indexOf('CHASE'); if (ci >= 0) g.camMode = ci;
  g.clock.getDelta = () => 1 / 60;
  g._autoQuality = () => {};
  const real = g.composer.render.bind(g.composer);
  let stub = true;
  g.composer.render = () => { if (!stub) real(); };
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
  for (let f = 0; f < 900; f++) { g.input.analog.throttle = 1; g.frame(); }
  const wallRGB = () => {
    stub = false; real(); const A = grab();
    const vis = ribbons.map((o) => o.visible);
    ribbons.forEach((o) => { o.visible = false; }); real(); const B = grab();
    ribbons.forEach((o, k) => { o.visible = vis[k]; }); real(); stub = true;
    let n = 0, R = 0, G = 0, Bl = 0;
    for (let i = 0; i < A.length; i += 4) {
      if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1])
        + Math.abs(A[i + 2] - B[i + 2]) < 12) continue;
      R += A[i]; G += A[i + 1]; Bl += A[i + 2]; n++;
    }
    return n ? [Math.round(R / n), Math.round(G / n), Math.round(Bl / n)] : null;
  };
  const lights = [];
  g.scene.traverse((o) => {
    if (o.isLight) lights.push({ type: o.type, colour: '#' + o.color.getHexString(),
      ground: o.groundColor ? '#' + o.groundColor.getHexString() : null,
      i: o.intensity });
  });
  const passes = (g.composer.passes ?? []).map((p) => p.constructor.name
    + (p.enabled === false ? ' (off)' : ''));
  const out = { lights, passes,
    fog: g.scene.fog ? { colour: '#' + g.scene.fog.color.getHexString(),
      near: g.scene.fog.near, far: g.scene.fog.far } : null,
    toneMapping: g.renderer.toneMapping, exposure: g.renderer.toneMappingExposure,
    tests: [] };
  out.tests.push({ what: 'as shipped', rgb: wallRGB() });
  // knock out one candidate at a time, restoring each time
  const hemi = g.scene.children.find((o) => o.isHemisphereLight);
  const sun = g.scene.children.find((o) => o.isDirectionalLight);
  let save;
  save = hemi.intensity; hemi.intensity = 0;
  out.tests.push({ what: 'hemi OFF', rgb: wallRGB() }); hemi.intensity = save;
  save = sun.intensity; sun.intensity = 0;
  out.tests.push({ what: 'sun OFF', rgb: wallRGB() }); sun.intensity = save;
  if (g.scene.fog) { const f = g.scene.fog; g.scene.fog = null;
    out.tests.push({ what: 'fog OFF', rgb: wallRGB() }); g.scene.fog = f; }
  for (const p of (g.composer.passes ?? [])) {
    if (p.constructor.name === 'RenderPass' || p.enabled === false) continue;
    p.enabled = false;
    out.tests.push({ what: p.constructor.name + ' OFF', rgb: wallRGB() });
    p.enabled = true;
  }
  save = g.renderer.toneMapping; g.renderer.toneMapping = 0;
  out.tests.push({ what: 'toneMapping OFF', rgb: wallRGB() });
  g.renderer.toneMapping = save;
  // any full-screen tinted overlay in the DOM or a haze mesh
  const haze = [];
  g.scene.traverse((o) => { if (/haze/i.test(o.name)) haze.push(o.name); });
  out.haze = haze;
  for (const nm of haze) {
    const o = g.scene.getObjectByName(nm); const v = o.visible; o.visible = false;
    out.tests.push({ what: nm + ' OFF', rgb: wallRGB() }); o.visible = v;
  }
  g.composer.render = real;
  return out;
});
console.log('LIGHTS'); for (const l of r.lights) console.log('  ', JSON.stringify(l));
console.log('FOG  ', JSON.stringify(r.fog));
console.log('PASSES', r.passes.join(', '));
console.log('TONE ', r.toneMapping, 'exposure', r.exposure, '| haze meshes:', r.haze.join(', ') || 'none');
console.log('\n  what                     wall mean RGB');
for (const tst of r.tests) console.log(`  ${String(tst.what).padEnd(24)} ${JSON.stringify(tst.rgb)}`);
await b.close();
