/* REFACTOR EQUIVALENCE — does a change to the world builder still build the
 * same worlds?
 *
 * This exists because `src/track.js` is being decomposed a module at a time
 * (see ARCHITECTURE.md §5.1), and a refactor of that size is worth exactly as
 * much as its proof. Reading the diff does not prove it: the file is thousands
 * of lines of procedural generation, and a single reordered statement silently
 * moves every subsequent draw from the seeded PRNG — which moves every tree,
 * rock and building in the world, in a way no screenshot review would catch.
 *
 * So: build every world on TWO servers — the old code and the new — and compare
 * a fingerprint of what actually got built.
 *
 *   git worktree add /tmp/baseline HEAD
 *   (cd /tmp/baseline && python3 -m http.server 8902 &)
 *   python3 -m http.server 8901 &                      # the working tree
 *   BASE_A=http://localhost:8902/ BASE_B=http://localhost:8901/ \
 *     node tests/test-equivalence.mjs 1 2 3 ...        # world ids, or none for all
 *
 * With only BASE_A set it compares that build against ITSELF, which is the
 * determinism check: same world, two loads, identical bytes.
 *
 * WHAT IS SAMPLED, AND WHY IT IS ONLY PURE QUERIES.
 * The first version of this probe fingerprinted live collider positions, and
 * the UNMODIFIED baseline disagreed with itself on world 1. The race is already
 * running by the time the page is sampled, so anything the simulation mutates
 * is timing noise, not a world difference. The fingerprint therefore covers
 * only queries that are pure functions of the built world — centreline points,
 * terrain height, road width, slope, ground height, the water plane — plus the
 * counts of what was placed. A probe that can fail on identical inputs cannot
 * certify anything.
 */
import { chromium } from 'playwright-core';

const A = process.env.BASE_A || 'http://localhost:8901/';
const B = process.env.BASE_B || A;
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: 900, height: 560 } });

// world ids from the command line, or the whole roster off the running build
let levels = process.argv.slice(2).map(Number).filter(Number.isFinite);
if (!levels.length) {
  const p = await ctx.newPage();
  await p.goto(`${A}?level=1`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__LEVELS?.length > 0, null, { timeout: 60000 });
  levels = await p.evaluate(() => window.__LEVELS.map((l) => l.id));
  await p.close();
}

/** Runs in the page. Pure queries only — see the header. */
const SAMPLE = () => {
  const g = window.__game, t = g?.track;
  if (!t) return { error: 'no track' };
  const nums = [];
  for (let i = 0; i < t.center.length; i += 17) {
    const p = t.pointAt(i, 0);
    nums.push(Math.round(p.x * 100), Math.round(p.y * 100), Math.round(p.z * 100));
  }
  for (let x = -700; x <= 700; x += 100)
    for (let z = -700; z <= 700; z += 100)
      nums.push(Math.round(t.terrainHeight(x, z) * 100));
  for (let i = 0; i < t.center.length; i += 23) {
    nums.push(Math.round(t.widthAt(i) * 100), Math.round(t.slopeAt(i) * 1000),
      Math.round(t.groundHeightAt(i, 6) * 100));
  }
  for (let x = -500; x <= 500; x += 250)
    for (let z = -500; z <= 500; z += 250)
      nums.push(Math.round((t.waterAt(x, z) ?? -999) * 100));
  let h = 0x811c9dc5;                                   // FNV-1a over the lot
  const s = nums.join(',');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return {
    name: g.level?.name, seed: g.worldSeed, hash: (h >>> 0).toString(16),
    counts: `${t.trees?.length}/${t.solids?.length}/${t.buildings?.length}/${t.props?.length}`,
  };
};

const sample = async (base, level) => {
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message.split('\n')[0]));
  try {
    await page.goto(`${base}?level=${level}&go=1&unlockall=1`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__game?.track?.center?.length > 0,
      null, { timeout: 60000 });
    const out = await page.evaluate(SAMPLE);
    out.errs = errs;
    return out;
  } catch (e) {
    return { error: e.message.split('\n')[0], errs };
  } finally { await page.close(); }
};

let fails = 0;
for (const lv of levels) {
  const a = await sample(A, lv);
  const b = await sample(B, lv);
  const ok = !a.error && !b.error && a.hash === b.hash && a.counts === b.counts
    && a.seed === b.seed && !a.errs.length && !b.errs.length;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  world ${String(lv).padStart(2)}  ` +
    `${(a.name ?? a.error ?? '?').padEnd(22)} ${a.hash ?? '-'} vs ${b.hash ?? '-'}  ` +
    `${a.counts ?? ''}${ok ? '' : `\n      A=${JSON.stringify(a)}\n      B=${JSON.stringify(b)}`}`);
}

await browser.close();
console.log(fails
  ? `\n${fails} of ${levels.length} worlds DIFFER`
  : `\nall ${levels.length} worlds identical across both builds`);
process.exit(fails ? 1 : 0);
