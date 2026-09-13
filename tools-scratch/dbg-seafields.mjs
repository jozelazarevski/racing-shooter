/* Find what the game ACTUALLY calls sea level / water, instead of guessing
 * field names. The first census guessed T.seaLevel / T.waterY / tk.seaLevel,
 * found none of them, and printed "sea? none" for 16 coast worlds — which
 * reads as "no world has sea" and is simply my guess failing. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8941';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 480, height: 320 } });
p.setDefaultTimeout(300000);
await p.goto(`${BASE}/?level=73&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
const r = await p.evaluate(() => {
  const g = window.__game, tk = g.track, T = tk.T ?? {};
  const hit = (o, label) => Object.keys(o || {})
    .filter((k) => /sea|water|tide|wave|bay|quay|marina|shore|coast/i.test(k))
    .map((k) => `${label}.${k} = ${JSON.stringify(o[k])?.slice(0, 70)}`);
  return {
    world: g.level?.name,
    theme: hit(T, 'T'),
    track: hit(tk, 'track').slice(0, 20),
    trackMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(tk))
      .filter((k) => /sea|water|shore|coast|quay|marina/i.test(k)),
    levelKeys: hit(g.level, 'level'),
  };
});
await b.close();
console.log(r.world);
for (const k of ['theme', 'track', 'trackMethods', 'levelKeys']) {
  console.log(`\n${k}:`); for (const v of r[k]) console.log('   ', v);
}
