/* HOW MANY RAIL BAYS DOES A WORLD ASK FOR, AND HOW MANY DOES IT GET?
 * The cap is only defensible if you know what it is refusing. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);
for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const r = await page.evaluate(() => {
    const t = window.__game.track;
    return { name: t.level?.name, want: t._edgeRailWant ?? 0, tight: t._edgeRailTightWant ?? 0,
      built: t._edgeRailCount ?? 0, dropped: t._edgeRailDropped ?? 0,
      bars: (t.barriers ?? []).length };
  });
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(16)} wants ${String(r.want).padStart(4)} `
    + `(${String(r.tight).padStart(4)} for tight corners)  built ${String(r.built).padStart(4)}  `
    + `DROPPED ${String(r.dropped).padStart(4)}   barriers ${r.bars}`);
}
await b.close();
