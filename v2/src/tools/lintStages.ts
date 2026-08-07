#!/usr/bin/env tsx
/* Build every stage and run §15 against it. Exits non-zero on any failure,
 * which is what "fails loudly" means in a build step. */
import { STAGES, buildStage } from '../world/stage.ts';
import { lintStage, lintSummary } from '../world/lint.ts';
import { lintRegion, regionFor } from '../world/region.ts';
import { fingerprint } from '../core/stageRng.ts';

let anyFailed = false;
/* §5's region checks are reported alongside §15's stage checks, because the
 * two documents are the same authority over different halves of the world. A
 * region failure does NOT fail the build: the two that fail today are defects
 * in the bible's own palette data, and §6 says a hex value changes in the
 * document first. Exiting non-zero on them would make the only way to a green
 * build a silent edit to the constants. */
const regionsSeen = new Set<string>();

for (const def of STAGES) {
  const t0 = Date.now();
  const stage = buildStage(def);
  const results = lintStage(stage);
  const { passed, failed, skipped, ok } = lintSummary(results);
  if (!ok) anyFailed = true;

  console.log(
    `\n${def.name.padEnd(16)} ${def.country.padEnd(10)} ${def.surface.padEnd(7)} ` +
    `${(stage.length / 1000).toFixed(2)} km  ${stage.corners.length} corners  ` +
    `${stage.objects.length} objects  ${fingerprint(stage.objects)}  ${Date.now() - t0} ms`,
  );
  console.log(`  ${passed} pass, ${failed} fail, ${skipped} skip`);
  for (const r of results) {
    if (r.status === 'pass') continue;
    console.log(`  ${r.status === 'fail' ? 'FAIL' : 'skip'} ${r.id}  ${r.detail}`);
  }
  regionsSeen.add((def.region ? regionFor(def.region) : regionFor(def.biome)).key);
}

console.log('\n--- RALLY_WORLD_BIBLE §5, per region in use ---');
for (const key of [...regionsSeen].sort()) {
  const results = lintRegion(key);
  const p = results.filter((r) => r.status === 'pass').length;
  const f = results.filter((r) => r.status === 'fail');
  const s = results.filter((r) => r.status === 'skip').length;
  console.log(`\n${key.padEnd(20)} ${p} pass, ${f.length} fail, ${s} not yet implementable`);
  for (const r of results) {
    if (r.status === 'pass') continue;
    console.log(`  ${r.status === 'fail' ? 'FAIL' : 'skip'} ${r.id}  ${r.detail}`);
  }
}

console.log(anyFailed ? '\nLINT FAILED' : '\nAll stages pass §15.');
process.exit(anyFailed ? 1 : 0);
