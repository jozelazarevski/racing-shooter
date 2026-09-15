import { chromium } from 'playwright-core';
const LVL = 32, ST = 870;
const OUT = process.env.OUT ?? '/tmp/culprit.png';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 900, height: 520 } });
p.setDefaultTimeout(240000);
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const info = await p.evaluate(({ ST9 }) => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 200 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const i = ST9 % N, c = t.center[i], aim = t.center[(i + 50) % N];
  g.frame = () => {};
  g.camera.position.set(c.x, c.y + 10, c.z);
  g.camera.lookAt(aim.x, aim.y + 2, aim.z);
  g.camera.updateMatrixWorld();
  const meshes = [];
  g.scene.traverse((o) => { if (o.isMesh && o.visible) meshes.push(o); });
  const m = meshes[meshes.length - 1];
  const rows = [];
  const arr = m.instanceMatrix?.array;
  if (arr) {
    for (let k = 0; k < Math.min(6, m.count); k++) {
      const o = k * 16;
      rows.push({ k, pos: [Math.round(arr[o + 12]), Math.round(arr[o + 13]), Math.round(arr[o + 14])],
        sx: +Math.hypot(arr[o], arr[o + 1], arr[o + 2]).toFixed(2) });
    }
  }
  // which system owns it?
  const owners = [];
  for (const key of Object.keys(g)) {
    const v = g[key];
    if (v && typeof v === 'object') {
      for (const k2 of Object.keys(v)) {
        if (v[k2] === m) owners.push(key + '.' + k2);
      }
    }
  }
  m.visible = false;
  if (g.composer) g.composer.render(); else g.renderer.render(g.scene, g.camera);
  return { count: m.count, frustumCulled: m.frustumCulled, renderOrder: m.renderOrder,
    matOpacity: m.material?.opacity, matTransparent: m.material?.transparent,
    matDepthWrite: m.material?.depthWrite, blending: m.material?.blending,
    hasInstanceColor: !!m.instanceColor, rows, owners };
}, { ST9: ST });
await p.screenshot({ path: OUT, timeout: 120000 });
console.log(JSON.stringify(info), OUT);
await browser.close();
