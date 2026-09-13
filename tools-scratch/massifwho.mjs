/* WHY conering AND loomsweep DISAGREE ABOUT A LEVEL. Both are silent when the
 * named InstancedMesh is missing, and silence there reads as "clean" - the
 * failure mode shrinkpath's header is about. This says, per level, whether the
 * spec asks for a massif at all and whether the mesh actually exists, so a
 * skipped level is a stated fact instead of a gap.
 *
 *   PORT=8914 LEVELS=32,47 node massifwho.mjs
 */
import { chromium } from 'playwright-core';
const PORT = process.env.PORT ?? 8914;
const levels = (process.env.LEVELS ?? '32,47').split(',');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 480 } });
p.setDefaultTimeout(600000);
let seen = 0;
for (const lv of levels) {
  await p.goto(`http://localhost:${PORT}/?level=${lv}&go=1&unlockall=1`, { waitUntil:'load', timeout:600000 });
  await p.waitForFunction(() => window.__game?.track?.center, undefined, { timeout:600000 });
  const r = await p.evaluate(async () => {
    const THREE = await import('three');
    const t = window.__game.track, M = t.T.massif;
    let mesh = null;
    t.group.traverse((o) => { if (o.name === 'massif') mesh = o; });
    const out = { name: t.T.name ?? '', spec: M ? `${M.count} @ r${M.r0}-${M.r1}` : 'NO MASSIF SPEC',
      mesh: mesh ? mesh.count : 'NO MESH',
      inChildren: !!t.group.children.find((o) => o.name === 'massif') };
    if (mesh) {
      const m = new THREE.Matrix4(), pos = new THREE.Vector3();
      const q = new THREE.Quaternion(), sc = new THREE.Vector3();
      const rs = [];
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, m); m.decompose(pos, q, sc);
        if (pos.y < -9999) continue;
        rs.push(Math.round(Math.hypot(pos.x, pos.z)));
      }
      rs.sort((a, c) => a - c);
      out.rs = rs;
    }
    return out;
  });
  console.log(`L${lv}`, JSON.stringify(r));
  seen++;
}
await b.close();
if (seen !== levels.length) { console.log('FAIL: did not visit every level'); process.exit(1); }
