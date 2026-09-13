// M1 world: flat ground with a painted figure-8 tuning circuit, simple sun
// + sky, a chassis mesh with four visual wheels. Stylized, readable (§7.1).
//
// THE RENDERER AND SHADOW SETTINGS ARE PORTED FROM IGNITE RALLY — v1's
// `Game` constructor in `src/main.js`, the renderer block at :858-871 and the
// sun block at :886-910. dustline had the same lights in the same places with
// none of the tuning, and every number v1 sets there has a comment naming the
// artefact it removes. What came across, and what did not, is written at each
// site below. `buildCarVisual` is dustline's own; the PORTED code above it is
// untouched by the instancing pass at the bottom of this file, which changes
// how the car is submitted and not one number the port brought across.

import * as THREE from 'three';
import carData from '../data/car.json';
import type { TrackDef } from '../tracks/trackDef';
import { mergeGeoms } from '../templates/geometry';

/** Half-width of the shadow frustum, in world units. dustline's own number —
 *  v1 uses 72 — and every depth constant below is derived from it. */
const SHADOW_HALF = 90;

/** How far up the sun sits from whatever it is lighting.
 *
 *  A directional light's ILLUMINATION does not depend on this at all, only on
 *  the direction; its SHADOW does, because the ortho shadow camera is placed at
 *  the light. `TrackDef.sky.sunDir` is documented as a bearing whose length is
 *  irrelevant, and the presets duly range from 105 to 190 units long, so a
 *  fixed near/far pair could not be safe for all of them until the distance
 *  itself was fixed. v1's rig is 156.5 units out with a 72-unit half-frustum;
 *  this is that ratio at dustline's 90, i.e. 156.5 * 90 / 72. */
const SUN_DIST = 196;

export function buildRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    // v1 `src/main.js:860`. On a laptop with switchable graphics this is what
    // decides whether the game gets the discrete GPU or the integrated one.
    canvas, antialias: true, powerPreference: 'high-performance',
  });
  renderer.setSize(innerWidth, innerHeight);
  // v1 `src/main.js:862` clamps a touch device to 1.75 rather than 2, and the
  // port dropped that clamp in the same change that gave dustline phone
  // controls — which is the worst possible time to lose it. A DPR-3 phone at
  // 2.0 draws (2.0/1.75)^2 = 1.31x the pixels v1 asks of the same handset, for
  // a difference nobody can see at that density. Detection is `pointer: coarse`
  // to match `ui/touch.ts`; the two must agree or the budget goes to a machine
  // that has no thumb pads on it.
  const coarse = matchMedia?.('(pointer: coarse)').matches ?? false;
  renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.75 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // v1 `src/main.js:871`, kept at v1's value. Its comment records the reason:
  // "Lifted from 1.12 after the lighting retune measured 35 % darker overall
  //  (mean scene luminance 71 -> 46 on PINE VALLEY). The retune's fill/key
  //  RATIO is what buys the shadow contrast, so exposure is the right lever to
  //  put the brightness back without flattening it again."
  // dustline inherited that retune — its `WEATHERS` carry v1's key/fill ratio,
  // ported into `tracks/presets.ts` — but not the exposure that pays for it,
  // so it has been rendering the dark half of v1's trade. UNVERIFIED: I have
  // not re-measured scene luminance in dustline; the number is v1's, applied
  // because dustline uses v1's lighting ratio.
  renderer.toneMappingExposure = 1.46;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

/** Fog, key light and fill, all read from the track. The tuning rings are
 *  positioned relative to the track's own start point rather than the (0, -24)
 *  they used to be nailed to, so they follow the pad on any track. */
export function buildWorld(scene: THREE.Scene, def: TrackDef, startX = 0, startZ = 0): THREE.Object3D[] {
  const sky = def.sky;
  scene.fog = new THREE.Fog(new THREE.Color(sky.fogColor).getHex(), sky.fogNear, sky.fogFar);

  const added: THREE.Object3D[] = [];
  const hemi = new THREE.HemisphereLight(
    new THREE.Color(sky.hemiSky).getHex(), new THREE.Color(sky.hemiGround).getHex(), sky.hemiIntensity,
  );
  scene.add(hemi);
  added.push(hemi);

  const sun = new THREE.DirectionalLight(new THREE.Color(sky.sunColor).getHex(), sky.sunIntensity);
  // The bearing is the track's; the DISTANCE is normalised so the shadow
  // camera's near/far can be constants (see SUN_DIST). Illumination is
  // unchanged by this — only the shadow camera's placement.
  const offset = new THREE.Vector3(sky.sunDir[0], sky.sunDir[1], sky.sunDir[2])
    .normalize().multiplyScalar(SUN_DIST);
  sun.position.copy(offset);
  sun.castShadow = true;
  // 1024 on a phone, 2048 elsewhere — v1 `src/main.js:889` makes the same
  // split. A shadow map is a full depth pass over everything that casts, so
  // 2048 is 4x the texels and 4x the bandwidth of 1024, and it buys resolution
  // that a 6-inch screen cannot resolve at this frustum size. Same
  // `pointer: coarse` test as the pixel-ratio clamp above, deliberately: the
  // two decisions are one decision about what device this is.
  const touchDevice = matchMedia?.('(pointer: coarse)').matches ?? false;
  const shadowRes = touchDevice ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowRes, shadowRes);
  const sc = sun.shadow.camera;
  sc.left = -SHADOW_HALF; sc.right = SHADOW_HALF; sc.top = SHADOW_HALF; sc.bottom = -SHADOW_HALF;
  // v1 `src/main.js:892` is near 10 / far 400 around a 72-unit half-frustum;
  // these are those numbers scaled by the same 90/72 as the box (12.5 and 500,
  // the near rounded down). Without a depth range the ortho camera keeps its
  // 0.5-500 default, which for a light 196 units out clips nothing but spends
  // most of the depth buffer's precision on empty space in front of the sun.
  sc.near = 12; sc.far = 500;
  // Three only calls this itself when it first allocates the shadow map
  // (`WebGLShadowMap`, at `shadow.map === null`), so mutating the frustum after
  // that first frame would otherwise be silently ignored. v1 calls it here too.
  sc.updateProjectionMatrix();
  // v1 `src/main.js:894-900`, all three verbatim, with v1's own reasons:
  //   bias/normalBias — "kills the acne the raked sun exposes". Several
  //     dustline weathers have a sun 12 degrees above the horizon
  //     (`presets.ts` sunset, sunDir [-160, 34, 20]), which is exactly the
  //     case that rakes shadow acne across flat ground.
  //   radius — v1: "A 1024 map stretched over a 144 u frustum is 0.14 u per
  //     texel, so a car shadow is ~30 texels across and its edge steps
  //     visibly". dustline's 2048 map over a 180 u frustum is 0.088 u per
  //     texel, so the same 3.5-texel kernel is a 0.31 u soft edge here against
  //     0.25 u on v1's desktop path. Close enough to keep v1's number rather
  //     than invent one.
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 3.5;
  sun.userData.sunOffset = offset;
  // The target has to be IN the scene for its world matrix to be updated, and
  // therefore for `shadowFollower` below to be able to move it. v1 adds both
  // (`scene.add(sun, sun.target)`); dustline added neither the target nor a
  // way to move it, which is why its shadow box has been nailed to the world
  // origin while the tracks are hundreds of units across.
  scene.add(sun, sun.target);
  added.push(sun, sun.target);

  // spawn-pad figure-8 painted on the flat tarmac apron: the M1 tuning
  // playground lives on inside the M2 rally world
  if (def.start.tuningRings) {
    const asphaltPaint = new THREE.MeshStandardMaterial({ color: 0x5a5d63, roughness: 0.92 });
    for (const sx of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(9, 15, 48), asphaltPaint);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(startX + sx * 17, 0.04, startZ);
      scene.add(ring);
      added.push(ring);
    }
  }
  return added;
}

/** THE SHADOW RIG FOLLOWS THE PLAYER — v1 `src/main.js:910` (`_sunOffset`) and
 *  `:1918-1923`, where `_updateCamera` re-aims the light at the player each
 *  frame.
 *
 *  A 180-unit shadow box is a crisp shadow if it is around the car and no
 *  shadow at all if it is not. dustline's box has been centred on the world
 *  origin, so on a track whose road runs out to x = 300 the cars have simply
 *  been driving out of their own shadows. Moving the light and its target
 *  together keeps the direction — and so the lighting — identical while the box
 *  travels with the car.
 *
 *  Takes what `buildWorld` returned and hands back an update function, or null
 *  if there is no sun in it. Callers that do not want a moving rig (the editor
 *  preview, which has no player) simply never call this, and the light stays
 *  where `buildWorld` put it.
 *
 *  NOT PORTED: v1 also lifts a low sun's ELEVATION for the shadow rig, because
 *  its light direction is derived from the theme's sun-sprite azimuth and would
 *  otherwise sit near the horizon. dustline authors `sunDir` directly per
 *  weather, so bending it here would make the shadows disagree with the light. */
export function shadowFollower(
  built: THREE.Object3D[],
): ((x: number, y: number, z: number) => void) | null {
  const sun = built.find(
    (o): o is THREE.DirectionalLight => (o as THREE.DirectionalLight).isDirectionalLight === true,
  );
  const offset = sun?.userData.sunOffset as THREE.Vector3 | undefined;
  if (!sun || !offset) return null;
  return (x, y, z) => {
    sun.position.set(x + offset.x, y + offset.y, z + offset.z);
    sun.target.position.set(x, y, z);
  };
}

/* ===========================================================================
 * THE GRID, AS 13 DRAW CALLS INSTEAD OF 220
 * ===========================================================================
 *
 * WHAT WAS HERE. `buildCarVisual` built 41 separate `THREE.Mesh` per car, and
 * `main.ts` calls it four times: 164 objects, 140 distinct geometries — every
 * `box()` minted a fresh `BoxGeometry` — and 32 materials from 13 distinct
 * parameter sets, because every call minted eight more. Measured by
 * `tools/verify-perf-budget.mjs` at harbour's worst pose, that was 105 colour
 * draws + 116 shadow draws = 221 of the frame's 484, carrying 3,912 submitted
 * triangles: 46% of the whole draw budget for 0.8% of the triangles, at 17.7
 * triangles a draw. On dustbowl the cars were 88% of every draw in the frame.
 *
 * All four cars always shared every shape. Only two numbers differ per car —
 * the paint and the accent — so the parts are merged BY MATERIAL into one
 * `BufferGeometry` each, built once per scene, and drawn as one `InstancedMesh`
 * with one instance per car:
 *
 *   colour   paint, dark, glass, accent, lamp, tail, wheel, rim      8 draws
 *   shadow   paint, dark, glass, accent, wheel                       5 draws
 *
 * 13 draws for the whole grid, and 13 for a grid twice the size. The lamps and
 * the taillights are `MeshBasicMaterial` and never cast, and the rims never
 * cast, which is exactly what the per-mesh version did (`add(..., false)`, and
 * a `rim` whose `castShadow` was never set) — not a saving taken here.
 *
 * WHAT IT COSTS, so this is not a free lunch on paper. The colour pass now
 * submits all 2,992 car triangles every frame, where per-mesh culling used to
 * leave 1,788 (proving-ground) to 2,124 (dustbowl) of them, because a single
 * instanced draw cannot cull the wing mirror that has left the frustum while
 * the rest of its car is still inside it. That is +868 to +1,204 triangles —
 * at most 0.8% of the 150,000 budget — bought with 204 to 223 fewer draw calls.
 * The shadow pass is unchanged at 2,096 triangles: the shadow box follows the
 * player, so it already contained every caster on every track.
 *
 * MEASURED, `node tools/verify-perf-budget.mjs`, worst portrait frame per track,
 * both passes, before -> after:
 *
 *   dustbowl          269 -> 48 draws     241,076 -> 242,062 tris
 *   harbour           484 -> 276 draws    525,052 -> 525,968 tris
 *   proving-ground    414 -> 210 draws    386,315 -> 387,231 tris
 *
 * dustbowl's draw budget now passes (48/200, colour 37/100); the triangle
 * budget is untouched by this change and still fails on all three, which is
 * terrain, water and scenery and not the cars.
 *
 * BOTH LIVERY COLOURS STAY FREE. The paint and the accent each go on the
 * `instanceColor` of their own mesh; neither is baked into the geometry. For
 * the accent that is not a luxury — `data/ai.json` gives MORROW accent
 * 0x222222 against 0xEEEEEE for KESKI and ONYX, so one baked accent would turn
 * MORROW's near-black centre stripes and side blades near-white and lose the
 * one livery that reads differently at distance. It costs nothing to keep:
 * the accent's material already differs from the paint's (roughness 0.6, no
 * metalness, against 0.42/0.12) and so already needed a draw of its own.
 * ======================================================================== */

/** How many cars one scene's fleet can hold.
 *
 *  `main.ts` builds one car for the player plus one per entry in
 *  `data/ai.json`, which is four today. This is that doubled, so M4's respawns
 *  and a larger grid do not have to reopen this file. A spare slot costs 16
 *  floats of instance matrix and 3 of instance colour — 76 bytes — and is never
 *  drawn, because `count` tracks the cars actually built and not the capacity.
 *  Overflowing it THROWS: the alternative is a fifth car that is on the track,
 *  scoring and colliding, and invisible, which is the kind of defect this
 *  repository's checks exist to stop shipping. */
const FLEET_CAPACITY = 8;

/** The six body materials, in the order their meshes are created. Two of them
 *  cast no shadow — see `Fleet`'s constructor. */
const BODY_PARTS = ['paint', 'dark', 'glass', 'accent', 'lamp', 'tail'] as const;
type BodyPart = typeof BODY_PARTS[number];

export interface CarVisual {
  root: THREE.Group;
  /** The four wheel transforms, in `carData.suspension.mounts` order.
   *
   *  `main.ts` writes `position`, `rotation` and `rotateX` on these every frame
   *  for steer, spin and suspension droop, and it still does — the shape it
   *  uses is unchanged and it needed no edit. They are no longer `Mesh`es
   *  though: the wheel is drawn by the fleet's 16-instance mesh, and these
   *  carry the pose it reads. Narrowing `Mesh` to `Object3D` is the honest
   *  type and compiles `main.ts` as-is, since every call it makes is
   *  `Object3D`'s. */
  wheels: THREE.Object3D[];
}

/** Every car in one scene, as one InstancedMesh per material.
 *
 *  WHY IT HANGS OFF THE FIRST CAR'S `root` RATHER THAN OFF THE SCENE. Three of
 *  this repository's checks identify a car by walking up from the drawable to a
 *  `CarVisual.root`: `verify-solidity.mjs`'s `isCar`, and
 *  `verify-perf-budget.mjs`'s `carIds`. A fleet mesh parented straight to the
 *  scene is reachable from no root, so solidity would report it `unclassified`
 *  and fail, and the budget tool would file the entire grid under road
 *  furniture — the instrument would go on printing a number, and the number
 *  would be wrong. Hanging the fleet under the first car built keeps both
 *  honest for one matrix inverse per frame; see `sync`.
 *
 *  Nothing here may carry a `:` in its name: `verify-clearance.mjs` and
 *  `verify-solidity.mjs` both read `<template>:<part>` as "this is a placed
 *  world component", and a car is not one. */
class Fleet extends THREE.Group {
  readonly cars: CarVisual[] = [];
  /** One instance per car. */
  private readonly bodies: THREE.InstancedMesh[] = [];
  /** Four instances per car. */
  private readonly wheel: THREE.InstancedMesh;
  private readonly rim: THREE.InstancedMesh;
  /** The two meshes that take a per-driver colour. */
  private readonly paint: THREE.InstancedMesh;
  private readonly accent: THREE.InstancedMesh;

  // Scratch, reused every frame: this runs inside the render callback and
  // allocating four matrices a frame is four matrices a frame for the GC.
  private readonly hostInv = new THREE.Matrix4();
  private readonly rel = new THREE.Matrix4();
  private readonly wheelM = new THREE.Matrix4();
  private readonly tint = new THREE.Color();

  constructor() {
    super();
    this.name = 'car-fleet';
    const g = fleetGeometry();

    const mk = (name: string, geo: THREE.BufferGeometry, mat: THREE.Material,
      capacity: number, castShadow: boolean) => {
      const m = new THREE.InstancedMesh(geo, mat, capacity);
      m.name = name;
      m.count = 0;                       // no cars yet; `addCar` raises it
      m.castShadow = castShadow;
      // The matrices are rewritten every frame from `main.ts`'s wheel poses.
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      /* NEVER FRUSTUM-CULLED, DELIBERATELY. `InstancedMesh` builds its bounding
       * sphere lazily on the first `Frustum.intersectsObject` and three never
       * invalidates it when `instanceMatrix` changes, so leaving culling on
       * would test every later frame against wherever the grid stood on that
       * one frame, and the cars would vanish the moment they drove away from
       * it. Recomputing the sphere per frame would work and would never once
       * pay for itself: the player's own car is in shot in every frame this
       * game draws, so the fleet is never wholly outside the frustum, and the
       * whole of it is 2,992 triangles over 8 draws. */
      m.frustumCulled = false;
      this.add(m);
      return m;
    };

    const byPart = {} as Record<BodyPart, THREE.InstancedMesh>;
    for (const part of BODY_PARTS) {
      // The lamps and the taillights are the two the per-mesh version passed
      // `shadow = false` for: they are unlit `MeshBasicMaterial` glows sunk
      // 6 cm into the bodywork that already casts around them.
      byPart[part] = mk(`car-${part}`, g.body[part], g.material[part], FLEET_CAPACITY,
        part !== 'lamp' && part !== 'tail');
      this.bodies.push(byPart[part]);
    }
    this.paint = byPart.paint;
    this.accent = byPart.accent;
    this.wheel = mk('car-wheel', g.wheel, g.material.wheel, FLEET_CAPACITY * 4, true);
    // The rim never cast either — it rode as an untouched child of the wheel
    // mesh, whose `castShadow` was never set.
    this.rim = mk('car-rim', g.rim, g.material.rim, FLEET_CAPACITY * 4, false);
  }

  /** Claim a slot in the fleet and hand back the pose carriers for it. */
  addCar(paintColor: number, accentColor: number): CarVisual {
    const slot = this.cars.length;
    if (slot >= FLEET_CAPACITY) {
      throw new Error(`buildCarVisual: the fleet holds ${FLEET_CAPACITY} cars and a `
        + `${slot + 1}th was asked for — raise FLEET_CAPACITY in render/scene.ts`);
    }
    const root = new THREE.Group();
    const wheels: THREE.Object3D[] = [];
    for (let i = 0; i < 4; i++) {
      const w = new THREE.Object3D();
      root.add(w);
      wheels.push(w);
    }
    // The first car built hosts the fleet. See the class comment.
    if (slot === 0) root.add(this);

    const car = { root, wheels };
    this.cars.push(car);
    for (const m of this.bodies) m.count = this.cars.length;
    this.wheel.count = this.rim.count = this.cars.length * 4;

    // The livery. `THREE.Color` converts a hex through `ColorManagement` into
    // the linear working space exactly as `material.color` used to, and the
    // shader multiplies the white base by this, so the paint is the same paint.
    this.paint.setColorAt(slot, this.tint.set(paintColor));
    this.accent.setColorAt(slot, this.tint.set(accentColor));
    if (this.paint.instanceColor) this.paint.instanceColor.needsUpdate = true;
    if (this.accent.instanceColor) this.accent.instanceColor.needsUpdate = true;
    return car;
  }

  /** Pull every car's pose into the instance matrices.
   *
   *  Hooked to `updateMatrixWorld` because that is the one place three visits
   *  every frame BEFORE both passes — `WebGLRenderer.render` calls
   *  `scene.updateMatrixWorld()` ahead of `projectObject` and of
   *  `shadowMap.render` — so the shadow map and the colour pass see the same
   *  frame's cars. `onBeforeRender` would have been a frame late for shadows,
   *  which three does not call it for. */
  override updateMatrixWorld(force?: boolean) {
    this.sync();
    super.updateMatrixWorld(force);
  }

  private sync() {
    const cars = this.cars;
    if (!cars.length) return;
    /* `buildCarVisual` adds every root straight to the scene, so a root's LOCAL
     * matrix IS its world matrix. Composing it here rather than reading
     * `matrixWorld` is what makes this independent of scene-child order: three
     * updates children in order, and this container is a child of car 0, so
     * cars 1..n still carry LAST frame's `matrixWorld` when it is reached. */
    for (const car of cars) {
      car.root.updateMatrix();
      for (const w of car.wheels) w.updateMatrix();
    }
    /* Instance matrices are in CAR 0's frame, because that is the frame this
     * container inherits from the parent it hangs off. For car 0 that is the
     * identity, so its parts sit at exactly the local coordinates the old
     * per-car meshes used; the rest of the grid carries its offset from it. */
    this.hostInv.copy(cars[0].root.matrix).invert();
    for (let k = 0; k < cars.length; k++) {
      const car = cars[k];
      this.rel.multiplyMatrices(this.hostInv, car.root.matrix);
      for (const m of this.bodies) m.setMatrixAt(k, this.rel);
      for (let w = 0; w < 4; w++) {
        this.wheelM.multiplyMatrices(this.rel, car.wheels[w].matrix);
        // The rim rode as a child of the wheel mesh at the wheel's own origin,
        // so it takes the wheel's matrix unchanged.
        this.wheel.setMatrixAt(k * 4 + w, this.wheelM);
        this.rim.setMatrixAt(k * 4 + w, this.wheelM);
      }
    }
    for (const m of this.bodies) m.instanceMatrix.needsUpdate = true;
    this.wheel.instanceMatrix.needsUpdate = true;
    this.rim.instanceMatrix.needsUpdate = true;
  }
}

/** The shapes and the materials, built once and shared by every car.
 *
 *  Group-B silhouette rally striker in the voxel style: layered hull, inset
 *  glass, rally lamp pod, livery stripes, bumpers, lights, mirrors. Every
 *  extent and offset below is the one the per-mesh version used, moved from a
 *  `Mesh.position` into the vertices. */
function fleetGeometry() {
  const c = carData.chassis;
  const hw = c.halfExtents[0], hl = c.halfExtents[2];
  const parts: Record<BodyPart, THREE.BufferGeometry[]> = {
    paint: [], dark: [], glass: [], accent: [], lamp: [], tail: [],
  };
  /** One box, baked where its `Mesh` used to sit. Rotate about the box's own
   *  centre first and translate second, because `Object3D.updateMatrix`
   *  composes T*R*S and hands that to the vertex — so a mesh with a `rotation`
   *  AND a `position` spins in place and then moves. Doing it the other way
   *  round here would swing the windscreen, the one rotated part, off the
   *  cabin and out through the bonnet. */
  const put = (key: BodyPart, w: number, h: number, l: number,
    x: number, y: number, z: number, rotX = 0) => {
    const g = new THREE.BoxGeometry(w, h, l);
    if (rotX) g.rotateX(rotX);
    g.translate(x, y, z);
    parts[key].push(g);
  };

  // hull: skirt + body + hood step
  put('dark', hw * 2 - 0.12, 0.3, hl * 2, 0, -0.18, 0);                    // rocker skirt
  put('paint', hw * 2, 0.5, hl * 2, 0, 0.1, 0);                            // main body
  put('paint', hw * 1.8, 0.14, 1.1, 0, 0.4, hl - 0.75);                    // hood step
  // cabin + inset glass
  put('paint', hw * 1.5, 0.5, 1.85, 0, 0.58, -0.3);
  put('glass', hw * 1.36, 0.4, 0.1, 0, 0.6, 0.68, -0.28);                  // raked windscreen
  put('glass', hw * 1.36, 0.34, 0.09, 0, 0.58, -1.24);
  for (const s of [-1, 1]) put('glass', 0.06, 0.32, 1.5, (hw * 1.5) / 2 * s + 0.015 * s, 0.58, -0.3);
  // rally lamp pod on the nose + pop-up look lamps
  put('dark', 1.1, 0.16, 0.24, 0, 0.42, hl - 0.12);
  for (const s of [-0.36, -0.12, 0.12, 0.36]) put('lamp', 0.18, 0.14, 0.06, s, 0.42, hl + 0.01);
  // headlights + taillights + grille
  for (const s of [-1, 1]) {
    put('lamp', 0.34, 0.16, 0.06, 0.62 * s, 0.16, hl + 0.01);
    put('tail', 0.34, 0.14, 0.06, 0.62 * s, 0.16, -hl - 0.01);
  }
  put('dark', 0.9, 0.14, 0.05, 0, 0.16, hl + 0.005);
  // bumpers + rear wing
  put('dark', hw * 2 + 0.1, 0.22, 0.3, 0, -0.14, hl + 0.05);
  put('dark', hw * 2 + 0.1, 0.22, 0.3, 0, -0.14, -hl - 0.05);
  put('dark', hw * 1.7, 0.06, 0.5, 0, 0.62, -hl + 0.15);
  for (const s of [-1, 1]) put('dark', 0.08, 0.22, 0.3, 0.6 * s, 0.48, -hl + 0.18);
  // livery: twin center stripes + side blades
  put('accent', 0.34, 0.03, hl * 2 - 0.1, -0.26, 0.362, 0);
  put('accent', 0.34, 0.03, hl * 2 - 0.1, 0.26, 0.362, 0);
  for (const s of [-1, 1]) put('accent', 0.03, 0.16, hl * 1.5, (hw - 0.005) * s, 0.05, 0.1);
  // mirrors + fender flares
  for (const s of [-1, 1]) {
    put('dark', 0.1, 0.1, 0.16, (hw + 0.09) * s, 0.52, 0.55);
    for (const z of [1.35, -1.35]) put('dark', 0.14, 0.2, 1.0, (hw + 0.04) * s, -0.22, z);
  }

  // 33 boxes, 396 triangles, merged into six buffers. `mergeGeoms` keeps
  // position and normal only, which is all these need — nothing on the car is
  // textured, and it is what every instanced mesh in the world already uses.
  const body = {} as Record<BodyPart, THREE.BufferGeometry>;
  for (const key of Object.keys(parts) as BodyPart[]) body[key] = mergeGeoms(parts[key]);

  const r = carData.tire.wheelRadius;
  const wheel = new THREE.CylinderGeometry(r, r, 0.32, 14);
  wheel.rotateZ(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.34, 8);
  rim.rotateZ(Math.PI / 2);

  const material = {
    // WHITE BASE, LIVERY ON `instanceColor`. three multiplies the two
    // (`vColor *= instanceColor` under USE_INSTANCING_COLOR), so white times
    // the old per-car colour is the old per-car colour. Every other number here
    // is the one the per-car material carried.
    paint: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.12 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 0.8 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x101821, roughness: 0.15, metalness: 0.4 }),
    accent: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
    lamp: new THREE.MeshBasicMaterial({ color: 0xfff2c0 }),
    tail: new THREE.MeshBasicMaterial({ color: 0xff3524 }),
    wheel: new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.95 }),
    rim: new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.4, metalness: 0.3 }),
  };
  return { body, wheel, rim, material };
}

/** One fleet per scene, not one per module.
 *
 *  An `InstancedMesh` has exactly one parent, so a fleet belongs to the scene
 *  it was built into. A module-level singleton would put the game's cars in the
 *  editor preview's scene — or, worse, in whichever of the two asked second —
 *  the moment anything else in this repository builds a car. Weak, so a
 *  discarded scene takes its fleet with it. */
const fleets = new WeakMap<THREE.Scene, Fleet>();

export function buildCarVisual(scene: THREE.Scene, paintColor = 0xff5c2e, accentColor = 0xf2ede0): CarVisual {
  let fleet = fleets.get(scene);
  if (!fleet) {
    fleet = new Fleet();
    fleets.set(scene, fleet);
  }
  const car = fleet.addCar(paintColor, accentColor);
  scene.add(car.root);
  return car;
}
