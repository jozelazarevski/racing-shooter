/* DOES THE WORLD BUILD WHAT ITS CONFIG SAYS IT DOES?
 * Every `count` in a tune is a REQUEST. This checks the ones I wrote into the
 * three new worlds against what the builder actually produced, so no claim
 * ships that the world does not honour. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8920';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await b.newPage({ viewport: { width: 640, height: 400 } });
page.setDefaultTimeout(300000);
for (const id of process.argv.slice(2).map(Number)) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${BASE}/?level=${id}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 300000 });
  await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 300000 });
  const r = await page.evaluate(() => {
    const t = window.__game.track;
    let bridgeMeshes = 0, massifInst = 0, ramps = 0;
    t.group.traverse((o) => {
      if (o.name === 'stone-bridge') bridgeMeshes++;
      if (o.isInstancedMesh && o.name === 'massif') massifInst += o.count;
      if (/ramp/i.test(o.name || '')) ramps++;
    });
    return { name: t.level?.name,
      askedBores: t.T.tunnels?.count ?? 0, sitedBores: (t._tunnels ?? []).length,
      askedBridges: t.T.stoneBridges?.count ?? 0, bridgeMeshes,
      askedRamps: t.T.rampCount, ramps: (t.ramps ?? []).length, rampMeshes: ramps,
      massifInst, trees: (t.trees ?? []).length,
      crests: (t.crests ?? []).length,
      scenery: (window.__game.level && window.__game.level.scenery) || null };
  });
  console.log(`${String(id).padStart(2)} ${(r.name ?? '?').padEnd(16)} `
    + `bores ${r.sitedBores}/${r.askedBores}  bridges built ${r.bridgeMeshes} (asked ${r.askedBridges})  `
    + `CRESTS ${String(r.crests).padStart(2)} (rampCount ${r.askedRamps ?? 'unset'})  massif ${r.massifInst}  trees ${r.trees}`
    + (errs.length ? `   PAGEERROR: ${errs[0]}` : ''));
}
await b.close();
