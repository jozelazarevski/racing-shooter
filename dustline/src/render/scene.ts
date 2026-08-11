// M1 world: flat ground with a painted figure-8 tuning circuit, simple sun
// + sky, a chassis mesh with four visual wheels. Stylized, readable (§7.1).
//
// THE RENDERER AND SHADOW SETTINGS ARE PORTED FROM IGNITE RALLY — v1's
// `Game` constructor in `src/main.js`, the renderer block at :858-871 and the
// sun block at :886-910. dustline had the same lights in the same places with
// none of the tuning, and every number v1 sets there has a comment naming the
// artefact it removes. What came across, and what did not, is written at each
// site below. `buildCarVisual` is dustline's own and is untouched.

import * as THREE from 'three';
import carData from '../data/car.json';
import type { TrackDef } from '../tracks/trackDef';

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

export interface CarVisual {
  root: THREE.Group;
  wheels: THREE.Mesh[];
}

export function buildCarVisual(scene: THREE.Scene, paintColor = 0xff5c2e, accentColor = 0xf2ede0): CarVisual {
  // Group-B silhouette rally striker in the voxel style: layered hull,
  // inset glass, rally lamp pod, livery stripes, bumpers, lights, mirrors.
  const c = carData.chassis;
  const hw = c.halfExtents[0], hl = c.halfExtents[2];
  const root = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: paintColor, roughness: 0.42, metalness: 0.12 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 0.8 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x101821, roughness: 0.15, metalness: 0.4 });
  const white = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.6 });
  const lampOn = new THREE.MeshBasicMaterial({ color: 0xfff2c0 });
  const tailOn = new THREE.MeshBasicMaterial({ color: 0xff3524 });
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (shadow) m.castShadow = true;
    root.add(m);
    return m;
  };
  const box = (w: number, h: number, l: number) => new THREE.BoxGeometry(w, h, l);

  // hull: skirt + body + hood step
  add(box(hw * 2 - 0.12, 0.3, hl * 2), dark, 0, -0.18, 0);                 // rocker skirt
  add(box(hw * 2, 0.5, hl * 2), paint, 0, 0.1, 0);                          // main body
  add(box(hw * 1.8, 0.14, 1.1), paint, 0, 0.4, hl - 0.75);                  // hood step
  // cabin + inset glass
  add(box(hw * 1.5, 0.5, 1.85), paint, 0, 0.58, -0.3);
  const ws = add(box(hw * 1.36, 0.4, 0.1), glass, 0, 0.6, 0.68);
  ws.rotation.x = -0.28;
  add(box(hw * 1.36, 0.34, 0.09), glass, 0, 0.58, -1.24);
  for (const s of [-1, 1]) add(box(0.06, 0.32, 1.5), glass, (hw * 1.5) / 2 * s + 0.015 * s, 0.58, -0.3);
  // rally lamp pod on the nose + pop-up look lamps
  add(box(1.1, 0.16, 0.24), dark, 0, 0.42, hl - 0.12);
  for (const s of [-0.36, -0.12, 0.12, 0.36]) add(box(0.18, 0.14, 0.06), lampOn, s, 0.42, hl + 0.01, false);
  // headlights + taillights + grille
  for (const s of [-1, 1]) {
    add(box(0.34, 0.16, 0.06), lampOn, 0.62 * s, 0.16, hl + 0.01, false);
    add(box(0.34, 0.14, 0.06), tailOn, 0.62 * s, 0.16, -hl - 0.01, false);
  }
  add(box(0.9, 0.14, 0.05), dark, 0, 0.16, hl + 0.005);
  // bumpers + rear wing
  add(box(hw * 2 + 0.1, 0.22, 0.3), dark, 0, -0.14, hl + 0.05);
  add(box(hw * 2 + 0.1, 0.22, 0.3), dark, 0, -0.14, -hl - 0.05);
  add(box(hw * 1.7, 0.06, 0.5), dark, 0, 0.62, -hl + 0.15);
  for (const s of [-1, 1]) add(box(0.08, 0.22, 0.3), dark, 0.6 * s, 0.48, -hl + 0.18);
  // livery: twin center stripes + side blades
  add(box(0.34, 0.03, hl * 2 - 0.1), white, -0.26, 0.362, 0);
  add(box(0.34, 0.03, hl * 2 - 0.1), white, 0.26, 0.362, 0);
  for (const s of [-1, 1]) add(box(0.03, 0.16, hl * 1.5), white, (hw - 0.005) * s, 0.05, 0.1);
  // mirrors + fender flares
  for (const s of [-1, 1]) {
    add(box(0.1, 0.1, 0.16), dark, (hw + 0.09) * s, 0.52, 0.55);
    for (const z of [1.35, -1.35]) add(box(0.14, 0.2, 1.0), dark, (hw + 0.04) * s, -0.22, z);
  }

  const wheels: THREE.Mesh[] = [];
  const r = carData.tire.wheelRadius;
  const wheelGeo = new THREE.CylinderGeometry(r, r, 0.32, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.34, 8);
  rimGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.95 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.4, metalness: 0.3 });
  for (let i = 0; i < 4; i++) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.castShadow = true;
    const rim = new THREE.Mesh(rimGeo, rimMat);
    w.add(rim);
    root.add(w);
    wheels.push(w);
  }
  scene.add(root);
  return { root, wheels };
}
