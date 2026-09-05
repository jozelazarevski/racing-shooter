/* THE WET ROAD'S SPECULAR LOBE, SWEPT. A wet surface at night is looking at one
 * hard key light in an otherwise black scene, so the same gloss that reads as
 * "wet" by day reads as a searchlight by night. This finds the WORST place on
 * the lap — the point where the camera looks straight up the reflection — and
 * then sweeps roughness and envMapIntensity there, so the night values are
 * chosen off a curve instead of a hunch. */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? '8901';
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
  let road = null;
  g.scene.traverse((x) => { if (x.name === 'road' && !road) road = x; });
  const mat = Array.isArray(road.material) ? road.material[0] : road.material;
  g.camMode = MODE;
  const put = (F) => {
    const i = Math.floor(t.N * F) % t.N, c = t.center[i], c2 = t.center[(i + 14) % t.N];
    for (let k = 0; k < 40; k++) {
      pl.pos.set(c.x, c.y, c.z);
      pl.heading = Math.atan2(c2.x - c.x, c2.z - c.z); pl.trackIndex = i;
      pl.mesh.position.set(c.x, c.y, c.z); pl.mesh.rotation.set(0, pl.heading, 0);
      g._updateCamera(1 / 60);
    }
  };
  const stat = () => {
    g.renderer.render(g.scene, g.camera);
    const cv = g.renderer.domElement, o = document.createElement('canvas');
    o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
    const d = o.getContext('2d').getImageData(0, 0, o.width, o.height).data;
    let n = 0, a200 = 0, a240 = 0, sum = 0, peak = 0;
    for (let k = 0; k < d.length; k += 4) {
      const l = 0.2126*d[k] + 0.7152*d[k+1] + 0.0722*d[k+2];
      n++; sum += l; if (l > 200) a200++; if (l > 240) a240++; if (l > peak) peak = l;
    }
    return { mean: +(sum/n).toFixed(1), over200: +(100*a200/n).toFixed(2),
      over240: +(100*a240/n).toFixed(2), peak: Math.round(peak) };
  };
  // 1. where on the lap is it worst?
  let worst = 0, wv = -1, scan = [];
  for (let f = 0; f < 1; f += 0.04) {
    put(f); const s = stat();
    scan.push(`${f.toFixed(2)}:${s.over200}`);
    if (s.over200 > wv) { wv = s.over200; worst = f; }
  }
  put(worst);
  // 2. sweep the two levers there
  const base = { roughness: mat.roughness, env: mat.envMapIntensity };
  const rows = [];
  for (const env of [0.75, 0.35]) {
    for (const r of [0.52, 0.62, 0.72, 0.82, 0.92]) {
      mat.roughness = r; mat.envMapIntensity = env; mat.needsUpdate = true;
      rows.push({ roughness: r, env, ...stat() });
    }
  }
  mat.roughness = base.roughness; mat.envMapIntensity = base.env; mat.needsUpdate = true;
  const shots = {};
  for (const [tag, r, env] of [['before', base.roughness, base.env], ['after', 0.82, 0.35]]) {
    mat.roughness = r; mat.envMapIntensity = env; mat.needsUpdate = true;
    g.renderer.render(g.scene, g.camera);
    shots[tag] = g.renderer.domElement.toDataURL('image/png');
  }
  mat.roughness = base.roughness; mat.envMapIntensity = base.env; mat.needsUpdate = true;
  return { world: g.level.name, worstAt: +worst.toFixed(2), worstOver200: wv,
    base, rows, scan: scan.join(' '), shots };
}, { MODE });
const fs = await import('fs');
for (const [k, v] of Object.entries(out.shots))
  fs.writeFileSync(`tools-scratch/shot-gloss-${LV}-${k}.png`, Buffer.from(v.split(',')[1], 'base64'));
delete out.shots;
console.log(JSON.stringify(out, null, 1));
await b.close();
