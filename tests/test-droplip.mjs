/* r335 — v2.3 §7.9 (daylight half) / P12: THE LIP WEARS ROCK. Recording F
 * (0:01, 0:30): the grass shelf runs to the drop with no visual change.
 * _slopeRock now paints any vertex whose neighbour falls away past ~42°
 * with the template's scree tone. This suite reads the BUILT near-terrain
 * mesh on two mountain worlds and checks, statistically, that lip
 * vertices sit measurably closer to the scree colour than flat ground.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));

for (const id of [12, 22]) {
  await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track;
    // the near ground: the one 201x201 vertex-coloured plane in the group
    let geo = null;
    t.group.traverse((o) => {
      if (o.isMesh && o.geometry?.attributes?.color
          && o.geometry.attributes.position.count === 201 * 201) geo = o.geometry;
    });
    if (!geo) return { fail: 'near ground mesh not found' };
    const pos = geo.attributes.position, col = geo.attributes.color;
    const W = 201, cell = 10;
    // THREE converts hex to LINEAR space when building vertex colours, so
    // the comparison must live there too (the first cut compared against
    // raw sRGB and read the tint as absent)
    const toLin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    const scree = { r: 0, g: 0, b: 0 };
    {
      const c = t.T.terrainScree ?? t.T.terrainDirt;
      const n = parseInt(String(c).replace('#', ''), 16);
      scree.r = toLin(((n >> 16) & 255) / 255);
      scree.g = toLin(((n >> 8) & 255) / 255);
      scree.b = toLin((n & 255) / 255);
    }
    const dist = (i) => Math.hypot(col.getX(i) - scree.r, col.getY(i) - scree.g, col.getZ(i) - scree.b);
    let lips = 0, lipSum = 0, flats = 0, flatSum = 0;
    for (let iz = 1; iz < W - 1; iz++) {
      for (let ix = 1; ix < W - 1; ix++) {
        const i = iz * W + ix;
        const x = pos.getX(i), z = pos.getZ(i);
        if (Math.max(Math.abs(x), Math.abs(z)) > 850) continue;   // near patch core
        const y0 = pos.getY(i);
        let fall = 0, rise = 0;
        for (const j of [i + 1, i - 1, i + W, i - W]) {
          fall = Math.max(fall, y0 - pos.getY(j));
          rise = Math.max(rise, pos.getY(j) - y0);
        }
        if (fall >= cell * 1.1 && lips < 4000) { lips++; lipSum += dist(i); }
        else if (fall < 2 && rise < 2 && flats < 4000) { flats++; flatSum += dist(i); }
      }
    }
    return { lips, flats,
      lipMean: +(lipSum / Math.max(1, lips)).toFixed(3),
      flatMean: +(flatSum / Math.max(1, flats)).toFixed(3) };
  });
  if (r.fail) check(`world ${id}: setup`, false, r.fail);
  else check(`world ${id}: drop lips read as rock against the flat ground`,
    r.lips > 50 && r.lipMean < r.flatMean * 0.8, JSON.stringify(r));
}
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe edge announces itself');
