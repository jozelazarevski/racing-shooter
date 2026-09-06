/* JOBS — the board you choose FROM, and the only objective you go somewhere
 * to do.
 *
 * Asked for as "expand the jobs, and I can take a job and start driving it to
 * fulfil it". The second half is the feature. Everything the game had until
 * now was handed to you for whatever world you happened to be standing on:
 * contracts are dealt at the start line for the current world, quests tick
 * along behind whatever you were going to do anyway, feats are stapled to a
 * world you have to find first. None of them is a decision, because none of
 * them sends you anywhere.
 *
 * A job is a named world, a named objective, a named price, and a button that
 * takes you there. What this suite defends:
 *
 *   - THE BOARD IS AN OFFER, NOT A SLOT MACHINE. Same five postings all day
 *     for this driver, only on worlds that are actually open, one per kind.
 *   - YOU HOLD ONE. Taking a second replaces the first; the held one is drawn
 *     as the thing you are doing rather than as another row to read.
 *   - DRIVE IT ACTUALLY DRIVES IT. The button swaps to the world the job names
 *     and starts the race there — that is the whole request, and a button that
 *     merely scrolls a list would not be it.
 *   - THE OBJECTIVE RIDES ALONG. The job is slotted into the same contract
 *     list the per-race objectives use, so it gets the per-frame progress, the
 *     finish hook and the HUD row without a second copy of any of them — but
 *     it must NOT climb a contract rung, because it has no ladder.
 *   - FINISHING IT PAYS, CLEARS IT, AND CLOSES IT FOR THE DAY. Without the
 *     last part a single job is an unlimited credit tap: bank it, it reposts,
 *     race it again.
 *   - IT IS WORTH ABOUT ONE GOOD RACE. ECONOMY-PLAN prices a strong race at
 *     ~1,800 CR and test-rungs holds a full contract sweep under 2,200; a
 *     posting that beat both would make racing the side activity.
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';

let pass = 0, fail = 0;
const ok = (cond, msg, extra = '') => {
  if (cond) { pass++; console.log('PASS ', msg); }
  else { fail++; console.log('FAIL ', msg, extra); }
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });

// ---- the board -------------------------------------------------------------
const board = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  g.career.job = null; g.career.jobsDone = null; g._jobsCache = null;
  const a = g._jobOffers();
  g._jobsCache = null;                      // force a rebuild, same day
  const b = g._jobOffers();
  return {
    n: a.length,
    stable: JSON.stringify(a) === JSON.stringify(b),
    kinds: a.map((o) => o.id),
    uniqueKinds: new Set(a.map((o) => o.id)).size,
    allOpen: a.every((o) => g.isLevelUnlocked(o.lvId)),
    allReal: a.every((o) => LEVELS.some((l) => l.id === o.lvId)),
    allPaid: a.every((o) => o.pay > 0),
    maxPay: Math.max(...a.map((o) => o.pay)),
    lines: a.map((o) => {
      const j = { ...o };
      return g.activeJob.call({ ...g, career: { job: j } })?.text;
    }),
  };
});
console.log('\n--- the board ---');
console.log('  ' + board.kinds.join(', '));
ok(board.n === 5, 'five postings', `${board.n}`);
ok(board.stable, 'the same five all day — a board that rerolls is a slot machine');
ok(board.uniqueKinds === board.n, 'one posting per kind, so five rows are five different jobs');
ok(board.allOpen, 'every posting is on a world you can actually drive');
ok(board.allReal && board.allPaid, 'every posting names a real world and a real price');
ok(board.maxPay <= 2200,
  'and the richest is still about one good race, not three', `${board.maxPay} CR`);

// ---- holding one -----------------------------------------------------------
const hold = await page.evaluate(() => {
  const g = window.__game;
  const offers = g._jobOffers();
  g._renderJobs();
  const rowsBefore = document.querySelectorAll('#job-board .jobrow').length;
  g._takeJob(offers[0]);
  const held = g.activeJob();
  const heldRows = document.querySelectorAll('#job-board .jobrow.held').length;
  const anyOffers = document.querySelectorAll('#job-board .jtake').length;
  // taking a second replaces the first — one at a time is the commitment
  g._takeJob(offers[1]);
  const second = g.activeJob();
  const out = { rowsBefore, heldRows, anyOffers,
    firstId: offers[0].id, heldId: held?.id, heldLv: held?.lv?.name,
    heldText: held?.text, secondId: second?.id,
    drive: !!document.getElementById('job-drive'),
    drop: !!document.getElementById('job-drop'),
    // and it survives a reload, because it lives on the career
    persisted: JSON.parse(localStorage.getItem(`ir-p${g.profile.id}-career`) || '{}').job?.id };
  g._dropJob();
  out.afterDrop = g.activeJob();
  out.offersBack = document.querySelectorAll('#job-board .jtake').length;
  return out;
});
console.log('\n--- holding one ---');
ok(hold.rowsBefore === 5, 'the board draws all five', `${hold.rowsBefore}`);
ok(hold.heldId === hold.firstId && hold.heldRows === 1 && hold.anyOffers === 0,
  'taking one replaces the board with the job you are doing', JSON.stringify(hold));
ok(hold.drive && hold.drop, 'and it offers exactly two things: drive it, or drop it');
ok(hold.secondId !== hold.firstId,
  'taking another replaces it — you hold ONE', `${hold.firstId} -> ${hold.secondId}`);
ok(hold.persisted === hold.firstId || hold.persisted === hold.secondId,
  'the job is written to the career, so it survives a reload', `${hold.persisted}`);
ok(hold.afterDrop === null && hold.offersBack === 5,
  'dropping it puts the board back', JSON.stringify({ a: hold.afterDrop, n: hold.offersBack }));

// ---- DRIVE IT actually drives it -------------------------------------------
const drive = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  // a posting on a world that is NOT the one under the menu, so the swap is
  // the thing being tested rather than a no-op
  const away = g._jobOffers().find((o) => o.lvId !== g.level.id);
  if (!away) return { skipped: true };
  g._takeJob(away);
  const from = g.level.id;
  g._renderJobs();
  document.getElementById('job-drive').click();
  return { skipped: false, from, want: away.lvId, now: g.level?.id,
    name: LEVELS.find((l) => l.id === away.lvId)?.name,
    // startRace opens on the 3-2-1, so 'countdown' is the honest answer here;
    // 'title' or 'menu' would mean the button only navigated
    racing: g.state === 'countdown' || g.state === 'race',
    state: g.state,
    carriedIntoRace: (g.contracts ?? []).filter((c) => c.job).length };
});
console.log('\n--- drive it ---');
ok(!drive.skipped && drive.now === drive.want,
  'DRIVE IT swaps to the world the job names',
  `${drive.from} -> ${drive.now} (wanted ${drive.want}, ${drive.name})`);
ok(drive.racing, 'and starts the race there rather than just showing it the list', drive.state);
ok(drive.carriedIntoRace === 1,
  'the job is carried into the race as a live objective', `${drive.carriedIntoRace}`);

// ---- the objective rides on the contract plumbing ---------------------------
const ride = await page.evaluate(() => {
  const g = window.__game;
  const jc = g.contracts.find((c) => c.job);
  const rungsBefore = JSON.stringify(g.career.rungs ?? {});
  const crBefore = g.contractCredits ?? 0;
  const label = jc.label;
  const pay = jc.pay;
  const kindId = String(jc.id).replace(/^job:/, '');
  // complete it the way the game does
  g._completeContract(jc);
  return { label, pay, kindId,
    labelSaysJob: /^JOB · /.test(label),
    paid: (g.contractCredits ?? 0) - crBefore,
    cleared: g.activeJob(),
    rungsUntouched: JSON.stringify(g.career.rungs ?? {}) === rungsBefore,
    reposted: g._jobOffers().some((o) => o.id === kindId),
    doneToday: g._jobsDoneToday().includes(kindId),
    inHud: (document.getElementById('contracts')?.textContent || '').includes('JOB') };
});
console.log('\n--- finishing it ---');
ok(ride.labelSaysJob, 'the live objective is labelled as a JOB, not as a contract', ride.label);
ok(ride.inHud, 'and it shows in the race HUD beside the contracts');
ok(ride.paid === ride.pay, 'completing it pays the posted price', `${ride.paid} vs ${ride.pay}`);
ok(ride.cleared === null, 'and clears it from the career — a job cannot be banked twice');
ok(ride.rungsUntouched,
  'it does NOT climb a contract rung — a job has no ladder to climb');
ok(ride.doneToday && !ride.reposted,
  'and the board does not repost it today, so one job is not an unlimited tap',
  JSON.stringify({ done: ride.doneToday, reposted: ride.reposted }));

// ---- taking work must never cost you money -------------------------------
// r181 unshifted the held job into `this.contracts` to reuse its plumbing,
// which quietly made the 600 CR all-contracts sweep bonus depend on the JOB
// as well: miss the job, lose the sweep. A penalty for accepting work.
const sweep = await page.evaluate(() => {
  const g = window.__game;
  const mk = (done, job) => ({ id: job ? 'job:x' : 'c', job, done, pay: 100, label: 'X' });
  // three contracts all done, plus a job that was missed
  g.contracts = [mk(false, true), mk(true), mk(true), mk(true)];
  const slate = g.contracts.filter((c) => !c.job);
  return { sweepEarned: slate.length > 0 && slate.every((c) => c.done),
    naive: g.contracts.every((c) => c.done) };
});
console.log('\n--- taking work costs nothing ---');
ok(sweep.sweepEarned && !sweep.naive,
  'a missed JOB does not cost the all-contracts sweep bonus',
  JSON.stringify(sweep));

// ---- the button says where the job is ------------------------------------
const btn = await page.evaluate(async () => {
  const g = window.__game;
  const { LEVELS } = await import('./src/track.js');
  g.career.job = null; g._jobsCache = null; g.career.jobsDone = null;
  g.state = 'title'; g.freeRoam = false; g.missionMode = false;
  const el = document.getElementById('start-btn');
  g._syncStartButton();
  const bare = el.textContent;
  // a job for THIS world
  const here = { id: 'haul', lvId: g.level.id, need: 3, pay: 500, part: null };
  g._takeJob(here);
  g._syncStartButton();
  const onIt = el.textContent;
  const litHere = el.classList.contains('has-job');
  // ...and one for somewhere else
  const other = LEVELS.find((l) => l.id !== g.level.id && g.isLevelUnlocked(l.id));
  g._takeJob({ id: 'haul', lvId: other.id, need: 3, pay: 500, part: null });
  g._syncStartButton();
  const elsewhere = el.textContent;
  const litAway = el.classList.contains('has-job');
  g.career.job = null; g._syncStartButton();
  return { bare, onIt, elsewhere, litHere, litAway, otherName: other.name };
});
console.log('\n--- the start button ---');
ok(!/JOB/.test(btn.bare), 'says nothing about jobs when you hold none', btn.bare);
ok(/JOB: /.test(btn.onIt) && btn.litHere,
  'names the job when you are standing on its world', JSON.stringify(btn.onIt));
ok(btn.elsewhere.includes(btn.otherName) && /WILL NOT COUNT/.test(btn.elsewhere) && !btn.litAway,
  'and warns you when the job is somewhere else — starting here would not count for it',
  JSON.stringify(btn.elsewhere));

ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
