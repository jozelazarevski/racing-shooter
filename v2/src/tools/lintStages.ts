#!/usr/bin/env tsx
/* Build every stage and run §15 against it. Exits non-zero on any failure,
 * which is what "fails loudly" means in a build step. */
import { STAGES, buildStage } from '../world/stage.ts';
import { lintStage, lintSummary } from '../world/lint.ts';
import { fingerprint } from '../core/stageRng.ts';

let anyFailed = false;

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
}

console.log(anyFailed ? '\nLINT FAILED' : '\nAll stages pass §15.');
process.exit(anyFailed ? 1 : 0);
