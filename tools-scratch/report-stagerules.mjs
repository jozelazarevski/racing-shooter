/* §13.1 — run the validator over EVERY world; one report. Long. */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const first = await browser.newPage({ viewport: { width: 480, height: 320 } });
await first.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
await first.waitForFunction(() => window.__game, undefined, { timeout: 300000 });
const ids = await first.evaluate(async () => {
  const T = await import('./src/track.js');
  return T.LEVELS.map((l) => [l.id, l.name]);
});
await first.close();
console.log(`${ids.length} worlds`);
const report = [];
for (const [id, name] of ids) {
  const p = await browser.newPage({ viewport: { width: 480, height: 320 } });
  try {
    await p.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 180000 });
    await p.waitForFunction(() => window.__game?.player && window.__game.track?.center,
      undefined, { timeout: 240000 });
    const r = await p.evaluate(() => {
      const g = window.__game;
      if (g.composer) g.composer.render = () => {};
      let elapsed = g.clock.elapsedTime;
      g.clock = { getDelta: () => { elapsed += 1 / 60; return 1 / 60; }, get elapsedTime() { return elapsed; } };
      for (let k = 0; k < 900 && g.state !== 'race'; k++) { g.countdown = 0.01; g.frame(); }
      g._frameBody();
      return { rotated: g.track._startRotated ?? null,
        violations: g._stageReport ?? [],
        ceilKmh: +((g._nitroCeilU ?? 0) * 3.1).toFixed(0) };
    });
    report.push({ id, name, ...r });
    console.log(id, name, JSON.stringify(r.violations.map((v) => v.rule)), r.rotated ? `rot ${r.rotated.by}` : '');
  } catch (e) {
    report.push({ id, name, error: String(e).slice(0, 120) });
    console.log(id, name, 'ERROR');
  }
  await p.close();
}
writeFileSync(new URL('./stagerules-report.json', import.meta.url), JSON.stringify(report, null, 1));
const counts = {};
for (const w of report) for (const v of w.violations ?? []) counts[v.rule] = (counts[v.rule] ?? 0) + 1;
console.log('SUMMARY', JSON.stringify(counts));
await browser.close();
