/* E-11 ("Most tracks look the same like this") — HOW MANY LOOKS, NOT HOW MANY THEMES?
 *
 * Static census, no browser: THEMES and the tree-mix table are literals in
 * src/track.js, so parse them. Building 78 worlds in a page costs forty
 * minutes and answers the same question.
 *
 * What reaches the eye while driving is colour and canopy, so each world is
 * reduced to a LOOK KEY: sky top, sky horizon, fog, hemisphere ground (which
 * tints everything low), and the dominant tree species. Colours are bucketed
 * coarsely (48 levels per channel) so near-identical palettes collapse into
 * one look — which is the point: the question is whether a driver could tell
 * two worlds apart, not whether their hex differs in the last digit.
 *
 *   node tools-scratch/dbg-lookcensus.mjs
 */
import fs from 'node:fs';

const src = fs.readFileSync('src/track.js', 'utf8');

const bucket = (v) => {
  if (v == null) return '-';
  let n = typeof v === 'number' ? v : NaN;
  if (typeof v === 'string') n = parseInt(v.replace(/[^0-9a-f]/gi, ''), 16);
  if (!Number.isFinite(n)) return '-';
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return [r, g, b].map((c) => Math.round(c / 48)).join('');
};

// ---- LEVELS: id, name, theme --------------------------------------------
const levels = [];
for (const m of src.matchAll(/\{\s*id:\s*(\d+),\s*name:\s*'([^']+)',\s*theme:\s*'([a-z0-9]+)'/g)) {
  levels.push({ id: +m[1], name: m[2], theme: m[3] });
}

// ---- THEMES: slice the object and read each key's colour fields ----------
const tStart = src.indexOf('const THEMES = {');
const tEnd = src.indexOf('\n};', tStart);
const themeSrc = src.slice(tStart, tEnd);
const themes = {};
// The generated harbour family (THEMES[key] = {...THEMES.harbor, ...over})
// is not a literal in the THEMES object, so a literal-only parse leaves those
// worlds with an empty look key — the '-|-|-|-|-' rows in the first run.
const genStart = src.indexOf('for (const [key, over] of');

const keyRe = /\n  ([a-z][a-z0-9]*): \{/g;
const keys = [...themeSrc.matchAll(keyRe)];
for (let i = 0; i < keys.length; i++) {
  const name = keys[i][1];
  const from = keys[i].index;
  const to = i + 1 < keys.length ? keys[i + 1].index : themeSrc.length;
  const body = themeSrc.slice(from, to);
  const f = (k) => { const m = body.match(new RegExp(k + ":\\s*(0x[0-9a-fA-F]+|'#[0-9a-fA-F]+')")); return m ? m[1] : null; };
  themes[name] = { skyTop: f('skyTop'), skyHorizon: f('skyHorizon'),
    fogColor: f('fogColor'), hemiGround: f('hemiGround') };
}

// ---- tree mix: dominant species per theme -------------------------------
// FLORA_MIX, explicitly — the first cut matched PROP_SPECS instead and
// reported crates and cones as the dominant "tree", which is how a broken
// parse looks when you do not check what it matched.
const fStart = src.indexOf('const FLORA_MIX = {');
const fEnd = src.indexOf('\n};', fStart);
const floraSrc = src.slice(fStart, fEnd);
const mix = {};
for (const m of floraSrc.matchAll(/\n  ([a-z][a-z0-9]*): \[\['([a-zA-Z]+)'/g)) {
  if (!(m[1] in mix)) mix[m[1]] = m[2];
}

const looks = new Map();
const rows = [];
for (const l of levels) {
  const t = themes[l.theme] || {};
  const key = [bucket(t.skyTop), bucket(t.skyHorizon), bucket(t.fogColor),
    bucket(t.hemiGround), mix[l.theme] ?? '-'].join('|');
  rows.push({ ...l, key });
  if (!looks.has(key)) looks.set(key, []);
  looks.get(key).push(l.name);
}

console.log(`worlds ${levels.length}   declared themes ${new Set(levels.map((l) => l.theme)).size}   DISTINCT LOOKS ${looks.size}`);
const sorted = [...looks.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [key, names] of sorted.slice(0, 12)) {
  console.log(`${String(names.length).padStart(2)}  ${key.padEnd(34)} ${names.slice(0, 6).join(', ')}${names.length > 6 ? ' …' : ''}`);
}
const solo = sorted.filter(([, n]) => n.length === 1).length;
console.log(`\nlooks shared by 2+ worlds: ${sorted.length - solo}   unique-to-one-world looks: ${solo}`);
