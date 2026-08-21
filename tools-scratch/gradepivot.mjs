/* IS THE CONTRAST PIVOT THE ONE CRUSHING BLUE?
 *
 * The grade pass does `c = (c - 0.5) * uCon + 0.5` and says of itself that it
 * "runs pre-OutputPass (linear space)". 0.5 is the midpoint of DISPLAY space;
 * in linear space mid-grey is about 0.214. So the lift is pivoted roughly
 * where highlights live, and every value below it is pushed DOWN — a channel
 * near zero is pushed to zero.
 *
 * The prediction, which is what makes this a test rather than a story: set
 * uCon to 1.0, which makes the pivot irrelevant, and the wall's blue channel
 * must jump. If it does not, the pivot is not the cause, whatever the algebra
 * says.
 *
 * uSat is knocked out separately as a control: it is the other thing in that
 * shader that could move saturation, and it must NOT explain the blue.
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
  const wall = () => {
    stub = false; real(); const A = grab();
    const vis = ribbons.map((o) => o.visible);
    ribbons.forEach((o) => { o.visible = false; }); real(); const B = grab();
    ribbons.forEach((o, k) => { o.visible = vis[k]; }); real(); stub = true;
    let n = 0, R = 0, G = 0, Bl = 0, sat = 0;
    for (let i = 0; i < A.length; i += 4) {
      if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1])
        + Math.abs(A[i + 2] - B[i + 2]) < 12) continue;
      R += A[i]; G += A[i + 1]; Bl += A[i + 2];
      const mx = Math.max(A[i], A[i + 1], A[i + 2]), mn = Math.min(A[i], A[i + 1], A[i + 2]);
      sat += mx ? (mx - mn) / mx : 0; n++;
    }
    return { rgb: [Math.round(R / n), Math.round(G / n), Math.round(Bl / n)],
      sat: +(sat / n).toFixed(3) };
  };
  const u = g.grade.uniforms;
  const con0 = u.uCon.value, sat0 = u.uSat.value, vig0 = u.uVig.value;
  const out = [];
  out.push({ what: `as shipped (uCon ${con0}, uSat ${sat0})`, ...wall() });
  u.uCon.value = 1.0;
  out.push({ what: 'uCon 1.0 (pivot irrelevant)', ...wall() });
  u.uCon.value = con0;
  u.uSat.value = 1.0;
  out.push({ what: 'uSat 1.0 (control)', ...wall() });
  u.uSat.value = sat0;
  u.uVig.value = 0;
  out.push({ what: 'uVig 0 (control)', ...wall() });
  u.uVig.value = vig0;
  g.composer.render = real;
  return out;
});
console.log('  what                              wall RGB          sat');
for (const o of r) console.log(`  ${o.what.padEnd(33)} ${JSON.stringify(o.rgb).padEnd(16)} ${o.sat}`);
await b.close();
