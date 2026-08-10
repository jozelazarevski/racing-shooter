/* IS `src/templates/` STILL A SHAPE LIBRARY?
 *
 * The folder exists to be reusable by anything in the app, and that property is
 * not a matter of intent — it is a matter of what it imports. The moment a
 * template reaches into the component registry, or the editor, or a track, it
 * stops being reusable and becomes a second copy of the tangle it was pulled
 * out of. That happens one convenient import at a time and nobody notices.
 *
 * So the boundary is checked rather than described:
 *
 *   1. NO RUNTIME DEPENDENCY OUT OF `templates/` except `three` and `core/`.
 *      Type-only imports are allowed and are how `buildings.ts` and `boats.ts`
 *      say their shapes fit the component contract — `import type` is erased at
 *      build time, so it cannot make a cycle at runtime.
 *   2. NO SIDE EFFECTS ON IMPORT. A shape library that does something when you
 *      load it cannot be loaded by a tool, a test or a future headless build.
 *   3. THE BARREL EXPORTS EVERYTHING. `export *` drops a name silently when two
 *      modules export it, so `index.ts` re-exporting five files is exactly the
 *      shape of problem that fails quietly at the import site rather than here.
 *
 *   node tools/verify-templates.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'src/templates';
let fails = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
};

const files = readdirSync(DIR).filter((f) => f.endsWith('.ts'));
const src = Object.fromEntries(files.map((f) => [f, readFileSync(join(DIR, f), 'utf8')]));

// ---- 1. what may a template depend on? --------------------------------------
const ALLOWED = [/^three$/, /^\.\//, /^\.\.\/core\//];
const leaks = [];
for (const [f, s] of Object.entries(src)) {
  // `import type { X } from '...'` and `import { type X }` are erased; a plain
  // import is not. Only the plain ones can create a runtime dependency.
  const re = /^import\s+(type\s+)?([\s\S]*?)from\s+'([^']+)'/gm;
  for (const m of s.matchAll(re)) {
    const [, typeOnly, clause, spec] = m;
    if (typeOnly) continue;
    if (ALLOWED.some((r) => r.test(spec))) continue;
    // a clause where every binding is `type X` is also erased
    const bindings = clause.replace(/[{}]/g, '').split(',').map((x) => x.trim()).filter(Boolean);
    if (bindings.length && bindings.every((b) => b.startsWith('type '))) continue;
    leaks.push(`${f} -> ${spec}`);
  }
}
check(leaks.length === 0,
  'templates depend only on three, core/ and each other at runtime',
  leaks.join(' | '));

// ---- 2. nothing happens on import -------------------------------------------
//
// Anything at the top level that is not a declaration, an import or an export
// runs the moment the module is loaded. A `const` is fine; a bare call is not.
const effects = [];
for (const [f, s] of Object.entries(src)) {
  const lines = s.split('\n');
  let depth = 0;
  let inBlockComment = false;
  lines.forEach((raw, i) => {
    let line = raw;
    if (inBlockComment) {
      if (line.includes('*/')) { line = line.slice(line.indexOf('*/') + 2); inBlockComment = false; } else return;
    }
    const trimmed = line.trim();
    if (depth === 0 && trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
      if (/^\/\*/.test(trimmed) && !trimmed.includes('*/')) inBlockComment = true;
      else if (/^[a-zA-Z_$][\w$.]*\s*\(/.test(trimmed)) effects.push(`${f}:${i + 1} ${trimmed.slice(0, 48)}`);
    }
    for (const ch of line) {
      if (ch === '{' || ch === '(' || ch === '[') depth++;
      if (ch === '}' || ch === ')' || ch === ']') depth--;
    }
    if (line.includes('/*') && !line.includes('*/')) inBlockComment = true;
  });
}
check(effects.length === 0, 'no template does anything on import', effects.slice(0, 4).join(' | '));

// ---- 3. the barrel really exports what its files export ----------------------
const barrel = src['index.ts'] ?? '';
const reexported = [...barrel.matchAll(/export \* from '\.\/([\w-]+)'/g)].map((m) => `${m[1]}.ts`);
const missing = files.filter((f) => f !== 'index.ts' && !reexported.includes(f));
check(missing.length === 0, 'index.ts re-exports every template file', missing.join(', '));

// A name exported by two files is dropped from `export *` WITHOUT AN ERROR,
// which is the failure this whole check exists for. Re-exporting the same
// symbol twice is fine — declaring it twice is not.
const declaredIn = new Map();
for (const [f, s] of Object.entries(src)) {
  if (f === 'index.ts') continue;
  for (const m of s.matchAll(/^export (?:async )?(?:function|const|class|interface|type|enum)\s+([\w$]+)/gm)) {
    (declaredIn.get(m[1]) ?? declaredIn.set(m[1], []).get(m[1])).push(f);
  }
}
const dupes = [...declaredIn].filter(([, fs]) => fs.length > 1)
  .map(([n, fs]) => `${n} in ${fs.join(' + ')}`);
check(dupes.length === 0,
  'no name is declared by two template files (export * would drop it)', dupes.join(' | '));

// ---- 4. and props/ is now only the catalogue --------------------------------
const props = readdirSync('src/world/props').filter((f) => f.endsWith('.ts'));
const infra = ['registry.ts', 'types.ts', 'thumbnail.ts'];
const notComponents = props.filter((f) => !infra.includes(f)
  && !readFileSync(join('src/world/props', f), 'utf8').includes('export default'));
check(notComponents.length === 0,
  `world/props/ holds components and nothing else (${props.length - infra.length} of them)`,
  notComponents.join(', '));

console.log(fails ? `\n${fails} FAILED` : '\nthe template boundary holds');
process.exit(fails ? 1 : 0);
