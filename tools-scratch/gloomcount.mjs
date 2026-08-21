/* HOW MANY GLOOM RIBBONS ARE STACKED OVER THIS ROAD?
 *
 * `_buildVizZones` lays an under-canopy gloom ribbon over the carriageway for
 * the length of each forest zone: MeshBasicMaterial 0x03130a at opacity 0.34,
 * 0.05 u above the road. One of those costs a third of the light. They are not
 * clipped against each other, so where two zones overlap the road takes
 * 0.66^2, and where three do, 0.66^3.
 *
 * The earlier elimination of this decal was SCOPED WRONG — it hid the ribbons
 * on NORDSCHLEIFE and re-measured NORDSCHLEIFE (9.7 -> 9.8), then the result
 * was carried over to a different world. So this one carries a POSITIVE
 * CONTROL: it also hides the ROAD, and if that does not move the number the
 * hiding mechanism is not working and no null result from it means anything.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.setDefaultTimeout(600000);
for (const arg of process.argv.slice(2)) {
  const [id, ...stations] = arg.split(':');
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  const r = await page.evaluate(([stations]) => {
    const g = window.__game, t = g.track, p = g.player;
    g.clock.getDelta = () => 1 / 60;
    const glooms = [], roads = [], casters = [];
    t.group.traverse((o) => {
      if (!(o.isMesh || o.isInstancedMesh)) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (m?.color && m.color.getHex() === 0x03130a && m.transparent) glooms.push(o);
      if (o.name === 'road') roads.push(o);
      // anything that throws a shadow and is not the ground itself
      if (o.castShadow && o.name !== 'road' && o.name !== 'terrain') casters.push(o);
    });
    const lum = () => {
      const cv = g.renderer.domElement;
      const c = document.createElement('canvas');
      c.width = 260; c.height = Math.round(260 * cv.height / cv.width);
      const cx = c.getContext('2d');
      cx.drawImage(cv, 0, 0, c.width, c.height);
      const px = cx.getImageData(Math.round(c.width * 0.34), Math.round(c.height * 0.42),
        Math.round(c.width * 0.32), Math.round(c.height * 0.30)).data;
      let s = 0;
      for (let i = 0; i < px.length; i += 4) s += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
      return +(s / (px.length / 4)).toFixed(1);
    };
    const park = (i) => {
      const c = t.center[i];
      p.pos.set(c.x, c.y + 1.2, c.z); p.y = c.y;
      p.vel.set(0, 0, 0); p.vy = 0; p.airborne = false;
      p.trackIndex = i; p.heading = t.headingAt(i);
      p.alive = true; p.health = p.maxHealth ?? 100;
      for (let f = 0; f < 150; f++) { g.input.analog.throttle = 0; g.input.analog.steer = 0; g.frame(); }
    };
    const rows = [];
    for (const s of stations) {
      const i = Number(s) % t.center.length;
      park(i);
      const on = lum();
      glooms.forEach((o) => { o.visible = false; }); g.frame();
      const off = lum();
      glooms.forEach((o) => { o.visible = true; });
      roads.forEach((o) => { o.visible = false; }); g.frame();
      const noRoad = lum();
      roads.forEach((o) => { o.visible = true; }); g.frame();
      // ...AND THE CANOPY. If the road brightens when nothing can cast on it,
      // the dark patch is a shadow, which is what a jungle is supposed to do.
      casters.forEach((o) => { o.castShadow = false; });
      g.frame(); g.frame();
      const noCast = lum();
      casters.forEach((o) => { o.castShadow = true; });
      g.frame(); g.frame();
      // how many ribbons cover this station, counted from the zone list
      const N = t.center.length;
      const zones = (t.vizZones ?? []).filter((z) => z.kind === 'forest'
        && ((i - z.i0 + N) % N) <= z.len);
      rows.push({ i, on, off, noRoad, noCast, cover: zones.length });
    }
    return { name: t.level?.name, glooms: glooms.length, casters: casters.length,
      zones: (t.vizZones ?? []).map((z) => `${z.kind}@${z.i0}+${z.len}`), rows };
  }, [stations]);
  console.log(`\n${String(id).padStart(2)} ${r.name}: ${r.glooms} gloom ribbon(s), ${r.casters} shadow casters, zones ${JSON.stringify(r.zones)}`);
  for (const x of r.rows) {
    console.log(`     station ${String(x.i).padStart(4)}  road ${String(x.on).padStart(6)}`
      + `  ->  ${String(x.off).padStart(6)} with the gloom hidden`
      + `   (${x.cover} ribbon${x.cover === 1 ? '' : 's'} cover it)`
      + `  ->  ${String(x.noCast).padStart(6)} with nothing casting a shadow`
      + `   [control: ${x.noRoad} with the ROAD hidden]`);
  }
}
await b.close();
