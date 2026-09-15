/* E-12 ("I'd like the field clean without trees. And add more field")
 *
 * CIDER LANE's theme already declares treeBelt [40, 140] — a 31 u open field
 * past the 9 u road edge — and the owner's frame still shows a conifer wall
 * at the verge and one lone tree standing in the open grass. So the belt is
 * NOT what put them there, and widening it would have changed nothing.
 *
 * This finds which system did: every drawn tree near the road, grouped by the
 * mesh that owns it, with the nearest distance per source. The mesh that
 * shows up inside the belt's own exclusion is the culprit.
 *
 *   node tools-scratch/dbg-fieldclear.mjs 71 70 46
 */
import { chromium } from 'playwright-core';
const A = process.argv.slice(2).map(Number).filter(Number.isFinite);
const USE = A.length ? A : [71];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 200 } });
p.setDefaultTimeout(600000);

for (const lv of USE) {
  await p.goto(`http://localhost:8901/?level=${lv}&go=1&unlockall=1`,
    { waitUntil: 'load', timeout: 600000 });
  await p.waitForFunction(() => window.__game?.track?.center?.length, undefined, { timeout: 600000 });
  console.log(JSON.stringify(await p.evaluate(() => {
    const t = window.__game.track;
    const byMesh = new Map();
    const note = (tag, d) => {
      const e = byMesh.get(tag) ?? { n: 0, nearest: 1e9, within20: 0 };
      e.n++; e.nearest = Math.min(e.nearest, d);
      if (d < 20) e.within20++;
      byMesh.set(tag, e);
    };
    // every registered tree, by the mesh that draws it
    for (const tr of t.camTrees ?? []) {
      if (!(tr.r > 0)) continue;
      const d = t._distToTrack(tr.x, tr.z);
      if (d > 60) continue;
      note('camTrees:' + (tr.meshes?.[0]?.name || tr.meshes?.[0]?.uuid?.slice(0, 6) || '?'), d);
    }
    for (const tr of t.trees ?? []) {
      const d = t._distToTrack(tr.x, tr.z);
      if (d > 60) continue;
      note('trees:' + (tr.kind || '?'), d);
    }
    const rows = [...byMesh.entries()]
      .map(([k, v]) => [k, v.n, +v.nearest.toFixed(1), v.within20])
      .sort((a, c) => a[2] - c[2]).slice(0, 8);
    return { world: t.level?.name, theme: t.level?.theme,
      belt: t.T?.treeBelt ?? null, roadHalf: +t.widthAt(0).toFixed(1),
      sources: rows };
  }, undefined)));
}
await b.close();
