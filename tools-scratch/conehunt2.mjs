/* WHICH OBJECT IS THE PALE WEDGE. Shadows are ruled out — every toggle leaves
 * it identical — so something is DRAWN there. This hides one object at a time
 * and scores it on the wedge metric itself (road pixels well above the road's
 * own median in the band ahead of the nose), skipping the road, which trivially
 * takes the wedge with it because the wedge is painted on it. */
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
  const measure = () => {
    g.renderer.render(g.scene, g.camera);
    const cv = g.renderer.domElement, o = document.createElement('canvas');
    o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
    const d = o.getContext('2d').getImageData(0, 0, o.width, o.height).data;
    const w = o.width, h = o.height, lum = [];
    for (let y = Math.floor(h * 0.30); y < Math.floor(h * 0.62); y++)
      for (let x = Math.floor(w * 0.18); x < Math.floor(w * 0.86); x++) {
        const k = (y * w + x) * 4;
        lum.push(0.2126*d[k] + 0.7152*d[k+1] + 0.0722*d[k+2]);
      }
    const med = [...lum].sort((a, b2) => a - b2)[Math.floor(lum.length / 2)];
    let n = 0; for (const l of lum) if (l > med + 22) n++;
    return n;
  };
  const base = measure();
  const V = g.camera.position.constructor;
  const cands = [];
  g.scene.traverse((o) => {
    if (!(o.isMesh || o.isInstancedMesh || o.isSprite || o.isPoints) || !o.visible) return;
    if (o.name === 'road') return;                 // the wedge is painted ON it
    const v = new V(); o.getWorldPosition(v);
    const dist = Math.hypot(v.x - c.x, v.z - c.z);
    if (dist > 160 && !o.isInstancedMesh && !o.isPoints) return;
    cands.push({ o, dist });
  });
  const hits = [];
  for (const cd of cands) {
    cd.o.visible = false;
    const n = measure();
    cd.o.visible = true;
    const took = base - n;
    if (took > base * 0.10) {
      const m = Array.isArray(cd.o.material) ? cd.o.material[0] : cd.o.material;
      hits.push({ name: cd.o.name || cd.o.type, parent: cd.o.parent?.name || cd.o.parent?.type,
        type: cd.o.type, mat: m?.type, blending: m?.blending, opacity: m?.opacity,
        transparent: m?.transparent, dist: Math.round(cd.dist),
        removed: took, pct: +(100 * took / base).toFixed(1),
        geo: cd.o.geometry?.type, count: cd.o.count });
    }
  }
  hits.sort((a, b2) => b2.removed - a.removed);
  return { world: g.level.name, base, tested: cands.length, hits: hits.slice(0, 10) };
}, { MODE });
console.log(JSON.stringify(out, null, 1));
await b.close();
