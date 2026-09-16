/* THE TINTS, A/B'd WITHOUT MOVING A TREE. Every previous attempt to measure a
 * diorama change was confounded by the same thing: the scene is built from one
 * seeded `rnd()` stream, so INSERTING a call re-rolls every placement after it
 * and the before/after are different forests. This flips `vertexColors` on the
 * already-built geometry instead — same trees, same camera, one flag. */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const p = await ctx.newPage(); p.setDefaultTimeout(600000);
await p.goto('http://localhost:8901/?level=1&unlockall=1', { waitUntil:'load', timeout:600000 });
await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
await p.evaluate(() => { window.__game.showMenu(); document.getElementById('tab-btn-garage')?.click(); });
await p.waitForTimeout(2600);
console.log(JSON.stringify(await p.evaluate(() => {
  const g = window.__game, st = g.__stage;
  g._stageRun(false);
  st.pivot.rotation.y = 2.05;
  const dio = st.scene.children.find((o) => o.type === 'Group' && o.children.some((c) => c.isMesh));
  const tinted = dio.children.filter((m) => m.isMesh && m.geometry.attributes.color);
  const grab = () => { st.r.render(st.scene, st.cam);
    const cv = st.cvs, o = document.createElement('canvas');
    o.width = cv.width; o.height = cv.height; o.getContext('2d').drawImage(cv, 0, 0);
    return o.getContext('2d').getImageData(0, 0, o.width, o.height).data; };
  const stat = (m, on) => {
    for (const t of tinted) { t.material.vertexColors = on; t.material.needsUpdate = true; }
    const other = tinted.filter((t) => t !== m);
    for (const t of other) t.visible = false;
    const base = grab();
    m.visible = false; const off = grab(); m.visible = true;
    for (const t of other) t.visible = true;
    // LUMINANCE IS THE WRONG STATISTIC for "is this one green mass". A cone
    // lit by one key already has four facet values, and that swamps a per-tree
    // base colour — the spread barely moves whatever the tints do. What the
    // tint actually varies is WARMTH, so measure warmth: R-B per pixel, and
    // the spread of THAT is the spread of the trees themselves.
    const lum = [], warm = [];
    for (let k = 0; k < base.length; k += 4) {
      if (Math.abs(base[k] - off[k]) + Math.abs(base[k+1] - off[k+1])
        + Math.abs(base[k+2] - off[k+2]) <= 6) continue;
      lum.push(0.2126 * base[k] + 0.7152 * base[k+1] + 0.0722 * base[k+2]);
      warm.push(base[k] - base[k + 2]);
    }
    const sd = (a) => { const m = a.reduce((s, v) => s + v, 0) / a.length;
      return +Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length).toFixed(1); };
    lum.sort((a, c) => a - c);
    const mean = lum.reduce((s, v) => s + v, 0) / lum.length;
    return { px: lum.length, mean: Math.round(mean), sd: sd(lum), warmSd: sd(warm),
      p10p90: [Math.round(lum[lum.length * 0.1 | 0]), Math.round(lum[lum.length * 0.9 | 0])] };
  };
  const out = [];
  for (const m of tinted) {
    // HOW MANY TINTS ARE ACTUALLY IN THE BUFFER. Report this FIRST: a run
    // where both columns match to the tenth is nearly always a weld that
    // carried one colour, not a tint that does not show. `clone()` copies
    // `userData` by reference, so `q.userData.tint = t` writes into the
    // object the SOURCE geometry owns and every clone reads the last write —
    // fifty trees, one green, and an A/B that measures nothing twice.
    const c = m.geometry.attributes.color;
    const seen = new Set();
    for (let i = 0; i < c.count; i++) seen.add(c.getX(i) + ',' + c.getY(i) + ',' + c.getZ(i));
    out.push({ color: '#' + m.material.color.getHexString(), distinctTints: seen.size,
      flat: stat(m, false), tinted: stat(m, true) });
  }
  for (const t of tinted) { t.material.vertexColors = true; t.material.needsUpdate = true; }
  return out;
}), null, 0));
await b.close();
