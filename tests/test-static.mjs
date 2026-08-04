// Static integrity gate — no browser, runs in milliseconds, blocks a release.
//
// Why this exists: r47 shipped to production with an unresolved merge conflict
// left in index.html. The browser happily ignored the "<<<<<<< HEAD" text and
// loaded BOTH sides' <script> tags, so main.js ran twice at two different ?v=
// URLs and built two entire games on top of each other. Visible symptom: the
// menu had six mode chips instead of three. Cheap check, expensive miss.
import { readFileSync, readdirSync, statSync } from 'node:fs';
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

console.log(fails ? `\n${fails} FAILED` : '\nall static checks passed');
process.exit(fails ? 1 : 0);
