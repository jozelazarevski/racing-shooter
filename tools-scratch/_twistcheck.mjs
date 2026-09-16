/* r420 — DID THE TWIST ACTUALLY CHANGE THE LAP?
 * A mirror-and-reverse preserves every radius, so the curvature HISTOGRAM is
 * identical by construction and cannot answer the question. What a twist
 * changes is (a) the ORDER corners arrive in, (b) their HANDEDNESS, and (c)
 * the plan outline the card draws. Measure those.
 */
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 320, height: 200 } });
const grab = async (lv) => {
  await p.goto(`http://localhost:8901/?level=${lv}&go=1&unlockall=1`, { waitUntil: 'load', timeout: 60000 });
  await p.waitForFunction(() => window.__game?.track?.center?.length, undefined, { timeout: 60000 });
  return p.evaluate(() => {
    const c = window.__game.track.center, N = c.length, sig = [], pts = [];
    for (let i = 0; i < N; i++) {
      const a = c[(i - 3 + N) % N], m = c[i], z = c[(i + 3) % N];
      sig.push(Math.sign((m.x - a.x) * (z.z - m.z) - (m.z - a.z) * (z.x - m.x)));
      pts.push([m.x, m.z]);
    }
    return { name: window.__game.level?.name, sig, pts };
  });
};
const A = await grab(process.argv[2]), B = await grab(process.argv[3]);
const N = Math.min(A.sig.length, B.sig.length);
let same = 0; for (let i = 0; i < N; i++) if (A.sig[i] === B.sig[i]) same++;
// plan outline: normalise both into a unit box and compare point sets
const norm = (pts) => { let nx=1e9,xx=-1e9,nz=1e9,xz=-1e9;
  for (const [x,z] of pts){nx=Math.min(nx,x);xx=Math.max(xx,x);nz=Math.min(nz,z);xz=Math.max(xz,z);}
  const s=1/Math.max(xx-nx,xz-nz); return pts.map(([x,z])=>[(x-nx)*s,(z-nz)*s]); };
const na = norm(A.pts), nb = norm(B.pts);
const near = (S, T) => { let sum=0; for (const a of S){ let best=1e9;
  for (const c of T){ const d=(a[0]-c[0])**2+(a[1]-c[1])**2; if(d<best)best=d; } sum+=Math.sqrt(best);} return sum/S.length; };
console.log(`${A.name} vs ${B.name}`);
console.log(`  corner HANDEDNESS agreeing station-for-station: ${(100*same/N).toFixed(1)} pct  (50 pct = unrelated, 100 pct = same lap same way)`);
console.log(`  plan OUTLINE distance (normalised): ${near(na, nb).toFixed(4)}  (0 = same outline)`);
await b.close();
