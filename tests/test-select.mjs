/* PICK A THING UP AND CHANGE IT — AND SEE IT CHANGE.
 *
 * "I want to be able to select each of the elements on the track and edit
 * them move/remove/rotate", and "add realtime view on what is changed".
 *
 * Two things had to be true for that. First the editor needs a HANDLE on
 * scenery it did not place: a batched instance is geometry in a buffer with
 * no memory of the template that made it, so the builder now records every
 * structure it puts down (`track.placedElements`) in the same vocabulary
 * `edit.elements` speaks — which is what lets a world house be adopted,
 * moved and rebuilt as itself. Second, the change has to be visible NOW: a
 * selected object is blanked out of the built world the moment you delete or
 * drag it, rather than waiting for APPLY.
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
const page = await browser.newPage({ viewport: { width: 1024, height: 700 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const { WorldEditor } = await import('./src/editor.js');
  const ed = new WorldEditor(g);
  g.editor = ed;
  ed.enter();
  const out = {};

  // ---- the builder now leaves a handle on what it built -------------------
  const reg = g.track.placedElements || [];
  out.registered = reg.length;
  out.hasTemplates = reg.every((e) => typeof e.type === 'string' && e.type.length > 0);

  // ---- SELECT a world structure -------------------------------------------
  ed.tool = 'select';
  const target = reg[Math.floor(reg.length / 2)];
  out.target = target ? { type: target.type, x: +target.x.toFixed(1), z: +target.z.toFixed(1) } : null;
  ed._selectAt({ x: target.x, z: target.z });
  out.selected = !!ed.sel;
  out.selKind = ed.sel && ed.sel.kind;
  out.selPreset = ed.sel && ed.sel.preset;
  out.marked = ed._selGroup ? ed._selGroup.children.length : 0;

  // ---- MOVE it: adopt, then drag ------------------------------------------
  const el = ed._adoptSelection();
  out.adopted = !!el && el.preset === target.type;
  out.erasedAtSource = ed.erase.some((z) => Math.hypot(z.x - target.x, z.z - target.z) < 1);
  out.hiddenLive = ed._hidden.length;          // instances blanked right now
  el.x = target.x + 40; el.z = target.z + 25;  // what _dragSelection does
  out.movedTo = { x: +el.x.toFixed(1), z: +el.z.toFixed(1) };

  // ---- ROTATE it ----------------------------------------------------------
  const rotBefore = el.rot;
  ed.sel = { kind: 'mine', el, x: el.x, z: el.z, rot: el.rot, scale: el.scale, preset: el.preset };
  ed.rotateSelection();
  out.rotated = Math.abs(el.rot - rotBefore) > 0.1;

  // ---- APPLY: it is really there, and really gone from where it was -------
  await new Promise((res) => ed.apply(res));
  const T = g.track;
  const near = (x, z, r) => (T.placedElements || [])
    .filter((e) => Math.hypot(e.x - x, e.z - z) < r).length;
  out.goneFromSource = near(target.x, target.z, 6);
  out.builtAtDest = near(el.x, el.z, 6);

  // ---- DELETE a world object, and see it go at once -----------------------
  const reg2 = g.track.placedElements || [];
  const victim = reg2.find((e) => Math.hypot(e.x - el.x, e.z - el.z) > 60) || reg2[0];
  ed.tool = 'select';
  ed._selectAt({ x: victim.x, z: victim.z });
  const hiddenBefore = ed._hidden.length;
  ed.deleteSelection();
  out.deleteHidNow = ed._hidden.length > hiddenBefore;   // blanked in the LIVE world
  out.deleteRecorded = ed.erase.some((z) => Math.hypot(z.x - victim.x, z.z - victim.z) < 1);
  out.selCleared = ed.sel === null;

  // UNDO puts the instances back
  ed._undo();
  out.undoRestored = ed._hidden.length === hiddenBefore
    && !ed.erase.some((z) => Math.hypot(z.x - victim.x, z.z - victim.z) < 1);

  // ---- the CHANGES panel is a live account --------------------------------
  const panel = () => document.getElementById('ed-changelist').textContent;
  ed._syncChanges();
  const txt = panel();
  out.changesShowsObjects = /objects placed/.test(txt);
  out.changesShowsRemovals = /things removed/.test(txt);
  ed.radius = 30;
  ed.tool = 'raise'; ed.strength = 4;
  ed._strokeFrom = ed.delta.dabs.length;
  ed._dab({ x: T.center[10].x, z: T.center[10].z });
  ed._endStroke();
  ed._syncChanges();
  out.changesTracksDabs = /terrain dabs/.test(panel());

  // ---- a solid with no template: removable, honestly labelled -------------
  const rock = (T.solids || []).find((s) => s.mat !== 'hut');
  if (rock) {
    ed._selectAt({ x: rock.x, z: rock.z });
    out.solidKind = ed.sel && ed.sel.kind;
  }

  ed.exit();
  out.marksClearedOnExit = !ed._selGroup || ed._selGroup.children.length === 0;
  return out;
});

console.log(`--- PINE VALLEY: ${R.registered} registered structures ---`);
ok(R.registered > 0, 'the builder records every structure it places', R.registered);
ok(R.hasTemplates, 'each one remembers the template it was built from');
ok(R.selected && R.selKind === 'world',
  'tapping a world building selects it', `${R.selKind}`);
ok(R.marked >= 2, 'and it is highlighted on screen', `${R.marked} marks`);
ok(R.adopted, 'adopting it keeps its template', R.selPreset);
ok(R.erasedAtSource, 'the original is marked for removal where it stood');
ok(R.hiddenLive > 0,
  'and it leaves the built world IMMEDIATELY — no waiting for APPLY',
  `${R.hiddenLive} instances blanked`);
ok(R.rotated, 'ROTATE turns the selection');
ok(R.goneFromSource === 0,
  'after APPLY nothing stands where it used to', R.goneFromSource);
ok(R.builtAtDest > 0,
  'and it is really built where it was dragged to', R.builtAtDest);
ok(R.deleteHidNow, 'DELETE removes a world object from view at once');
ok(R.deleteRecorded, 'and records it so the rebuild agrees');
ok(R.selCleared, 'the selection clears when its object is gone');
ok(R.undoRestored, 'UNDO puts a deleted object back, instances and all');
ok(R.changesShowsObjects && R.changesShowsRemovals,
  'the CHANGES panel itemises what is pending');
ok(R.changesTracksDabs, 'and updates live as you paint');
ok(R.solidKind === 'solid' || R.solidKind === 'world',
  'a rock or tree is selectable too', R.solidKind);
ok(R.marksClearedOnExit, 'selection furniture leaves with the editor');
ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
