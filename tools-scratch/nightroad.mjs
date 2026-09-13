/* WHY THE ROAD BLOWS OUT AT NIGHT. The white cone reported from a phone is not
 * an added quad — hiding every additive and emissive object in the frame moves
 * nothing, and hiding the ROAD takes 78% of the bright pixels with it. So it is
 * the carriageway's own specular lobe: a smooth surface, a low key light, and a
 * camera looking straight up the reflection. This reports the road material and
 * the lights that hit it, plus how much of the frame clips. */
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
console.log(JSON.stringify(await p.evaluate(({ MODE }) => {
  const g = window.__game, t = g.track, pl = g.player;
  const i = Math.floor(t.N * 0.2), c = t.center[i], c2 = t.center[(i + 14) % t.N];
  const place = () => { pl.pos.set(c.x, c.y, c.z);
    pl.heading = Math.atan2(c2.x - c.x, c2.z - c.z); pl.trackIndex = i;
    pl.mesh.position.set(c.x, c.y, c.z); pl.mesh.rotation.set(0, pl.heading, 0); };
  g.camMode = MODE;
  for (let k = 0; k < 40; k++) { place(); g._updateCamera(1 / 60); }
  g.renderer.render(g.scene, g.camera);
  const cv = g.renderer.domElement, o = document.createElement('canvas');
  o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
  const d = o.getContext('2d').getImageData(0, 0, o.width, o.height).data;
  let n = 0, a200 = 0, a240 = 0, sum = 0;
  for (let k = 0; k < d.length; k += 4) {
    const l = 0.2126*d[k] + 0.7152*d[k+1] + 0.0722*d[k+2];
    n++; sum += l; if (l > 200) a200++; if (l > 240) a240++;
  }
  let road = null;
  g.scene.traverse((x) => { if (x.name === 'road' && !road) {
    const m = Array.isArray(x.material) ? x.material[0] : x.material;
    road = { mat: m.type, roughness: m.roughness, metalness: m.metalness,
      envMapIntensity: m.envMapIntensity, color: '#' + m.color.getHexString(),
      hasRoughMap: !!m.roughnessMap, hasEnvMap: !!m.envMap, hasNormalMap: !!m.normalMap }; } });
  const lights = [];
  g.scene.traverse((x) => { if (x.isLight) lights.push({
    type: x.type, intensity: +x.intensity.toFixed(2),
    color: '#' + (x.color?.getHexString?.() ?? '??'),
    ground: x.groundColor ? '#' + x.groundColor.getHexString() : undefined,
    pos: [x.position.x, x.position.y, x.position.z].map((v) => +v.toFixed(1)) }); });
  return { world: g.level.name, skyTop: t.T.skyTop, mode: MODE,
    exposure: +g.renderer.toneMappingExposure.toFixed(2),
    meanLum: Math.round(sum / n), pctOver200: +(100*a200/n).toFixed(2), pctOver240: +(100*a240/n).toFixed(2),
    road, lights, envMapIntensity: t.T.envMapIntensity };
}, { MODE }), null, 1));
await b.close();
