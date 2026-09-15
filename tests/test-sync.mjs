/* ONE CAREER, MANY DEVICES — AND THE MERGE NEVER LOSES A STAR.
 *
 * THE ASK: "create DB to store all user profiles and progress across
 * different devices and sessions."
 *
 * The engine is src/sync.js: profile snapshots, a progression-preserving
 * merge, sync codes as the zero-infrastructure transport, and a cloud
 * adapter that activates when window.IGNITE_SYNC is configured (db/README.md
 * has the one-table schema). This suite drives the whole path across two
 * genuinely separate browser contexts — separate localStorage, like two
 * phones — and asserts the properties that make sync trustworthy:
 *
 *   ROUND TRIP    decode(encode(snapshot)) is the snapshot
 *   MERGE UNION   device A's wins + device B's wins both survive the merge
 *   NEVER LOSES   the merged career is >= each side, field by field
 *   SYMMETRY      merging A into B equals merging B into A (progression)
 *   IDEMPOTENT    importing the same code twice changes nothing
 *   UI            the profile panel actually offers the code path
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const boot = async (ctx) => {
  const p = await ctx.newPage();
  await p.goto(`${BASE}/?unlockall=1`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__game?.sync && window.__sync, undefined, { timeout: 180000 });
  return p;
};

// ---- device A: a career with a win on world 1 and a bought SLEEK ----
const ctxA = await browser.newContext({ viewport: { width: 640, height: 400 } });
const pA = await boot(ctxA);
const codeA = await pA.evaluate(async () => {
  const g = window.__game;
  localStorage.setItem('ir-p1-career', JSON.stringify({ finished: { 1: { place: 1, stars: 3, bestScore: 5200 } } }));
  localStorage.setItem('ir-p1-garage', JSON.stringify({ credits: 900, upgrades: { brawler: { engine: 2 } } }));
  localStorage.setItem('ir-p1-cars', JSON.stringify({ owned: ['brawler', 'sleek'], selected: 'sleek' }));
  g.reloadProfileState();
  const snap = g.sync.snapshot();
  // round trip through the wire format
  const code = await window.__sync.encodeSyncCode(snap);
  const back = await window.__sync.decodeSyncCode(code);
  return { code, roundtrip: JSON.stringify(back.keys) === JSON.stringify(snap.keys),
    len: code.length };
});
check('sync code round-trips exactly', codeA.roundtrip, `${codeA.len} chars`);
await ctxA.close();

// ---- device B: a DIFFERENT career — podium on world 2, more credits ----
const ctxB = await browser.newContext({ viewport: { width: 640, height: 400 } });
const pB = await boot(ctxB);
const r = await pB.evaluate(async (code) => {
  const g = window.__game;
  localStorage.setItem('ir-p1-career', JSON.stringify({ finished: { 2: { place: 2, stars: 2, bestScore: 3100 } } }));
  localStorage.setItem('ir-p1-garage', JSON.stringify({ credits: 1500, upgrades: { brawler: { engine: 1, tires: 3 } } }));
  localStorage.setItem('ir-p1-cars', JSON.stringify({ owned: ['brawler', 'crown'], selected: 'crown' }));
  g.reloadProfileState();

  const localBefore = g.sync.snapshot();
  const snapA = await window.__sync.decodeSyncCode(code);
  g.sync.adopt(snapA);

  const once = g.sync.snapshot();
  g.sync.adopt(snapA);                       // idempotence: import the same code again
  const twice = g.sync.snapshot();

  // symmetry, on the pure engine: A merged into B vs B merged into A
  const ab = window.__sync.mergeSnapshots(localBefore, snapA);
  const ba = window.__sync.mergeSnapshots(snapA, localBefore);

  return {
    career: g.career.finished,
    credits: g.garage.credits,
    upgrades: g.garage.upgrades,
    owned: g.cars.owned.slice().sort(),
    idempotent: JSON.stringify(once.keys) === JSON.stringify(twice.keys),
    symmetric: JSON.stringify(ab.keys.career) === JSON.stringify(ba.keys.career)
      && JSON.stringify(ab.keys.cars.owned.slice().sort()) === JSON.stringify(ba.keys.cars.owned.slice().sort())
      && ab.keys.garage.credits === ba.keys.garage.credits,
    ui: {
      section: !!document.getElementById('profile-sync'),
      exportBtn: !!document.getElementById('sync-export'),
      importBtn: !!document.getElementById('sync-import'),
      status: document.getElementById('sync-status')?.textContent ?? '',
    },
  };
}, codeA.code);
await ctxB.close();

check('both devices’ world results survive the merge',
  r.career[1]?.stars === 3 && r.career[2]?.stars === 2,
  `world 1: ${JSON.stringify(r.career[1])}, world 2: ${JSON.stringify(r.career[2])}`);
check('credits keep the max, never the overwrite', r.credits === 1500, `${r.credits} CR`);
check('upgrade levels union field-wise',
  r.upgrades?.brawler?.engine === 2 && r.upgrades?.brawler?.tires === 3,
  JSON.stringify(r.upgrades));
check('owned cars union', JSON.stringify(r.owned) === JSON.stringify(['brawler', 'crown', 'sleek']),
  r.owned.join(','));
check('importing the same code twice changes nothing', r.idempotent);
check('merge is symmetric for progression', r.symmetric);
check('the profile panel offers the sync path',
  r.ui.section && r.ui.exportBtn && r.ui.importBtn, JSON.stringify(r.ui));
check('unconfigured cloud reports itself honestly', /CLOUD OFF/.test(r.ui.status), r.ui.status);

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\none career, any device');
process.exit(fail ? 1 : 0);
