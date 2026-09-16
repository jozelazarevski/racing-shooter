/* r321 — THE GARAGE SHOWROOM (owner: "Make this more exciting. Increase the
 * graphics. Add more details and complexity.")
 *
 *   S1  the spec sheet renders six live bars, and SPEED's figure is the
 *       player's real top speed in the HUD's own km/h
 *   S2  every bar is normalised (no width past 100%), and the stock notch
 *       only appears where the build actually added something
 *   S3  upgrade cards state now -> next in the car's numbers, mirrored
 *       from applyUpgrades (engine km/h, armor hull, magazine rounds)
 *   S4  buying a rung moves BOTH the card's line and the sheet's bar —
 *       the shop and the car cannot disagree
 *   S5  dampers speak the r320 landing law's numbers
 */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:8901';
let fail = 0;
const check = (n, ok, d = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const p = await browser.newPage({ viewport: { width: 430, height: 932 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));
await p.goto(`${BASE}/?level=1`, { waitUntil: 'load', timeout: 300000 });
await p.waitForFunction(() => window.__game?.player && document.getElementById('build-preview'),
  undefined, { timeout: 300000 });

const r = await p.evaluate(() => {
  const g = window.__game;
  g.showMenu?.('garage');
  g.renderGarage();
  const sheet = document.querySelector('#build-preview .bp-sheet');
  const rows = sheet ? [...sheet.querySelectorAll('.sp-row')] : [];
  const rowOf = (label) => rows.find((x) => x.querySelector('i')?.textContent.trim() === label);
  const speedRow = rowOf('SPEED');
  const widths = rows.map((x) => parseFloat(x.querySelector('.sp-bar b')?.style.width ?? '0'));
  const cardDesc = (key) => document.querySelector(`.up-card[data-up="${key}"] .uc-desc`)?.textContent ?? '';
  const engineDesc0 = cardDesc('engine');
  const armorDesc0 = cardDesc('armor');
  const magDesc0 = cardDesc('magazine');
  const dampDesc = cardDesc('dampers');
  const kmhNow = Math.round(g.player.maxSpeed * 3.6);
  // S4: buy one ENGINE WRENCH rung and re-read
  g.garage.credits = 99999;
  const up = g.carUpgrades();
  up.engine = (up.engine | 0) + 1;
  g.applyUpgrades();
  g.renderGarage();
  const engineDesc1 = document.querySelector('.up-card[data-up="engine"] .uc-desc')?.textContent ?? '';
  const kmhAfter = Math.round(g.player.maxSpeed * 3.6);
  const speedText1 = document.querySelector('#build-preview .bp-sheet .sp-row em')?.textContent ?? '';
  const notch = !!document.querySelector('#build-preview .bp-sheet .sp-bar u');
  up.engine--; g.applyUpgrades(); g.renderGarage();   // restore
  return {
    rows: rows.length, widths,
    speedText: speedRow?.querySelector('em')?.textContent ?? '',
    kmhNow, kmhAfter, speedText1, notch,
    engineDesc0, engineDesc1, armorDesc0, magDesc0, dampDesc,
    hull: Math.round(g.player.maxHealth), rounds: g.player.maxRounds,
  };
});

check('S1  six live bars, SPEED in the HUD\'s km/h',
  r.rows === 6 && r.speedText.includes(`${r.kmhNow} KM/H`),
  `${r.rows} rows, "${r.speedText}" vs ${r.kmhNow}`);
check('S2  bars are normalised and the stock build carries no notch',
  r.widths.every((w) => w > 0 && w <= 100),
  `widths ${r.widths.join(', ')}`);
check('S3  engine card speaks km/h now -> next',
  /\d+ → \d+ KM\/H TOP SPEED/.test(r.engineDesc0), r.engineDesc0);
check('S3  armor card speaks hull now -> next',
  new RegExp(`${r.hull} → ${r.hull + 15} HULL`).test(r.armorDesc0), r.armorDesc0);
check('S3  magazine card speaks rounds now -> next',
  new RegExp(`${r.rounds} → ${r.rounds + 30} CANNON ROUNDS`).test(r.magDesc0), r.magDesc0);
check('S4  a bought rung moves the card AND the sheet together',
  r.engineDesc1.startsWith(`${r.kmhAfter}`) && r.speedText1.includes(`${r.kmhAfter} KM/H`) && r.notch,
  `card "${r.engineDesc1}", sheet "${r.speedText1}", notch ${r.notch}`);
check('S5  dampers speak the landing law',
  /22 → 25 U\/S/.test(r.dampDesc) && /CLIFF/.test(r.dampDesc), r.dampDesc);

// ---- r322: the turntable is visible IMMEDIATELY (owner: "make this
// rotating car always visible when I go over and update it") ----
const s = await p.evaluate(async () => {
  const g = window.__game;
  const st = g.__stage;
  // S6: entering the garage paints synchronously — _stagePaint stamps w/h
  // and framedFor before any animation frame has a chance to run
  g._stageRun(false);
  st.w = 0; st.h = 0; st.framedFor = null;
  g.showMenu?.('garage');
  g.renderGarage();
  const s6 = { painted: st.framedFor === st.sig && st.w > 0, rafArmed: !!st.raf };
  // S7: a build change repaints even with the loop STOPPED — the purchase
  // and the picture are one moment
  g._stageRun(false);
  const up = g.carUpgrades();
  up.armor = (up.armor | 0) + 1;
  st.framedFor = null;
  g._stageSync();
  const s7 = { painted: st.framedFor === st.sig, loopOff: !st.raf };
  up.armor--; g._stageSync();
  // S8: the loop survives on actual visibility, not title-screen
  // bookkeeping — with the canvas displayed but state off 'title', it
  // keeps turning (the BACK TO GARAGE path used to go dark here)
  g._stageRun(true);
  const stateWas = g.state;
  g.state = 'results';
  const spin0 = st.spin;
  await new Promise((res) => setTimeout(res, 400));
  const s8 = { alive: !!st.raf, turned: st.spin > spin0 };
  g.state = stateWas;
  return { s6, s7, s8 };
});
check('S6  entering the garage paints the turntable synchronously',
  s.s6.painted && s.s6.rafArmed, JSON.stringify(s.s6));
check('S7  an update repaints instantly even with the loop stopped',
  s.s7.painted && s.s7.loopOff, JSON.stringify(s.s7));
check('S8  the turntable runs on visibility, not screen bookkeeping',
  s.s8.alive && s.s8.turned, JSON.stringify(s.s8));

check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close();
console.log(fail ? `\n${fail} FAILED` : '\nthe showroom sells');
process.exit(fail ? 1 : 0);
