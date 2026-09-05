/* What the running world's lights and road material actually are. */
import { chromium } from 'playwright-core';
const LV = process.env.LV ?? '74';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:900,height:520} })).newPage();
p.setDefaultTimeout(600000);
await p.goto(`http://localhost:8901/?level=${LV}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, out = { lights: [], road: null, exposure: g.renderer.toneMappingExposure, tone: g.renderer.toneMapping,
    T: { hemi: g.track.T.hemiIntensity, sun: g.track.T.sunIntensity } };
  g.scene.traverse(o => {
    if (o.isLight) out.lights.push({ type: o.type, i: o.intensity, c: '#' + o.color.getHexString() });
    if (o.name === 'road' && o.material) out.road = { color: '#' + o.material.color.getHexString(),
      rough: o.material.roughness, env: o.material.envMapIntensity };
  });
  return out;
}), null, 1));
await b.close();
