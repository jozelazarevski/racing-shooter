/* THE WORLD FINGERPRINT, AND THE GUARD THAT KEEPS IT MEANINGFUL.
 *
 * `verify-track-format.mjs` proves the track FORMAT lost nothing. `verify-sdf.mjs`
 * proves the road-distance bake is exact. Neither notices if a change to a
 * component, a scatter rule or the builder quietly moves every tree in the game.
 * This does.
 *
 * For every built-in track it builds the real world and hashes what came out —
 * terrain heights, surfaces, and the transform of every single instanced object
 * — then compares against a golden file committed next to the tracks. An
 * unintended world change fails here instead of being noticed in a screenshot
 * three releases later.
 *
 * It also runs the whole build inside `withoutMathRandom()`, so an unseeded call
 * anywhere in world construction throws with a stack rather than silently
 * reintroducing a world that cannot be rebuilt. Determinism that is true by
 * inspection stops being true the first time somebody adds a line.
 *
 *   npx vite build          # the tool serves ../V2 itself
 *   node tools/verify-worlds.mjs           # check against the golden file
 *   node tools/verify-worlds.mjs --update  # re-bless it, after an INTENDED change
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { ensureServer } from './serve.mjs';

const BASE = process.env.BASE || 'http://localhost:8903/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

// Serves ../V2 itself unless something already is, so the check
// never fails because a server from an earlier session has gone away.
const stopServer = await ensureServer(BASE, '../V2');
const GOLDEN = 'src/data/worlds.golden.json';
const UPDATE = process.argv.includes('--update');

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message.split('\n')[0]));

await page.goto(`${BASE}editor.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__editor?.preview?.terrain, null, { timeout: 90000 });

const results = await page.evaluate(async () => {
  const e = window.__editor;
  const out = {};

  // FNV-1a over a stream of integers. Chosen because the fingerprint has to be
  // stable across machines and browsers: this is all uint32 arithmetic, so it
  // cannot drift with a different floating-point library or rounding mode.
  const mk = () => {
    let h = 0x811c9dc5;
    return {
      n(v) { h ^= v | 0; h = Math.imul(h, 0x01000193); },
      get() { return (h >>> 0).toString(16).padStart(8, '0'); },
    };
  };

  // Fingerprint one built world. Factored out because each track is built
  // more than once — see the seed-independence check below.
  const fingerprint = (track) => {
    const t = e.preview.terrain;
    const h = mk();

    // terrain: height and surface on a fixed lattice
    const S = track.world.size;
    const SURF = ['tarmac', 'gravel', 'mud', 'snow', 'ice', 'sand'];
    for (let gz = 0; gz <= 40; gz++) {
      for (let gx = 0; gx <= 40; gx++) {
        const x = (gx / 40 - 0.5) * S;
        const z = (gz / 40 - 0.5) * S;
        h.n(Math.round(t.heightAt(x, z) * 1000));
        h.n(SURF.indexOf(t.surfaceIdAt(x, z)));
      }
    }
    // the racing line's own ground, which is what the car and the AI meet
    for (let i = 0; i < t.roadPoints.length; i += 3) {
      const p = t.roadPoints[i];
      h.n(Math.round(p.x * 100));
      h.n(Math.round(p.z * 100));
      h.n(Math.round(t.heightAt(p.x, p.z) * 1000));
    }

    // every instanced object: count and transform. This is the part that
    // catches a component or scatter rule changing under you.
    let instances = 0;
    for (const o of e.preview.objects) {
      if (!o.isInstancedMesh) continue;
      h.n(o.count);
      instances += o.count;
      const a = o.instanceMatrix.array;
      for (let i = 0; i < o.count; i++) {
        const off = i * 16;
        // Position AND scale. The first version hashed only elements 12-14 —
        // the translation — while its comment claimed it covered scale too.
        // A deliberate mutation (widening one component's scale range) sailed
        // straight through, which is how the hole was found: a check that
        // cannot fail is not a check. Element 5 is m22, which for a uniform
        // scale under a Y rotation is the scale exactly, so it captures size
        // without picking up float noise from the trig in the other elements.
        h.n(Math.round(a[off + 12] * 100));
        h.n(Math.round(a[off + 13] * 100));
        h.n(Math.round(a[off + 14] * 100));
        h.n(Math.round(a[off + 5] * 1000));
      }
    }

    return { fingerprint: h.get(), instances, components: { ...e.preview.componentCounts },
      roadSamples: t.roadPoints.length };
  };

  for (const track of e.builtInTracks()) {
    // BUILT TWICE, under two different replacements for Math.random. If any
    // part of world construction depends on unseeded randomness the two
    // fingerprints diverge. (Throwing on the call itself does not work —
    // three.js generates a UUID with Math.random for every geometry it makes;
    // see core/rng.ts.)
    e.withStubbedRandom(0x1234, () => { e.preview.rebuild(track); });
    const a = fingerprint(track);
    e.withStubbedRandom(0x9abcdef, () => { e.preview.rebuild(track); });
    const b = fingerprint(track);
    out[track.id] = { ...a, seedIndependent: a.fingerprint === b.fingerprint, other: b.fingerprint };
  }
  return out;
});

await browser.close();
await stopServer();

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

for (const [id, r] of Object.entries(results)) {
  check(r.seedIndependent, `${id}: the world does not depend on unseeded randomness`,
    r.seedIndependent ? '' : `two runs under different Math.random gave ${r.fingerprint} and ${r.other}`);
}

if (UPDATE) {
  writeFileSync(GOLDEN, `${JSON.stringify(results, null, 2)}\n`);
  console.log(`\nblessed ${GOLDEN}:`);
  for (const [id, r] of Object.entries(results)) {
    console.log(`  ${id.padEnd(16)} ${r.fingerprint}  ${r.instances} instances`);
  }
  await stopServer();
  process.exit(fails ? 1 : 0);
}

if (!existsSync(GOLDEN)) {
  console.log(`\nno golden file at ${GOLDEN} — run with --update to create it`);
  await stopServer();
  process.exit(1);
}
const golden = JSON.parse(readFileSync(GOLDEN, 'utf8'));

for (const [id, r] of Object.entries(results)) {
  const g = golden[id];
  if (!g) { check(false, `${id}: present in the golden file`, 'new track — re-bless with --update'); continue; }
  check(r.fingerprint === g.fingerprint, `${id}: world unchanged`,
    r.fingerprint === g.fingerprint
      ? `${r.fingerprint}, ${r.instances} instances`
      : `fingerprint ${g.fingerprint} -> ${r.fingerprint}. If this change was INTENDED, `
        + 're-bless with `npm run verify:worlds -- --update`; if it was not, something moved every object in the world');
  if (r.fingerprint === g.fingerprint) continue;
  // a diff of the counts is far more useful than "the hash moved"
  for (const k of new Set([...Object.keys(g.components ?? {}), ...Object.keys(r.components ?? {})])) {
    const a = g.components?.[k] ?? 0, b = r.components?.[k] ?? 0;
    if (a !== b) console.log(`        ${k}: ${a} -> ${b}`);
  }
}
for (const id of Object.keys(golden)) {
  if (!results[id]) check(false, `${id}: still exists`, 'in the golden file but not in the build');
}

check(pageErrors.length === 0, 'no page errors while building every world', pageErrors.slice(0, 3).join(' | '));

console.log(fails ? `\n${fails} FAILED` : '\nevery world matches its fingerprint and is fully seeded');
process.exit(fails ? 1 : 0);
