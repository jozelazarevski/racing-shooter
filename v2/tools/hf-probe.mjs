import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();
// 4x4 cells => 5x5 heights. Make height depend ONLY on one index so we can see
// which world axis it maps to.
const N = 4;
const h = new Float32Array((N+1)*(N+1));
for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) {
  // index = b*(N+1) + a   (a varies fastest)
  h[b*(N+1)+a] = a * 10 + b * 100;
}
const w = new RAPIER.World({x:0,y:-9.81,z:0});
const body = w.createRigidBody(RAPIER.RigidBodyDesc.fixed());
w.createCollider(RAPIER.ColliderDesc.heightfield(N, N, h, {x: 40, y: 1, z: 40}), body);
// field spans -20..20 in x and z. Sample heights along +x and along +z.
w.step();
const probe = (x,z) => {
  const hit = w.castRay(new RAPIER.Ray({x, y: 200, z}, {x:0,y:-1,z:0}), 400, true);
  return hit ? (200 - hit.timeOfImpact).toFixed(1) : 'miss';
};
for (const [x,z] of [[-20,-20],[20,-20],[-20,20],[20,20],[0,0]])
  console.log(`x=${String(x).padStart(3)} z=${String(z).padStart(3)}  ->  ${probe(x,z)}`);
console.log('expect: height = 10*a + 100*b, a<->?, b<->?');
