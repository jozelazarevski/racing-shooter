/* E-20 "Rename the tracks" — WHICH NAMES ACTUALLY BREAK THE RULE?
 *
 * §7.10: no real circuit, city, mountain, brand or driver names in stage data,
 * and acceptance query R9 is a string scan for exactly that. So the rename is
 * grounded in the rule rather than in novelty — which also protects the names
 * the OWNER gave (SERPENT PASS came off his own sheet at r327).
 *
 * Flags a name if any word of it matches a real-world place/marque list, or
 * reads as a lightly-veiled one.
 */
import fs from 'node:fs';
const src = fs.readFileSync('src/track.js', 'utf8');
const cut = (h, e) => { const a = src.indexOf(h); const b = src.indexOf(e, a); return src.slice(a, b + e.length); };
const scope = new Proxy({ Math, JSON, Object, Array, Number, String }, { has: () => true, get: (t, k) => (k in t ? t[k] : 0) });
const { LEVELS } = new Function('__s', `with(__s){ ${cut('export const LEVELS = [', '\n];').replace('export const', 'const')}\nreturn { LEVELS }; }`)(scope);

// Real-world proper nouns: regions, cities, ranges, circuits, marques.
const REAL = {
  'AZUR': 'Côte d\'Azur, a real French region',
  'COTE': 'Côte d\'Azur',
  'AEGEAN': 'the Aegean, a real sea',
  'DALMATIA': 'Dalmatia, a real Croatian region',
  'LIGURIA': 'Liguria, a real Italian region',
  'CINQUE': 'Cinque Terre, a real Italian coastline',
  'BORGHI': 'Italian, pairs with Cinque above',
  'ARDENNES': 'the Ardennes, a real forest/region (and Spa)',
  'PRINCIPALITY': 'reads as Monaco',
  'RIVIERA': 'a real coastline',
  'TREMOLA': 'Tremola, the real Gotthard road',
  'FURKA': 'Furka, a real Swiss pass',
  'TURINI': 'Col de Turini, a real rally stage',
  'ESTONIA': 'a country',
  'SUZUKA': 'a real circuit', 'MONZA': 'a real circuit', 'SPA': 'a real circuit',
  'PIKES': 'Pikes Peak', 'MONACO': 'a real city', 'GOTTHARD': 'a real pass',
  'DOLOMITI': 'the Dolomites, a real range',
  'SANREMO': 'Sanremo, a real city and rally',
  'GENOVA': 'Genoa, a real city',
};
let flagged = 0;
for (const l of LEVELS) {
  const words = String(l.name).toUpperCase().split(/[^A-Z]+/).filter(Boolean);
  const hit = words.find((w) => REAL[w]);
  if (hit) { flagged++; console.log(`  ${String(l.id).padStart(3)} ${l.name.padEnd(24)} <- ${hit}: ${REAL[hit]}`); }
}
console.log(`\n${LEVELS.length} worlds, ${flagged} names flagged against §7.10`);
// also scan the route/theme KEYS, which are stage data too
const keys = new Set(LEVELS.map((l) => l.route).concat(LEVELS.map((l) => l.theme)).filter(Boolean));
const badKeys = [...keys].filter((k) => REAL[String(k).toUpperCase()]);
console.log(`route/theme keys that are real-world names: ${badKeys.length}  ${badKeys.join(', ')}`);
