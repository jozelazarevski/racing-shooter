/* Are the 11,497 ghosts culled IN THE REGISTRY (tr.r zeroed, so collision
 * already skips them) or only in the MESH (live collider, invisible tree)? */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=0&go=1&unlockall=1', { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.camTrees?.length, undefined, { timeout: 600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const cam = window.__game.track.camTrees;
  let ghostLiveR = 0, ghostZeroR = 0, minR = 1e9, maxR = 0, culledFlag = 0;
  for (const c of cam) {
    const m = c.meshes && c.meshes[0];
    if (!m || c.idx == null) continue;
    const sc = m.instanceMatrix.array[c.idx * 16];
    if (sc >= 0.01) continue;
    if (c.culled) culledFlag++;
    if (c.r > 0) { ghostLiveR++; minR = Math.min(minR, c.r); maxR = Math.max(maxR, c.r); }
    else ghostZeroR++;
  }
  return { total: cam.length, ghostLiveR, ghostZeroR, culledFlag,
    ghostR: ghostLiveR ? [+minR.toFixed(2), +maxR.toFixed(2)] : null };
}, undefined)));
await b.close();
