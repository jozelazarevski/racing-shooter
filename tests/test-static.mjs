// Static integrity gate — no browser, runs in milliseconds, blocks a release.
//
// Why this exists: r47 shipped to production with an unresolved merge conflict
// left in index.html. The browser happily ignored the "<<<<<<< HEAD" text and
// loaded BOTH sides' <script> tags, so main.js ran twice at two different ?v=
// URLs and built two entire games on top of each other. Visible symptom: the
// menu had six mode chips instead of three. Cheap check, expensive miss.
import { readFileSync, readdirSync, statSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', '.git', 'lib', 'assets']);
const TEXT = new Set(['.html', '.js', '.mjs', '.css', '.json', '.md', '.webmanifest']);

let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

// 1. no conflict markers anywhere in the tracked source
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (TEXT.has(extname(name))) out.push(p);
  }
  return out;
};
const conflicted = [];
for (const f of walk(ROOT)) {
  const src = readFileSync(f, 'utf8');
  if (/^(<<<<<<< |>>>>>>> |=======$)/m.test(src)) conflicted.push(f.slice(ROOT.length + 1));
}
check(conflicted.length === 0, 'no merge-conflict markers in source', conflicted.join(', '));

// 2. every module is referenced by exactly one <script src>, and every ?v=
//    cache-buster agrees — two versions of one module means two copies loaded
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const srcs = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
const byFile = new Map();
for (const s of srcs) {
  const [file, q = ''] = s.split('?');
  (byFile.get(file) ?? byFile.set(file, []).get(file)).push(q);
}
const dupes = [...byFile].filter(([, q]) => q.length > 1);
check(dupes.length === 0, 'each module loaded exactly once',
  dupes.map(([f, q]) => `${f} x${q.length}`).join(', '));

const versions = new Set(srcs.map((s) => (s.split('?')[1] || '').replace(/^v=/, '')).filter(Boolean));
check(versions.size <= 1, 'one cache-buster version across all scripts', [...versions].join(' vs '));

// 3. the on-screen build stamp and the service worker cache name must move
//    with that version, or phones keep serving the previous build
const ver = [...versions][0] ?? '';
const stamp = html.match(/id="build-tag"[^>]*>([^<]*)</)?.[1]?.trim();
check(!!ver && stamp === ver, 'build stamp matches script version', `stamp=${stamp} scripts=${ver}`);

const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
check(!!ver && sw.includes(ver), 'sw.js CACHE name carries the version', `looking for ${ver}`);

// 4. every module PARSES AS A MODULE.
//
// `node --check src/track.js` is not this check. With no package.json in the
// repo, node parses a bare `.js` file in the SCRIPT goal, which is sloppy mode
// — and in sloppy mode an object literal that is missing its closing brace
// degenerates into a chain of labelled statements and blocks, which is valid.
// Merging the four new worlds left exactly that: two element kits unclosed.
// `node --check` passed on all five touched files; the browser, which always
// parses a module in strict mode, threw "Unexpected token ';'" with no stack
// and no file name, and the whole game failed to boot.
//
// Copying to a `.mjs` extension forces the MODULE goal, which is what the
// browser does, and reports the file and line. Cheap, and it is the difference
// between catching this here in 200 ms and catching it after a deploy.
const tmp = join(ROOT, '.parsecheck.mjs');
const badParse = [];
for (const f of walk(ROOT)) {
  if (!['.js', '.mjs'].includes(extname(f))) continue;
  if (f.includes('/sw.js')) continue;           // classic worker script, not a module
  writeFileSync(tmp, readFileSync(f, 'utf8'));
  const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
  if (r.status !== 0) {
    const line = (r.stderr.match(/\.parsecheck\.mjs:(\d+)/) ?? [])[1] ?? '?';
    const msg = (r.stderr.match(/^(SyntaxError:.*)$/m) ?? [])[1] ?? 'parse failed';
    badParse.push(`${f.slice(ROOT.length + 1)}:${line} ${msg}`);
  }
}
try { unlinkSync(tmp); } catch { /* already gone */ }
check(badParse.length === 0, 'every module parses in the module goal (strict mode)',
  badParse.join('; '));

console.log(fails ? `\n${fails} FAILED` : '\nall static checks passed');
process.exit(fails ? 1 : 0);
