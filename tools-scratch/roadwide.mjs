/* What half-width does this world actually carry, and how far off the
 * centreline does a lateral offset land? _clearsRoad refuses when
 * distToTrack - r < half + 1.6, so both terms have to be read, not assumed. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://127.0.0.1:8920';
const LV = +(process.env.LV ?? 57);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 400, height: 260 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=${LV}&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
const r = await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const N = t.center.length;
  let wMin = 1e9, wMax = -1e9, wSum = 0;
  const dts = [];
  for (let i = 0; i < N; i += 2) {
    const w = t.widthAt ? t.widthAt(i) : 9;
    wMin = Math.min(wMin, w); wMax = Math.max(wMax, w); wSum += w;
    const pt = t.pointAt(i, 21);
    dts.push(t._distToTrack(pt.x, pt.z));
  }
  dts.sort((a, b2) => a - b2);
  return { N, roadWidth: t.T.roadWidth ?? 1, narrows: !!t.T.narrows,
    wMin: +wMin.toFixed(2), wMax: +wMax.toFixed(2), wMean: +(wSum / (N / 2)).toFixed(2),
    dtAt21: { min: +dts[0].toFixed(1), p50: +dts[dts.length >> 1].toFixed(1),
      max: +dts[dts.length - 1].toFixed(1) },
    laps: t.T.lanes ?? null, merge: !!t.T.merge, split: !!t.T.split };
});
console.log(JSON.stringify(r));
await b.close();
