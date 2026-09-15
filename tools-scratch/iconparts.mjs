/* WHAT IS BEHIND THE CAR IN A SHELF ICON, by name and by share of the frame.
 *
 * The icons are shot through `_shoot(..., {ground:true})` against the garage
 * diorama. Reported: a flat green wall, a brown vertical smear, and the car
 * parked on the hard-cut lip of a tan strip. `dioparts` measures the BAY,
 * which is a different camera at a different distance — at icon framing the
 * lens sits a few units off the dirt and sees almost none of what the bay
 * shot shows, so the bay's numbers say nothing about this frame.
 *
 * Re-shoots the icon at 4x through the game's own `_shoot`, then hides one
 * child of the forest at a time and re-shoots, reporting how much of the ICON
 * each part owns. Saves every frame so the winner can be looked at.
 *
 *   CAR=sleek node iconparts.mjs
 */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const CAR = process.env.CAR ?? 'sleek';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 430, height: 900 } });
p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
const out = await p.evaluate(async (car) => {
  const g = window.__game;
  // the shelf's own rig, at four times the size so the picture can be read
  const S = 4, W = 148 * S, H = 96 * S;
  // build the mesh the same way `_carIcons` does, through the game's own path
  const mod = await import('./src/vehicles.js');
  const entry = mod.CAR_CATALOG.find((c) => c.key === car) ?? mod.CAR_CATALOG[0];
  const shoot = () => {
    const mesh = mod.buildCarMesh(entry.spec);
    mesh.rotation.y = g._iconYaw ?? 0;
    return g._shoot(mesh, W, H, { ground: true });
  };
  // `_shoot` hides the forest again on the way out, so reach it once and keep it
  const st = g._studio(W, H);
  // KEY BY INDEX. The diorama's parts are mostly unnamed Meshes, so keying the
  // shot table by `o.name` collapsed all fourteen onto one entry and the probe
  // reported a single 0% row — a clean-looking pass over thirteen untested
  // objects.
  const parts = st.forest.children.map((o, i) => ({ i,
    name: `${i}:${o.name || o.type}${o.isInstancedMesh ? `[${o.count}]` : ''}`
      + `:${o.geometry?.attributes?.position?.count ?? 0}v` }));
  const base = shoot();
  const shots = { base };
  const shares = [];
  for (const q of parts) {
    const o = st.forest.children[q.i];
    if (!o.visible) continue;
    o.visible = false;
    shots[q.name] = shoot();
    o.visible = true;
  }
  return { W, H, parts, shots, shares };
}, CAR);
// diff off-thread: decode each data URL and compare
const diffs = await p.evaluate(async ([shots, W, H]) => {
  const load = (u) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = u; });
  // SIZE THE CANVAS FROM THE IMAGE, NOT FROM THE REQUEST. The studio renderer
  // runs at a pixel ratio of 2, so a 592 x 384 shot comes back from
  // `toDataURL` as 1184 x 768. Sizing this canvas to the REQUESTED width and
  // drawing at 0,0 cropped every comparison to the top-left QUADRANT — a
  // quarter of the frame, reported as the frame. Every share this probe
  // printed before this line was a quadrant share.
  const px = (img) => { const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; };
  const base = px(await load(shots.base));
  const out = [];
  for (const [k, u] of Object.entries(shots)) {
    if (k === 'base') continue;
    const a = px(await load(u));
    let n = 0;
    for (let i = 0; i < a.length; i += 4)
      if (Math.abs(a[i] - base[i]) + Math.abs(a[i + 1] - base[i + 1])
        + Math.abs(a[i + 2] - base[i + 2]) > 18) n++;
    out.push({ what: k, pct: +(100 * n / (a.length / 4)).toFixed(1) });
  }
  return out.sort((a, c) => c.pct - a.pct);
}, [out.shots, out.W, out.H]);
console.log(`icon ${CAR} at ${out.W}x${out.H}, ${out.parts.length} forest parts`);
for (const d of diffs) console.log(`  ${String(d.pct).padStart(5)}%  ${d.what}`);
const b64 = out.shots.base.split(',')[1];
writeFileSync(`tools-scratch/shot-iconparts-${CAR}.png`, Buffer.from(b64, 'base64'));
console.log(`wrote tools-scratch/shot-iconparts-${CAR}.png`);
await b.close();
