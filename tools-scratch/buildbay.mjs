/* THE BUILD BAY, exercised the way a player would: open a slot, try a part you
 * cannot afford, get told why; buy one you can; watch the stats AND the mesh
 * change; confirm a locked part refuses to fit at any price. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 830 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
await p.goto('http://localhost:8901/?level=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu(); document.getElementById('tab-btn-garage').click(); });

const snap = () => p.evaluate(() => {
  const g = window.__game, pl = g.player;
  const pipes = () => { let n = 0; pl.mesh.getObjectByName('upgradeKit')
    ?.traverse(o => { if (o.geometry?.type === 'CylinderGeometry') n++; }); return n; };
  return { credits: g.garage.credits,
    engine: g.fittedPart('engine').id, spoiler: g.fittedPart('spoiler').id,
    maxSpeed: +pl.maxSpeed.toFixed(2), accel: +pl.accel.toFixed(2),
    gripBoost: +(pl.gripBoost ?? 1).toFixed(3), downforce: pl.downforce ?? 0,
    kitCylinders: pipes(),
    kitParts: pl.mesh.getObjectByName('upgradeKit')?.children.length ?? 0 };
});
const line = async (t) => console.log(`${t.padEnd(24)} ${JSON.stringify(await snap())}`);
await line('stock');

// open the ENGINE slot and try the V12 (locked) with plenty of money
await p.evaluate(() => { window.__game.garage.credits = 50000; window.__game.renderGarage(); });
await p.evaluate(() => document.querySelectorAll('#build-bay .bb-head')[0].click());
const parts = () => p.evaluate(() => [...document.querySelectorAll('#build-bay .bb-slot.open .bb-part')]
  .map(r => r.querySelector('.bb-pn').textContent.trim().replace(/[▮]/g,'')));
console.log('engine options: ' + JSON.stringify(await parts()));
const wingOpts = async () => { await p.evaluate(() => { window.__game._buildOpen='spoiler'; window.__game._renderBuildBay(); });
  const r = await parts(); await p.evaluate(() => { window.__game._buildOpen='engine'; window.__game._renderBuildBay(); }); return r; };
console.log('wing options:   ' + JSON.stringify(await wingOpts()));
await p.evaluate(() => [...document.querySelectorAll('#build-bay .bb-slot.open .bb-part')][3].click()); // V12, locked
console.log('locked msg: ' + await p.evaluate(() =>
  document.querySelector('#build-bay .bb-msg')?.textContent.trim().slice(0, 80)));
await line('after locked tap');
await p.evaluate(() => [...document.querySelectorAll('#build-bay .bb-slot.open .bb-part')][2].click()); // V8
await line('V8 fitted');
// now the wing
await p.evaluate(() => { window.__game._buildOpen = 'spoiler'; window.__game._renderBuildBay(); });
await p.evaluate(() => [...document.querySelectorAll('#build-bay .bb-slot.open .bb-part')][2].click()); // ducktail
await line('+ ducktail');
// broke: try to buy with nothing
await p.evaluate(() => { const g = window.__game; g.garage.credits = 10;
  g._buildOpen = 'spoiler'; g.renderGarage(); });
await p.evaluate(() => [...document.querySelectorAll('#build-bay .bb-slot.open .bb-part')][3].click()); // GT wing
console.log('broke msg: ' + await p.evaluate(() =>
  document.querySelector('#build-bay .bb-msg')?.textContent.trim().slice(0, 90)));
// and it PERSISTS
console.log('persisted: ' + await p.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem(window.__game._pkey('garage')));
  return JSON.stringify(raw.parts?.[window.__game.cars.selected]?.fitted); }));
// RACE FOR THE PART: clear six worlds and the V12 must open, and say so once.
console.log('--- earning the V12 ---');
console.log(await p.evaluate(() => {
  const g = window.__game;
  const L = g.chapters().flatMap(c => c.levels).slice(0, 6);
  for (const lv of L) g.career.finished[lv.id] = { place: 1, time: 60 };
  const slot = [...document.querySelectorAll('#build-bay .bb-head')];
  g._buildOpen = 'engine'; g.renderGarage();
  const v12 = [...document.querySelectorAll('#build-bay .bb-slot.open .bb-part')][3];
  const before = document.getElementById('part-unlock').style.display;
  g._announcePartUnlocks();
  const el = document.getElementById('part-unlock');
  return { v12RowSaysBuyable: v12.textContent.includes('CR'),
    bannerShown: el.style.display !== 'none',
    banner: el.textContent.replace(/\s+/g,' ').trim().slice(0, 70) };
}));
// ...and only ONCE
console.log('second finish announces again: ' + await p.evaluate(() => {
  window.__game._announcePartUnlocks();
  return document.getElementById('part-unlock').style.display !== 'none'; }));
// and now it can actually be bought and fitted
console.log(await p.evaluate(() => {
  const g = window.__game; g.garage.credits = 20000; g._buildOpen='engine'; g.renderGarage();
  [...document.querySelectorAll('#build-bay .bb-slot.open .bb-part')][3].click();
  return { fitted: g.fittedPart('engine').id, credits: g.garage.credits,
    maxSpeed: +g.player.maxSpeed.toFixed(2) }; }));
if (errs.length) console.log('ERR ' + errs.slice(0,3).join(' | '));
await b.close();
