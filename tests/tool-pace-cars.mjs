/* The REAL car catalogue, read out of src/vehicles.js.
 *
 * Deliberately parsed from source rather than copied: a tuning tool that rates
 * its own private copy of the numbers will happily tell you the roster is
 * balanced while the game ships something else. `src/vehicles.js` cannot be
 * imported under plain node (it imports three), so the two literal blocks are
 * lifted out textually — `key: '…'` and the `stats: { … }` that follows it.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(join(root, 'src', 'vehicles.js'), 'utf8');

const cat = src.slice(src.indexOf('export const CAR_CATALOG'));
export const CARS = [];
const re = /key:\s*'([a-z0-9]+)'[\s\S]*?stats:\s*\{([\s\S]*?)\}/g;
let m;
while ((m = re.exec(cat))) {
  const stats = {};
  for (const [, k, v] of m[2].matchAll(/([a-zA-Z]+):\s*(-?[\d.]+)/g)) stats[k] = Number(v);
  CARS.push({ key: m[1], stats });
  if (CARS.length >= 8) break;              // the catalogue, not what follows it
}

if (!CARS.length) throw new Error('could not read CAR_CATALOG out of src/vehicles.js');
