/* GROUND TRUTH FROM THE BUILDER, NOT FROM THE BUILT SCENE.
 *
 * Recovering "which sample does this rail belong to" from a finished mesh is
 * guesswork on a hairpin — the answer is in `_buildOverpassDecks`, so patch it
 * on the wire and have it record what it decided and why. `page.route` rewrites
 * `src/track.js` in flight; nothing on disk changes.
 */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);

const NEEDLE = `          const rail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 2 * this.segLen + 0.4), stone);`;
const PATCH = `          (window.__rails ??= []).push({ j, side, rx, rz, ry: c.y + 0.45, up: o.up, half: o.half });\n` + NEEDLE;

await page.route('**/src/track.js', async (route) => {
  const res = await route.fetch();
  let body = await res.text();
  if (!body.includes(NEEDLE)) throw new Error('rail construction line not found — did it move?');
  body = body.replace(NEEDLE, PATCH);
  await route.fulfill({ response: res, body, headers: { ...res.headers(), 'content-type': 'text/javascript' } });
});

for (const id of process.argv.slice(2).map(Number)) {
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
    undefined, { timeout: 300000 });
  const out = await page.evaluate(() => {
    const t = window.__game.track, N = t.center.length;
    const rails = window.__rails ?? [];
    const rows = [];
    for (const r of rails) {
      // the census question: is this rail standing in SOMEBODY's carriageway,
      // at a height a car there would meet?
      let worst = null;
      for (let i = 0; i < N; i++) {
        const c = t.center[i];
        const d = Math.hypot(r.rx - c.x, r.rz - c.z);
        const bite = t.widthAt(i) - d;
        if (bite <= 0.15) continue;
        const top = r.ry + 0.55, bot = r.ry - 0.55;
        if (top < c.y + 0.35 || bot > c.y + 2.8) continue;      // sunk or overhead
        const dLap = Math.min((i - r.j + N) % N, (r.j - i + N) % N);
        const dx = r.rx - c.x, dz = r.rz - c.z;
        const lat = Math.abs(dx * t.nrm[i].x + dz * t.nrm[i].z);
        const cand = { i, bite: +bite.toFixed(2), d: +d.toFixed(2), lat: +lat.toFixed(2),
          half: +t.widthAt(i).toFixed(2), dy: +(r.ry - 0.45 - c.y).toFixed(2), dLap,
          r2: +(dx * dx + dz * dz).toFixed(0),
          exemptOwnRun: dLap <= r.half + 4, inRadius: dx * dx + dz * dz <= 400 };
        if (!worst || cand.bite > worst.bite) worst = cand;
      }
      if (worst) rows.push({ j: r.j, side: r.side, up: r.up, half: r.half,
        at: `${r.rx.toFixed(0)},${r.rz.toFixed(0)}`, ...worst });
    }
    return { name: t.level?.name, built: rails.length, rows,
      ov: (t._overpasses ?? []).map((o) => ({ up: o.up, low: o.low, half: o.half })) };
  });
  console.log(`\n===== ${id} ${out.name}: ${out.built} deck rails built, ${out.rows.length} standing in a carriageway =====`);
  console.log(`overpasses: ${JSON.stringify(out.ov)}`);
  for (const r of out.rows) console.log('  ' + JSON.stringify(r));
}
await b.close();
