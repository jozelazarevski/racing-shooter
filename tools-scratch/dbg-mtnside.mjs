/* HRD-5/6 census: per station, does at least one side carry ground rising to
 * >= roadY - 1 within the corridor (8-46u out)? Lists causeway runs. */
import { chromium } from 'playwright-core';
const LVL = Number(process.env.LVL ?? 66);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const t = window.__game.track, N = t.center.length;
  let bad = 0; const runs = [];
  let runStart = -1;
  for (let i = 0; i < N; i++) {
    const c = t.center[i], n = t.nrm[i];
    let ok = false;
    for (const s of [1, -1]) {
      for (const d of [14, 24, 38]) {
        if (t.terrainHeight(c.x + n.x * d * s, c.z + n.z * d * s) >= c.y - 1) { ok = true; break; }
      }
      if (ok) break;
    }
    const excl = t._circDist(i, 0) < 110;
    const fail = !ok && !excl;
    if (fail) { bad++; if (runStart < 0) runStart = i; }
    else if (runStart >= 0) { runs.push([runStart, i - 1]); runStart = -1; }
  }
  if (runStart >= 0) runs.push([runStart, N - 1]);
  return { world: window.__game.level?.name, N, causewayStations: bad,
    runs: runs.filter((r2) => r2[1] - r2[0] >= 2).slice(0, 10),
    mtn: !!t._mtnSide };
});
console.log(JSON.stringify(r));
await browser.close();
