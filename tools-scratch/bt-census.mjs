/* bankTuck phase: A/B deck-intrusion census on the banking worlds.
 *
 *   LVLS=66 VARIANTS='[{"name":"head","ceil":"head"},{"name":"patch"}]' \
 *     node tools-scratch/bt-census.mjs
 *
 * MODE=disk (default) boots the working tree and applies each variant to the
 * live instance (see bt-lib.js). MODE=head serves `git show HEAD:src/track.js`
 * in place of /src/track.js through page.route — nothing on disk moves — and
 * censuses that boot as-is, which is the true baseline the in-page `head`
 * variant has to reproduce.
 *
 * An intrusion is a probe whose DRAWN terrain stands above the DRAWN deck. A
 * new intrusion is one at or below the deck in the first variant listed and
 * above it in the variant being reported. OUT=<file> writes the margins. */
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
const ROOT = 'C:/tmp/racing-shooter';
const LVLS = (process.env.LVLS ?? '66').split(',').map(Number);
const MODE = process.env.MODE ?? 'disk';
const VARIANTS = JSON.parse(process.env.VARIANTS ?? '[{"name":"asbuilt","asBuilt":true}]');
const OUT = process.env.OUT ?? null;
const lib = readFileSync(`${ROOT}/tools-scratch/bt-lib.js`, 'utf8');
const headSrc = MODE === 'head' ? execSync('git show HEAD:src/track.js', { cwd: ROOT, maxBuffer: 1 << 28 }).toString() : null;
const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? 'C:/tmp/cleanchk/chrome.exe',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const dump = {};
for (const LVL of LVLS) {
  const p = await b.newPage({ viewport: { width: 320, height: 200 } });
  p.setDefaultTimeout(900000);
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));
  if (headSrc) {
    await p.route(/\/src\/track\.js(\?.*)?$/, (route) => route.fulfill({
      status: 200, contentType: 'application/javascript; charset=utf-8', body: headSrc }));
  }
  await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 });
  await p.evaluate(lib);
  const meta = await p.evaluate(() => {
    const tr = window.__game.track;
    return { name: window.__game.level?.name, nBanked: tr._bank9 ? [...tr._bank9].filter((v) => v).length : 0,
      stations: window.__bt.stations(tr).length,
      hasTuck: /bankTuck/.test(Object.getPrototypeOf(tr)._blendHeight.toString()),
      ceilArgs: Object.getPrototypeOf(tr)._roadCeil.length, bankTuck0: window.__DRIVING?.patch02b?.bankTuck ?? null };
  });
  const res = [];
  for (const v of VARIANTS) {
    const r = await p.evaluate((v) => {
      const bt = window.__bt, tr = bt.tr();
      if (!v.asBuilt) bt.setVariant(tr, v);
      const st = bt.stations(tr);
      const t0 = performance.now();
      const c = bt.census(tr, st);
      c.edge = bt.edgeStep(tr);
      return { ...c, ms: performance.now() - t0 };
    }, v);
    res.push({ v, ...r });
  }
  const base = res[0];
  const rows = [];
  for (const r of res) {
    let tot = 0, totP = 0, flip = 0, unflip = 0, worst = -Infinity;
    const flips = [];
    for (let q = 0; q < r.margin.length; q++) {
      if (r.margin[q] > 0) tot++;
      if (r.phys[q] > 0) totP++;
      if (base.margin[q] <= 0 && r.margin[q] > 0) { flip++; flips.push(q); }
      if (base.margin[q] > 0 && r.margin[q] <= 0) unflip++;
      if (r.margin[q] > worst) worst = r.margin[q];
    }
    flips.sort((a, b2) => r.margin[b2] - r.margin[a]);
    rows.push({ variant: r.v.name, probes: r.margin.length, intrusions: tot, physIntrusions: totP,
      newVsFirst: flip, clearedVsFirst: unflip, worstMargin: +worst.toFixed(4),
      topNew: flips.slice(0, 8).map((q) => `${r.st[q]}@${r.lat[q].toFixed(3)}:+${r.margin[q].toFixed(3)}`),
      edge: r.edge, ms: Math.round(r.ms) });
  }
  console.log(JSON.stringify({ LVL, MODE, ...meta, errs: errs.slice(0, 3), rows }, null, 1));
  dump[LVL] = { meta, res: res.map((r) => ({ name: r.v.name, margin: r.margin, st: r.st, lat: r.lat })) };
  await p.close();
}
if (OUT) writeFileSync(OUT, JSON.stringify(dump));
await b.close();
