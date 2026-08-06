/* §15 L15 — the AI reference lap, measured rather than asserted.
 *
 * "Stage completable by the AI reference lap with zero resets and under 8 kJ of
 *  cumulative impact energy."
 *
 * The static lint reports L15 as SKIPPED and always will: it is a claim about a
 * car driving a stage, and `lintStage` has no physics. This harness is the part
 * that can answer it. It boots the real build, hands the car to the same
 * RoadDriver the rival uses at skill 1.0, and drives the whole stage.
 *
 * Everything it reports is a measurement. A stage that cannot be driven fails
 * here, loudly, with the distance and the place it stopped.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8902/play-v2/';
const STAGES = (process.env.STAGES ?? 'ouninpohja,col-de-turini,fafe,monte-carlo,safari,sweet-lamb')
  .split(',');
const SKILL = Number(process.env.SKILL ?? 1.0);

/** §15 STAGE_LINT.referenceLapMaxImpactEnergyJ. */
const MAX_IMPACT_J = 8000;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});

let failures = 0;
const rows = [];

for (const stage of STAGES) {
  const page = await browser.newPage({ viewport: { width: 800, height: 480 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(`${BASE}?stage=${stage}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__v2?.phys && window.__referenceLap,
    undefined, { timeout: 180_000 });

  const name = await page.evaluate(() => document.getElementById('stage-name').textContent);
  // THE STAGE THAT LOADED MUST BE THE STAGE THAT WAS ASKED FOR.
  //
  // It once was not. Stage progression locked stages the player had not
  // reached, and the boot code answered a locked ?stage= by opening the
  // current leg instead — so this harness asked for six stages, was given
  // Ouninpohja six times, and reported "every stage passes L15" in a run where
  // five of them were never driven. A harness that cannot tell it was handed
  // the wrong subject is worse than no harness.
  const loaded = await page.evaluate(() => window.__v2.stage.def.id);
  if (loaded !== stage) {
    failures++;
    console.log(`${stage.padEnd(14)} FAIL asked for "${stage}", got "${loaded}" — not measured`);
    await page.close();
    continue;
  }
  const r = await page.evaluate((skill) => window.__referenceLap(skill), SKILL);
  const km = await page.evaluate(() => window.__v2.stage.length / 1000);

  const ok = r.finished && r.resets === 0 && r.damageJ < 8000;
  if (!ok || errors.length) failures++;
  rows.push({ stage: name ?? stage, km, ...r, errors: errors.length });

  console.log(
    `${(name ?? stage).padEnd(14)} ${ok ? 'ok  ' : 'FAIL'}` +
    ` ${r.finished
      ? `${r.seconds.toFixed(1)}s`
      : r.loopedAt
        ? `RESET LOOP at ${r.loopedAt} m of ${km.toFixed(2)} km — respawns to the same node and fails identically`
        : `DNF at ${(r.distance / 1000).toFixed(2)}/${km.toFixed(2)} km`}` +
    ` · ${r.resets} resets · ${r.cuts} cuts · +${r.penaltySeconds.toFixed(0)}s · ${(r.damageJ / 1000).toFixed(2)} kJ` +
    ` · ${r.offRoadSeconds.toFixed(1)}s off road` +
    ` · slowest ${r.minSpeedKmh.toFixed(0)} km/h at ${Math.round(r.slowestPoint)} m` +
    (r.resetPoints.length ? ` · resets at ${r.resetPoints.join(', ')} m` : '') +
    (errors.length ? ` · ${errors.length} page errors: ${errors[0]}` : ''),
  );
  await page.close();
}

await browser.close();

const finished = rows.filter((r) => r.finished).length;
const avg = rows.filter((r) => r.finished);
console.log(
  `\nL15 at skill ${SKILL.toFixed(2)}: ${finished}/${rows.length} stages completed,` +
  ` ${rows.reduce((a, r) => a + r.resets, 0)} resets total,` +
  ` worst impact ${(Math.max(...rows.map((r) => r.damageJ)) / 1000).toFixed(2)} kJ` +
  ` (limit ${MAX_IMPACT_J / 1000} kJ)` +
  (avg.length ? `, average ${(avg.reduce((a, r) => a + r.km / (r.seconds / 3600), 0) / avg.length).toFixed(1)} km/h` : ''),
);
console.log(failures ? `${failures} STAGES FAIL L15` : 'Every stage passes L15.');
process.exit(failures ? 1 : 0);
