/* IS DUSTLINE STILL A SEPARATE PROJECT?
 *
 * There are two games in this repository. IGNITE RALLY is at the root —
 * vanilla JS, hand-rolled physics, its own vendored `lib/three.module.min.js`
 * and `lib/postprocessing/`. dustline is this folder — TypeScript, Vite,
 * Rapier, three from npm. dustline takes a great deal FROM the older game: the
 * house templates, the boat loft, the painted textures, the sky, the flora, the
 * lighting numbers. All of it was COPIED ACROSS and converted, and every ported
 * file says so in its header. None of it is imported.
 *
 * That distinction is the whole migration. A copy can be read, typed, reseeded
 * and fixed here without touching a game that still ships; an import makes the
 * two builds one build, and then a change to v1's `src/track.js` — 910 KB of
 * code nobody in this folder is reviewing — can break this one, and dustline
 * can no longer be built, tested or moved on its own. It only takes one
 * `import { X } from '../../src/textures.js'` at 2 a.m. to buy that, and the
 * app would still run, so nothing would tell you.
 *
 * So the separation is checked rather than described:
 *
 *   1. NO MODULE SPECIFIER LEAVES `dustline/`. Every import, dynamic import,
 *      require and `<script src>` must resolve inside this folder or name a
 *      package in `node_modules`.
 *   2. NO FILE PATH IN CODE LEAVES `dustline/` either. `readFileSync` reaches
 *      just as far as `import` does, and the tools in this folder run against
 *      real paths. Two escapes are allowed and named below; both point at
 *      dustline's own output or at a doc, neither is v1 code.
 *   3. NO v1 ARTEFACT IS NAMED IN CODE. Naming `src/textures.js` in a
 *      provenance comment is REQUIRED by the porting convention — that is how a
 *      port records where it came from. Naming it outside a comment is the leak.
 *      So this check reads the source with comments blanked out and looks for
 *      v1's module names, its `lib/` folder and its vendored three.
 *   4. THREE COMES FROM THE PACKAGE. v1 ships its own minified copy and its own
 *      copy of the postprocessing passes. Loading those here would put two
 *      copies of three in one page — two `WebGLRenderer`s, two material
 *      registries, silent breakage — and would pin dustline to whatever version
 *      the other game happens to vendor.
 *   5. NO SYMLINK POINTS OUT. Every check above reads text. A symlink is not
 *      text: `src/v1 -> ../../src` would make `./v1/textures.js` look local.
 *   6. THE PORT LEDGER IS NOT STALE. `PORT.md` is the record of what came
 *      across, and a ledger naming files that no longer exist is worse than no
 *      ledger: it reads as checked. Both ends of every row are verified — the
 *      v1 source at the repository root, and the dustline destination here.
 *
 *   node tools/verify-separation.mjs
 */
import { readdirSync, readFileSync, existsSync, lstatSync, readlinkSync } from 'node:fs';
import { join, resolve, relative, dirname } from 'node:path';

const ROOT = resolve('.');
const REPO = resolve('..');
let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

// THE TWO ESCAPES THAT ARE ALLOWED, and why each one is not a dependency on v1:
//
//   ../play-dustline   dustline's OWN build output. `vite.config.ts` writes the
//                      bundle there so GitHub Pages serves it next to the other
//                      game, and the headless tools load it back to drive a
//                      real build. Writing out is not reaching in.
//   ../ARCHITECTURE.md the repository-wide document. `verify-templates.mjs` and
//                      `verify-coverage.mjs` cross-check the component count
//                      against the prose there so it cannot drift. It is a
//                      document, not code, and nothing is imported from it.
//
// Anything else that escapes is a new decision and should fail here until
// somebody adds it to this list on purpose.
const ALLOWED_ESCAPES = ['../play-dustline', '../ARCHITECTURE.md'];
const allowed = (abs) => ALLOWED_ESCAPES.some((a) => {
  const p = resolve(ROOT, a);
  return abs === p || abs.startsWith(`${p}/`);
});
const escapes = (spec, base) => {
  const abs = spec.startsWith('/') ? join(ROOT, spec) : resolve(base, spec);
  return relative(ROOT, abs).startsWith('..') && !allowed(abs);
};

// This file has to contain the strings it looks for — the patterns in check 3
// are v1's own filenames, and check 2's filter is the literal `'../'`. So the
// two content scans skip it by name. Excluding it by name is honest; excluding
// it by some rule that happens to spare it would not be. It is still subject to
// checks 1 and 5, which are about what it actually imports and is.
const SELF = 'tools/verify-separation.mjs';

// ---- the tree ---------------------------------------------------------------
const SKIP = new Set(['node_modules', '.git', 'dist']);
const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isSymbolicLink()) out.push(p);
    else if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};
const all = walk('.').map((p) => relative(ROOT, resolve(p)));
const code = all.filter((f) => /\.(ts|tsx|js|mjs|cjs|html)$/.test(f));
const lineOf = (src, index) => src.slice(0, index).split('\n').length;

/* Comments and strings are different places for the same characters, and every
 * check below depends on telling them apart: a v1 path in a comment is the
 * porting convention working, and the same path in a string is the leak. So the
 * source is walked once and comment bodies are replaced with spaces. Offsets
 * are preserved, so a hit still reports its real line.
 *
 * String bodies are left alone deliberately: a specifier IS a string, and check
 * 2 is entirely about what is inside them.
 *
 * REGEX LITERALS ARE TRACKED, and they have to be. This file contains
 * `/\bfrom\s*['"]([^'"]+)['"]/` — a regex holding two unbalanced quotes. A
 * scanner that does not know it is a regex enters string mode on the first one
 * and is wrong about every character after it, which is how the first cut of
 * this tool reported comment text as a code path. Whether `/` opens a regex or
 * divides depends on the token before it, so that token is carried along.
 *
 * What is still not modelled: `${}` interpolation inside a template literal, so
 * a backtick nested in a substitution would close the outer string early. There
 * is none in this tree, and check 3 is the one that matters most for a false
 * PASS — it also matches against v1's names directly, which no desync hides. */
function blankComments(src, html) {
  const out = src.split('');
  const blank = (a, b) => { for (let k = a; k < b; k++) if (out[k] !== '\n') out[k] = ' '; };
  if (html) {
    for (const m of src.matchAll(/<!--[\s\S]*?-->/g)) blank(m.index, m.index + m[0].length);
    return out.join('');
  }
  // After these, a `/` opens a regex; after a value — an identifier, `)`, `]`,
  // a digit — it is division.
  const PUNCT = '(,=:[!&|?{};+-*%~^<>';
  const KEYWORD = /^(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;
  let i = 0, mode = 'code', quote = '', sig = '', word = '';
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (mode === 'code') {
      if (c === '/' && d === '/') { mode = 'line'; blank(i, i + 2); i += 2; continue; }
      if (c === '/' && d === '*') { mode = 'block'; blank(i, i + 2); i += 2; continue; }
      if (c === '/' && (sig === '' || PUNCT.includes(sig) || KEYWORD.test(word))) {
        mode = 'regex'; sig = '/'; word = ''; i++; continue;
      }
      if (c === '"' || c === "'" || c === '`') { mode = 'str'; quote = c; i++; continue; }
      if (!/\s/.test(c)) {
        if (/[\w$]/.test(c)) { word += c; sig = c; } else { sig = c; word = ''; }
      }
      i++; continue;
    }
    if (mode === 'line') { if (c === '\n') mode = 'code'; else blank(i, i + 1); i++; continue; }
    if (mode === 'block') {
      if (c === '*' && d === '/') { blank(i, i + 2); mode = 'code'; i += 2; continue; }
      blank(i, i + 1); i++; continue;
    }
    if (mode === 'regex') {
      if (c === '\\') { i += 2; continue; }
      if (c === '[') { while (i < src.length && src[i] !== ']') { if (src[i] === '\\') i++; i++; } i++; continue; }
      if (c === '/' || c === '\n') mode = 'code';
      i++; continue;
    }
    if (c === '\\') { i += 2; continue; }
    if (c === quote) mode = 'code';
    i++;
  }
  return out.join('');
}

const source = Object.fromEntries(code.map((f) => {
  const raw = readFileSync(f, 'utf8');
  return [f, { raw, clean: blankComments(raw, f.endsWith('.html')) }];
}));

// ---- 1. no module specifier leaves the folder --------------------------------
const SPECIFIERS = [
  /\bfrom\s*['"]([^'"]+)['"]/g,          // import x from '...' / export * from '...'
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g, // await import('...')
  /\bimport\s*['"]([^'"]+)['"]/g,        // import '...' for side effects
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /<script[^>]*\bsrc\s*=\s*['"]([^'"]+)['"]/gi,
  /<link[^>]*\bhref\s*=\s*['"]([^'"]+)['"]/gi,
];
const imported = [];
for (const [f, { clean }] of Object.entries(source)) {
  for (const re of SPECIFIERS) {
    for (const m of clean.matchAll(re)) {
      const spec = m[1];
      if (!spec.startsWith('.') && !spec.startsWith('/')) continue; // a package
      if (spec.startsWith('data:')) continue;
      // A specifier resolves against the importing file. Always.
      if (escapes(spec, dirname(f))) imported.push(`${f}:${lineOf(clean, m.index)} -> ${spec}`);
    }
  }
}
check(imported.length === 0,
  `no module specifier resolves outside dustline/ (${code.length} files)`,
  imported.join(' | '));

// ---- 2. and neither does a path a tool opens ---------------------------------
//
// Every string literal that looks like a path is resolved and checked. A
// verifier reading v1's source to diff a port against would be caught here, and
// that is intended: the comparison belongs in a commit message, not in a build.
//
// TWO BASES, because a string does not say what it is. `'../foo'` in an import
// resolves against the file; the same characters passed to `readFileSync`
// resolve against the WORKING DIRECTORY, which for everything in `tools/` is
// `dustline/` — that is where `npm run` starts them, and it is why
// `verify-templates.mjs` can open `src/templates` with no prefix. A file that
// runs in node is therefore checked both ways, since the text alone cannot say
// which reading applies. Files under `src/` only ever mean the first: they are
// modules in a browser bundle and open nothing.
const opened = [];
for (const [f, { clean }] of Object.entries(source)) {
  if (f.endsWith('.html') || f === SELF) continue;
  const runsInNode = f.startsWith('tools/') || /^[^/]*\.(config|mjs|cjs)\b/.test(f);
  const bases = runsInNode ? [dirname(f), ROOT] : [dirname(f)];
  for (const m of clean.matchAll(/(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
    const s = m[2];
    if (!s.includes('../') && !s.includes('racing-shooter/')) continue;
    if (s.includes('${')) continue; // an interpolated path resolves at runtime
    // An absolute path is already resolved; it needs no base and must not be
    // given one, or `/home/.../racing-shooter/src` reads as a server-root path.
    const out = s.startsWith('/')
      ? relative(ROOT, s).startsWith('..') && !allowed(resolve(s))
      : bases.some((b) => escapes(s, b));
    if (out) opened.push(`${f}:${lineOf(clean, m.index)} -> ${s}`);
  }
}
check(opened.length === 0,
  'no path opened by dustline code points outside dustline/',
  opened.join(' | '));

// ---- 3. v1 is named in prose, never in code ----------------------------------
//
// v1's modules, from `ls src/ src/world/` at the repository root. A port names
// these in its header on purpose; the check is that the name never survives
// into anything that runs.
const V1_MODULES = ['main', 'track', 'textures', 'vehicles', 'particles', 'weapons', 'hostiles',
  'choppers', 'traffic', 'hud', 'input', 'editor', 'audio', 'offline', 'sync',
  'flora', 'themes', 'catalog', 'circuits', 'levels', 'constants'];
const V1_PATTERNS = [
  new RegExp(`(?:\\.{1,2}/|/)?(?:src/)?(?:world/)?(?:${V1_MODULES.join('|')})\\.js\\b`),
  /\blib\/postprocessing\b/,
  /\bthree\.module(?:\.min)?\.js\b/,
];
const named = [];
for (const [f, { clean }] of Object.entries(source)) {
  if (f === SELF) continue;
  clean.split('\n').forEach((line, i) => {
    for (const re of V1_PATTERNS) {
      const m = line.match(re);
      if (m) named.push(`${f}:${i + 1} ${m[0]}`);
    }
  });
}
check(named.length === 0,
  'no v1 module, no v1 lib/ and no vendored three is named outside a comment',
  named.join(' | '));

// ---- 4. three is a dependency, not a file next door --------------------------
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const local = Object.entries(deps).filter(([, v]) => /^(file:|link:|\.\.?\/)/.test(v));
check(!!deps.three && local.length === 0,
  `three is an npm dependency (${deps.three ?? 'MISSING'}) and no dependency is resolved from outside`,
  local.map(([k, v]) => `${k}: ${v}`).join(', '));

// Postprocessing has a vendored copy at the repository root and a packaged copy
// in `three/examples/jsm/`. Only the second one may be used here.
const threeImports = [];
for (const [f, { clean }] of Object.entries(source)) {
  for (const m of clean.matchAll(/\bfrom\s*['"](three[^'"]*)['"]/g)) {
    if (!/^three(\/|$)/.test(m[1])) threeImports.push(`${f} -> ${m[1]}`);
  }
}
check(threeImports.length === 0,
  'every three import names the package', threeImports.join(' | '));

// ---- 5. and nothing tunnels under all of that -------------------------------
const links = [];
for (const f of all) {
  if (!lstatSync(f).isSymbolicLink()) continue;
  const target = resolve(dirname(f), readlinkSync(f));
  if (relative(ROOT, target).startsWith('..')) links.push(`${f} -> ${readlinkSync(f)}`);
}
check(links.length === 0, 'no symlink under dustline/ points outside it', links.join(' | '));

// ---- 6. the ledger still describes this tree --------------------------------
//
// PORT.md writes a dustline destination as `dustline/src/...` and a v1 source as
// the root-relative `src/...` it really is, so the two are told apart by shape
// rather than by column. Both are checked: a destination that has been renamed
// and a v1 source that has been deleted are the same rot.
if (!existsSync('PORT.md')) {
  check(false, 'PORT.md exists', 'the port ledger is missing');
} else {
  const ledger = readFileSync('PORT.md', 'utf8');
  const cited = [...ledger.matchAll(/`([^`\s]+\.(?:ts|js|json|html|md))`/g)].map((m) => m[1]);
  const missing = [];
  for (const p of new Set(cited)) {
    if (p.startsWith('dustline/')) {
      if (!existsSync(relative('dustline', p))) missing.push(`dustline: ${p}`);
    } else if (/^(src|lib|tests|spec)\//.test(p) || p === 'index.html') {
      if (!existsSync(join(REPO, p))) missing.push(`v1: ${p}`);
    }
  }
  check(missing.length === 0,
    `every file PORT.md cites exists (${new Set(cited).size} paths)`, missing.join(' | '));
}

console.log(fails ? `\n${fails} FAILED` : '\ndustline reaches into nothing but its own folder');
process.exit(fails ? 1 : 0);
