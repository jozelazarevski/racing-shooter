/* Stand on the road beside a square and look AT it — the driver's view of the
 * piazza, which is not the view down the street that lapshot gives. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74', K = +(process.env.K ?? 0);
const BACK = +(process.env.BACK ?? 26), UP = +(process.env.UP ?? 2.4);
const FACE = !!process.env.FACE;   // stand IN the square and look at its church
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => new Promise(r => { let n=0; const f=()=>(++n>24?r():requestAnimationFrame(f)); requestAnimationFrame(f); }));
const url = await p.evaluate(({ K, BACK, UP, FACE }) => {
  const g = window.__game, t = g.track;
  const pz = (t._piazzas ?? [])[K];
  if (!pz) return null;
  if (FACE) {
    // the square's own frame, straight off the matrix `_inPiazza` tests with
    const M4 = g.camera.matrixWorld.constructor, V3 = g.camera.position.constructor;
    const fwd = new M4().copy(pz.inv).invert();
    const out = pz.x1 > -pz.x0 ? 1 : -1;              // the side the church is on
    // off the axis and above the fountain, or the centrepiece fills the frame
    const eye = new V3(out * -Math.abs(pz.x1) * 1.15, 4.2, pz.hw * 0.7).applyMatrix4(fwd);
    const at = new V3(out * Math.abs(pz.x1) * 0.35, 8.5, 0).applyMatrix4(fwd);
    g.camera.position.copy(eye);
    g.camera.lookAt(at);
    g.camera.updateProjectionMatrix();
    g.renderer.render(g.scene, g.camera);
    return g.renderer.domElement.toDataURL('image/png');
  }
  let bi = 0, bd = Infinity;
  for (let i = 0; i < t.N; i++) {
    const c = t.center[i], d = Math.hypot(c.x - pz.x, c.z - pz.z);
    if (d < bd) { bd = d; bi = i; }
  }
  // stand on the carriageway a little short of the square, at driver height
  const c = t.center[(bi - BACK + t.N) % t.N];
  g.camera.position.set(c.x, c.y + UP, c.z);
  g.camera.lookAt(pz.x, c.y + 2.2, pz.z);
  g.camera.updateProjectionMatrix();
  g.renderer.render(g.scene, g.camera);
  return g.renderer.domElement.toDataURL('image/png');
}, { K, BACK, UP, FACE });
if (!url) { console.log('no piazza ' + K + ' on level ' + LV); await b.close(); process.exit(0); }
const fs = await import('fs');
fs.writeFileSync(`tools-scratch/shot-piazza-${LV}-${K}.png`, Buffer.from(url.split(',')[1], 'base64'));
console.log(`shot-piazza-${LV}-${K}.png`);
await b.close();
