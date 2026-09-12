/* "Remove the new tag and update the maps of each track. They don't match the
 * current now" (owner, 2026-09-11) — WHICH MAPS ARE WRONG, AND WHY?
 *
 * The level-select card draws `_drawCircuitMap(canvas, lv.route || lv.theme)`,
 * which is `circuitPoints(key)` = `CIRCUITS[key] || CIRCUITS.forest`. Two
 * ways that can disagree with the world you actually drive:
 *   (a) the key is not in CIRCUITS at all, so the card silently draws PINE
 *       VALLEY's shape;
 *   (b) several worlds share one route key, so they all draw one map.
 * Both are measured here, statically.
 */
import fs from 'node:fs';
const src = fs.readFileSync('src/track.js', 'utf8');
const cut = (h, e) => { const a = src.indexOf(h); const b = src.indexOf(e, a); return src.slice(a, b + e.length); };
const scope = new Proxy({ Math, JSON, Object, Array, Number, String }, { has: () => true, get: (t, k) => (k in t ? t[k] : 0) });
// CIRCUITS cannot be evaluated on its own — its entries call shape helpers
// (`switchbackStack(...)` and friends) defined elsewhere in the module. The
// question here is only WHICH KEYS EXIST, so take the top-level keys of the
// literal rather than its geometry.
const circuitSrc = cut('const CIRCUITS = {', '\n};');
// ...AND THE KEYS ASSIGNED AFTER THE LITERAL. `CIRCUITS.glaciercol =
// composeRoute(...)` is not inside the object, and a literal-only parse
// therefore reported GLACIER COL as falling back to PINE VALLEY's loop --
// which it does not: it measures lap 5239 / p50 185 / 43.6 pct sweepers
// against PINE's 6800 / 421 / 17.7. This is EXACTLY the trap the look
// census hit with `THEMES.savanna = {...}` in r414. Second table, same
// mistake: check for post-hoc assignment before trusting a literal.
const keys = new Set([
  ...[...circuitSrc.matchAll(/\n  ([A-Za-z][A-Za-z0-9_]*):/g)].map((m) => m[1]),
  ...[...src.matchAll(/^CIRCUITS\.([A-Za-z][A-Za-z0-9_]*)\s*=/gm)].map((m) => m[1]),
]);
const { LEVELS } = new Function('__s', `with(__s){ ${cut('export const LEVELS = [', '\n];').replace('export const', 'const')}\nreturn { LEVELS }; }`)(scope);
const byKey = new Map();
const missing = [];
for (const l of LEVELS) {
  const k = l.route || l.theme;
  if (!keys.has(k)) missing.push(`${l.id} ${l.name} (key '${k}' -> falls back to CIRCUITS.forest)`);
  const eff = keys.has(k) ? k : 'forest';
  if (!byKey.has(eff)) byKey.set(eff, []);
  byKey.get(eff).push(l.name + (l.routeReverse ? ' [reversed]' : ''));
}
console.log(`worlds ${LEVELS.length}   CIRCUITS shapes ${keys.size}   shapes actually used ${byKey.size}`);
console.log(`\nKEY NOT IN CIRCUITS — card draws PINE VALLEY's shape: ${missing.length}`);
for (const m of missing) console.log('  ' + m);
const shared = [...byKey.entries()].filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length);
console.log(`\nONE MAP SERVING SEVERAL WORLDS: ${shared.length} shapes, ${shared.reduce((n, [, v]) => n + v.length, 0)} worlds`);
for (const [k, v] of shared) console.log(`  ${String(v.length).padStart(2)}  ${k.padEnd(14)} ${v.join(', ')}`);
const rev = LEVELS.filter((l) => l.routeReverse);
console.log(`\nreversed worlds (map ignores reversal): ${rev.length}  ${rev.map((l) => l.name).join(', ')}`);
