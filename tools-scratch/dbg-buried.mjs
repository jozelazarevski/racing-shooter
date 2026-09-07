/* Buried-tree census (WR-7.6b): a tree is BURIED when the drawn ground at
 * its trunk stands more than 1.5 u above its base (trunk swallowed), or the
 * terrain 1 crown-radius uphill stands above base + 60% of its height
 * (crown digs into the hillside). Reads gameplay trees (t.trees) and the
 * carpet registry (t.camTrees). */
import { chromium } from 'playwright-core';
const LEVELS = (process.env.LEVELS ?? '1,29,56,58,61,66').split(',').map(Number);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const lvl of LEVELS) {
  const p = await browser.newPage({ viewport: { width: 400, height: 300 } });
  await p.goto(`http://localhost:8901/?level=${lvl}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => window.__game?.track?.center && window.__game.player, undefined, { timeout: 300000 });
  const r = await p.evaluate(() => {
    const g = window.__game, t = g.track;
    const th = (x, z) => t.terrainHeight(x, z);
    let trunkBuried = 0, crownInHill = 0, n = 0;
    const worst = [];
    for (const tr of t.trees ?? []) {
      if (tr.culled) continue;
      n++;
      const ty = tr.y ?? th(tr.x, tr.z);
      const ground = th(tr.x, tr.z);
      const sink = ground - ty;
      if (sink > 1.5) { trunkBuried++; worst.push({ kind: tr.kind ?? '?', sink: +sink.toFixed(1), x: Math.round(tr.x), z: Math.round(tr.z) }); continue; }
      // crown vs uphill terrain: sample 4 compass points at crown radius
      const r9 = (tr.r ?? 2) * 1.6, hApprox = 7 * (tr.s ?? 1);
      let hit = false;
      for (const [dx, dz] of [[r9, 0], [-r9, 0], [0, r9], [0, -r9]]) {
        if (th(tr.x + dx, tr.z + dz) > ty + hApprox * 0.6) { hit = true; break; }
      }
      if (hit) { crownInHill++; if (worst.length < 14) worst.push({ kind: tr.kind ?? '?', crown: true, x: Math.round(tr.x), z: Math.round(tr.z) }); }
    }
    let carpetBuried = 0, cn = 0;
    for (const tr of t.camTrees ?? []) {
      cn++;
      const ground = th(tr.x, tr.z);
      if (tr.top != null && ground > tr.top - 1) carpetBuried++;
    }
    worst.sort((a, b) => (b.sink ?? 0) - (a.sink ?? 0));
    return { name: g.level?.name, trees: n, trunkBuried, crownInHill,
      carpet: cn, carpetBuried, worst: worst.slice(0, 6) };
  });
  console.log(JSON.stringify(r));
  await p.close();
}
await browser.close();
