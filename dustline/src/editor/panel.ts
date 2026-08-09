// The property panel.
//
// Every field here is a thing that used to be a literal in the engine. The snow
// line was `z < -150` inside `surfaceIdAt`; it is now a number box. The jump was
// `Math.exp(-((t-0.62)**2)/0.00028) * 5.5`; it is now three number boxes with
// names. That translation is the entire point of the exercise — the complaint
// was "I waste too much time asking for the worlds to be fixed", and the fix is
// not a faster way to ask, it is not having to.
//
// The panel is rebuilt wholesale on every change rather than diffed. It is a
// few hundred DOM nodes on a human-speed interaction; a virtual DOM here would
// be machinery earning nothing.

import type {
  TrackDef, SurfaceId, HeightOctave, SurfaceZone, ZonePredicate, SceneryLayer,
} from '../tracks/trackDef';
import { SURFACE_IDS } from '../tracks/trackDef';
import { templateIds, getTemplate } from '../world/props/registry';

export type TabId = 'shape' | 'terrain' | 'surfaces' | 'scenery' | 'props' | 'sky';

type Commit = (mutate: (d: TrackDef) => void, label: string) => void;

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

function group(parent: HTMLElement, title: string): HTMLElement {
  const g = el('div', 'grp');
  g.appendChild(el('h3', undefined, title));
  parent.appendChild(g);
  return g;
}

function hint(parent: HTMLElement, text: string) {
  parent.appendChild(el('p', 'hint', text));
}

function numRow(
  parent: HTMLElement, label: string, value: number, onChange: (v: number) => void,
  opts: { step?: number; min?: number; max?: number } = {},
) {
  const row = el('div', 'row');
  row.appendChild(el('label', undefined, label));
  const inp = el('input');
  inp.type = 'number';
  inp.value = String(value);
  if (opts.step !== undefined) inp.step = String(opts.step);
  if (opts.min !== undefined) inp.min = String(opts.min);
  if (opts.max !== undefined) inp.max = String(opts.max);
  // `change` not `input`: committing on every keystroke would push a hundred
  // undo entries for one number and rebuild the preview while you type a minus
  inp.addEventListener('change', () => {
    const v = parseFloat(inp.value);
    if (Number.isFinite(v)) onChange(v);
  });
  row.appendChild(inp);
  parent.appendChild(row);
  return inp;
}

function textRow(parent: HTMLElement, label: string, value: string, onChange: (v: string) => void) {
  const row = el('div', 'row');
  row.appendChild(el('label', undefined, label));
  const inp = el('input');
  inp.type = 'text';
  inp.value = value;
  inp.addEventListener('change', () => onChange(inp.value));
  row.appendChild(inp);
  parent.appendChild(row);
}

function selectRow<T extends string>(
  parent: HTMLElement, label: string, value: T, options: readonly T[], onChange: (v: T) => void,
) {
  const row = el('div', 'row');
  row.appendChild(el('label', undefined, label));
  const sel = el('select');
  for (const o of options) {
    const opt = el('option', undefined, o);
    opt.value = o;
    sel.appendChild(opt);
  }
  sel.value = value;
  sel.addEventListener('change', () => onChange(sel.value as T));
  row.appendChild(sel);
  parent.appendChild(row);
}

function checkRow(parent: HTMLElement, label: string, value: boolean, onChange: (v: boolean) => void) {
  const row = el('div', 'row check');
  const inp = el('input');
  inp.type = 'checkbox';
  inp.checked = value;
  inp.addEventListener('change', () => onChange(inp.checked));
  row.appendChild(inp);
  row.appendChild(el('label', undefined, label));
  parent.appendChild(row);
}

function colorRow(parent: HTMLElement, label: string, value: string, onChange: (v: string) => void) {
  const row = el('div', 'row');
  row.appendChild(el('label', undefined, label));
  const inp = el('input');
  inp.type = 'color';
  inp.value = value;
  inp.addEventListener('change', () => onChange(inp.value));
  row.appendChild(inp);
  parent.appendChild(row);
}

function card(parent: HTMLElement, title: string, onRemove?: () => void): HTMLElement {
  const c = el('div', 'card');
  const head = el('header');
  head.appendChild(el('b', undefined, title));
  if (onRemove) {
    const x = el('button', 'mini', '✕');
    x.addEventListener('click', onRemove);
    head.appendChild(x);
  }
  c.appendChild(head);
  parent.appendChild(c);
  return c;
}

function addButton(parent: HTMLElement, label: string, onClick: () => void) {
  const b = el('button', 'add', label);
  b.addEventListener('click', onClick);
  parent.appendChild(b);
}

// ---------------------------------------------------------------------------

export function renderPanel(
  root: HTMLElement, def: TrackDef, tab: TabId, commit: Commit,
  selectedProp = -1, onSelectProp: (i: number) => void = () => {},
) {
  root.innerHTML = '';
  switch (tab) {
    case 'shape': return shapeTab(root, def, commit);
    case 'terrain': return terrainTab(root, def, commit);
    case 'surfaces': return surfacesTab(root, def, commit);
    case 'scenery': return sceneryTab(root, def, commit);
    case 'props': return propsTab(root, def, commit, selectedProp, onSelectProp);
    case 'sky': return skyTab(root, def, commit);
  }
}

function shapeTab(root: HTMLElement, def: TrackDef, commit: Commit) {
  const g = group(root, 'Identity');
  textRow(g, 'id', def.id, (v) => commit((d) => { d.id = v.trim() || d.id; }, 'id'));
  numRow(g, 'seed', def.seed, (v) => commit((d) => { d.seed = v | 0; }, 'seed'), { step: 1 });
  hint(g, 'The seed decides every scattered tree, rock and cloud. Same seed, same world — '
    + 'change it to reshuffle the scatter without touching the layout.');

  const r = group(root, 'Road');
  numRow(r, 'half-width (m)', def.road.halfWidth, (v) => commit((d) => { d.road.halfWidth = v; }, 'half-width'), { step: 0.5, min: 2 });
  numRow(r, 'verge blend (m)', def.road.blend, (v) => commit((d) => { d.road.blend = v; }, 'blend'), { step: 1, min: 0 });
  numRow(r, 'samples', def.road.samples, (v) => commit((d) => { d.road.samples = Math.max(64, v | 0); }, 'samples'), { step: 20, min: 64 });
  hint(r, 'Samples is how finely the loop is walked — it sets the resolution of the road mesh, '
    + 'the racing line and the surface bands. 480 is the shipped value.');

  const s = group(root, 'Start');
  numRow(s, 'pad radius (m)', def.start.padRadius, (v) => commit((d) => { d.start.padRadius = v; }, 'pad radius'), { step: 5, min: 0 });
  selectRow(s, 'pad surface', def.start.padSurface, SURFACE_IDS, (v) => commit((d) => { d.start.padSurface = v; }, 'pad surface'));
  checkRow(s, 'painted tuning rings', def.start.tuningRings, (v) => commit((d) => { d.start.tuningRings = v; }, 'tuning rings'));
  hint(s, 'The pad is a flat apron at the start line. The grid forms here, so a pad smaller than '
    + 'the field will start cars on a slope.');

  const w = group(root, 'World');
  numRow(w, 'size (m)', def.world.size, (v) => commit((d) => { d.world.size = Math.max(200, v); }, 'world size'), { step: 50, min: 200 });
  numRow(w, 'mesh res', def.world.meshRes, (v) => commit((d) => { d.world.meshRes = Math.max(32, v | 0); }, 'mesh res'), { step: 16, min: 32 });
  numRow(w, 'road field res', def.world.sdfRes, (v) => commit((d) => { d.world.sdfRes = Math.max(64, v | 0); }, 'sdf res'), { step: 20, min: 64 });
  hint(w, 'Mesh res is the terrain grid — it is also the collider, so raising it costs physics as '
    + 'well as frames. Road field res sets how precisely the road edge is found; the build cost '
    + 'grows with its square.');
}

function terrainTab(root: HTMLElement, def: TrackDef, commit: Commit) {
  const g = group(root, 'Landscape');
  hint(g, 'Octaves are the rolling country away from the road. Each is a wave over the map; '
    + 'stack a big slow one and a small fast one for hills with texture.');
  def.terrain.octaves.forEach((o, i) => {
    const c = card(g, `${o.kind} ${i + 1}`, () => commit((d) => { d.terrain.octaves.splice(i, 1); }, 'remove octave'));
    numRow(c, 'amplitude (m)', o.amp, (v) => commit((d) => { d.terrain.octaves[i].amp = v; }, 'octave amp'), { step: 0.5 });
    if (o.kind === 'wave') {
      numRow(c, 'freq x', o.fx, (v) => commit((d) => { (d.terrain.octaves[i] as { fx: number }).fx = v; }, 'freq'), { step: 0.005 });
      numRow(c, 'freq z', o.fz, (v) => commit((d) => { (d.terrain.octaves[i] as { fz: number }).fz = v; }, 'freq'), { step: 0.005 });
      numRow(c, 'phase', o.phase, (v) => commit((d) => { (d.terrain.octaves[i] as { phase: number }).phase = v; }, 'phase'), { step: 0.1 });
    } else {
      numRow(c, 'freq x', o.freqX, (v) => commit((d) => { (d.terrain.octaves[i] as { freqX: number }).freqX = v; }, 'freq'), { step: 0.005 });
      numRow(c, 'phase x', o.phaseX, (v) => commit((d) => { (d.terrain.octaves[i] as { phaseX: number }).phaseX = v; }, 'phase'), { step: 0.1 });
      numRow(c, 'freq z', o.freqZ, (v) => commit((d) => { (d.terrain.octaves[i] as { freqZ: number }).freqZ = v; }, 'freq'), { step: 0.005 });
      numRow(c, 'phase z', o.phaseZ, (v) => commit((d) => { (d.terrain.octaves[i] as { phaseZ: number }).phaseZ = v; }, 'phase'), { step: 0.1 });
    }
  });
  addButton(g, '+ rolling octave', () => commit((d) => {
    d.terrain.octaves.push({
      kind: 'product', amp: 4, freqX: 0.02, phaseX: 0, fnX: 'sin', freqZ: 0.02, phaseZ: 0, fnZ: 'cos',
    } as HeightOctave);
  }, 'add octave'));
  addButton(g, '+ diagonal ridge', () => commit((d) => {
    d.terrain.octaves.push({ kind: 'wave', amp: 2, fx: 0.03, fz: 0.03, phase: 0 } as HeightOctave);
  }, 'add octave'));

  const rp = group(root, 'Slopes');
  hint(rp, 'A ramp lifts one side of the map — how the original gets its snow-capped north.');
  def.terrain.ramps.forEach((rm, i) => {
    const c = card(rp, `ramp ${i + 1}`, () => commit((d) => { d.terrain.ramps.splice(i, 1); }, 'remove ramp'));
    selectRow(c, 'axis', rm.axis, ['x', 'z'] as const, (v) => commit((d) => { d.terrain.ramps[i].axis = v; }, 'ramp axis'));
    selectRow(c, 'rises where', rm.dir, ['lt', 'gt'] as const, (v) => commit((d) => { d.terrain.ramps[i].dir = v; }, 'ramp dir'));
    numRow(c, 'beyond (m)', rm.beyond, (v) => commit((d) => { d.terrain.ramps[i].beyond = v; }, 'ramp beyond'), { step: 10 });
    numRow(c, 'slope (m/m)', rm.slope, (v) => commit((d) => { d.terrain.ramps[i].slope = v; }, 'ramp slope'), { step: 0.01 });
    numRow(c, 'max rise (m)', rm.max, (v) => commit((d) => { d.terrain.ramps[i].max = v; }, 'ramp max'), { step: 1 });
  });
  addButton(rp, '+ ramp', () => commit((d) => {
    d.terrain.ramps.push({ axis: 'z', beyond: -140, dir: 'lt', slope: 0.08, max: 14 });
  }, 'add ramp'));

  const wt = group(root, 'Water');
  hint(wt, 'One level for the whole map: every square metre of land below it is under water. '
    + 'Where the water goes is decided by the LAND — sink a bay with an octave or a ramp and it '
    + 'fills. Boats float at this height wherever you drop them.');
  if (!def.water) {
    addButton(wt, '+ flood below a level', () => commit((d) => {
      d.water = { level: 0, color: '#3f7f96', deep: '#12384c', deepAt: 6, opacity: 0.78 };
    }, 'add water'));
  } else {
    const wc = card(wt, 'water', () => commit((d) => { delete d.water; }, 'remove water'));
    numRow(wc, 'level (m)', def.water.level, (v) => commit((d) => { d.water!.level = v; }, 'water level'), { step: 0.5 });
    numRow(wc, 'deep at (m)', def.water.deepAt, (v) => commit((d) => { d.water!.deepAt = Math.max(0.5, v); }, 'water deepAt'), { step: 0.5, min: 0.5 });
    numRow(wc, 'opacity', def.water.opacity, (v) => commit((d) => { d.water!.opacity = Math.max(0, Math.min(1, v)); }, 'water opacity'), { step: 0.05, min: 0, max: 1 });
    colorRow(wc, 'shallow', def.water.color, (v) => commit((d) => { d.water!.color = v; }, 'water colour'));
    colorRow(wc, 'deep', def.water.deep, (v) => commit((d) => { d.water!.deep = v; }, 'water deep colour'));
    hint(wc, 'The road is NOT lifted clear of the water. Raise the level past the lowest point of '
      + 'the road profile and you will flood the lap — which the validator warns about, because a '
      + 'ford is a fine thing to want and a submerged circuit is not.');
  }

  const rd = group(root, 'Road profile');
  hint(rd, 'The road has its own elevation, independent of the land — waves are rolling '
    + 'gradient over the lap, crests are jumps. A narrow crest is a kicker; a wide one is a hill.');
  def.terrain.road.waves.forEach((wv, i) => {
    const c = card(rd, `wave ${i + 1}`, () => commit((d) => { d.terrain.road.waves.splice(i, 1); }, 'remove wave'));
    numRow(c, 'amplitude (m)', wv.amp, (v) => commit((d) => { d.terrain.road.waves[i].amp = v; }, 'wave amp'), { step: 0.2 });
    numRow(c, 'cycles / lap', wv.cycles, (v) => commit((d) => { d.terrain.road.waves[i].cycles = v; }, 'wave cycles'), { step: 1 });
    numRow(c, 'phase', wv.phase, (v) => commit((d) => { d.terrain.road.waves[i].phase = v; }, 'wave phase'), { step: 0.1 });
  });
  addButton(rd, '+ wave', () => commit((d) => { d.terrain.road.waves.push({ amp: 2, cycles: 3, phase: 0 }); }, 'add wave'));

  def.terrain.road.crests.forEach((cr, i) => {
    const c = card(rd, `crest ${i + 1}`, () => commit((d) => { d.terrain.road.crests.splice(i, 1); }, 'remove crest'));
    numRow(c, 'at (lap 0–1)', cr.at, (v) => commit((d) => { d.terrain.road.crests[i].at = Math.max(0, Math.min(1, v)); }, 'crest at'), { step: 0.01, min: 0, max: 1 });
    numRow(c, 'height (m)', cr.height, (v) => commit((d) => { d.terrain.road.crests[i].height = v; }, 'crest height'), { step: 0.5 });
    numRow(c, 'width', cr.width, (v) => commit((d) => { d.terrain.road.crests[i].width = Math.max(1e-6, v); }, 'crest width'), { step: 0.0001 });
  });
  addButton(rd, '+ crest / jump', () => commit((d) => {
    d.terrain.road.crests.push({ at: 0.5, height: 5, width: 0.0003 });
  }, 'add crest'));
}

function predicateCard(parent: HTMLElement, p: ZonePredicate, zi: number, pi: number, commit: Commit) {
  const c = card(parent, p.kind, () => commit((d) => { d.surfaces.zones[zi].any.splice(pi, 1); }, 'remove rule'));
  const zp = (d: TrackDef) => d.surfaces.zones[zi].any[pi];
  if (p.kind === 'circle') {
    numRow(c, 'centre x', p.x, (v) => commit((d) => { (zp(d) as { x: number }).x = v; }, 'zone x'), { step: 10 });
    numRow(c, 'centre z', p.z, (v) => commit((d) => { (zp(d) as { z: number }).z = v; }, 'zone z'), { step: 10 });
    numRow(c, 'radius (m)', p.radius, (v) => commit((d) => { (zp(d) as { radius: number }).radius = v; }, 'zone radius'), { step: 5 });
    numRow(c, 'off-road radius', p.offroadRadius ?? p.radius,
      (v) => commit((d) => { (zp(d) as { offroadRadius: number }).offroadRadius = v; }, 'zone radius'), { step: 5 });
  } else if (p.kind === 'halfPlane') {
    selectRow(c, 'axis', p.axis, ['x', 'z'] as const, (v) => commit((d) => { (zp(d) as { axis: 'x' | 'z' }).axis = v; }, 'zone axis'));
    selectRow(c, 'side', p.op, ['lt', 'gt'] as const, (v) => commit((d) => { (zp(d) as { op: 'lt' | 'gt' }).op = v; }, 'zone side'));
    numRow(c, 'at (m)', p.value, (v) => commit((d) => { (zp(d) as { value: number }).value = v; }, 'zone value'), { step: 10 });
  } else {
    numRow(c, 'above (m)', p.height, (v) => commit((d) => { (zp(d) as { height: number }).height = v; }, 'zone height'), { step: 1 });
  }
}

function surfacesTab(root: HTMLElement, def: TrackDef, commit: Commit) {
  const g = group(root, 'Defaults');
  selectRow(g, 'road', def.surfaces.road, SURFACE_IDS, (v) => commit((d) => { d.surfaces.road = v; }, 'road surface'));
  selectRow(g, 'off-road', def.surfaces.offroad, SURFACE_IDS, (v) => commit((d) => { d.surfaces.offroad = v; }, 'offroad surface'));

  const b = group(root, 'Road bands');
  hint(b, 'A stretch of the lap, by fraction, with its own surface — the gravel section between '
    + 'two tarmac ones. Bands only apply on the road.');
  def.surfaces.bands.forEach((band, i) => {
    const c = card(b, `${band.surface} ${band.from}–${band.to}`, () => commit((d) => { d.surfaces.bands.splice(i, 1); }, 'remove band'));
    numRow(c, 'from (0–1)', band.from, (v) => commit((d) => { d.surfaces.bands[i].from = v; }, 'band from'), { step: 0.01, min: 0, max: 1 });
    numRow(c, 'to (0–1)', band.to, (v) => commit((d) => { d.surfaces.bands[i].to = v; }, 'band to'), { step: 0.01, min: 0, max: 1 });
    selectRow(c, 'surface', band.surface, SURFACE_IDS, (v) => commit((d) => { d.surfaces.bands[i].surface = v; }, 'band surface'));
  });
  addButton(b, '+ band', () => commit((d) => { d.surfaces.bands.push({ from: 0.1, to: 0.3, surface: 'gravel' }); }, 'add band'));

  const z = group(root, 'Zones');
  hint(z, 'Regions of the map that override the surface. Rules inside a zone are OR-ed: the snow '
    + 'zone is "north of a line OR above an altitude". Zones are checked in order, first match wins.');
  def.surfaces.zones.forEach((zone, zi) => {
    const c = card(z, zone.id || `zone ${zi + 1}`, () => commit((d) => { d.surfaces.zones.splice(zi, 1); }, 'remove zone'));
    textRow(c, 'name', zone.id, (v) => commit((d) => { d.surfaces.zones[zi].id = v; }, 'zone name'));
    selectRow(c, 'surface', zone.surface, SURFACE_IDS, (v) => commit((d) => { d.surfaces.zones[zi].surface = v; }, 'zone surface'));
    checkRow(c, 'affects road', zone.onRoad, (v) => commit((d) => { d.surfaces.zones[zi].onRoad = v; }, 'zone on road'));
    checkRow(c, 'affects open country', zone.offRoad, (v) => commit((d) => { d.surfaces.zones[zi].offRoad = v; }, 'zone off road'));
    zone.any.forEach((p, pi) => predicateCard(c, p, zi, pi, commit));
    const addRow = el('div');
    addButton(addRow, '+ circle', () => commit((d) => {
      d.surfaces.zones[zi].any.push({ kind: 'circle', x: 0, z: 0, radius: 80 });
    }, 'add rule'));
    addButton(addRow, '+ line', () => commit((d) => {
      d.surfaces.zones[zi].any.push({ kind: 'halfPlane', axis: 'z', op: 'lt', value: -150 });
    }, 'add rule'));
    addButton(addRow, '+ altitude', () => commit((d) => {
      d.surfaces.zones[zi].any.push({ kind: 'aboveHeight', height: 13 });
    }, 'add rule'));
    c.appendChild(addRow);

    if (zone.stripe) {
      const sc = card(c, 'stripe', () => commit((d) => { delete d.surfaces.zones[zi].stripe; }, 'remove stripe'));
      numRow(sc, 'period (lap)', zone.stripe.period, (v) => commit((d) => { d.surfaces.zones[zi].stripe!.period = v; }, 'stripe period'), { step: 0.01 });
      numRow(sc, 'duty (lap)', zone.stripe.duty, (v) => commit((d) => { d.surfaces.zones[zi].stripe!.duty = v; }, 'stripe duty'), { step: 0.002 });
      selectRow(sc, 'surface', zone.stripe.surface, SURFACE_IDS, (v) => commit((d) => { d.surfaces.zones[zi].stripe!.surface = v; }, 'stripe surface'));
    } else {
      addButton(c, '+ patches (e.g. ice)', () => commit((d) => {
        d.surfaces.zones[zi].stripe = { period: 0.07, duty: 0.012, surface: 'ice' };
      }, 'add stripe'));
    }
  });
  addButton(z, '+ zone', () => commit((d) => {
    d.surfaces.zones.push({
      id: `zone${d.surfaces.zones.length + 1}`, surface: 'sand', onRoad: true, offRoad: true,
      any: [{ kind: 'circle', x: 0, z: 0, radius: 90 }],
    } as SurfaceZone);
  }, 'add zone'));
}

function sceneryTab(root: HTMLElement, def: TrackDef, commit: Commit) {
  const ids = templateIds();
  const g = group(root, 'Scatter layers');
  hint(g, 'A layer fills the landscape with one COMPONENT, by rule. Placement is seeded per '
    + 'component, so editing the rocks never moves the trees. Leave a field blank to use the '
    + "component's own default — a pine already knows it does not grow on ice.");
  def.scenery.forEach((layer, i) => {
    const tpl = getTemplate(layer.template);
    const c = card(g, tpl ? tpl.name : `${layer.template} (missing!)`,
      () => commit((d) => { d.scenery.splice(i, 1); }, 'remove layer'));
    selectRow(c, 'component', layer.template, ids, (v) => commit((d) => { d.scenery[i].template = v; }, 'layer component'));
    numRow(c, 'count', layer.count, (v) => commit((d) => { d.scenery[i].count = Math.max(0, v | 0); }, 'count'), { step: 10, min: 0 });
    numRow(c, 'clear of road (m)', layer.minRoadDist, (v) => commit((d) => { d.scenery[i].minRoadDist = v; }, 'road clearance'), { step: 1 });
    numRow(c, 'clear of start (m)', layer.minSpawnDist, (v) => commit((d) => { d.scenery[i].minSpawnDist = v; }, 'start clearance'), { step: 5 });
    const range = layer.scale ?? tpl?.authoring.scale ?? [1, 1];
    numRow(c, 'scale min', range[0], (v) => commit((d) => {
      const cur = d.scenery[i].scale ?? [...range];
      d.scenery[i].scale = [v, cur[1]];
    }, 'scale'), { step: 0.1 });
    numRow(c, 'scale max', range[1], (v) => commit((d) => {
      const cur = d.scenery[i].scale ?? [...range];
      d.scenery[i].scale = [cur[0], v];
    }, 'scale'), { step: 0.1 });
    numRow(c, 'spread (0-1)', layer.spread, (v) => commit((d) => { d.scenery[i].spread = Math.max(0.05, Math.min(1, v)); }, 'spread'), { step: 0.02 });
    const av = el('div');
    av.appendChild(el('label', 'hint', 'never on:'));
    const avoid = layer.avoidSurfaces ?? tpl?.authoring.avoidSurfaces ?? [];
    for (const sfc of SURFACE_IDS) {
      checkRow(av, sfc, avoid.includes(sfc), (on) => commit((d) => {
        const list = d.scenery[i].avoidSurfaces ?? [...avoid];
        const at = list.indexOf(sfc);
        if (on && at < 0) list.push(sfc);
        if (!on && at >= 0) list.splice(at, 1);
        d.scenery[i].avoidSurfaces = list;
      }, 'avoid surface'));
    }
    c.appendChild(av);
  });
  addButton(g, '+ layer', () => commit((d) => {
    d.scenery.push({
      template: ids[0] ?? 'rock', count: 80, minRoadDist: 10, minSpawnDist: 60, spread: 0.95,
    } as SceneryLayer);
  }, 'add layer'));
}

function propsTab(
  root: HTMLElement, def: TrackDef, commit: Commit,
  selectedProp: number, onSelect: (i: number) => void,
) {
  const g = group(root, 'Placed components');
  const list = def.props ?? [];
  if (!list.length) {
    hint(g, 'Nothing placed by hand yet. Drag a component from the palette onto the map — '
      + 'or drop it on the 3D view. Scatter fills a landscape; placement puts a tyre stack on '
      + 'the outside of turn four.');
  } else {
    hint(g, 'Click a row to select it on the map. Selected props move with drag, rotate with '
      + '[ and ], resize with - and =, duplicate with ctrl+D, and delete with del.');
  }
  list.forEach((p, i) => {
    const tpl = getTemplate(p.template);
    const c = card(g, `${tpl ? tpl.name : p.template} #${i + 1}`,
      () => commit((d) => { d.props?.splice(i, 1); }, 'remove prop'));
    if (i === selectedProp) c.style.borderColor = '#ffd400';
    c.addEventListener('click', () => onSelect(i));
    numRow(c, 'x', Math.round(p.x), (v) => commit((d) => { d.props![i].x = v; }, 'prop x'), { step: 1 });
    numRow(c, 'z', Math.round(p.z), (v) => commit((d) => { d.props![i].z = v; }, 'prop z'), { step: 1 });
    numRow(c, 'rotation (deg)', Math.round((p.rot * 180) / Math.PI),
      (v) => commit((d) => { d.props![i].rot = (v * Math.PI) / 180; }, 'prop rot'), { step: 15 });
    numRow(c, 'scale', p.scale, (v) => commit((d) => { d.props![i].scale = Math.max(0.05, v); }, 'prop scale'), { step: 0.1 });
    numRow(c, 'lift (m)', p.yOffset ?? 0, (v) => commit((d) => { d.props![i].yOffset = v; }, 'prop lift'), { step: 0.25 });
    if (tpl) {
      const solid = typeof tpl.physics.solid === 'function' ? tpl.physics.solid(p.scale) : tpl.physics.solid;
      hint(c, `${tpl.description} — ${solid ? `SOLID at this scale, ${tpl.physics.massKg ?? '?'} kg` : 'not solid at this scale'}`);
    } else {
      hint(c, 'This component no longer exists. The world will skip it and warn in the console.');
    }
  });
}

function skyTab(root: HTMLElement, def: TrackDef, commit: Commit) {
  const g = group(root, 'Sky dome');
  const labels = ['zenith', 'upper', 'lower', 'horizon'];
  def.sky.stops.forEach((s, i) => {
    colorRow(g, labels[i], s, (v) => commit((d) => { d.sky.stops[i] = v; }, 'sky stop'));
  });

  const f = group(root, 'Fog');
  colorRow(f, 'colour', def.sky.fogColor, (v) => commit((d) => { d.sky.fogColor = v; }, 'fog colour'));
  numRow(f, 'near (m)', def.sky.fogNear, (v) => commit((d) => { d.sky.fogNear = v; }, 'fog near'), { step: 20 });
  numRow(f, 'far (m)', def.sky.fogFar, (v) => commit((d) => { d.sky.fogFar = v; }, 'fog far'), { step: 20 });

  const l = group(root, 'Light');
  colorRow(l, 'sun', def.sky.sunColor, (v) => commit((d) => { d.sky.sunColor = v; }, 'sun colour'));
  numRow(l, 'sun strength', def.sky.sunIntensity, (v) => commit((d) => { d.sky.sunIntensity = v; }, 'sun intensity'), { step: 0.1 });
  numRow(l, 'sun x', def.sky.sunDir[0], (v) => commit((d) => { d.sky.sunDir[0] = v; }, 'sun dir'), { step: 10 });
  numRow(l, 'sun y', def.sky.sunDir[1], (v) => commit((d) => { d.sky.sunDir[1] = v; }, 'sun dir'), { step: 10 });
  numRow(l, 'sun z', def.sky.sunDir[2], (v) => commit((d) => { d.sky.sunDir[2] = v; }, 'sun dir'), { step: 10 });
  colorRow(l, 'sky fill', def.sky.hemiSky, (v) => commit((d) => { d.sky.hemiSky = v; }, 'hemi sky'));
  colorRow(l, 'ground bounce', def.sky.hemiGround, (v) => commit((d) => { d.sky.hemiGround = v; }, 'hemi ground'));
  numRow(l, 'fill strength', def.sky.hemiIntensity, (v) => commit((d) => { d.sky.hemiIntensity = v; }, 'hemi intensity'), { step: 0.05 });

  const h = group(root, 'Horizon');
  numRow(h, 'mountains', def.sky.mountains.count, (v) => commit((d) => { d.sky.mountains.count = Math.max(0, v | 0); }, 'mountains'), { step: 1, min: 0 });
  numRow(h, 'ring radius (m)', def.sky.mountains.radius, (v) => commit((d) => { d.sky.mountains.radius = v; }, 'mountain radius'), { step: 20 });
  numRow(h, 'height (m)', def.sky.mountains.height, (v) => commit((d) => { d.sky.mountains.height = v; }, 'mountain height'), { step: 5 });
  numRow(h, 'snowline (−1..1)', def.sky.mountains.snowline, (v) => commit((d) => { d.sky.mountains.snowline = v; }, 'snowline'), { step: 0.1, min: -1, max: 1 });
  numRow(h, 'clouds', def.sky.clouds, (v) => commit((d) => { d.sky.clouds = Math.max(0, v | 0); }, 'clouds'), { step: 1, min: 0 });
}

export { SURFACE_IDS };
export type { SurfaceId };
