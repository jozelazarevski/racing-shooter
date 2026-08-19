/* WHAT DOES THE MID-FIELD LOOK LIKE FROM THE ROAD?
 *
 * The census says scatter density falls from 15.4 items per 10,000 u² in the
 * 80-160 band to 1.6 beyond it, and the distant stand does not start until
 * 640. Whether that READS as a bare field from the driving seat is a different
 * question from whether it measures as one, and it is the question that
 * decides whether anything needs doing: a band nobody looks at does not need
 * trees in it.
 *
 * So: park on the racing line and aim the camera square across the verge, at
 * eye height, so the 150-700 u band is the whole frame. No chase boom, no
 * top-down — the angle a driver actually sees that ground from.
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const OUT = process.env.OUT ?? '/tmp/side';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 900, height: 460 } });
page.setDefaultTimeout(600000);
for (const arg of process.argv.slice(2)) {
  const [id, frac] = arg.split(':');
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  const info = await page.evaluate(([f]) => {
    const g = window.__game, t = g.track, p = g.player, N = t.center.length;
    const i = Math.round(N * (f ?? 0.25)) % N;
    const c = t.center[i], n = t.nrm[i];
    p.pos.set(c.x, c.y + 1.2, c.z); p.y = c.y;
    p.vel.set(0, 0, 0); p.vy = 0; p.airborne = false;
    p.trackIndex = i; p.heading = t.headingAt(i);
    p.alive = true; p.health = p.maxHealth ?? 100;
    for (let k = 0; k < 60; k++) { g.input.analog.throttle = 0; g.frame(); }
    g.hud?.hide?.();
    // pick the side with more open ground: whichever normal leads away from
    // the rest of the lap
    let best = null;
    for (const sgn of [1, -1]) {
      const px = c.x + n.x * 300 * sgn, pz = c.z + n.z * 300 * sgn;
      const d = t._distToTrack(px, pz);
      if (!best || d > best.d) best = { sgn, d };
    }
    const s = best.sgn;
    g.camera.position.set(c.x + n.x * 6 * s, c.y + 3.4, c.z + n.z * 6 * s);
    g.camera.lookAt(c.x + n.x * 400 * s, c.y + 14, c.z + n.z * 400 * s);
    g.camera.updateMatrixWorld(true);
    g.composer.render();
    // how much is out there, by band, along this sightline
    const bands = [[80, 160], [160, 300], [300, 640], [640, 1100]];
    const counts = bands.map(() => 0);
    for (const tr of (t.trees ?? [])) {
      const dx = tr.x - c.x, dz = tr.z - c.z;
      const along = dx * n.x * s + dz * n.z * s;
      const side = Math.abs(dx * -n.z * s + dz * n.x * s);
      if (along < 0 || side > 220) continue;
      const bi = bands.findIndex(([a, b2]) => along >= a && along < b2);
      if (bi >= 0) counts[bi]++;
    }
    let stand = 0;
    t.group.traverse((o) => {
      if (o.name !== 'distant-stand' || !o.isInstancedMesh) return;
      const arr = o.instanceMatrix.array;
      for (let k = 0; k < o.count; k++) {
        const dx = arr[k * 16 + 12] - c.x, dz = arr[k * 16 + 14] - c.z;
        const along = dx * n.x * s + dz * n.z * s;
        const side = Math.abs(dx * -n.z * s + dz * n.x * s);
        if (along > 80 && along < 1100 && side < 220) stand++;
      }
    });
    return { name: t.level?.name, i, side: s, counts, stand };
  }, [Number(frac)]);
  await page.screenshot({ path: `${OUT}/L${String(id).padStart(2, '0')}-side.png` });
  console.log(`${String(id).padStart(2)} ${(info.name ?? '?').padEnd(20)} station ${info.i}  `
    + `in this 440 u-wide corridor:  80-160: ${info.counts[0]}   160-300: ${info.counts[1]}   `
    + `300-640: ${info.counts[2]}   640-1100: ${info.counts[3]}   + ${info.stand} stand clumps`);
}
await b.close();
