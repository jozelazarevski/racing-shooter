/* E-11 ("Most tracks look the same like this") — HOW MANY LOOKS, HONESTLY?
 *
 * v2. The v1 census (dbg-lookcensus.mjs) was a literal-only regex parse and
 * it was WRONG IN BOTH DIRECTIONS:
 *   - it missed the 12 generated harbour worlds (`THEMES[key] = {...harbor,
 *     ...over}` is not a literal), which came out as an empty key and read
 *     as a 7-world cluster that does not exist;
 *   - it ignored each world's own `tune`, which is layered OVER the theme
 *     (`{ ...THEMES[theme], ...level.tune }`, track.js:1126). BIRCHLAND
 *     CRESTS carries a full dawn palette in its tune and v1 still counted it
 *     inside the pine cluster. v1 therefore OVERSTATED sameness.
 *
 * v2 evaluates the actual literals instead of pattern-matching them: THEMES,
 * the generated-harbour loop, FLORA_MIX and LEVELS are sliced out of the
 * source and run in a sandbox whose scope Proxy answers 0 for anything they
 * reach outside themselves (they reach for almost nothing — these are data).
 * That is exact where a regex was approximate, and it still costs no browser.
 *
 *   node tools-scratch/dbg-lookcensus2.mjs
 */
import fs from 'node:fs';

const src = fs.readFileSync('src/track.js', 'utf8');
const cut = (head, endTok) => {
  const a = src.indexOf(head);
  if (a < 0) throw new Error(`census: cannot find ${head}`);
  const b = src.indexOf(endTok, a);
  return src.slice(a, b + endTok.length);
};

const themeSrc = cut('const THEMES = {', '\n};');
const genSrc = cut('for (const [key, over] of', '\n}\n');
// SIX THEMES ARE NOT IN THE LITERAL AT ALL — they are assigned afterwards
// (`THEMES.riviera = {...}`, `THEMES.savanna = {...}`, and four more). v2's
// first run missed them and reported 12 worlds with an all-'-' key, which
// read as a cluster and was nothing of the kind. Take them by name.
const postSrc = [...src.matchAll(/^THEMES\.[A-Za-z0-9_]+ = \{/gm)]
  .map((m) => cut(m[0], '\n};')).join('\n');
const floraSrc = cut('const FLORA_MIX = {', '\n};');
const levelSrc = cut('export const LEVELS = [', '\n];').replace('export const', 'const');
// r414: the per-world palette table and the loop that folds it into each
// level's tune live just past the LEVELS array, so the census MUST take them
// too — the first run after they landed still reported the old 43 looks
// because the instrument could not see them, which is not the same thing as
// the change not working.
const variantSrc = cut('const LOOK_VARIANTS = {', '\n};')
  + '\n' + cut('for (const [id, over] of Object.entries(LOOK_VARIANTS))', '\n}\n');

const scope = new Proxy({ Math, JSON, Object, Array, Number, String }, {
  has: () => true,
  get: (t, k) => (k in t ? t[k] : 0),
});
const { THEMES, FLORA_MIX, LEVELS } = new Function('__s',
  `with(__s){ ${themeSrc}\n${genSrc}\n${postSrc}\n${floraSrc}\n${levelSrc}\n${variantSrc}\nreturn { THEMES, FLORA_MIX, LEVELS }; }`)(scope);

// Colours bucketed coarsely (48 levels/channel): the question is whether a
// driver could tell two worlds apart, not whether their hex differs.
const bucket = (v) => {
  if (v == null) return '-';
  let n = typeof v === 'number' ? v : NaN;
  if (typeof v === 'string') n = parseInt(v.replace(/[^0-9a-f]/gi, ''), 16);
  if (!Number.isFinite(n)) return '-';
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(c / 48)).join('');
};

const looks = new Map();
const rows = [];
for (const l of LEVELS) {
  const T = { ...(THEMES[l.theme] || {}), ...(l.tune || {}) };     // the game's own merge
  const mix = FLORA_MIX[T.vegetation] || FLORA_MIX[l.theme] || null;
  const key = [bucket(T.skyTop), bucket(T.skyHorizon), bucket(T.fogColor),
    bucket(T.hemiGround), mix ? mix[0][0] : '-'].join('|');
  rows.push({ id: l.id, name: l.name, theme: l.theme, key });
  if (!looks.has(key)) looks.set(key, []);
  looks.get(key).push(l.name);
}

console.log(`worlds ${LEVELS.length}   themes ${Object.keys(THEMES).length}   declared ${new Set(LEVELS.map((l) => l.theme)).size}   DISTINCT LOOKS ${looks.size}`);
const sorted = [...looks.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [key, names] of sorted) {
  if (names.length < 2) continue;
  console.log(`${String(names.length).padStart(2)}  ${key.padEnd(30)} ${names.join(', ')}`);
}
const solo = sorted.filter(([, n]) => n.length === 1).length;
const inClusters = LEVELS.length - solo;
console.log(`\nlooks shared by 2+ worlds: ${sorted.length - solo}   unique looks: ${solo}   worlds sharing a look: ${inClusters}`);
if (process.env.ROWS) for (const r of rows) console.log(`${String(r.id).padStart(3)} ${r.name.padEnd(24)} ${r.theme.padEnd(14)} ${r.key}`);
