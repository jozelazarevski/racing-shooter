/* E-18 "twist the tracks, make them drive the other world, change the scenery"
 *
 * A shared ROUTE is not automatically a shared WORLD: the same shape under a
 * different theme, or run the other way round, is a different place to drive.
 * So before twisting anything, list every cluster with what each member
 * already has — theme, and which of the four transforms it carries.
 *
 *   none | flipX | reverse | flipX+reverse   (the r327 "fourth distinct lap")
 */
import fs from 'node:fs';
const src = fs.readFileSync('src/track.js', 'utf8');
const cut = (h, e) => { const a = src.indexOf(h); const b = src.indexOf(e, a); return src.slice(a, b + e.length); };
const scope = new Proxy({ Math, JSON, Object, Array, Number, String }, { has: () => true, get: (t, k) => (k in t ? t[k] : 0) });
const { LEVELS } = new Function('__s', `with(__s){ ${cut('export const LEVELS = [', '\n];').replace('export const', 'const')}\nreturn { LEVELS }; }`)(scope);
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

const twist = (l) => (l.routeFlipX ? 'flipX' : '') + (l.routeReverse ? (l.routeFlipX ? '+reverse' : 'reverse') : '') || 'none';
const by = new Map();
for (const l of LEVELS) {
  const k = keys.has(l.route || l.theme) ? (l.route || l.theme) : 'forest';
  if (!by.has(k)) by.set(k, []);
  by.get(k).push(l);
}
let collisions = 0, sameTheme = 0;
for (const [k, ws] of [...by].sort((a, b) => b[1].length - a[1].length)) {
  if (ws.length < 2) continue;
  const seen = new Map();
  console.log(`\n${k}  (${ws.length} worlds)`);
  for (const l of ws) {
    const t = twist(l);
    const dup = seen.has(t);
    if (dup) collisions++;
    seen.set(t, true);
    console.log(`   ${String(l.id).padStart(3)} ${l.name.padEnd(22)} theme=${String(l.theme).padEnd(14)} twist=${t.padEnd(14)}${dup ? '  <-- SAME LAP, SAME DIRECTION' : ''}`);
  }
  const themes = new Set(ws.map((l) => l.theme));
  if (themes.size < ws.length) { sameTheme++; console.log(`   (themes: ${[...themes].join(', ')} — ${ws.length - themes.size} world(s) share scenery too)`); }
}
console.log(`\nworlds driving a lap another world already drives the same way: ${collisions}`);
console.log(`clusters where scenery is shared as well: ${sameTheme}`);
