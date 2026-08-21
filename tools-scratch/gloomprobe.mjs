/* HOW DARK IS A VIZ-ZONE, AND WHICH PART OF IT IS DOING IT?
 *
 * The reported picture is a phone frame with the road bright on one side of a
 * hard line and near-black on the other, props still faintly visible through
 * the dark. That is a translucent slab, not a shadow — and `_buildVizZones`
 * lays exactly one: an under-canopy "gloom" ribbon, MeshBasicMaterial 0x03130a
 * at 0.34 opacity, over the full road width for the length of the zone.
 *
 * A zone also pulls the scene fog in (near 45 / far 200) and packs trees
 * against both edges. So the frame is measured FOUR times from the same place:
 * as it is, without the gloom decal, without the fog pull, and without either.
 * Whatever the difference is, it is that term's doing — no guessing.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.setDefaultTimeout(600000);
for (const id of process.argv.slice(2)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 600000 });
  const r = await page.evaluate(() => {
    const g = window.__game, t = g.track, p = g.player;
    g.clock.getDelta = () => 1 / 60;
    const zones = (t.vizZones ?? []).map((z) => ({ kind: z.kind, i0: z.i0, len: z.len, mid: z.mid }));
    const forest = zones.find((z) => z.kind === 'forest');
    if (!forest) return { name: t.level?.name, zones, forest: null };
    // the gloom ribbons are the only unnamed MeshBasicMaterial in the world
    // group whose colour is this one — find them by that, not by index
    const glooms = [];
    t.group.traverse((o) => {
      if (o.isMesh && o.material?.isMeshBasicMaterial && o.material.transparent
          && o.material.color && o.material.color.getHex() === 0x03130a) glooms.push(o);
    });
    // park in the middle of the zone, on the road, facing along it
    const seat = (i) => {
      const c = t.center[i % t.center.length];
      p.pos.set(c.x, c.y + 1.2, c.z); p.y = c.y;
      p.vel.set(0, 0, 0); p.vy = 0; p.airborne = false;
      p.trackIndex = i % t.center.length;
      p.heading = t.headingAt(i % t.center.length);
      p.alive = true; p.health = p.maxHealth ?? 100;
    };
    const lum = () => {
      const cv = g.renderer.domElement;
      const c = document.createElement('canvas');
      c.width = 260; c.height = Math.round(260 * cv.height / cv.width);
      const x2 = c.getContext('2d');
      x2.drawImage(cv, 0, 0, c.width, c.height);
      // the ROAD AHEAD: the middle third across, the band from 35% to 70% down
      const y0 = Math.round(c.height * 0.35), y1 = Math.round(c.height * 0.70);
      const px = x2.getImageData(Math.round(c.width / 3), y0,
        Math.round(c.width / 3), y1 - y0).data;
      let s = 0;
      for (let i = 0; i < px.length; i += 4) s += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
      return +(s / (px.length / 4)).toFixed(1);
    };
    const settle = (i) => { seat(i); for (let k = 0; k < 90; k++) { g.input.analog.throttle = 0; g.frame(); } };
    const out = {};
    const N = t.center.length;
    settle(forest.mid);
    const fogNear = g.scene.fog?.near, fogFar = g.scene.fog?.far;
    out.inZone = lum();
    glooms.forEach((m) => { m.visible = false; });
    g.frame(); out.noGloom = lum();
    const nf = g.scene.fog?.near, ff = g.scene.fog?.far;
    g.scene.fog.near = t.theme?.fogNear ?? 320; g.scene.fog.far = t.theme?.fogFar ?? 1500;
    g.renderer.render(g.scene, g.camera); out.noGloomNoFog = lum();
    glooms.forEach((m) => { m.visible = true; });
    g.renderer.render(g.scene, g.camera); out.noFog = lum();
    g.scene.fog.near = nf; g.scene.fog.far = ff;
    // ...and a control: the same measurement well OUTSIDE the zone
    settle((forest.mid + Math.round(N / 2)) % N);
    out.outOfZone = lum();
    return { name: t.level?.name, zones, forest, glooms: glooms.length,
      fog: [fogNear, fogFar], out };
  });
  if (!r.forest) { console.log(`${String(id).padStart(2)} ${r.name}: no forest viz-zone (${JSON.stringify(r.zones)})`); continue; }
  const o = r.out;
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(20)} ${r.glooms} gloom ribbon(s), zone fog ${r.fog[0]?.toFixed(0)}/${r.fog[1]?.toFixed(0)}`);
  console.log(`      road luminance:  in zone ${String(o.inZone).padStart(6)}   `
    + `no gloom ${String(o.noGloom).padStart(6)}   no fog ${String(o.noFog).padStart(6)}   `
    + `neither ${String(o.noGloomNoFog).padStart(6)}   |  outside the zone ${o.outOfZone}`);
}
await b.close();
