/* WHAT DID THE GUARDS COST? Counts the pieces both fixes can withhold —
 * overpass deck rails, their tyre-stack fallback markers, and stone-bridge
 * arch faces — so "the pier is gone" can be told apart from "the bridge is
 * gone". Run against both ports and diff.
 *   BASE=http://localhost:8930 node tools-scratch/deckcount.mjs 8 24 41 55 60 ...
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);
const tot = { rail: 0, marker: 0, arch: 0, parapet: 0 };
for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  const ok = await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 }).then(() => 1).catch(() => 0);
  if (!ok) { console.log(`SKIP ${id}`); continue; }
  const r = await page.evaluate(() => {
    const t = window.__game.track;
    const c = { rail: 0, marker: 0, arch: 0, parapet: 0 };
    const eq = (a, x) => a != null && Math.abs(a - x) < 1e-6;
    t.group.traverse((m) => {
      const p = m.geometry?.parameters; if (!p) return;
      if (eq(p.width, 0.5) && eq(p.height, 1.1)) c.rail++;            // deck rail
      else if (eq(p.width, 0.2) && eq(p.height, 1.0) && eq(p.depth, 0.2)) c.marker++;
      else if (eq(p.width, 2.2) && eq(p.height, 9) && eq(p.depth, 3.2)) c.arch++;
      else if (eq(p.width, 1) && eq(p.height, 1) && eq(p.depth, 1)
        && Math.abs(m.scale.x - 1.1) < 1e-6) c.parapet++;             // stone bridge wall
    });
    return { name: t.level?.name ?? '?', ov: (t._overpasses ?? []).length, ...c };
  });
  for (const k of Object.keys(tot)) tot[k] += r[k];
  console.log(`  ${String(id).padStart(2)} ${r.name.padEnd(20)} ${r.ov} overpasses  `
    + `rails ${String(r.rail).padStart(3)}  markers ${String(r.marker).padStart(3)}  `
    + `arch faces ${r.arch}  parapets ${r.parapet}`);
}
console.log(`===== rails ${tot.rail}  markers ${tot.marker}  arch faces ${tot.arch}  parapets ${tot.parapet} =====`);
await b.close();
