/* NAME PART 2. `iconparts` says one 4-vertex mesh owns 82% of a shelf icon and
 * `iconrig` measures its world box as 420 x 420 x 0 — an UPRIGHT quad standing
 * at the origin, which would cut the car in half if it were really there. One
 * of those two readings is wrong, so print what the object actually is
 * (geometry type, its own rotation, its material colour) and shoot the icon
 * with it hidden so the answer can be looked at rather than argued. */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 900 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const out = await p.evaluate(async () => {
  const g = window.__game;
  const mod = await import('./src/vehicles.js');
  const S = 4, W = 148 * S, H = 96 * S;
  const st = g._studio(W, H);
  const shoot = () => g._shoot(mod.buildCarMesh(mod.CAR_CATALOG[1].spec), W, H, { ground: true });
  const desc = st.forest.children.map((o, i) => ({
    i, geo: o.geometry?.type, params: o.geometry?.parameters ?? null,
    rot: [o.rotation.x, o.rotation.y, o.rotation.z].map((v) => +v.toFixed(2)),
    pos: o.position.toArray().map((v) => +v.toFixed(1)),
    colour: o.material?.color ? '#' + o.material.color.getHexString() : null,
    blending: o.material?.blending, side: o.material?.side, name: o.name || '',
  }));
  const shots = {};
  for (const i of [2, 3, 4, 0, 1]) {
    const o = st.forest.children[i];
    const was = o.visible; o.visible = false;
    shots[`no${i}`] = shoot();
    o.visible = was;
  }
  return { desc, shots };
});
for (const d of out.desc) console.log(JSON.stringify(d));
for (const [k, u] of Object.entries(out.shots))
  writeFileSync(`tools-scratch/shot-icon-${k}.png`, Buffer.from(u.split(',')[1], 'base64'));
console.log('wrote', Object.keys(out.shots).map((k) => `shot-icon-${k}.png`).join(' '));
await b.close();
