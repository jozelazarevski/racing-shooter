/* LOOK AT THE STATION THE NUMBER CAME FROM.
 * Argument is level:k, where k indexes `track._river.line`. The camera stands
 * off to the side at a low angle, which is the only angle a floating ribbon or
 * a spilling bank is visible from — from above, water and ground are both just
 * a colour. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const OUT = process.env.OUT ?? '/tmp/river';
const BACK = Number(process.env.BACK ?? 48), UP = Number(process.env.UP ?? 14);
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 900, height: 520 } });
page.setDefaultTimeout(600000);
for (const arg of process.argv.slice(2)) {
  // `level:k` indexes the river line; `level@x,z` aims at a world point, which
  // is what a vertex-level finding gives you.
  const atPoint = arg.includes('@');
  const id = Number(arg.split(/[:@]/)[0]);
  const k = atPoint ? null : Number(arg.split(':')[1]);
  const XZ = atPoint ? arg.split('@')[1].split(',').map(Number) : null;
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  const info = await page.evaluate(([k, back, up, XZ]) => {
    const g = window.__game, t = g.track, R = t._river;
    if (!R) return { err: 'no river' };
    const kk = XZ ? t._riverNearest(XZ[0], XZ[1]).k
      : Math.max(1, Math.min(R.line.length - 2, k));
    const p = R.line[kk], a = R.line[kk - 1], c = R.line[kk + 1];
    let tx = c.x - a.x, tz = c.z - a.z;
    const L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
    const nx = tz, nz = -tx;
    // FRAME OFF THE WATER, NOT OFF THE PLAN. `R.bed[kk]` is the carved bed
    // profile, and where the finding IS that the water and the ground disagree
    // it is exactly the wrong number to build a camera on — three shots framed
    // a start gantry 20 u above the point they were aiming at. Take the real
    // water vertices near the target instead, and fall back to the ground.
    const ax0 = XZ ? XZ[0] : p.x, az0 = XZ ? XZ[1] : p.z;
    let wy = null;
    let wmesh = null;
    t.group.traverse((o) => { if (o.name === 'river-water' && o.geometry) wmesh = o; });
    if (wmesh) {
      wmesh.updateMatrixWorld(true);
      const pa = wmesh.geometry.attributes.position, m = wmesh.matrixWorld.elements;
      for (let i = 0; i < pa.count; i++) {
        const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
        const wx = m[0] * x + m[4] * y + m[8] * z + m[12];
        const wyy = m[1] * x + m[5] * y + m[9] * z + m[13];
        const wz = m[2] * x + m[6] * y + m[10] * z + m[14];
        if (Math.hypot(wx - ax0, wz - az0) < 8) wy = wy == null ? wyy : Math.max(wy, wyy);
      }
    }
    const bedY = wy != null ? wy : t.terrainHeight(ax0, az0);
    const ax = XZ ? XZ[0] : p.x, az = XZ ? XZ[1] : p.z;
    g.camera.position.set(ax + nx * back, bedY + up, az + nz * back);
    g.camera.lookAt(ax, bedY, az);
    g.hud?.hide?.();
    g.composer.render();
    const off = R.half * 1.36 + R.bank + 1.5;
    return { name: t.level?.name, k: kk,
      at: [Math.round(p.x), Math.round(p.z)],
      framedOn: wy != null ? 'water' : 'ground', bed: +bedY.toFixed(2),
      waterY: wy == null ? null : +wy.toFixed(2),
      roadY: +t.groundHeightAt(t.nearestIndex(new p.constructor(ax0, 0, az0)),
        t.lateralOffset(new p.constructor(ax0, 0, az0), t.nearestIndex(new p.constructor(ax0, 0, az0)))).toFixed(2),
      groundUnder: +t.terrainHeight(p.x, p.z).toFixed(2),
      bankA: +t.terrainHeight(p.x + nx * off, p.z + nz * off).toFixed(2),
      bankB: +t.terrainHeight(p.x - nx * off, p.z - nz * off).toFixed(2),
      road: Math.round(t._distToTrack(p.x, p.z)) };
  }, [k, BACK, UP, XZ]);
  if (info.err) { console.log(`${id}:${k} ${info.err}`); continue; }
  await page.screenshot({ path: `${OUT}/L${String(id).padStart(2, '0')}-${atPoint ? 'at' + XZ.join('_') : 'k' + k}.png` });
  console.log(`${id}:${k} ${info.name}  at ${JSON.stringify(info.at)}  bed ${info.bed}  `
    + `ground under ${info.groundUnder}  banks ${info.bankA} / ${info.bankB}  ${info.road} u from the road`
    + `  | water ${info.waterY} vs road ${info.roadY} (framed on ${info.framedOn})`);
}
await b.close();
