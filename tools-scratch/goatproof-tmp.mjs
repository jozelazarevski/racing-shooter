// Climb the goat and photograph it: approach, mid-spiral, summit star.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 900, height: 600 } });
p.setDefaultTimeout(300000);
await p.goto('http://localhost:8901/?level=6&mode=roam&go=1&unlockall=1', { waitUntil:'load', timeout:120000 });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout:120000 });
const shots = await p.evaluate(async () => {
  const g = window.__game, t = g.track, pl = g.player, G = t._goat;
  g.clock.getDelta = () => 1 / 60;
  if (g.composer) g.composer.render = () => {};   // draw only for the snaps
  const P = G.pts, start = P[0];
  pl.pos.set(start[0], t.terrainHeight(start[0], start[1]) + 0.6, start[1]);
  pl.y = pl.pos.y; pl.trackIndex = t.nearestIndex(pl.pos);
  pl.heading = Math.atan2(P[3][0] - start[0], P[3][1] - start[1]);
  pl.vel.set(0, 0, 0); pl.vy = 0; pl.airborne = false; pl.alive = true; pl.health = 100;
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const out = [];
  const snap = () => {
    // chase-style: behind and above the car, looking past it up the hill
    const back = pl.heading + Math.PI;
    g.camera.position.set(pl.pos.x + Math.sin(back) * 16, pl.y + 8, pl.pos.z + Math.cos(back) * 16);
    g.camera.lookAt(pl.pos.x + Math.sin(pl.heading) * 10, pl.y + 2, pl.pos.z + Math.cos(pl.heading) * 10);
    g.camera.updateProjectionMatrix(); g.renderer.render(g.scene, g.camera);
    out.push(g.renderer.domElement.toDataURL('image/png'));
  };
  let target = 2;
  const marks = [0.22, 0.62, 1.0]; let mi = 0;
  for (let k = 0; k < 90 * 60; k++) {
    while (target < P.length - 1 && Math.hypot(P[target][0] - pl.pos.x, P[target][1] - pl.pos.z) < 14) target++;
    const err = wrap(Math.atan2(P[target][0] - pl.pos.x, P[target][1] - pl.pos.z) - pl.heading);
    g.input.analog.steer = Math.max(-1, Math.min(1, err * 1.7));
    const speed = pl.vel.length();
    g.input.analog.throttle = speed < 26 ? 1 : 0;
    g.input.analog.brake = speed > 30 ? 0.5 : 0;
    g.frame();
    const prog = target / P.length;
    if (mi < marks.length && prog >= marks[mi] && k > 180) { snap(); mi++; }
    const dC = Math.hypot(G.x - pl.pos.x, G.z - pl.pos.z);
    if (dC < 15 && pl.y > t.terrainHeight(G.x, G.z) - 4) break;
  }
  // summit shot: car at the crown beside the star, wide view down the world
  const back = pl.heading + Math.PI;
  g.camera.position.set(pl.pos.x + Math.sin(back) * 22, pl.y + 12, pl.pos.z + Math.cos(back) * 22);
  g.camera.lookAt(pl.pos.x, pl.y + 2, pl.pos.z);
  g.camera.updateProjectionMatrix(); g.renderer.render(g.scene, g.camera);
  out.push(g.renderer.domElement.toDataURL('image/png'));
  return out;
});
const fs = await import('fs');
shots.forEach((s, i) => fs.writeFileSync(`/tmp/goat-proof-${i}.png`, Buffer.from(s.split(',')[1], 'base64')));
console.log('wrote', shots.length, 'shots');
await b.close();
