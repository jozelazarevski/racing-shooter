import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 640, height: 400 } });
p.setDefaultTimeout(300000);
await p.goto(`${BASE}/?level=74&go=1&unlockall=1`, { waitUntil: 'load' });
await p.waitForFunction(() => window.__game?.track?.center && window.__game.player);
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track, pl = g.player;
  g.camMode = 3;
  const big = (t.solids ?? []).filter((s) => (s.r ?? 0) >= 3 && s.r <= 20 && s.y !== -9999)
    .sort((a, b) => b.r - a.r)[0];
  const ang = Math.atan2(pl.pos.z - big.z, pl.pos.x - big.x);
  pl.placeAt(pl.trackIndex, 0, true);
  pl.pos.set(big.x + Math.cos(ang) * (big.r + 3), pl.pos.y, big.z + Math.sin(ang) * (big.r + 3));
  pl.heading = Math.atan2(big.x - pl.pos.x, big.z - pl.pos.z) + Math.PI;
  pl.vel.set(0, 0, 0);
  let worstIn = 0, frames = [];
  for (let f = 0; f < 90; f++) {
    pl._wedgeT = 0; pl._lostT = 0; g._gateMissT = 0;
    g.frame();
    const cp = g.camera.position;
    const d = Math.hypot(cp.x - big.x, cp.z - big.z);
    const testTop = (big.y ?? t.terrainHeight(big.x, big.z)) + Math.min(14, big.r * 1.6);
    if (d < big.r - 0.5 && cp.y < testTop) {
      worstIn = Math.max(worstIn, big.r - d);
      frames.push({ f, d: +d.toFixed(1), camY: +cp.y.toFixed(1), dbg: g._dbgProbe });
    }
  }
  const cp2 = g.camera.position;
  // replicate the probe's own math for the final frame
  const pp2 = pl.pos, samples = [];
  { const dx = pp2.x - cp2.x, dz = pp2.z - cp2.z, dy = pp2.y - cp2.y;
    for (let s2 = 1; s2 <= 7; s2++) {
      const f2 = s2 / 8;
      const sx = cp2.x + dx * f2, sz = cp2.z + dz * f2;
      const inTun = t.tunnelAt ? !!t.tunnelAt({ x: sx, y: 0, z: sz }, pl.trackIndex, 10) : 'noFn';
      const dH = Math.hypot(sx - 328, sz - (-109));
      samples.push({ f: f2, dHut: +dH.toFixed(1), inTun,
        sy: +(cp2.y + dy * f2).toFixed(1) });
    }
  }
  const deck = t.deckOverhead ? (t.deckOverhead(pl.pos, pl.trackIndex) || t.deckOverhead(cp2, pl.trackIndex)) : null;
  const tun = t.tunnelAt ? t.tunnelAt(cp2, pl.trackIndex, 10) : null;
  return { dbgProbe: g._dbgProbe ?? null, samples, camSolidsN: (g._camSolids ?? []).length, deck: deck ? { deckY: +(deck.deckY ?? -1).toFixed(1), half: deck.half } : null,
    tun: !!tun,
    big: { x: Math.round(big.x), z: Math.round(big.z), r: +big.r.toFixed(1),
      y: big.y != null ? +big.y.toFixed(1) : null, h: big.h ?? null, mat: big.mat },
    terrAtBig: +t.terrainHeight(big.x, big.z).toFixed(1),
    carY: +pl.pos.y.toFixed(1), worstIn: +worstIn.toFixed(1), frames,
    probeTop: +(((big.y ?? t.terrainHeight(big.x, big.z)) + (big.h ?? Math.min(14, big.r * 1.6)) + 1.1)).toFixed(1),
    testTop: +(((big.y ?? t.terrainHeight(big.x, big.z)) + Math.min(14, big.r * 1.6))).toFixed(1) };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
