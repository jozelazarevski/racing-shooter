/* WHY DID A WORLD GET FEWER BORES THAN IT ASKED FOR?
 * `count` is a request; tunnelFitAt refuses stations that are too curved, too
 * near a gorge/overpass/tunnel, too near the start gate, or on a crest. This
 * walks every station and reports which gate turned it away, so "asked 3, got
 * 1" becomes a reason instead of a shrug. */
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
    const t = window.__game.track, N = t.center.length;
    const why = { gate: 0, gorge: 0, curve: 0, tunnel: 0, fit: 0, ok: 0 };
    const TIGHT = 0.02;
    for (let i = 0; i < N; i++) {
      if (t._circDist(i, 0) < 60) { why.gate++; continue; }
      if (t._nearGorge(i, 40)) { why.gorge++; continue; }
      if (t.curvature[i] > TIGHT) { why.curve++; continue; }
      if ((t._tunnels ?? []).some((u) => i >= u.s - 20 && i <= u.e + 20)) { why.tunnel++; continue; }
      const f = t.tunnelFitAt ? t.tunnelFitAt(i) : null;
      if (!f) { why.fit++; continue; }
      why.ok++;
    }
    return { name: t.level?.name, N, why,
      asked: t.T.tunnels?.count ?? 0, sited: (t._tunnels ?? []).length,
      bridges: (t._jumpGorges ?? []).length, gorge: !!t._gorge,
      overpasses: (t._overpasses ?? []).length };
  });
  const w = r.why;
  console.log(`${String(id).padStart(2)} ${r.name}  asked ${r.asked}, sited ${r.sited}   `
    + `(${r.N} stations)`);
  console.log(`     refused: start gate ${w.gate}, near gorge/overpass/bore ${w.gorge}, `
    + `too curved ${w.curve}, beside a sited bore ${w.tunnel}, tunnelFitAt said no ${w.fit}`);
  console.log(`     STILL AVAILABLE: ${w.ok} stations   `
    + `[jump gorges ${r.bridges}, hero gorge ${r.gorge}, overpasses ${r.overpasses}]`);
}
await b.close();
