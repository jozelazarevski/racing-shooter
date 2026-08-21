/* WHERE DOES test-wedge-recovery's "normal racing" PHASE ACTUALLY STALL?
 *
 * That phase holds FULL THROTTLE WITH NO STEERING for 30 s and asserts no
 * rescue fires. On a track with corners that is not normal racing, it is
 * driving into the scenery — so before either loosening the net or rewriting
 * the test, find out what the car is doing at the moment the rescue fires. If
 * it is off the road, barely moving, with the throttle down, the rescue is
 * right and the assertion's name is wrong.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8901';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 400, height: 240 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/?level=20&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });
const r = await page.evaluate(() => {
  const g = window.__game, p = g.player, t = g.track;
  g.clock.getDelta = () => 1 / 60;
  g._autoQuality = () => {};
  g.composer.render = () => {};
  for (let f = 0; f < 400 && g.state !== 'race'; f++) g.frame();
  p.placeAt(0, 0, true);
  p.vel.set(0, 0, 0); p._wedgeT = 0;
  const events = [];
  const realFeed = g.hud.feed.bind(g.hud);
  g.hud.feed = (m, k) => {
    if (m === 'RECOVERED') events.push({
      s: +(f0 / 60).toFixed(1), lat: +p.lateral.toFixed(1),
      half: +(t.widthAt?.(p.trackIndex) ?? 9).toFixed(1),
      spd: +Math.hypot(p.vel.x, p.vel.z).toFixed(2),
      idx: p.trackIndex, anchorT: +(p._wedgeAnchorT ?? 0).toFixed(1),
      groundY: +t.terrainHeight(p.pos.x, p.pos.z).toFixed(1),
      roadY: +t.center[p.trackIndex].y.toFixed(1),
    });
    return realFeed(m, k);
  };
  let f0 = 0;
  for (; f0 < 1800; f0++) { g.input.analog.throttle = 1; g.frame(); }
  return { world: g.level?.name, events };
});
console.log(r.world);
for (const e of r.events) console.log('  RECOVERED at', JSON.stringify(e));
if (!r.events.length) console.log('  no rescue fired');
await b.close();
