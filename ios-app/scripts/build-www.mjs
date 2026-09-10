/* Assemble ios-app/www from the repo root.
 *
 * The game is a static site at the repository root; the iOS shell serves a
 * COPY of it from the app bundle. This script is the single definition of
 * what ships in the app:
 *
 *   included: index.html, driving.json, src/, lib/, assets/
 *   excluded: sw.js (the bundle IS the offline copy; src/offline.js bails
 *             on the capacitor:// scheme), manifest.webmanifest (browser
 *             install metadata), docs, tests, tools, the V2/dustline/admin
 *             sub-apps, and the Pages plumbing (404.html, robots.txt).
 *
 * Run via `npm run build` or `npm run sync` (which also runs `cap sync ios`).
 */
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const www = resolve(here, '..', 'www');

const INCLUDE = ['index.html', 'driving.json', 'src', 'lib', 'assets'];

rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

for (const entry of INCLUDE) {
  const from = join(repoRoot, entry);
  if (!existsSync(from)) {
    console.error(`build-www: missing ${entry} at repo root — aborting`);
    process.exit(1);
  }
  cpSync(from, join(www, entry), { recursive: true });
}

console.log(`build-www: assembled ${INCLUDE.join(', ')} -> ios-app/www`);
