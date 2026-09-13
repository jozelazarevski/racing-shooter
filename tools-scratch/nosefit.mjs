/* The kit's nose gap per car, measured against the BODYWORK box and against
 * the box that includes the lamp rig — so "did the lights move the nose" is a
 * number rather than an argument. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await (await b.newContext({ viewport:{width:400,height:300} })).newPage();
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1', { waitUntil:'load', timeout:600000 });
console.log(await p.evaluate(async () => {
  const THREE = await import('/lib/three.module.min.js');
  const V = await import('/src/vehicles.js');
  const KEYS = ['engine','handling','tires','nitro','armor','cannon','dampers','magazine','rack'];
  const out = [];
  for (const car of V.CAR_CATALOG) {
    const m = V.buildCarMesh(car.spec);
    const all = new THREE.Box3().setFromObject(m);
    const body = new THREE.Box3();
    for (const c of m.children) { if (c !== m.userData?.carLights) body.expandByObject(c); }
    const up = {}; for (const k of KEYS) up[k] = 5; up.beacon = 3;
    V.applyUpgradeKit(m, up, null);
    const kb = new THREE.Box3().setFromObject(m.getObjectByName('upgradeKit'));
    out.push(`${car.key.padEnd(9)} noseVsAll ${(kb.max.z - all.max.z).toFixed(3)}   noseVsBody ${(kb.max.z - body.max.z).toFixed(3)}`);
  }
  return out.join('\n');
}));
await b.close();
