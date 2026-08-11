/* DOES A FIX STAY FIXED, AND CAN THE WORLD BE REBUILT TO PROVE IT?
 *
 * THE COMPLAINT THIS EXISTS FOR IS ONE WORD, SAID OVER AND OVER:
 *
 *     "I can still enter the mountains instead of hitting them"
 *     "Still can enter."                     - with a photograph from INSIDE a hillside
 *     "Still see the shark mountains there"
 *     "I still don't see jumping across cracks and gorges."
 *     "I don't see the new complex tracks"
 *     "I keep on debugging the game non stop for things that can be obviously working."
 *
 * STILL. IGNITE RALLY's commit log carries the same shape in its own words -
 * "Reported twice with the same photograph". Those are not sixteen separate
 * bugs. They are FIXES THAT DID NOT HOLD: a defect repaired in one code path
 * and left live in a second (r148 made the massif cones solid and left the
 * skyline bare on 51 of 60 worlds for five more releases), or repaired and
 * later regressed, with nothing standing watch either way. v1 grew 56 test
 * files because 56 things went wrong, every one written AFTER the incident,
 * and no convention forcing it.
 *
 * There are exactly two ways a fix stops being true, and this file guards both.
 *
 * ---------------------------------------------------------------------------
 * 1 & 3. THE WORLD MUST BE REBUILDABLE, OR NOTHING BELOW MEANS ANYTHING.
 *
 * MIGRATION.md: a world's crest count moved 6 -> 0 across two builds with NO
 * CODE CHANGE, "which is WHY the sinking bug is still open: I could not
 * reproduce it." A bug you cannot reproduce is a bug you fix by guessing, and a
 * guess is what comes back. Determinism is not a nice-to-have here; it is the
 * precondition for every other check in this folder being evidence rather than
 * an anecdote.
 *
 * `verify-worlds.mjs` already does the central half of this well: it builds
 * each track twice under two different replacements for `Math.random` and
 * requires the fingerprints to match, against a committed golden file. THIS
 * FILE DOES NOT REPEAT THAT. It closes the holes in it, and the holes are real
 * and measured, not hypothetical:
 *
 *   a) THE GOLDEN FINGERPRINT IS BLIND TO YAW AND TO NON-UNIFORM SCALE.
 *      It hashes matrix elements 12/13/14 (translation) and element 5 (`m22`),
 *      "which for a uniform scale under a Y rotation is the scale exactly".
 *      True - for a UNIFORM scale. The horizon massifs are not uniform:
 *      `render/horizon.ts:130` scales them `(w, h, w * (0.5..1.2))`, so `m22`
 *      is their HEIGHT and their WIDTH and DEPTH are never hashed. That is
 *      precisely the shark-fin proportion in "Still see the shark mountains
 *      there". Yaw lives in elements 0/2/8/10 and is not hashed either - and
 *      yaw is not cosmetic: `world/build.ts:275` feeds `inst.rot` to the box
 *      colliders, so a yaw change rotates the collision footprint of every
 *      yawed box in the world, which is BUGS.md #1's "furniture in the lane"
 *      arriving with the fingerprint unmoved.
 *      That hole has a precedent in this very repo: the FIRST version of
 *      `verify-worlds` hashed the translation alone while its comment claimed
 *      it covered scale, and a mutation widening a component's scale range
 *      sailed straight through. This is the same hole one level over.
 *
 *   b) IT ONLY LOOKS AT TOP-LEVEL InstancedMesh. `if (!o.isInstancedMesh)
 *      continue` over `preview.objects` skips the terrain mesh, the road mesh,
 *      the water, the sky dome and the whole cloud Group - everything the
 *      complaint record is actually about. A hole in the road would be hashed
 *      as unchanged.
 *
 *   c) IT NEVER HASHES GEOMETRY. A component whose SHAPE changes - a peak that
 *      becomes a shark tooth - moves no instance matrix at all.
 *
 *   d) IT CANNOT TELL "seed-dependent" FROM "build-order-dependent". Two builds
 *      under two seeds catch unseeded randomness. They do not catch state
 *      leaking from one build into the next, which is the exact shape of
 *      "the crest count moved with no code change".
 *
 *   So check 3 here builds every committed track FOUR times - twice under the
 *   same seed, once under a different one, and once with the track order
 *   reversed - and hashes THE WHOLE BUILT WORLD: all sixteen matrix elements,
 *   per-instance colour, every non-instanced mesh, and every distinct geometry
 *   vertex for vertex. It compares runs against each other, so unlike the
 *   golden file it CANNOT GO STALE and needs no re-blessing when a world is
 *   deliberately changed.
 *
 *   Check 1 is the static half, and it is the surviving form of the idea
 *   MIGRATION.md and ARCHITECTURE.md 5.2 both asked to keep: v2's
 *   `withoutMathRandom()`, which turned an unseeded call into a build failure.
 *   The runtime form of that guard is impossible here and `core/rng.ts` records
 *   why - `THREE.MathUtils.generateUUID()` calls `Math.random` four times for
 *   every geometry, material and texture, so a guard that throws on any call
 *   can never pass in a three.js application. The SOURCE-LEVEL form is not
 *   impossible: walk the import closure of world construction and require that
 *   nothing in it reaches for `Math.random` unless it is registered below with
 *   a reason and a ceiling. It costs no browser and catches the mistake at the
 *   line that made it rather than as a diverging hash.
 *
 * ---------------------------------------------------------------------------
 * 2. AND EVERY FIX MUST LEAVE A CHECK BEHIND THAT ACTUALLY RUNS.
 *
 * `REGRESSIONS.md` is the register: one row per fixed defect, the owner's words
 * where it was reported, and the named check that now stands watch. This
 * enforces it, in both directions:
 *
 *   - a row naming a check that does not exist   -> FAIL (somebody deleted the watch)
 *   - a named check not reachable from `gate` or `gate:full` -> FAIL
 *     (a check nobody runs is a check that has already stopped working)
 *   - a check-shaped tool in `tools/` with no row -> FAIL (a fix with no memory)
 *
 * The second one is the important one and it is the reason this is worth
 * automating at all. `verify:deploy` "was in no gate" for its entire life until
 * an audit found it by hand; that is the failure mode, and it is silent.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS DOES NOT COVER, stated plainly because a check that overclaims is
 * worse than no check:
 *
 *   - It cannot tell whether a registered check is any GOOD. A file that prints
 *     PASS unconditionally satisfies every rule in check 2. Mutation testing is
 *     the answer to that and this repo already set the standard.
 *   - Check 3 observes the EDITOR PREVIEW, which builds no colliders at all
 *     (`editor/preview.ts` passes nulls for the Rapier world, and says so). A
 *     collider that moves without its mesh moving is invisible here; that is
 *     `verify-physics`, `verify-solidity` and `verify-clearance`'s ground.
 *   - Check 3 compares runs WITHIN ONE PAGE LOAD and one machine. It proves the
 *     world does not depend on unseeded randomness, on build order or on
 *     accumulated state. It does not prove two different machines agree.
 *     `verify-worlds`'s golden file is what covers that, which is why the two
 *     checks are complements and not duplicates.
 *   - Check 1 registers the three 2D canvas painters in `templates/` as exempt.
 *     Their unseeded grain lands in an ImageData and never in a coordinate; the
 *     structural reason that is safe is that `verify-templates` already proves
 *     nothing in `templates/` may depend on `tracks/` or `world/` at runtime, so
 *     a painter cannot reach the terrain or the road. If one ever did start
 *     returning coordinates, CHECK 3 would catch it, because the seeds differ
 *     between its runs. The two halves cover each other; neither alone is enough.
 *   - Materials and colours outside per-instance colour are not hashed.
 *
 *   npx vite build                                  # check 3 serves ../play-dustline itself
 *   node tools/verify-regression-memory.mjs
 *   node tools/verify-regression-memory.mjs --static        # checks 1 and 2 only, no browser
 *   node tools/verify-regression-memory.mjs --fingerprints  # print the full vs golden hash per track
 *   node tools/verify-regression-memory.mjs --root=DIR      # check another copy of dustline
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, normalize, resolve as resolvePath } from 'node:path';

const arg = (name, dflt) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};
// --root exists so this tool can be pointed at a SCRATCH COPY of dustline and
// mutation-tested without editing the real tree. Every path below is relative
// to it.
const ROOT = resolvePath(arg('root', process.cwd()));
const STATIC_ONLY = process.argv.includes('--static');
const SHOW_FP = process.argv.includes('--fingerprints');
const at = (...p) => join(ROOT, ...p);

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

/* ===========================================================================
 * 1. THE SEEDING GUARD, AT SOURCE LEVEL
 * ======================================================================== */

/* The entry points the world is actually built through. Both the game
 * (`main.ts`) and the editor preview (`editor/preview.ts`) import exactly
 * these, which is deliberate — the preview is the real engine, so there is one
 * world builder and not two. `ai/racingLine.ts` is here because the baked line
 * is part of the world the rivals drive, and `tracks/registry.ts` because that
 * is how a committed JSON becomes a TrackDef. */
const WORLD_ROOTS = [
  'src/tracks/terrain.ts',
  'src/tracks/registry.ts',
  'src/render/scene.ts',
  'src/render/scenery.ts',
  'src/ai/racingLine.ts',
];

/* Files inside the world-construction closure that may call `Math.random`,
 * each with the reason and a CEILING on how many times.
 *
 * The ceiling is what stops this being an off switch. Calls may go DOWN freely
 * — converting a painter to a seeded stream is always welcome — and a file that
 * grows a new one fails until somebody either seeds it or writes down why it is
 * safe. An exemption list without a ratchet is just a way of switching a check
 * off, which is `verify-architecture`'s rule and it applies here too.
 *
 * The counts are the ones measured on this tree at the time of writing; they
 * are not a budget anybody chose. */
const RANDOM_OK = {
  'src/core/rng.ts': [3,
    'this file IS the seeding machinery: `withStubbedRandom` saves, replaces and '
    + 'restores the real Math.random, which is three references'],
  'src/templates/textures.ts': [191,
    'a 2D canvas painter — its randomness lands in an ImageData, never in a '
    + 'coordinate, a scale, a yaw or a collider'],
  'src/templates/surfaces.ts': [79,
    'the same: v1\'s painted road/rock/sand surfaces, ported call-for-call. Its own '
    + 'header says rewriting fifteen call sites per function into a seeded stream '
    + 'was judged not worth it for pixels nobody can reproduce a complaint about'],
  'src/templates/markings.ts': [4,
    'the same: grit flecks scattered over the painted line markings'],
};

/* Not in the closure and deliberately not policed: `src/editor/` (two calls —
 * `newDialog.ts:135` mints a new track's seed, `main.ts:112` rolls a hand-placed
 * prop's yaw) and gameplay (`render/particles.ts`, damage, AI jitter). Both are
 * correct. The editor's rolls are AUTHORING: they happen once, land in the
 * committed track JSON as data, and the world built from that JSON is fully
 * reproducible afterwards. Gameplay randomness is explicitly wanted — `core/rng.ts`
 * says so: "NOT seeded, deliberately: anything that happens while PLAYING".
 * The rule this check enforces is about WORLD CONSTRUCTION, and that is why it
 * walks the import graph instead of grepping `src/`. */

const readIf = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : null);

/** Strip block and line comments so a Math.random in a PORTING NOTE — and
 *  `render/horizon.ts`, `render/sky.ts` and `render/particles.ts` all carry one,
 *  saying what the port replaced — is not mistaken for a call.
 *
 *  BLANKED, NOT DELETED. Deleting a block comment shifts every line after it,
 *  and the first mutation test of this file duly reported the offending call at
 *  `build.ts:88` when it was on line 98. A check that names the wrong line sends
 *  you to the wrong place, which is the failure it exists to prevent. */
const stripComments = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');

const resolveSpec = (from, spec) => {
  if (!spec.startsWith('.')) return null;            // a package, not our source
  const base = normalize(join(dirname(from), spec));
  for (const c of [`${base}.ts`, join(base, 'index.ts')]) if (existsSync(at(c))) return c;
  return null;
};

const closure = new Set();
{
  const queue = WORLD_ROOTS.filter((f) => existsSync(at(f)));
  const missingRoots = WORLD_ROOTS.filter((f) => !existsSync(at(f)));
  while (queue.length) {
    const f = queue.pop();
    if (closure.has(f)) continue;
    closure.add(f);
    const s = readFileSync(at(f), 'utf8');
    for (const m of s.matchAll(/from\s+'([^']+)'/g)) { const r = resolveSpec(f, m[1]); if (r) queue.push(r); }
    for (const m of s.matchAll(/import\s*\(\s*'([^']+)'\s*\)/g)) { const r = resolveSpec(f, m[1]); if (r) queue.push(r); }
    // `world/props/registry.ts` DISCOVERS components with import.meta.glob rather
    // than listing them, which is the right design and is invisible to a naive
    // import walk — it would drop all 109 component files, which is exactly where
    // a stray scatter roll would live. Expand the glob.
    for (const m of s.matchAll(/import\.meta\.glob<[^>]*>\s*\(\s*'([^']+)'|import\.meta\.glob\s*\(\s*'([^']+)'/g)) {
      const pattern = m[1] ?? m[2];
      const dir = normalize(join(dirname(f), dirname(pattern)));
      const ext = pattern.slice(pattern.lastIndexOf('.'));
      if (!existsSync(at(dir))) continue;
      for (const e of readdirSync(at(dir))) if (e.endsWith(ext)) queue.push(join(dir, e));
    }
  }
  check(missingRoots.length === 0,
    `every world-construction entry point exists (${WORLD_ROOTS.length} of them)`,
    missingRoots.length ? `${missingRoots.join(', ')} — did a file move? this check is now looking at less than it thinks` : '');
}

{
  const offenders = [];
  const drifted = [];
  const stale = new Set(Object.keys(RANDOM_OK));
  for (const f of [...closure].sort()) {
    const src = stripComments(readFileSync(at(f), 'utf8'));
    const n = (src.match(/Math\s*\.\s*random/g) ?? []).length;
    if (!n) continue;
    const rule = RANDOM_OK[f];
    if (!rule) {
      // report the first line so the failure names the culprit, v1-style
      const line = src.split('\n').findIndex((l) => /Math\s*\.\s*random/.test(l)) + 1;
      offenders.push(`${f}:${line} (${n} call${n === 1 ? '' : 's'})`);
      continue;
    }
    stale.delete(f);
    if (n > rule[0]) drifted.push(`${f} has ${n} raw calls, registered for at most ${rule[0]}`);
  }
  check(offenders.length === 0,
    `no unregistered Math.random in the ${closure.size} modules world construction reaches`,
    offenders.length
      ? `${offenders.join(' | ')} — a world that cannot be rebuilt cannot be debugged. `
        + 'Draw from `Rng.fork(def.seed, name)` in core/rng.ts, or register the file in RANDOM_OK with the reason it is safe'
      : `${Object.keys(RANDOM_OK).length} files registered`);
  check(drifted.length === 0,
    'no registered file has grown a new raw Math.random since it was registered',
    drifted.join(' | '));
  // A ceiling nobody can reach is a ceiling that has stopped meaning anything.
  check(stale.size === 0,
    'every registered exemption is still needed',
    stale.size ? `${[...stale].join(', ')} no longer calls Math.random (or left the closure) — drop the entry` : '');
}

/* ===========================================================================
 * 2. THE REGISTER — EVERY FIX LEAVES A CHECK, AND THE CHECK RUNS
 * ======================================================================== */

const REGISTER = 'REGRESSIONS.md';
const registerText = readIf(at(REGISTER));
check(registerText !== null, `${REGISTER} exists`,
  registerText === null ? 'the register IS the convention — without it nothing records which check guards which defect' : '');

/* A tool is a CHECK if it is named like one. `make-*.mjs` are generators,
 * `png.mjs`/`serve.mjs`/`shot-component.mjs` are libraries; none of them can
 * fail a build, so none of them is a fix's memory. */
const isCheckTool = (f) => f.endsWith('.mjs') && (f.startsWith('verify-') || f.endsWith('-smoke.mjs'));
const toolFiles = existsSync(at('tools')) ? readdirSync(at('tools')).filter(isCheckTool).sort() : [];

/* Which npm scripts are reachable from `gate` or `gate:full`, following
 * `npm run X` transitively — `gate:full` runs `gate`, so the tools in `gate`
 * are reachable through it and must not be reported as unwired. */
const pkg = JSON.parse(readFileSync(at('package.json'), 'utf8'));
const scripts = pkg.scripts ?? {};
const reachableScripts = new Set();
{
  const queue = ['gate', 'gate:full'].filter((s) => scripts[s]);
  while (queue.length) {
    const s = queue.pop();
    if (reachableScripts.has(s)) continue;
    reachableScripts.add(s);
    for (const m of (scripts[s] ?? '').matchAll(/npm\s+run\s+([\w:-]+)/g)) queue.push(m[1]);
  }
}
const toolsInScript = (body) => [...body.matchAll(/tools\/([\w.-]+\.mjs)/g)].map((m) => m[1]);
const gatedTools = new Set();
const scriptedTools = new Map();      // tool file -> the script names that run it
for (const [name, body] of Object.entries(scripts)) {
  for (const t of toolsInScript(body)) {
    (scriptedTools.get(t) ?? scriptedTools.set(t, []).get(t)).push(name);
    if (reachableScripts.has(name)) gatedTools.add(t);
  }
}

const rows = [];
if (registerText) {
  for (const raw of registerText.split('\n')) {
    const line = raw.trim();
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 4) continue;
    if (!/^\d+$/.test(cells[0])) continue;                    // header and the |---| rule
    rows.push({
      n: Number(cells[0]),
      defect: cells[1],
      reported: cells[2],
      checks: [...cells[3].matchAll(/`tools\/([\w.-]+\.mjs)`/g)].map((m) => m[1]),
    });
  }
}
check(rows.length > 0, `${REGISTER} has rows`, rows.length ? `${rows.length} defects registered` : 'nothing is registered');

{
  const numbering = rows.map((r, i) => (r.n === i + 1 ? null : `row ${i + 1} is numbered ${r.n}`)).filter(Boolean);
  check(numbering.length === 0, 'the register is numbered without gaps or duplicates', numbering.join(', '));

  const thin = rows.filter((r) => r.defect.length < 40 || !r.reported).map((r) => `#${r.n}`);
  check(thin.length === 0,
    'every row says what the defect WAS, and what it was reported as (— if nobody reported it)',
    thin.length ? `${thin.join(', ')} — a row that does not describe the defect cannot tell you whether the check still matches it` : '');

  const noCheck = rows.filter((r) => r.checks.length === 0).map((r) => `#${r.n}`);
  check(noCheck.length === 0,
    'every registered defect names at least one check',
    noCheck.length ? `${noCheck.join(', ')} — name it as \`tools/verify-x.mjs\`` : '');

  const named = new Set(rows.flatMap((r) => r.checks));
  const missing = [...named].filter((t) => !existsSync(at('tools', t)));
  check(missing.length === 0,
    `every check the register names still exists (${named.size} named)`,
    missing.length
      ? `${missing.join(', ')} — the register says a defect is guarded and the guard is gone. `
        + 'That is the exact failure this file is named after'
      : '');

  const unwired = [...named].filter((t) => existsSync(at('tools', t)) && !gatedTools.has(t));
  check(unwired.length === 0,
    'every check the register names runs in `gate` or `gate:full`',
    unwired.length
      ? `${unwired.join(', ')} — a check nobody runs has already stopped working. `
        + '`verify:deploy` sat in no gate for its whole life until an audit found it by hand'
      : `all ${named.size} reachable from ${[...reachableScripts].sort().join(' / ')}`);

  const unregistered = toolFiles.filter((t) => !named.has(t));
  check(unregistered.length === 0,
    `every check in tools/ is claimed by a row (${toolFiles.length} checks)`,
    unregistered.length
      ? `${unregistered.join(', ')} — a gate exists with no record of which defect it guards, `
        + 'which is how v1 ended up with 56 test files and no idea which ones still mattered'
      : '');

  // Not a check — a hand-off. If something is unwired, print the exact lines,
  // because "wire it up" without the line is how it stays unwired.
  if (unwired.length) {
    console.log('\n      package.json needs, in "scripts":');
    for (const t of unwired.sort()) {
      const base = t.replace(/\.mjs$/, '');
      const name = base.endsWith('-smoke')
        ? `smoke:${base.replace(/-smoke$/, '')}`
        : `verify:${base.replace(/^verify-/, '')}`;
      const existing = scriptedTools.get(t);
      console.log(existing
        ? `        "${existing[0]}" exists but is not reachable from gate/gate:full — add it to one`
        : `        "${name}": "node tools/${t}",`);
    }
    console.log('      and each of those script names appended to "gate" or "gate:full".');
  }
}

/* ===========================================================================
 * 3. THE WHOLE BUILT WORLD, FOUR TIMES OVER
 * ======================================================================== */

if (STATIC_ONLY) {
  console.log(`\n(--static: check 3 skipped — the built-world determinism run needs a build and a browser)`);
  console.log(fails ? `\n${fails} FAILED` : '\nchecks 1 and 2 hold; check 3 was not run');
  process.exit(fails ? 1 : 0);
}

const { chromium } = await import('playwright-core');
const { ensureServer } = await import('./serve.mjs');

// A port of its own. Five sibling tools serve builds on 8903-8911 and two of
// them running at once on the same port serve each other's bundle.
const BASE = process.env.BASE || 'http://localhost:8913/';
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const stopServer = await ensureServer(BASE, '../play-dustline');

const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message.split('\n')[0]));
await page.goto(`${BASE}editor.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__editor?.preview?.terrain, null, { timeout: 90000 });

const runs = await page.evaluate(async () => {
  const e = window.__editor;

  // FNV-1a over a stream of integers, the same choice and the same reason as
  // verify-worlds: all uint32 arithmetic, so the hash cannot drift with a
  // different floating-point library or rounding mode.
  const mk = () => {
    let h = 0x811c9dc5;
    const n = (v) => { h ^= v | 0; h = Math.imul(h, 0x01000193); };
    return { n, s(str) { for (let i = 0; i < str.length; i++) n(str.charCodeAt(i)); },
      get() { return (h >>> 0).toString(16).padStart(8, '0'); } };
  };

  /* THE WHOLE WORLD, not the part that happens to be instanced.
   *
   * Rounding: 1e-3 on everything. Positions run to a few thousand units so the
   * products stay well inside int32, and within one page load the arithmetic is
   * bit-identical anyway — the rounding is there so the hash is about the world
   * and not about the last bit of a double. */
  const R = (v) => Math.round(v * 1000);

  const fingerprint = () => {
    const h = mk();
    const geoms = new Map();          // shared part-cache geometry, hashed once
    let instMeshes = 0, plainMeshes = 0, instances = 0, objects = 0, verts = 0;

    const hashGeometry = (g) => {
      if (!g) { h.s('nogeom'); return; }
      const seen = geoms.get(g);
      if (seen !== undefined) { h.s('geomref'); h.n(seen); return; }
      const id = geoms.size; geoms.set(g, id);
      h.s('geom'); h.n(id);
      const p = g.getAttribute && g.getAttribute('position');
      const c = g.getAttribute && g.getAttribute('color');
      const idx = g.getIndex && g.getIndex();
      h.n(p ? p.count : 0); h.n(idx ? idx.count : 0);
      if (p) { for (let i = 0; i < p.array.length; i++) h.n(R(p.array[i])); verts += p.count; }
      if (c) { for (let i = 0; i < c.array.length; i++) h.n(R(c.array[i])); }
      if (idx) { for (let i = 0; i < idx.array.length; i++) h.n(idx.array[i]); }
    };

    const flat = [];
    for (const root of e.preview.objects) root.traverse((o) => flat.push(o));
    for (const o of flat) {
      objects++;
      h.s(o.name || ''); h.s(o.type); h.n(o.visible ? 1 : 0);
      h.n(R(o.position.x)); h.n(R(o.position.y)); h.n(R(o.position.z));
      h.n(R(o.quaternion.x)); h.n(R(o.quaternion.y)); h.n(R(o.quaternion.z)); h.n(R(o.quaternion.w));
      h.n(R(o.scale.x)); h.n(R(o.scale.y)); h.n(R(o.scale.z));
      if (o.isInstancedMesh) {
        instMeshes++; instances += o.count;
        h.n(o.count);
        hashGeometry(o.geometry);
        const a = o.instanceMatrix.array;
        // ALL SIXTEEN ELEMENTS. 0/2/8/10 carry the yaw and the X/Z scale, which
        // is where the shark-fin proportion and every rotated box collider live.
        for (let i = 0; i < o.count * 16; i++) h.n(R(a[i]));
        const col = o.instanceColor;
        if (col) for (let i = 0; i < o.count * 3; i++) h.n(R(col.array[i]));
      } else if (o.isMesh || o.isLine || o.isPoints) {
        plainMeshes++;
        hashGeometry(o.geometry);
      }
    }
    return { fp: h.get(), objects, instMeshes, plainMeshes, instances, verts, geoms: geoms.size };
  };

  /* verify-worlds' fingerprint, reproduced EXACTLY as it stands, so this tool
   * can prove what it adds instead of claiming it. Diagnostic only — it is
   * printed under --fingerprints and never asserted on, because a copy of
   * another tool's formula would rot the moment that tool improved. */
  const legacyFingerprint = (track) => {
    const t = e.preview.terrain;
    const h = mk();
    const S = track.world.size;
    const SURF = ['tarmac', 'gravel', 'mud', 'snow', 'ice', 'sand'];
    for (let gz = 0; gz <= 40; gz++) {
      for (let gx = 0; gx <= 40; gx++) {
        const x = (gx / 40 - 0.5) * S, z = (gz / 40 - 0.5) * S;
        h.n(Math.round(t.heightAt(x, z) * 1000));
        h.n(SURF.indexOf(t.surfaceIdAt(x, z)));
      }
    }
    for (let i = 0; i < t.roadPoints.length; i += 3) {
      const p = t.roadPoints[i];
      h.n(Math.round(p.x * 100)); h.n(Math.round(p.z * 100));
      h.n(Math.round(t.heightAt(p.x, p.z) * 1000));
    }
    let covered = 0;
    for (const o of e.preview.objects) {
      if (!o.isInstancedMesh) continue;
      h.n(o.count); covered++;
      const a = o.instanceMatrix.array;
      for (let i = 0; i < o.count; i++) {
        const off = i * 16;
        h.n(Math.round(a[off + 12] * 100));
        h.n(Math.round(a[off + 13] * 100));
        h.n(Math.round(a[off + 14] * 100));
        h.n(Math.round(a[off + 5] * 1000));
      }
    }
    return { fp: h.get(), covered };
  };

  // The two stubbed seeds are verify-worlds' own, so a divergence here and a
  // divergence there are the same experiment.
  const SEED_A = 0x1234, SEED_B = 0x9abcdef;
  const tracks = e.builtInTracks();
  const out = {};
  const build = (t, seed) => { e.withStubbedRandom(seed, () => { e.preview.rebuild(t); }); };

  for (const t of tracks) { build(t, SEED_A); out[t.id] = { a: fingerprint(), legacy: legacyFingerprint(t) }; }
  for (const t of tracks) { build(t, SEED_A); out[t.id].a2 = fingerprint().fp; }
  for (const t of tracks) { build(t, SEED_B); out[t.id].b = fingerprint().fp; }
  for (const t of [...tracks].reverse()) { build(t, SEED_A); out[t.id].rev = fingerprint().fp; }
  return out;
});

await browser.close();
await stopServer();

for (const [id, r] of Object.entries(runs)) {
  // Rebuilding the same track under the same seed must give the same world.
  // Note the second pass runs each track after a DIFFERENT predecessor than the
  // first did, so this is also the strongest statement here: no state survives a
  // rebuild. `resetPartCache()` handing out a stale buffer would land here.
  check(r.a.fp === r.a2, `${id}: rebuilding under the same seed gives the same world`,
    r.a.fp === r.a2
      ? `${r.a.fp} — ${r.a.objects} objects, ${r.a.instances} instances, ${r.a.geoms} geometries, ${r.a.verts} vertices`
      : `${r.a.fp} then ${r.a2}. Something in world construction is carrying state across builds, `
        + 'or reading the clock. This is MIGRATION.md\'s crest count moving 6 -> 0 with no code change');

  check(r.a.fp === r.b, `${id}: the world does not depend on unseeded randomness`,
    r.a.fp === r.b
      ? 'identical under two different Math.random stubs, yaw and non-uniform scale included'
      : `${r.a.fp} under one Math.random stub and ${r.b} under another. `
        + 'Draw from `Rng.fork(def.seed, name)`; verify-worlds may pass anyway if what moved was a yaw, '
        + 'an X/Z scale, a geometry or a non-instanced mesh');

  check(r.a.fp === r.rev, `${id}: the world does not depend on which track was built before it`,
    r.a.fp === r.rev
      ? 'same fingerprint built first and built last'
      : `${r.a.fp} in forward order and ${r.rev} in reverse. A world that depends on its neighbours `
        + 'cannot be reproduced from its own track file, which is the whole point of the format');
}

check(pageErrors.length === 0, 'no page errors while building every world four times',
  pageErrors.slice(0, 3).join(' | '));

if (SHOW_FP) {
  console.log('\n      what each fingerprint sees (the golden one is verify-worlds\', reproduced):');
  console.log('      track            full        golden      objects  inst.meshes  plain  geoms');
  for (const [id, r] of Object.entries(runs)) {
    console.log(`      ${id.padEnd(16)} ${r.a.fp}    ${r.legacy.fp}    `
      + `${String(r.a.objects).padStart(5)}  ${String(r.legacy.covered).padStart(9)}`
      + `  ${String(r.a.plainMeshes).padStart(5)}  ${String(r.a.geoms).padStart(5)}`);
  }
  console.log('      "inst.meshes" is what the golden fingerprint looks at; "plain" and "geoms" are what it does not.');
}

console.log(fails
  ? `\n${fails} FAILED`
  : '\nevery world rebuilds identically, and every fix on the register still has a check standing over it');
process.exit(fails ? 1 : 0);
