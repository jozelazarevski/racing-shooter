/* bankTuck phase: AS-BUILT census of one boot — the deck-intrusion census of
 * bt-lib.js plus the apron metrics the ceiling repair was justified by, read
 * off the built 'road-skirt' meshes, plus a per-mesh position hash for
 * bit-identity checks between boots.
 *
 *   MODE=head|disk   head serves `git show HEAD:src/track.js` via page.route
 *   BT=<number>      serve driving.json with patch02b.bankTuck = BT (disk only)
 *   LVLS=66,6,...
 *
 * Skirt metrics, per station-side (i < N, both sides, rows lip/face/toe):
 *   skirtAbove — vertices more than 0.05 u above the DRAWN deck of whatever
 *                leg they land on (nearest sample, |lateral| <= widthAt+2.0,
 *                deck read linearly off that station's road ribbon edge pair)
 *   rowOrder   — station-sides where NOT (lip > face > toe)
 *   row1Ground — row-1 vertices with _drawnGroundY above them, and the worst
 */
import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
const ROOT = 'C:/tmp/racing-shooter';
const LVLS = (process.env.LVLS ?? '66').split(',').map(Number);
const MODE = process.env.MODE ?? 'disk';
const BT = process.env.BT !== undefined ? Number(process.env.BT) : null;
const lib = readFileSync(`${ROOT}/tools-scratch/bt-lib.js`, 'utf8');
const headSrc = MODE === 'head' ? execSync('git show HEAD:src/track.js', { cwd: ROOT, maxBuffer: 1 << 28 }).toString() : null;
const dj = JSON.parse(readFileSync(`${ROOT}/driving.json`, 'utf8'));
if (BT !== null) dj.patch02b.bankTuck = BT;
const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? 'C:/tmp/cleanchk/chrome.exe',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
for (const LVL of LVLS) {
  const p = await b.newPage({ viewport: { width: 320, height: 200 } });
  p.setDefaultTimeout(900000);
  const errs = [], warns = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));
  p.on('console', (m) => { if (/driving\.json/.test(m.text())) warns.push(m.text()); });
  if (headSrc) await p.route(/\/src\/track\.js(\?.*)?$/, (r) => r.fulfill({
    status: 200, contentType: 'application/javascript; charset=utf-8', body: headSrc }));
  // driving.json is fetched WITHOUT an await (main.js loadDrivingOverrides()),
  // so a go=1 world can be built before it lands: route the module default too
  if (BT !== null) await p.route(/\/src\/driving\.js(\?.*)?$/, (r) => r.fulfill({
    status: 200, contentType: 'application/javascript; charset=utf-8',
    body: readFileSync(`${ROOT}/src/driving.js`, 'utf8').replace(/bankTuck: [0-9.]+,/, `bankTuck: ${BT},`) }));
  if (BT !== null) await p.route(/\/driving\.json(\?.*)?$/, (r) => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(dj) }));
  await p.goto(`http://localhost:8901/?level=${LVL}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 900000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 900000 });
  await p.evaluate(lib);
  const r = await p.evaluate(() => {
    const tr = window.__game.track, N = tr.center.length, bt = window.__bt;
    const road = tr.group.children.find((m) => m.name === 'road');
    const RP = road.geometry.attributes.position.array;
    const deckAt = (s, x, z) => {
      const c = tr.center[s], nv = tr.nrm[s];
      const l = (x - c.x) * nv.x + (z - c.z) * nv.z;
      const ax = RP[s * 6], ay = RP[s * 6 + 1], az = RP[s * 6 + 2], by = RP[s * 6 + 4];
      const w = Math.hypot(ax - c.x, az - c.z);
      return { l, deck: by + (ay - by) * (l + w) / (2 * w) };
    };
    const sk = []; tr.group.traverse((o) => { if (o.name === 'road-skirt') sk.push(o); });
    const sa = { 'w0/all': 0, 'w0/other': 0, 'w1.2/all': 0, 'w1.2/other': 0, 'w2/all': 0, 'w2/other': 0 };
    let skirtAbove = 0, rowOrder = 0, row1Ground = 0, row1N = 0, row1Worst = -Infinity, row0Out = 0;
    for (const m of sk) {
      const P = m.geometry.attributes.position.array;
      for (let i = 0; i < N; i++) {
        const y = [0, 1, 2].map((r) => P[(i * 3 + r) * 3 + 1]);
        if (!(y[0] > y[1] && y[1] > y[2])) rowOrder++;
        for (let r = 0; r < 3; r++) {
          const o = (i * 3 + r) * 3, x = P[o], yy = P[o + 1], z = P[o + 2];
          const s = tr._nearestSample(x, z);
          const dk = deckAt(s.i, x, z);
          if (Math.abs(dk.l) <= tr.widthAt(s.i) + 2.0 && yy > dk.deck + 0.05) skirtAbove++;
          const own = tr._circDist(i, s.i) <= 10;
          for (const [nm, pad] of [['w0', 0], ['w1.2', 1.2], ['w2', 2.0]]) {
            if (Math.abs(dk.l) > tr.widthAt(s.i) + pad || !(yy > dk.deck + 0.05)) continue;
            sa[nm + '/all']++; if (!own) sa[nm + '/other']++;
          }
          if (r === 0 && s.i === i && Math.abs(dk.l) > tr.widthAt(i) + 2.0) row0Out++;
          if (r === 1) {
            const g = tr._drawnGroundY(x, z);
            if (g === null) continue;
            row1N++;
            if (g > yy) row1Ground++;
            if (g - yy > row1Worst) row1Worst = g - yy;
          }
        }
      }
    }
    // the deck-intrusion census, as built
    const st = bt.stations(tr);
    const c = st.length ? bt.census(tr, st) : { margin: [] };
    const cm = st.length ? bt.census(tr, st, 40, bt.meshGround(tr)) : { margin: [] };
    tr._meshLattice = null;
    const cf = st.length ? bt.census(tr, st) : { margin: [] };
    const cnt = (a) => { let n = 0, w = -Infinity; for (const v of a) { if (v > 0) n++; if (v > w) w = v; } return [n, +w.toFixed(4)]; };
    let memoVsMesh = 0, freshVsMesh = 0; for (let q = 0; q < c.margin.length; q++) { if (Math.abs(c.margin[q] - cm.margin[q]) > 1e-4) memoVsMesh++; if (Math.abs(cf.margin[q] - cm.margin[q]) > 1e-4) freshVsMesh++; }
    const alt = { mesh: cnt(cm.margin), fresh: cnt(cf.margin), memoVsMesh, freshVsMesh };
    let intr = 0, worst = -Infinity;
    for (const v of c.margin) { if (v > 0) intr++; if (v > worst) worst = v; }
    // per-mesh position hashes (FNV over the raw float bytes)
    const hashes = {};
    tr.group.traverse((o) => {
      const a = o.geometry?.attributes?.position?.array;
      if (!a) return;
      const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
      let h = 2166136261;
      for (let k = 0; k < u.length; k++) { h ^= u[k]; h = Math.imul(h, 16777619); }
      const key = o.name || o.type;
      hashes[key] = ((hashes[key] ?? 0) ^ (h >>> 0)) >>> 0;   // order-free per name
    });
    const D = window.__DRIVING?.patch02b ?? {};
    return { name: window.__game.level?.name, N, nBanked: tr._bank9 ? [...tr._bank9].filter((v) => v).length : 0,
      bankTuck: D.bankTuck ?? null, dropped: window.__DRIVING?.__droppedKeys ?? null,
      skirts: sk.length, skirtAbove, sa, rowOrder, row1Ground, row1N, row1Worst: +row1Worst.toFixed(3), row0Out,
      probes: c.margin.length, intrusions: intr, worstMargin: +worst.toFixed(4),
      margin: c.margin, marginMesh: cm.margin, marginFresh: cf.margin, alt, hashes };
  });
  const { margin, marginMesh, marginFresh, hashes, ...rest } = r;
  console.log(JSON.stringify({ LVL, MODE, BT, ...rest, errs: errs.slice(0, 3), warns }));
  console.log('HASHES ' + JSON.stringify({ LVL, MODE, BT, hashes }));
  console.log('MARGIN ' + JSON.stringify({ LVL, MODE, BT, margin, marginMesh, marginFresh }));
  await p.close();
}
await b.close();
