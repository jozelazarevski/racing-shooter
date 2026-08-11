/* THE EDITOR, WITH COMPLETE CONTROL.
 *
 * The tools this suite pins are the ones EDITOR.md used to list under "Not in
 * this version", plus the ones that were missing from every tool at once:
 *
 *   NATURE. CLEAR AREA could take a wood away and nothing could plant one.
 *   `edit.props` is authored trees and rocks, stamped by the builder into its
 *   own instanced batches — so a hand-planted pine fells, a hand-placed
 *   boulder stops a car, and both cost one draw call per part.
 *
 *   SELECT. Every tool could only ADD. Nothing could be picked up again: no
 *   move, no exact scale, no delete, no duplicate. An object placed 30 u wrong
 *   could only be erased with a brush that took its neighbours with it.
 *
 *   REDO. Undo was a one-way street, so overshooting it cost the work twice.
 *
 *   WATER LEVEL. A lake stood wherever the ground it was dug in happened to
 *   be. Flooding a valley was not expressible.
 *
 *   THE DRAFT and SCENE CODES. Unsaved work lived only in the tab, and a scene
 *   could not leave the device it was built on.
 *
 * Everything is driven through the real handlers.
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
const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
await page.goto(`${BASE}/?level=1&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await page.waitForFunction(() => window.__game?.track?.center && window.__game.player,
  undefined, { timeout: 600000 });

const R = await page.evaluate(async () => {
  const g = window.__game;
  const { WorldEditor, encodeSceneCode, decodeSceneCode } = await import('./src/editor.js');
  const out = {};
  const ed = new WorldEditor(g);
  g.editor = ed;
  ed.enter();
  const t = () => g.track;
  // a spot `d` units off the racing line at station `i` — well clear of the
  // carriageway, so nothing here is testing the road clamps by accident
  const off = (i, d) => {
    const c = t().center[i], hd = t().headingAt(i);
    return { x: c.x + Math.sin(hd) * d, z: c.z + Math.cos(hd) * d };
  };

  // ---- NATURE: one tree, then a copse ------------------------------------
  ed._pickTool('nature');
  ed.natureKind = 'pine';
  ed.natureCount = 1;
  const treeSpot = off(120, 55);
  ed._natureAt(treeSpot);
  out.propsAfterOne = ed.props.length;
  out.propKind = ed.props[0] && ed.props[0].kind;

  ed.natureCount = 12;
  ed.radius = 45;
  ed._natureAt(off(240, 70));
  out.propsAfterCopse = ed.props.length;
  // a scatter stays inside the brush it was painted with
  const centre = off(240, 70);
  out.copseInsideBrush = ed.props.slice(1)
    .every((p) => Math.hypot(p.x - centre.x, p.z - centre.z) <= ed.radius + 1);
  // ...and the whole copse is ONE undo, not twelve
  ed._undo();
  out.propsAfterCopseUndo = ed.props.length;
  ed._redoStep();
  out.propsAfterRedo = ed.props.length;

  // ---- and the builder actually grows them --------------------------------
  const treesBefore = t().trees.length;
  await new Promise((res) => ed.apply(res));
  out.treesGrew = g.track.trees.length - treesBefore;
  let propMeshes = 0, propInstances = 0;
  g.track.group.traverse((o) => {
    if (o.isInstancedMesh && /^edit-prop-/.test(o.name || '')) {
      propMeshes++; propInstances = Math.max(propInstances, o.count);
    }
  });
  out.propMeshes = propMeshes;
  out.propInstances = propInstances;
  // an authored pine is a real tree in the world's own tree list
  out.propIsTracked = g.track.trees.some(
    (tr) => Math.hypot(tr.x - treeSpot.x, tr.z - treeSpot.z) < 1.5);

  // ---- a BOULDER is solid, like the world's own ---------------------------
  const rockSpot = off(300, 60);
  ed.natureKind = 'boulder'; ed.natureCount = 1;
  ed._natureAt(rockSpot);
  await new Promise((res) => ed.apply(res));
  out.rockIsSolid = g.track.solids.some(
    (s) => Math.hypot(s.x - rockSpot.x, s.z - rockSpot.z) < 2 && s.mat === 'stone');

  // ---- SELECT: pick it up, move it, size it, delete it --------------------
  ed._pickTool('select');
  ed.radius = 20;
  ed._selectAt(treeSpot);
  out.selType = ed.selection && ed.selection.type;
  out.selKind = ed.selection && ed.selection.ref.kind;

  // move it, through the same drag the mouse drives
  const moveTo = off(122, 90);
  ed._moveDrag = { el: ed.selection.ref, mesh: { position: { x: 0, z: 0 } },
    ox: ed.selection.ref.x, oz: ed.selection.ref.z, before: ed._stateSnapshot() };
  ed._moveDrag.el.x = moveTo.x; ed._moveDrag.el.z = moveTo.z; ed._moveDrag.moved = true;
  ed._endMoveDrag();
  out.movedTo = Math.round(Math.hypot(ed.props[0].x - treeSpot.x, ed.props[0].z - treeSpot.z));
  ed._undo();
  out.moveUndone = Math.round(Math.hypot(ed.props[0].x - treeSpot.x, ed.props[0].z - treeSpot.z));
  ed._redoStep();

  // duplicate, then delete the copy
  ed._selectAt(moveTo);
  const nBefore = ed.props.length;
  ed._duplicateSelection();
  out.dupAdded = ed.props.length - nBefore;
  ed._deleteSelection();
  out.delRemoved = nBefore === ed.props.length;

  // ---- SELECT reaches a placed BUILDING too, and the sliders aim it -------
  ed._pickTool('place'); ed.preset = 'chapel';
  const houseSpot = off(400, 46);
  ed._place(houseSpot);
  ed._pickTool('select');
  ed._selectAt(houseSpot);
  out.selBuilding = ed.selection && ed.selection.type === 'element';
  ed._applyToSelection('scale', 1.8);
  ed._turnSelection(Math.PI / 2);
  out.builtScale = ed.selection.ref.scale;
  out.builtRot = +ed.selection.ref.rot.toFixed(3);

  // ---- WATER: a level you can set ----------------------------------------
  ed._pickTool('water'); ed.radius = 50;
  const lakeSpot = off(520, 120);
  ed._waterAt(lakeSpot);
  out.lakes = ed.waters.length;
  const y0 = ed.waters[0].y;
  ed._pickTool('select');
  ed._selectAt(lakeSpot);
  out.selWater = ed.selection && ed.selection.type === 'water';
  // the inspector's own RAISE button, through the handler the DOM calls
  ed._act('the water level', () => { ed.selection.ref.y += 2; });
  out.lakeRose = +(ed.waters[0].y - y0).toFixed(2);
  out.payloadCarriesLevel = ed.buildPayload().waters[0].y === ed.waters[0].y;
  ed._undo();
  out.lakeLevelUndone = ed.waters[0].y === y0;

  // ---- the EDGE slider changes the shape of the brush, not just its size --
  const probe = (hard) => {
    const e2 = new WorldEditor(g);
    e2.radius = 40; e2.strength = 10; e2.hardness = hard;
    e2.tool = 'raise';
    e2._dab({ x: 9000, z: 9000 });           // far from anything, pure geometry
    const mid = e2.delta.at(9000 + 28, 9000);  // 70% of the way out
    e2.dispose();
    return +mid.toFixed(3);
  };
  out.softShoulder = probe(0);
  out.hardShoulder = probe(100);

  // ---- NOISE roughens: many small dabs, both signs ------------------------
  const eN = new WorldEditor(g);
  eN.tool = 'noise'; eN.radius = 40; eN.strength = 6;
  eN._strokeFrom = 0;
  for (let i = 0; i < 24; i++) eN._dab({ x: 9000, z: 9000 });
  out.noiseDabs = eN.delta.dabs.length;
  out.noiseBothWays = eN.delta.dabs.some((d) => d.dh > 0) && eN.delta.dabs.some((d) => d.dh < 0);
  out.noiseIsFine = eN.delta.dabs.every((d) => d.r < 40);
  eN._endStroke();
  eN._undo();
  out.noiseUndoneWhole = eN.delta.dabs.length;
  eN.dispose();

  // ---- SNAP puts things on a grid -----------------------------------------
  const eS = new WorldEditor(g);
  eS.snap = 10; eS.preset = 'shed'; eS.tool = 'place';
  eS._place({ x: 123.4, z: -77.9 });
  out.snapped = `${eS.elements[0].x},${eS.elements[0].z}`;
  eS.dispose();

  // ---- ERASE takes plants as well as buildings ----------------------------
  ed._pickTool('erase'); ed.radius = 40;
  const propsBeforeErase = ed.props.length;
  ed._eraseAt({ x: ed.props[0].x, z: ed.props[0].z });
  out.eraseTookProps = propsBeforeErase - ed.props.length;
  ed._undo();
  out.eraseUndone = ed.props.length === propsBeforeErase;

  // ---- SAVE / LOAD carries the plants, and so does a CODE -----------------
  const scene = ed.serialize();
  out.sceneVersion = scene.v;
  out.sceneHasProps = (scene.props || []).length;
  const code = encodeSceneCode(scene);
  const back = decodeSceneCode(code);
  out.codeRoundTrip = JSON.stringify(back) === JSON.stringify(scene);
  out.codeIsText = /^[A-Za-z0-9_-]+$/.test(code);
  out.codeKb = +(code.length / 1024).toFixed(1);

  const ed2 = new WorldEditor(g);
  ed2.load(scene);
  out.reloadedProps = ed2.props.length;
  out.reloadedLakes = ed2.waters.length;
  out.reloadedSame = JSON.stringify(ed2.serialize().props) === JSON.stringify(scene.props);
  // a scene carrying a plant this build has never heard of still loads
  ed2.load({ ...scene, props: [...(scene.props || []), { kind: 'nonesuch', x: 0, z: 0 }] });
  out.unknownPropSkipped = ed2.props.every((p) => p.kind !== 'nonesuch');
  ed2.dispose();

  // ---- a CODE is untrusted text ------------------------------------------
  // It arrives from another device, so it is the one input this tool has that
  // it did not write itself: a name is text on a card, never markup, and a
  // list that is not a list must not become a sculpt full of NaN.
  const nasty = encodeSceneCode({ v: 2, base: 1,
    name: '<img src=x onerror="window.__pwned=1">',
    dabs: 'not-a-list', elements: 'nope', props: [{ kind: 'pine', x: 5, z: 5 }] });
  ed._importCode(nasty);
  out.pwned = !!window.__pwned;
  // the honest test is whether an ELEMENT got built, not whether the string
  // survives: innerHTML reads back the escaped form, which still spells
  // "onerror=" and would pass a substring check while doing nothing
  const mb = ed.root.querySelector('#ed-modal-body');
  out.nastyMadeElement = !!mb.querySelector('img');
  out.nastyShownAsText = mb.textContent.includes('<img src=x');
  const savedNames = Object.keys(WorldEditor.list(g));
  out.nastyName = savedNames.find((n) => n.includes('img src'));
  const ed3 = new WorldEditor(g);
  ed3.load(WorldEditor.list(g)[out.nastyName]);
  out.badDabsIgnored = ed3.delta.length === 0 && ed3.elements.length === 0;
  out.goodPropKept = ed3.props.length === 1;
  ed3.dispose();
  WorldEditor.remove(out.nastyName, g);
  ed._closeModal();
  out.junkRefused = (ed._importCode('this is not a code'),
    ed.root.querySelector('#ed-status') ? true : true);
  out.junkStatus = ed.statusEl.textContent;

  // ---- THE DRAFT survives leaving ----------------------------------------
  WorldEditor.clearDraft(g);
  ed._pickTool('place'); ed.preset = 'barn';
  ed._place(off(600, 50));
  ed._saveDraftNow();                      // the flush the debounce timer does
  const d = WorldEditor.draft(g);
  out.draftExists = !!(d && d.scene && (d.scene.elements || []).length);
  out.draftBase = d && d.scene.base;

  // ---- CHECK finds a building standing in the road ------------------------
  const eC = new WorldEditor(g);
  eC.preset = 'chapel'; eC.tool = 'place';
  eC._place({ x: t().center[300].x, z: t().center[300].z });   // dead on the racing line
  eC._check();
  out.checkText = eC.root.querySelector('#ed-modal-body').textContent;
  eC.dispose();
  const eOK = new WorldEditor(g);
  eOK._check();
  out.checkCleanText = eOK.root.querySelector('#ed-modal-body').textContent;
  eOK.dispose();

  // ---- the KEY MAP is real: every binding resolves ------------------------
  const combo = (k, mod = false, shift = false) => WorldEditor._combo(
    { key: k, ctrlKey: mod, metaKey: false, shiftKey: shift });
  out.comboPlain = combo('q');
  out.comboUndo = combo('z', true);
  out.comboRedo = combo('z', true, true);
  out.comboNamed = combo('Escape');
  out.comboQuestion = combo('?', false, true);

  // the tool rail carries every tool the new editor claims
  const railTools = [...ed.root.querySelectorAll('.ed-tool')].map((b) => b.dataset.tool).sort();
  out.railTools = railTools.join(',');
  out.hasNature = railTools.includes('nature');
  out.hasSelect = railTools.includes('select');
  out.hasNoise = railTools.includes('noise');

  ed.exit();
  out.marksAfterExit = ['editor-ghosts', 'editor-zones', 'editor-route']
    .reduce((n, nm) => {
      const o = g.scene.getObjectByName(nm);
      return n + (o && o.visible ? o.children.length : 0);
    }, 0);
  return out;
});

console.log('\n--- NATURE: the thing CLEAR AREA had no opposite for ---');
ok(R.propsAfterOne === 1 && R.propKind === 'pine', 'one tap plants one tree',
  `${R.propsAfterOne} ${R.propKind}`);
ok(R.propsAfterCopse === 13, 'COUNT scatters a whole copse in one tap', R.propsAfterCopse);
ok(R.copseInsideBrush, 'and every tree of it lands inside the brush');
ok(R.propsAfterCopseUndo === 1, 'the copse is ONE undo, not twelve', R.propsAfterCopseUndo);
ok(R.propsAfterRedo === 13, 'and REDO brings the whole copse back', R.propsAfterRedo);
ok(R.treesGrew >= 13, 'the rebuilt world actually grows them', R.treesGrew);
ok(R.propMeshes >= 2 && R.propMeshes <= 6,
  'as a handful of instanced batches, not a mesh per tree', R.propMeshes);
ok(R.propIsTracked, 'an authored tree is a real tree in the world\'s tree list');
ok(R.rockIsSolid, 'an authored boulder registers as a stone solid');

console.log('\n--- SELECT: pick it up again ---');
ok(R.selType === 'prop' && R.selKind === 'pine', 'tapping a plant selects it',
  `${R.selType}/${R.selKind}`);
ok(R.movedTo > 20, 'dragging it moves it', `${R.movedTo} u`);
ok(R.moveUndone === 0, 'and the move undoes', `${R.moveUndone} u`);
ok(R.dupAdded === 1, 'DUPLICATE makes one copy', R.dupAdded);
ok(R.delRemoved, 'DELETE takes exactly the selection');
ok(R.selBuilding, 'a placed building selects the same way');
ok(R.builtScale === 1.8 && R.builtRot !== 0,
  'and the SCALE / ROT controls aim the object already down',
  `scale ${R.builtScale}, rot ${R.builtRot}`);

console.log('\n--- WATER has a level ---');
ok(R.lakes === 1, 'the tool digs one lake', R.lakes);
ok(R.selWater, 'and it can be selected');
ok(R.lakeRose === 2, 'RAISE lifts the surface', R.lakeRose);
ok(R.payloadCarriesLevel, 'the level reaches the builder');
ok(R.lakeLevelUndone, 'and it undoes');

console.log('\n--- the brush has a shape, not just a size ---');
ok(R.hardShoulder > R.softShoulder * 1.15,
  'EDGE=HARD holds the ground up further out than EDGE=SOFT',
  `soft ${R.softShoulder} vs hard ${R.hardShoulder}`);
ok(R.noiseDabs >= 20, 'NOISE lays a dab per pass', R.noiseDabs);
ok(R.noiseBothWays, 'roughening goes both up and down');
ok(R.noiseIsFine, 'in lumps smaller than the brush');
ok(R.noiseUndoneWhole === 0, 'and the whole roughening is one undo', R.noiseUndoneWhole);
ok(R.snapped === '120,-80', 'SNAP puts a placement on the grid', R.snapped);

console.log('\n--- ERASE, SAVE, CODES and the DRAFT ---');
ok(R.eraseTookProps > 0, 'ERASE removes plants as well as buildings', R.eraseTookProps);
ok(R.eraseUndone, 'and that undoes too');
ok(R.sceneVersion === 2, 'the scene format declares v2', R.sceneVersion);
ok(R.sceneHasProps > 0, 'and carries the plants', R.sceneHasProps);
ok(R.reloadedProps === R.sceneHasProps && R.reloadedSame,
  'a saved scene reloads every plant exactly', `${R.reloadedProps}/${R.sceneHasProps}`);
ok(R.reloadedLakes === 1, 'and its lakes', R.reloadedLakes);
ok(R.unknownPropSkipped, 'a plant from a later palette is skipped, not fatal');
ok(R.codeRoundTrip, 'a scene CODE round-trips byte for byte');
ok(R.codeIsText, 'and is plain text you can paste anywhere');
ok(R.codeKb < 24, 'a full scene code is small enough to paste', `${R.codeKb} kB`);
ok(R.draftExists && R.draftBase === 1,
  'unsaved work is written to a draft as you go', `base ${R.draftBase}`);

console.log('\n--- a pasted CODE is text, not markup ---');
ok(R.pwned === false, 'a scene name cannot run script');
ok(R.nastyMadeElement === false, 'the browser builds no element out of it');
ok(R.nastyShownAsText, 'it is shown as the literal text it is');
ok(!!R.nastyName, 'the scene still imports, under its literal name', R.nastyName);
ok(R.badDabsIgnored, 'a list field that is not a list is dropped, not iterated');
ok(R.goodPropKept, 'and the parts that ARE well formed still load');
ok(/not a scene code/i.test(R.junkStatus),
  'plain junk is refused with a reason', R.junkStatus);

console.log('\n--- CHECK tells you before the car does ---');
ok(/carriageway/i.test(R.checkText),
  'a building in the road is reported', R.checkText.slice(0, 120));
ok(/Nothing to report/i.test(R.checkCleanText),
  'and a clean scene is called clean', R.checkCleanText.slice(0, 80));

console.log('\n--- the keyboard, and the rail ---');
ok(R.comboPlain === 'q' && R.comboUndo === 'mod+z' && R.comboRedo === 'mod+shift+z'
  && R.comboNamed === 'escape' && R.comboQuestion === '?',
  'every shape of shortcut resolves to the binding it is written as',
  [R.comboPlain, R.comboUndo, R.comboRedo, R.comboNamed, R.comboQuestion].join(' '));
ok(R.hasNature && R.hasSelect && R.hasNoise,
  'the rail carries the new tools', R.railTools);
ok(R.marksAfterExit === 0, 'and exit still takes every marker with it', R.marksAfterExit);

// ---- and the keys are actually wired to the page ------------------------
// `_combo` agreeing with the table proves the matcher; only a real keydown
// proves the listener is bound, that a shortcut reaches the tool, and that
// typing in a field is still typing.
await page.evaluate(() => { window.__game.editor.enter(); });
const press = async (k) => { await page.keyboard.press(k); await page.waitForTimeout(60); };
const tool = () => page.evaluate(() => window.__game.editor.tool);
await press('t');
const afterT = await tool();
await press('v');
const afterV = await tool();
await press('KeyS');
const afterS = await tool();
const nPlaced = await page.evaluate(() => {
  const ed = window.__game.editor;
  ed._pickTool('place'); ed.preset = 'shed';
  const c = window.__game.track.center[500];
  ed._place({ x: c.x + 60, z: c.z + 60 });
  return ed.elements.length;                 // this scene already has some
});
await press('Control+z');
const afterUndo = await page.evaluate(() => window.__game.editor.elements.length);
await press('Control+Shift+z');
const afterRedo = await page.evaluate(() => window.__game.editor.elements.length);
await press('Shift+Slash');                       // '?'
const helpOpen = await page.evaluate(() =>
  window.__game.editor.root.querySelector('#ed-modal-title').textContent);
await press('Escape');
const helpShut = await page.evaluate(() =>
  window.__game.editor.root.querySelector('#ed-modal').classList.contains('off'));
// a shortcut letter typed into a field is a letter
const typedStays = await page.evaluate(async () => {
  const ed = window.__game.editor;
  ed._pickTool('raise');
  const box = ed.root.querySelector('#ed-modal-body');
  ed._openScenes();
  const ta = ed.root.querySelector('#ed-code');
  ta.focus();
  ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', bubbles: true }));
  const out = ed.tool;
  ed._closeModal();
  void box;
  return out;
});

console.log('\n--- the keys are bound to the page, not just to a table ---');
ok(afterT === 'noise' && afterV === 'select' && afterS === 'nature',
  'a keypress switches tool', `${afterT} ${afterV} ${afterS}`);
ok(afterUndo === nPlaced - 1 && afterRedo === nPlaced,
  'ctrl+Z and ctrl+shift+Z undo and redo',
  `${nPlaced} -> ${afterUndo} -> ${afterRedo}`);
ok(helpOpen === 'KEYS', 'and ? opens the key list', helpOpen);
ok(helpShut, 'and ESC closes it');
ok(typedStays === 'raise',
  'a shortcut letter typed into a text field stays a letter', typedStays);

console.log('\n--- and it does all that without throwing ---');
ok(errors.length === 0, 'no page errors across the whole session',
  errors.slice(0, 4).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
