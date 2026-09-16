/* CAN YOU SEE THE CARS? The question NEO-KYOTO's green really posed, asked in
 * the form that matters to a player: how far is a car from the ground it is
 * standing on, in a colour space where distance means what the eye means.
 *
 * A world is allowed to be any colour. What it is not allowed to do is swallow
 * the cars — and a strongly tinted light does exactly that, because it drags
 * every albedo in the frame toward one hue and the machines go with it.
 *
 * THE MASK IS A KEY COLOUR, NOT A DIFF. The first cut hid each car, diffed the
 * two frames and called the changed pixels the car. It reported delta-E
 * between 1 and 4 for EVERY world — including PINE VALLEY, where the car is
 * plainly visible — which is the tell: a metric that cannot separate a world
 * you know works from one you suspect does not is measuring noise. It was.
 * A threshold of 22 summed across three channels is satisfied by a difference
 * of seven per channel, so the mask filled up with antialiasing and drifting
 * embers instead of bodywork. Swap the car's materials for flat magenta,
 * render, and the magenta pixels ARE the car — the same ground truth
 * `eyesweep.mjs` had to learn.
 *
 * Ground is the RING just outside those pixels in the real frame, not the
 * hidden-car frame: fire worlds animate, and two screenshots seconds apart are
 * not the same picture.
 *
 * CIE76 delta-E, which is a number with a meaning: under about 10 two colours
 * are hard to tell apart at a glance, and a rival you cannot pick out of the
 * road at a glance is one you will drive into.
 *
 *   LEVELS=1,5,14,18 node carvisible.mjs
 */
import { chromium } from 'playwright-core';
const LEVELS = (process.env.LEVELS ?? '1,5,14').split(',');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const rows = [];
for (const lvl of LEVELS) {
  const p = await b.newPage({ viewport: { width: 430, height: 800 } });
  p.setDefaultTimeout(600000);
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
  await p.evaluate(async () => {
    const g = window.__game, t = g.track, pl = g.player;
    g.startRace?.();
    const f = () => new Promise((r) => requestAnimationFrame(r));
    for (let i = 0; i < 600 && g.state !== 'race'; i++) await f();
    // park the player and bring the nearest rivals alongside, so every world
    // is judged on the same arrangement instead of on whatever the AI did
    const HOME = Math.floor(t.N * 0.3);
    window.__park = () => {
      const c = t.pointAt(HOME, 0);
      pl.heading = t.headingAt(HOME); pl.pos.x = c.x; pl.pos.z = c.z;
      if (Number.isFinite(c.y)) { pl.pos.y = c.y; pl.y = c.y; }
      pl.vy = 0; pl.airborne = false; pl.trackIndex = HOME; pl.vel.set(0, 0, 0);
      (g.enemies || []).slice(0, 2).forEach((e, i) => {
        const c2 = t.pointAt(HOME + 10 + i * 8, (i ? 1 : -1) * 0.45);
        e.pos.x = c2.x; e.pos.z = c2.z;
        if (Number.isFinite(c2.y)) { e.pos.y = c2.y; e.y = c2.y; }
        e.heading = t.headingAt(HOME + 10 + i * 8); e.trackIndex = HOME + 10 + i * 8;
        e.vel?.set?.(0, 0, 0);
      });
    };
    for (let i = 0; i < 90; i++) { window.__park(); await f(); }
  });
  const shot = async () => (await p.screenshot({ clip: { x: 0, y: 0, width: 430, height: 620 } })).toString('base64');
  // PLATE=off hides the ground plate on every car, for an A/B on identical
  // geometry — the lesson from the tree tints: rebuilding to compare re-rolls
  // the scene, toggling does not.
  if (process.env.PLATE === 'off') await p.evaluate(() => {
    const g = window.__game;
    let n = 0;
    for (const c of [g.player, ...(g.enemies || [])]) {
      const pl2 = c.mesh?.userData?.groundPlate;
      if (pl2) { pl2.visible = false; n++; }
    }
    // r267 added a dark ground plate under every car to lift a pale rival off
    // a pale road, measured it as worth under 1.5 points once the metric was
    // right, and took it out again. The toggle stays because the A/B pattern
    // is the point: hide the thing, do not rebuild the scene without it.
    if (!n) throw new Error('no ground plates found — PLATE=off would be a no-op');
  });
  const targets = await p.evaluate(() => Math.min(2, (window.__game.enemies || []).length) + 1);
  const shots = [];
  for (let i = 0; i < targets; i++) {
    await p.evaluate(async (k) => {
      const g = window.__game, THREE = g.THREE || window.THREE;
      const car = k === 0 ? g.player : g.enemies[k - 1];
      const key = new (car.mesh.children.find((c) => c.isMesh)?.material?.constructor
        ? Object.getPrototypeOf(car.mesh.children.find((c) => c.isMesh).material).constructor : Object)();
      car.__saved = [];
      car.mesh.traverse((o) => {
        if (!o.isMesh || !o.material) return;
        car.__saved.push([o, o.material]);
        const m = o.material.clone();
        m.color?.setHex(0xff00ff);
        m.emissive?.setHex(0xff00ff);
        m.map = null; m.emissiveMap = null; m.transparent = false; m.opacity = 1;
        m.toneMapped = false; m.fog = false;
        o.material = m;
      });
      const f = () => new Promise((r) => requestAnimationFrame(r));
      window.__park(); await f(); await f();
    }, i);
    const keyed = await shot();
    await p.evaluate(async (k) => {
      const g = window.__game;
      const car = k === 0 ? g.player : g.enemies[k - 1];
      for (const [o, m] of car.__saved || []) { o.material.dispose?.(); o.material = m; }
      car.__saved = null;
      const f = () => new Promise((r) => requestAnimationFrame(r));
      window.__park(); await f(); await f();
    }, i);
    shots.push({ keyed, plain: await shot() });
  }
  const r = await p.evaluate(async ([sh, name]) => {
    const load = async (d) => {
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.src = 'data:image/png;base64,' + d; });
      const cv = document.createElement('canvas');
      cv.width = img.width; cv.height = img.height;
      cv.getContext('2d').drawImage(img, 0, 0);
      return { px: cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, w: cv.width, h: cv.height };
    };
    const lab = (r2, g2, b2) => {
      const f = (v) => { v /= 255; return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92; };
      const R = f(r2), G = f(g2), B = f(b2);
      let X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
      let Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
      let Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
      const k = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
      X = k(X); Y = k(Y); Z = k(Z);
      return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
    };
    const out = [];
    for (const { keyed, plain } of sh) {
      const K = await load(keyed), P = await load(plain);
      const W = K.w, H = K.h;
      const inCar = new Uint8Array(W * H);
      let n = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
      for (let q = 0; q < W * H; q++) {
        const i2 = q * 4;
        // flat magenta, allowing for bloom bleed but not for a magenta world
        if (K.px[i2] > 170 && K.px[i2+2] > 170 && K.px[i2+1] < 110) {
          inCar[q] = 1; n++;
          const x = q % W, y = (q / W) | 0;
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
      if (n < 150) { out.push({ px: n, note: 'car not on screen' }); continue; }
      // PER PIXEL, NOT MEAN AGAINST MEAN. The mean of a car against the mean
      // of its ground measures whether the car matches on AVERAGE, which is
      // not what makes a shape visible — a pale car with a dark rim round it
      // is unmissable and still averages out to the colour of the road. That
      // error hid a real result: adding a dark ground plate to every car moved
      // the mean-vs-mean figure by 0.3 and looked like it had done nothing.
      // What the eye picks up is the part of the shape that DOES separate, so
      // score every car pixel against the ground and report how much of the
      // car clears the threshold.
      const car = [0, 0, 0], gnd = [0, 0, 0];
      let gn = 0;
      const carPx = [];
      for (let q = 0; q < W * H; q++) {
        const i2 = q * 4;
        if (inCar[q]) {
          car[0] += P.px[i2]; car[1] += P.px[i2+1]; car[2] += P.px[i2+2];
          carPx.push(i2); continue;
        }
        const x = q % W, y = (q / W) | 0;
        if (x >= x0 - 12 && x <= x1 + 12 && y >= y0 - 12 && y <= y1 + 12
          && (x < x0 - 2 || x > x1 + 2 || y < y0 - 2 || y > y1 + 2)) {
          gnd[0] += P.px[i2]; gnd[1] += P.px[i2+1]; gnd[2] += P.px[i2+2]; gn++;
        }
      }
      if (!gn) { out.push({ px: n, note: 'no ground ring' }); continue; }
      const c = car.map((v) => v / n), g2 = gnd.map((v) => v / gn);
      const L2 = lab(...g2);
      const per = carPx.map((i2) => {
        const L = lab(P.px[i2], P.px[i2+1], P.px[i2+2]);
        return Math.hypot(L[0]-L2[0], L[1]-L2[1], L[2]-L2[2]);
      }).sort((a, b2) => a - b2);
      const L1 = lab(...c);
      out.push({ px: n, car: c.map((v) => Math.round(v)), ground: g2.map((v) => Math.round(v)),
        meanDeltaE: +Math.hypot(L1[0]-L2[0], L1[1]-L2[1], L1[2]-L2[2]).toFixed(1),
        medianDeltaE: +per[per.length >> 1].toFixed(1),
        p90DeltaE: +per[(per.length * 0.9) | 0].toFixed(1),
        visiblePct: +(100 * per.filter((v) => v > 10).length / per.length).toFixed(1) });
    }
    return { name, cars: out };
  }, [shots, await p.evaluate(() => window.__game.level?.name)]);
  rows.push({ level: lvl, ...r });
  await p.close();
}
console.log(JSON.stringify(rows, null, 1));
await b.close();
