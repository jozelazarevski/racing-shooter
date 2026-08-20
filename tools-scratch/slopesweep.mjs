/* PICK THE SMOOTHING SLOPE BY MEASURING IT.
 * The cap's ramp rate is a free constant and the first value was a guess.
 * Rebuild the world at several rates and read the road-hidden fraction each
 * time, so the number is chosen by what it does rather than by taste. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const IDS = (process.env.IDS ?? '4,10,27').split(',').map(Number);
const SLOPES = (process.env.SLOPES ?? '0.35,0.5,1,2,4').split(',').map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(600000);
console.log('  world              slope   road hidden   worst station');
for (const id of IDS) {
  for (const sl of SLOPES) {
    await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1&capslope=${sl}`,
      { waitUntil: 'load', timeout: 600000 });
    await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
      undefined, { timeout: 600000 });
    const r = await page.evaluate(async (slope) => {
      const g = window.__game;
      // rebuild this level with the slope applied, so the cap is rebuilt too
      // THEMES is not exported; the level's own `tune` is merged over the
      // theme at build time, so put the knob there and rebuild.
      const lv = g.level;
      g.state = 'title'; g.editScene = null;
      lv.tune = { ...(lv.tune ?? {}), cliffCapSlope: slope };
      g.swapLevel(lv, true, null);
      await new Promise((res) => requestAnimationFrame(res));
      if (g.track?.T?.cliffCapSlope !== slope) return { err: 'tune did not reach the theme' };
      const t = g.track, p = g.player, N = t.center.length;
      const CN = g.constructor.CAM_NAMES ?? [];
      const ci = CN.indexOf('TOP-DOWN'); if (ci >= 0) g.camMode = ci;
      g.clock.getDelta = () => 1 / 60;
      g._autoQuality = () => {};
      const real = g.composer.render.bind(g.composer);
      g.composer.render = () => {};
      for (let f = 0; f < 400 && g.state !== 'race'; f++) g.frame();
      const ribbons = [];
      t.group.traverse((o) => {
        if (o.isMesh && !o.isInstancedMesh && o.material?.map && !o.name
            && o.geometry?.attributes?.position?.count > 2000) ribbons.push(o);
      });
      const road = t.group.getObjectByName('road');
      if (!ribbons.length || !road) return { err: `ribbons ${ribbons.length} road ${!!road}` };
      const grab = () => {
        const cv = g.renderer.domElement;
        const c = document.createElement('canvas');
        c.width = cv.width; c.height = cv.height;
        c.getContext('2d').drawImage(cv, 0, 0);
        return c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      };
      let roadPx = 0, hidden = 0, worst = 0, worstAt = -1;
      for (let j = 0; j < N; j += 18) {
        const c = t.center[j];
        for (let f = 0; f < 12; f++) {
          p.pos.set(c.x, c.y + 0.6, c.z);
          p.speed = 2; p.trackIndex = j; p.heading = t.headingAt(j);
          p.vel?.set?.(0, 0, 0);
          g.frame();
        }
        real(); const A = grab();
        const rv = ribbons.map((o) => o.visible);
        ribbons.forEach((o) => { o.visible = false; });
        real(); const B = grab();
        const roadVis = road.visible; road.visible = false;
        real(); const C = grab();
        road.visible = roadVis;
        ribbons.forEach((o, k) => { o.visible = rv[k]; });
        let rp = 0, hp = 0;
        for (let i = 0; i < B.length; i += 4) {
          if (Math.abs(B[i] - C[i]) + Math.abs(B[i + 1] - C[i + 1]) + Math.abs(B[i + 2] - C[i + 2]) <= 10) continue;
          rp++;
          if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 10) hp++;
        }
        if (rp < 500) continue;
        roadPx += rp; hidden += hp;
        const f2 = hp / rp;
        if (f2 > worst) { worst = f2; worstAt = j; }
      }
      g.composer.render = real;
      return { name: lv.name, pct: +(100 * hidden / Math.max(roadPx, 1)).toFixed(1),
        worst: +(100 * worst).toFixed(1), worstAt };
    }, sl);
    if (r.err) { console.log(`  L${id} slope ${sl}: PROBE FAILED ${r.err}`); continue; }
    console.log(`  ${String(r.name).padEnd(18)} ${String(sl).padStart(5)}   ${String(r.pct).padStart(9)}%   ${String(r.worst).padStart(6)}% at ${r.worstAt}`);
  }
}
await b.close();
