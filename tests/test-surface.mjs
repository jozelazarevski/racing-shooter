// Surface-condition suite: snow/wet must change the drive (brakes, slides,
// traction), rain must fall on wet worlds, snow/wet tags must be on themes.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); };

// ---- physics isolation on a dry world (tags injected at runtime) ----
{
  const page = await b.newPage({ viewport: { width: 900, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:8901/?level=2&unlockall=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, { timeout: 15000 });
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', { timeout: 12000 });
  const r = await page.evaluate(() => {
    const g = window.__game, p = g.player, t = g.track;
    g.state = 'paused'; // freeze the live loop; we drive the sim by hand
    let idx = 0; for (let i = 0; i < t.N; i++) if (t.curvature[i] < t.curvature[idx]) idx = i;
    const brakeDist = (tag) => {
      t.T.surface = tag;
      p.alive = true; p.health = 100; p.placeAt(idx, 0);
      p.heading = t.headingAt(idx);
      p.vel.copy(p.forward).multiplyScalar(30); p.slip = 0; p.airborne = false; p.vy = 0;
      let dist = 0, steps = 0;
      const prev = p.pos.clone();
      while (Math.hypot(p.vel.x, p.vel.z) > 3 && steps < 3000) {
        p.step(1 / 60, { throttle: 0, brake: 1, steer: 0, drift: false });
        dist += p.pos.distanceTo(prev); prev.copy(p.pos); steps++;
      }
      return dist;
    };
    // grip proxy: steps to scrub a fixed 15 u/s lateral velocity down to 3
    const scrub = (tag) => {
      t.T.surface = tag;
      p.alive = true; p.placeAt(idx, 0);
      p.heading = t.headingAt(idx);
      const side = { x: p.forward.z, z: -p.forward.x };
      p.vel.copy(p.forward).multiplyScalar(12);
      p.vel.x += side.x * 15; p.vel.z += side.z * 15;
      p.slip = 0; p.airborne = false; p.vy = 0;
      let steps = 0;
      while (steps < 1200) {
        p.step(1 / 60, { throttle: 0, brake: 0, steer: 0, drift: false });
        const s2 = { x: p.forward.z, z: -p.forward.x };
        if (Math.abs(p.vel.x * s2.x + p.vel.z * s2.z) < 3) break;
        steps++;
      }
      return steps;
    };
    const out = {
      brakeDry: +brakeDist(undefined).toFixed(1), brakeWet: +brakeDist('wet').toFixed(1), brakeSnow: +brakeDist('snow').toFixed(1),
      slideDry: scrub(undefined), slideSnow: scrub('snow'),
    };
    delete t.T.surface; g.state = 'race';
    return out;
  });
  check('snow braking >= 1.35x dry distance', r.brakeSnow >= r.brakeDry * 1.35, JSON.stringify(r));
  check('wet braking >= 1.12x dry distance', r.brakeWet >= r.brakeDry * 1.12, `wet=${r.brakeWet} dry=${r.brakeDry}`);
  check('snow holds a slide >= 1.3x longer than dry', r.slideSnow >= r.slideDry * 1.3, `snowSteps=${r.slideSnow} drySteps=${r.slideDry}`);
  check('no page errors (physics sim)', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}

// ---- real worlds: tags on themes, rain ambient, spray, HUD banner ----
for (const [lvl, wantSurf, wantWeather] of [[3, 'snow', 'snow'], [7, 'snow', 'snow'], [8, 'wet', 'rain'], [1, 'wet', 'rain']]) {
  const page = await b.newPage({ viewport: { width: 900, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://localhost:8901/?level=${lvl}&unlockall=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game, { timeout: 15000 });
  await page.evaluate(() => {
    const g = window.__game;
    g.__banner = '';
    const f = g.hud.feed.bind(g.hud);
    g.hud.feed = (m, k) => { if (/ROAD/.test(m)) g.__banner = m; f(m, k); };
  });
  await page.click('#start-btn');
  await page.evaluate(() => { window.__game.countdown = 0.01; });
  await page.waitForFunction(() => window.__game.state === 'race', { timeout: 12000 });
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    const head0 = g.particles.head;
    // drive hard for a bit so spray + ambient both run
    const iv = setInterval(() => { p.vel.copy(p.forward).multiplyScalar(20); }, 100);
    await new Promise(res => setTimeout(res, 3000));
    clearInterval(iv);
    return {
      surf: g.track.T?.surface ?? 'dry',
      weather: g.track.theme?.weather?.type ?? null,
      banner: g.__banner,
      headDelta: (g.particles.head - head0 + 60000) % 60000,
    };
  });
  check(`L${lvl} surface='${wantSurf}' weather='${wantWeather}'`, r.surf === wantSurf && r.weather === wantWeather, JSON.stringify(r));
  check(`L${lvl} HUD surface banner shown`, /ROAD/.test(r.banner), r.banner);
  // headless runs ~15fps and ambient() is budget-capped per frame — 40+ in 3s
  // proves the weather system is spawning; real 60fps browsers run 4x this
  check(`L${lvl} particles flowing (ambient + spray)`, r.headDelta > 40, `headDelta=${r.headDelta}`);
  check(`L${lvl} no page errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.close();
}
await b.close();
const fails = results.filter(x => !x.ok);
console.log(`\n==== ${results.length - fails.length}/${results.length} PASSED ====`);
if (fails.length) process.exit(1);
