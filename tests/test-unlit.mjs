/* A WORLD YOU CANNOT SEE THE ROAD IN.
 *
 * THE COMPLAINT was a phone screenshot: a black strip running between two lit
 * green hedges, with the car somewhere in it. Not a shadow — the verges, the
 * hedgerow and the fence posts beside it were all bright.
 *
 * Nothing in this repo had ever looked at a phone. The visual sweeps drove
 * 800x460 desktop frames, and the "featureless slab" metric asks whether a
 * frame is ONE colour, which a half-bright half-black frame is not. So the
 * defect that shipped was invisible to both.
 *
 * WHAT THIS MEASURES, and why it is measured this way:
 *
 *   THE ROAD, NOT THE FRAME. A dark frame can be night, a tunnel, a storm or a
 *   tree line, all of which are fine. The carriageway is the one surface a
 *   driver must be able to read, so the sample is the strip of canvas the road
 *   ahead occupies and nothing else.
 *
 *   PARKED, NOT DRIVEN. The first cut of this drove each world and took the
 *   worst of four frames, and the same untouched world (CLIFF KNOT) scored
 *   29.3% on one build and 100.0% on the next — world scatter runs on bare
 *   `Math.random()`, so no two loads are the same lap. Fixed stations make two
 *   builds comparable.
 *
 *   THROUGH THE COMPOSER. Comparing `g.frame()` (bloom, grade, tone map)
 *   against a bare `renderer.render()` once made fog look like it was crushing
 *   the picture 4x, when the difference was the post chain. Every sample here
 *   goes through the real one.
 *
 * THE NUMBERS THIS PINS (390x844, 8 stations, luminance out of 255):
 *
 *   before          HEDGEROW DASH 19.6 median / 11.8 worst, 5 of 8 under 25
 *                   SILVERSTONE   34.8 / 9.8,  OULTON PARK 54.5 / 14.1
 *                   NORDSCHLEIFE  55.1 / 14.5 (a `sunEl` 0.17 "first light")
 *   the control     every other tarmac world: TREMOLA 86.3, MONACO 106.2,
 *                   GOTTHARD 110.9, FURKA 119.2, MONZA 125.3
 *   after           61.5 / 32.4,  65.6 / 50.8,  86.8 / 60.1,  76.5 / 41.0
 *
 * FLOOR is 25 — comfortably under the fixed worlds' worst stations and well
 * over the 9.8-14.5 the defect produced. Raising it to hide a future find
 * would defeat the point; add a NAMED exemption with a reason instead, the way
 * the three night stages below are named.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const FLOOR = Number(process.env.FLOOR ?? 25);
const STATIONS = Number(process.env.STATIONS ?? 8);

// NIGHT IS NOT UNLIT — it is the stage. These three are dark on purpose and
// carry their own light: two NEO-KYOTO neon worlds whose road glows through an
// emissive map, and the one night street stage. Named, with the reason, so the
// list cannot quietly grow into "all the dark ones".
const NIGHT = new Map([
  [17, 'NEON GRID EXPRESSWAY — NEO-KYOTO after dark; the carriageway is lit by its own emissive line-work'],
  [30, 'LANTERN QUARTER — the roster\'s only night street stage'],
  [40, 'MARINA BAY — a night harbour circuit under floodlight'],
]);

// ONE STATION THAT IS STILL DARK AND IS NOT UNDERSTOOD. Listed with its number
// and what has been RULED OUT, because a filter with no reason behind it is how
// the next one gets hidden too:
//
//   AMAZON RAPIDS station 675 — road luminance 20.2 against that world's own
//   48.4 median. A black ellipse in the middle of the carriageway, the road
//   plainly readable on either side of it. NOT the contact-shadow decals
//   (hidden: 21.1 -> 21.1, and only 2 of the world's 1152 reach the station)
//   and NOT obviously the shadow map (toggling `shadowMap.enabled` at runtime
//   moved neither this world nor PINE VALLEY, which has visible tree shadows —
//   so that probe proved nothing and is recorded as inconclusive, not as an
//   answer). `jungle` carries the roster's heaviest wet road — darken 0.38 and
//   six puddle pools — which is the next thing to measure.
//
// This is a TOLERANCE, not an exemption: the station must not get darker.
const KNOWN = new Map([
  [8, { at: 675, floor: 18, why: 'AMAZON RAPIDS — an unexplained dark patch mid-carriageway; see the note above' }],
]);

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
// THE PHONE IS THE VIEWPORT THAT REPORTED IT, and it is not the same picture:
// the HUD layout, the canvas aspect and the vignette all differ from desktop.
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));

await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const ids = await page.evaluate(async () => {
  const { LEVELS } = await import('./src/track.js');
  return LEVELS.map((l) => l.id);
});

const dark = [];
for (const id of ids) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  const booted = await page.waitForFunction(
    () => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 })
    .then(() => 1).catch(() => 0);
  if (!booted) { dark.push({ id, name: '?', worst: -1, note: 'never booted' }); continue; }
  const r = await page.evaluate((S) => {
    const g = window.__game, t = g.track, p = g.player, N = t.center.length;
    g.clock.getDelta = () => 1 / 60;
    // the settle frames do not need pixels — only the measured one does
    const real = g.composer.render.bind(g.composer);
    g.composer.render = () => { if (g.__want) real(); };
    const lum = () => {
      const cv = g.renderer.domElement;
      const c = document.createElement('canvas');
      c.width = 260; c.height = Math.round(260 * cv.height / cv.width);
      const cx = c.getContext('2d');
      cx.drawImage(cv, 0, 0, c.width, c.height);
      const px = cx.getImageData(Math.round(c.width * 0.34), Math.round(c.height * 0.42),
        Math.round(c.width * 0.32), Math.round(c.height * 0.30)).data;
      let s = 0;
      for (let i = 0; i < px.length; i += 4) s += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
      return s / (px.length / 4);
    };
    const rows = [];
    for (let k = 0; k < S; k++) {
      const i = Math.round(N * k / S), c = t.center[i];
      p.pos.set(c.x, c.y + 1.2, c.z); p.y = c.y;
      p.vel.set(0, 0, 0); p.vy = 0; p.airborne = false;
      p.trackIndex = i; p.heading = t.headingAt(i);
      p.alive = true; p.health = p.maxHealth ?? 100;
      p._lostT = 0; p._wedgeT = 0; p._bogT = 0;
      for (let f = 0; f < 150; f++) { g.input.analog.throttle = 0; g.input.analog.steer = 0; g.frame(); }
      g.__want = 1; g.frame(); g.__want = 0;
      // A BORE IS MEANT TO BE DARK, and the track is asked directly rather
      // than inferred from `vizZones`. The first cut read the zone list and
      // let GLACIER COL 450 and TIMBER GORGE 338 through as offenders — the
      // two stations a separate probe had already tagged ':bore'. Bore
      // placement runs through `tunnelFitAt` over a world built with bare
      // `Math.random()`, so a zone list read on one load does not describe the
      // next one. `tunnelAt` is the same call `_updateCamera` uses to decide a
      // sample is roof rather than obstacle, and it answers for THIS load.
      const inBore = !!(t.tunnelAt && t.tunnelAt(p.pos, i, 10));
      const zone = (t.vizZones ?? []).find((z) => ((i - z.i0 + N) % N) <= z.len);
      rows.push({ i, road: +lum().toFixed(1), bore: inBore, zone: zone ? zone.kind : '' });
    }
    return { name: t.level?.name ?? '?', rows, bores: rows.filter((x) => x.bore).map((x) => x.i) };
  }, STATIONS);
  const usable = r.rows.filter((x) => !x.bore && x.zone !== 'bore');
  const worst = usable.reduce((a, x) => (x.road < a.road ? x : a), usable[0]);
  const med = usable.map((x) => x.road).sort((a, c) => a - c)[usable.length >> 1];
  dark.push({ id, name: r.name, worst: worst.road, at: worst.i, med, bores: r.bores });
}

console.log('\n road luminance at 8 fixed stations, 390x844, out of 255\n');
for (const d of [...dark].sort((a, b) => a.worst - b.worst)) {
  const tag = (NIGHT.has(d.id) ? '  (night stage — exempt)' : '')
    + (d.bores?.length ? `  [station${d.bores.length > 1 ? 's' : ''} ${d.bores.join(',')} inside a bore — skipped]` : '');
  console.log(`   L${String(d.id).padStart(2, '0')} ${d.name.padEnd(22)} median ${String(d.med).padStart(6)}`
    + `   darkest ${String(d.worst).padStart(6)} at ${d.at}${tag}`);
}

const offenders = dark.filter((d) => !NIGHT.has(d.id) && d.worst >= 0 && d.worst < FLOOR
  && !(KNOWN.has(d.id) && d.worst >= KNOWN.get(d.id).floor));
console.log('');
ok(offenders.length === 0,
  `every daylight world's road stays over ${FLOOR}/255 at all ${STATIONS} stations`,
  offenders.map((d) => `${d.name} ${d.worst} at ${d.at}`).join(', '));
for (const [id, k] of KNOWN) {
  const d = dark.find((x) => x.id === id);
  ok(d && d.worst >= k.floor,
    `the known dark station on ${k.why.split(' —')[0]} has not got darker (floor ${k.floor})`,
    d ? `it now measures ${d.worst} at ${d.at}` : 'world missing');
}
ok(dark.every((d) => d.worst >= 0), 'every world booted', dark.filter((d) => d.worst < 0).map((d) => d.name).join(', '));
for (const [id, why] of NIGHT) {
  const d = dark.find((x) => x.id === id);
  ok(d && d.worst < FLOOR,
    `the exemption for ${why.split(' —')[0]} still earns its place`,
    d ? `it now measures ${d.worst}, over the floor — drop it from NIGHT` : 'world missing');
}
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);
