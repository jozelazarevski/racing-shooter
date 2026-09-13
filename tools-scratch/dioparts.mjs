/* WHAT EACH PIECE OF THE DIORAMA IS WORTH. The forest is welded into one mesh
 * per material, so "did the tufts help" is answerable: hide each mesh in turn
 * and count the pixels that change. A part that moves nothing is geometry the
 * menu is paying for and nobody can see. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu(); document.getElementById('tab-btn-garage')?.click(); });
await p.waitForTimeout(2600);
console.log(JSON.stringify(await p.evaluate(() => {
  const st = window.__game.__stage;
  st.pivot.rotation.y = 0.7;
  const grab = () => { st.r.render(st.scene, st.cam);
    const cv = st.cvs, o = document.createElement('canvas');
    o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
    return o.getContext('2d').getImageData(0, 0, o.width, o.height).data; };
  const base = grab();
  const parts = [];
  st.scene.traverse((o) => {
    if (o.isMesh && o.parent?.type === 'Group' && o !== st.car) parts.push(o);
  });
  const out = [];
  for (const m of parts) {
    const col = m.material?.color ? '#' + m.material.color.getHexString() : '?';
    const tris = (m.geometry?.attributes?.position?.count ?? 0) / 3;
    m.visible = false;
    const off = grab();
    m.visible = true;
    let n = 0;
    for (let k = 0; k < base.length; k += 4)
      if (Math.abs(base[k] - off[k]) + Math.abs(base[k+1] - off[k+1])
        + Math.abs(base[k+2] - off[k+2]) > 6) n++;
    out.push({ color: col, tris: Math.round(tris),
      pixels: n, pctOfBay: +(100 * n / (base.length / 4)).toFixed(1) });
  }
  out.sort((a, b2) => b2.pixels - a.pixels);
  return { parts: out, totalTris: out.reduce((s, o) => s + o.tris, 0) };
}), null, 0));
await b.close();
