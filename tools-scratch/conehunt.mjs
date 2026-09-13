/* NAMING THE PALE WEDGE ON THE ROAD. It sits on the deployed build, which has
 * no lamp rig at all, and it stays anchored to the car — so it is not a texture
 * and not an added quad. The two things in this engine that follow the player
 * every frame are the shadow light's frustum and the tone-mapped key itself.
 * This toggles each and counts the wedge, which is defined as road pixels well
 * above the road's own median in a band ahead of the nose. */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? '8902';
const LV = process.env.LV ?? '17';
const MODE = +(process.env.MODE ?? 2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 },
  isMobile: true, hasTouch: true, deviceScaleFactor: 2 })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:${PORT}/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>90?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
const out = await p.evaluate(({ MODE }) => {
  const g = window.__game, t = g.track, pl = g.player;
  const i = Math.floor(t.N * 0.2), c = t.center[i], c2 = t.center[(i + 14) % t.N];
  g.camMode = MODE;
  for (let k = 0; k < 40; k++) {
    pl.pos.set(c.x, c.y, c.z);
    pl.heading = Math.atan2(c2.x - c.x, c2.z - c.z); pl.trackIndex = i;
    pl.mesh.position.set(c.x, c.y, c.z); pl.mesh.rotation.set(0, pl.heading, 0);
    g._updateCamera(1 / 60);
  }
  const px = () => { g.renderer.render(g.scene, g.camera);
    const cv = g.renderer.domElement, o = document.createElement('canvas');
    o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
    return { d: o.getContext('2d').getImageData(0, 0, o.width, o.height).data, w: o.width, h: o.height }; };
  // the wedge lives in the upper-middle third: road ahead of the nose
  const measure = () => {
    const { d, w, h } = px();
    const lum = [], idx = [];
    for (let y = Math.floor(h * 0.30); y < Math.floor(h * 0.62); y++)
      for (let x = Math.floor(w * 0.18); x < Math.floor(w * 0.86); x++) {
        const k = (y * w + x) * 4;
        lum.push(0.2126*d[k] + 0.7152*d[k+1] + 0.0722*d[k+2]); idx.push(k);
      }
    const sorted = [...lum].sort((a, b2) => a - b2);
    const med = sorted[Math.floor(sorted.length / 2)];
    let n = 0, sum = 0;
    for (const l of lum) if (l > med + 22) { n++; sum += l - med; }
    return { median: +med.toFixed(1), wedgePixels: n,
      pctOfBand: +(100 * n / lum.length).toFixed(1), lift: n ? +(sum / n).toFixed(1) : 0 };
  };
  const base = measure();
  const moon = g.moon;
  const before = { castShadow: moon?.castShadow, intensity: moon?.intensity,
    cam: moon?.shadow ? { l: moon.shadow.camera.left, r: moon.shadow.camera.right,
      t: moon.shadow.camera.top, b: moon.shadow.camera.bottom,
      near: moon.shadow.camera.near, far: moon.shadow.camera.far,
      mapSize: moon.shadow.mapSize.x, bias: moon.shadow.bias,
      normalBias: moon.shadow.normalBias } : null,
    autoUpdate: g.renderer.shadowMap.autoUpdate, type: g.renderer.shadowMap.type };
  const tests = {};
  if (moon) {
    moon.castShadow = false; tests.moonShadowOff = measure(); moon.castShadow = before.castShadow;
    const s = moon.shadow.camera, k = 2.5;
    const o = { l: s.left, r: s.right, t: s.top, b: s.bottom };
    s.left *= k; s.right *= k; s.top *= k; s.bottom *= k; s.updateProjectionMatrix();
    tests.frustum2p5x = measure();
    s.left = o.l; s.right = o.r; s.top = o.t; s.bottom = o.b; s.updateProjectionMatrix();
    const bi = moon.shadow.bias, nb = moon.shadow.normalBias;
    moon.shadow.bias = -0.0015; moon.shadow.normalBias = 0.05;
    tests.biasTweak = measure();
    moon.shadow.bias = bi; moon.shadow.normalBias = nb;
  }
  g.renderer.shadowMap.enabled = false; tests.allShadowsOff = measure();
  g.renderer.shadowMap.enabled = true;
  g.renderer.render(g.scene, g.camera);
  return { world: g.level.name, base, before, tests,
    url: g.renderer.domElement.toDataURL('image/png') };
}, { MODE });
const fs = await import('fs');
fs.writeFileSync(`tools-scratch/shot-cone-${PORT}.png`, Buffer.from(out.url.split(',')[1], 'base64'));
delete out.url;
console.log(JSON.stringify(out, null, 1));
await b.close();
