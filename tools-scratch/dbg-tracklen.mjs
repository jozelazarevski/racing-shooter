/* THE ROSTER'S LAP LENGTHS (M-2). `_lapsForTrack` races 3 laps under
 * `lapsShortTrackU` (3000 u) and 1 lap over it. The pay census found every
 * sampled world between 5,528 and 12,038 u — i.e. ALL of them over the
 * threshold, so the 3-lap branch never fires and the owner's r381 rule
 * ("decide when track is 1 or 3 laps depending the length") is inert.
 * Before proposing a threshold, measure the whole distribution. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await browser.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(600000);
const n = Number(process.env.N ?? 78);
const out = [];
for (let L = 0; L < n; L++) {
  try {
    await p.goto(`${BASE}/?level=${L}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
    await p.waitForFunction(() => window.__game?.track?.length > 0, undefined, { timeout: 120000 });
    out.push(await p.evaluate(() => ({
      name: window.__game.level?.name, id: window.__game.level?.id,
      len: Math.round(window.__game.track.length),
      laps: window.__game.lapsTotal, declared: window.__game.level?.laps ?? null,
    })));
  } catch { out.push({ name: `level ${L}`, len: null }); }
}
const ok = out.filter((r) => r.len);
ok.sort((a, b) => a.len - b.len);
for (const r of ok) console.log(`${String(r.len).padStart(6)} u  laps ${r.laps}${r.declared != null ? ' (declared)' : ''}  ${r.name}`);
const q = (f) => ok[Math.min(ok.length - 1, Math.floor(ok.length * f))].len;
console.log(`\nn=${ok.length}  min ${ok[0].len}  p25 ${q(0.25)}  median ${q(0.5)}  p75 ${q(0.75)}  max ${ok[ok.length - 1].len}`);
for (const t of [3000, 6000, 6500, 7000, 7500, 8000]) {
  console.log(`threshold ${t}: ${ok.filter((r) => r.len < t).length} of ${ok.length} worlds would race 3 laps`);
}
await browser.close();
