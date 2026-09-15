/* #127 (owner, r406): "Red crowns fill the frame at the camera" on FALKEN
 * RIDGE — an alpine `furka` pass, NOT an autumn world, so red crowns are not
 * a season. Static reading said the theme foliage is green, which is how this
 * stayed open for 27 builds. Ask the running game what colour the foliage
 * ACTUALLY is: instanced meshes carry per-instance colours (setColorAt), and
 * a green material with a red instance colour reads red on screen. */
import { chromium } from 'playwright-core';
const BASE = process.env.BASE ?? 'http://localhost:8901';
const ID = process.env.ID ?? '21';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 900, height: 560 } });
p.setDefaultTimeout(600000);
await p.goto(`${BASE}/?level=${ID}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout: 600000 });
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, t = g.track;
  const hueOf = (r, gr, bl) => {
    const mx = Math.max(r, gr, bl), mn = Math.min(r, gr, bl), d = mx - mn;
    if (d < 1e-6) return -1;
    let h;
    if (mx === r) h = ((gr - bl) / d) % 6; else if (mx === gr) h = (bl - r) / d + 2; else h = (r - gr) / d + 4;
    h *= 60; if (h < 0) h += 360;
    return Math.round(h);
  };
  const band = (h) => h < 0 ? 'grey' : h < 20 ? 'RED' : h < 45 ? 'ORANGE'
    : h < 70 ? 'YELLOW' : h < 170 ? 'green' : h < 260 ? 'blue' : 'purple';
  const out = [];
  t.group.traverse((o) => {
    if (!o.isMesh && !o.isInstancedMesh) return;
    if (!/tree|foliage|canopy|crown|leaf|pine|fir|carpet/i.test(o.name || '')) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    const mc = m?.color;
    const rec = { name: o.name, count: o.count ?? 1,
      material: mc ? { hex: '#' + mc.getHexString(), band: band(hueOf(mc.r, mc.g, mc.b)) } : null,
      vertexColors: !!m?.vertexColors, bands: {} };
    if (o.isInstancedMesh && o.instanceColor) {
      const a = o.instanceColor.array;
      for (let i = 0; i < o.count; i++) {
        const bb = band(hueOf(a[i * 3], a[i * 3 + 1], a[i * 3 + 2]));
        rec.bands[bb] = (rec.bands[bb] ?? 0) + 1;
      }
    }
    out.push(rec);
  });
  // one compact line per world: the whole point is the BAND SPLIT
  const tot = {};
  for (const r of out) for (const [k, v] of Object.entries(r.bands)) tot[k] = (tot[k] ?? 0) + v;
  const n = Object.values(tot).reduce((a, c) => a + c, 0);
  const pct = Object.fromEntries(Object.entries(tot).map(([k, v]) => [k, Math.round(100 * v / n) + '%']));
  return { name: g.level?.name, theme: g.level?.theme, season: t.T?.season ?? null,
    carpetInstances: n, split: pct };
})));
// ...and a frame, because a colour census is not a photograph
await p.evaluate(() => {
  const g = window.__game, t = g.track, pl = g.player;
  pl.placeAt(Math.floor(t.center.length * 0.3), 0, true); pl.invuln = 0;
  pl._unstuckReq = true; pl.unstuckCool = 0;
});
await p.evaluate(() => new Promise((r) => { let n = 0; const f = () => (++n > 150 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }));
await p.screenshot({ path: `tools-scratch/shot-redcrowns-${ID}.png` });
await b.close();
