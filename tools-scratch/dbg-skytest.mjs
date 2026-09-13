import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 900, height: 520 } });
p.setDefaultTimeout(240000);
await p.goto('http://localhost:8901/?level=32&go=1&unlockall=1', { waitUntil: 'load', timeout: 240000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 240000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, N = t.center.length;
  g.clock.getDelta = () => 1 / 60;
  for (let k = 0; k < 200 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
  const i = 870 % N, c = t.center[i], aim = t.center[(i + 50) % N];
  g.frame = () => {};
  g.camera.position.set(c.x, c.y + 10, c.z);
  g.camera.lookAt(aim.x, aim.y + 2, aim.z);
  g.camera.updateMatrixWorld();
  const cv = document.createElement('canvas'); cv.width = 900; cv.height = 520;
  const ctx = cv.getContext('2d');
  const sample = (x, y) => {
    if (g.composer) g.composer.render(); else g.renderer.render(g.scene, g.camera);
    ctx.drawImage(g.renderer.domElement, 0, 0, 900, 520);
    const d = ctx.getImageData(x, y, 1, 1).data; return [d[0], d[1], d[2]];
  };
  const before = sample(500, 165);
  // hide EVERY mesh
  const hidden = [];
  g.scene.traverse((o) => { if (o.isMesh && o.visible) { o.visible = false; hidden.push(o); } });
  const allHidden = sample(500, 165);
  for (const o of hidden) o.visible = true;
  // what is the background?
  const bg = g.scene.background;
  const skyish = [];
  g.scene.traverse((o) => {
    const nm = (o.name || '').toLowerCase();
    if (/sky|sun|moon|cloud|horizon|aurora|star/.test(nm)) {
      skyish.push({ name: o.name, type: o.type, vis: o.visible,
        col: o.material?.color ? '#' + o.material.color.getHexString() : null });
    }
  });
  return { before, allHidden, meshes: hidden.length,
    bg: bg ? (bg.isColor ? '#' + bg.getHexString() : bg.type || 'texture') : null,
    skyish: skyish.slice(0, 10) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
