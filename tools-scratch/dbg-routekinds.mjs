/* Q15 attribution — did the r358 circular pacing pass change CANYON RUN's
 * gate kinds at all? Dumps the gate kind sequence from two served builds. */
import { chromium } from 'playwright-core';
const LEVEL = process.env.LEVEL ?? 'CANYON RUN';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });

const dump = async (base) => {
  const p = await browser.newPage({ viewport: { width: 800, height: 520 } });
  await p.goto(`${base}/?level=1&go=1&fresh=1`, { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 120000 });
  const idx = await p.evaluate((name) => {
    const g = window.__game;
    const all = g.chapters?.().flatMap((c) => c.levels) ?? [];
    return all.find((l) => l.name === name)?.id ?? -1;
  }, LEVEL);
  if (idx < 0) { await p.close(); return { err: 'level not found' }; }
  await p.goto(`${base}/?level=${idx}&go=1&fresh=1`, { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => window.__game?.route?.gates?.length, undefined, { timeout: 120000 });
  const r = await p.evaluate(() => ({
    world: window.__game.level?.name,
    kinds: window.__game.route.gates.map((x) => x.kind),
  }));
  await p.close();
  return r;
};

const cur = await dump('http://localhost:8901');
const old = await dump('http://localhost:8904');
console.log('r357 :', old.world, old.kinds?.join(','));
console.log('HEAD :', cur.world, cur.kinds?.join(','));
console.log(JSON.stringify(cur.kinds) === JSON.stringify(old.kinds) ? 'IDENTICAL' : 'CHANGED');
await browser.close();
