// THE SKY — PORTED FROM IGNITE RALLY (`_buildSky`, the `skyMethods` object in
// `src/world/sky.js` at the repository root).
//
// dustline had a sky the way a mockup has a sky: one canvas gradient on a
// sphere and a ring of emissive icosahedra for clouds, neither of which claims
// any provenance, and above the horizon line that was the entire image. v1
// builds five layers there and every one of them is doing a job:
//
//   1. a shader dome whose gradient runs to the horizon and carries a
//      forward-scatter lobe around the sun's own bearing;
//   2. a star field, on the worlds that are dark enough to want one;
//   3. a dense haze ring inside the far peaks;
//   4. a second, fainter haze ring OUTSIDE them, so the skyline stacks
//      hills -> haze -> peaks -> haze -> sky rather than reading as one band;
//   5. a cloud field of painted sprites, warmed on the sun's side of the
//      compass, sunk and faded toward the fog with distance.
//
// The dome and the haze ring are shapes and live in `templates/horizon.ts`
// next to the skyline forms; the sprites they use are `hazeTexture` and
// `cloudTexture` in `templates/textures.ts`, both already ported and, until
// this file, both with no consumer. What is here is the ARRANGEMENT: how big
// each layer is for this world, where the clouds go, and how it all comes down
// again.
//
// WHAT CAME ACROSS VERBATIM: the layer list and its order; the shader (see
// `skyDomeMaterial`); the two haze rings and their proportions; the whole cloud
// field — `ceil(count * 1.5)` sprites, radius `500 + rand * 800`, height
// `(190 + rand * 160) * (1 - 0.45 * far) + 60 * far`, size `120 + rr^2 * 260`
// with the SQUARED bias that makes a field of small puffs under a few heroes,
// aspect `0.38 + rand * 0.24`, opacity `(0.55 + 0.45 * rand) * (1 - 0.35 * far)`,
// the warm rim `lerp(glow, 0.3 * max(0, cos(bearing - sunAz)))`, the recession
// `lerp(fog, 0.35 * far)`, and the drift `(1.5 + rand * 2.5) * (1 - 0.4 * far)`
// wrapping from one side of the field to the other; and the star field's 340
// points at elevation 0.08 to 1.35 in `PointsMaterial` at size 2.4 unattenuated.
//
// FIVE DELIBERATE CHANGES:
//
//   1. `Math.random()` BECOMES A SEEDED STREAM, `Rng.fork(def.seed, 'sky')`,
//      like every other scatter in dustline. A world that cannot be rebuilt
//      cannot be debugged — `core/rng.ts` argues this at length.
//   2. THE SKY IS SCALED TO THIS WORLD'S SKYLINE. v1's sky is a set of absolute
//      lengths authored around a 900 u near hill ring; a dustline track states
//      its own ring in `sky.mountains.radius` (640 to 680 on the shipped
//      tracks), so every length below is v1's multiplied by `K`. See `K`.
//   3. THE DOME IS NOT V1's 3000 u. That is the one v1 proportion this world
//      cannot have, and the arithmetic is under `domeR`.
//   4. NO SUN SPRITE, WHICH IS ALSO V1's ANSWER. See `SUN` below.
//   5. THE SPRITE MAPS ARE CLONED. `hazeTexture` and `cloudTexture` are
//      memoised through `cached()`, and `templates/canvas.ts` is explicit that a
//      shared texture disposed by somebody else "renders black and logs
//      nothing". The editor's `disposeDeep` (`editor/preview.ts:103`) disposes
//      `material.map` on every rebuild, which would do exactly that to the
//      shared instance. A clone shares the canvas and the GPU upload through
//      three's `Source` refcount but carries its own disposal, so the rig can
//      be torn down by either route without poisoning the cache.
//
// WHAT V1 DOES THAT THIS DOES NOT: v1's game lead hides both haze rings when
// the camera pitches steeply down, because from its top-down roam camera "the
// cylinder's far wall painted a WHITE SHEET over half the world". The meshes
// are named `haze-band` and `haze-band-far` here so the same toggle can be
// written, but dustline's chase camera never gets to that pitch and I have not
// reproduced the failure, so there is nothing switching them.

import * as THREE from 'three';
import type { TrackDef } from '../tracks/trackDef';
import { Rng } from '../core/rng';
import { skyDome, hazeRing, skyColorAt } from '../templates/horizon';
import { hazeTexture, cloudTexture } from '../templates/textures';

const TAU = Math.PI * 2;

/** The near hill ring v1's sky is authored around: `_buildHorizon` places its
 *  near ring at 900 to 1040 and its far one at 1120 to 1280, and every other
 *  length in that sky is a number chosen against those. */
const V1_HILL_RING = 900;

/** THE SKY RIG FOR ONE WORLD.
 *
 *  A class rather than five build functions because the layers share the
 *  derived numbers, the clouds need a per-frame nudge, and the whole thing has
 *  to come down again: the editor rebuilds on a keystroke, and a dome, two
 *  cylinders and forty sprite materials left in the scene per rebuild is a leak
 *  you can watch happen in the memory graph. */
export class Sky {
  /** Every object added to the scene, for a caller that disposes its own way
   *  (the editor pushes these into its `built` list and walks them). */
  readonly objects: THREE.Object3D[] = [];

  private readonly scene: THREE.Scene;
  private readonly drifting: { sprite: THREE.Sprite; speed: number }[] = [];
  /** Textures this rig owns and must free — see change 5 in the header. */
  private readonly owned: THREE.Texture[] = [];
  /** Where a drifting cloud is sent back to the far side of the field. */
  private readonly wrapX: number;

  constructor(scene: THREE.Scene, def: TrackDef) {
    this.scene = scene;
    const S = def.sky;
    const M = S.mountains;
    const rng = Rng.fork(def.seed, 'sky');

    // THE ONE SCALE FACTOR. v1's sky rings are 940 and 1450 against a 900 u
    // hill ring; a track here states its own, so the whole sky is that ratio.
    // The fallback matches what the editor uses to frame a track with no
    // skyline at all (`editor/preview.ts:198`).
    const K = (M.radius > 0 ? M.radius : def.world.size * 0.7) / V1_HILL_RING;

    // Haze rings, at v1's ratios: the near one just outside the near hills
    // (940 of 900) and the far one outside the far peaks (1450 of 900), which
    // is what puts a band of atmosphere BETWEEN the two rows of mountains
    // `render/horizon.ts` places at radius M.radius and M.radius * 1.34.
    const hazeR1 = 940 * K;
    const hazeR2 = 1450 * K;

    // THE DOME CANNOT BE V1's. v1 uses 3000 u and says why: "the roam bounds
    // reach 1400, and a top-down camera near the edge sliced straight through a
    // 1500 dome - its pale horizon shader then painted half the frame white.
    // 3000 keeps the dome past every reachable camera while staying inside the
    // 3200 far plane." dustline's far plane is 1500 (`render/camera.ts:19`), so
    // v1's proportion — 3.33 times the hill ring, i.e. 2133 u on a 640 u
    // skyline — would put the entire dome behind it and leave no sky at all.
    // It is sized instead as the larger of dustline's own existing radius and
    // whatever clears the outer haze ring, so nothing in the sky ever pokes
    // through it. On the shipped tracks that is 1125 u for `dustbowl` — exactly
    // the radius the canvas dome had, its outer haze landing at 1031 — 1159 for
    // `proving-ground` and 1194 for `harbour`, whose skylines are wider.
    //
    // NOT MEASURED IN A RUNNING GAME: those worlds are 900 u across, so a
    // camera 450 u out at a corner sees the dome's far wall from up to 1644 u
    // against a 1500 u far plane, and the bottom of that far side can clip. The
    // lower bound here is the haze ring, so the lever is the far plane in
    // `render/camera.ts`, which this file does not own.
    const domeR = Math.max(1100, def.world.size * 1.25, hazeR2 * 1.09);

    // ---- 1. the dome ----
    const sun = new THREE.Vector3(S.sunDir[0], S.sunDir[1], S.sunDir[2]).normalize();
    // v1's `sunGlow` is a per-theme knob defaulting to 0xfff2c8. dustline has
    // no field for it and does not need one: `sunColor` is what the key light
    // already is, and light scattered off the air in front of the sun is that
    // sun. It also tracks the weather where a constant would not — #ffc98a at
    // golden hour, #cfd8e2 under the storm, which is the one preset whose sun
    // is cold and whose sky should not be told otherwise.
    const dome = skyDome(domeR, { stops: S.stops, sunDir: sun, glow: S.sunColor });
    // dustline's own, kept from the canvas dome it replaces: the backdrop draws
    // first and everything else lands on top of it.
    dome.renderOrder = -10;
    this.add(dome);

    // ---- 1a. THE SUN, WHICH IS THE LOBE ABOVE AND NOTHING ELSE ----
    //
    // `templates/textures.ts` carries `sunTexture` and `glowTexture`, both
    // painted and both unused, because v1 paints them and then refuses to draw
    // them. Where the sprite used to be, `src/world/sky.js:83-89` says:
    //
    //   "NO SUN SPRITE. A 560-unit additive halo with depthWrite off washed a
    //    hot white smear across the road and grass - the default camera looks
    //    DOWN, so a sky billboard ends up laid over the play surface rather
    //    than sitting on the horizon, and the bloom pass then amplified it.
    //    The light itself still comes from sunAz/sunEl; it simply has no drawn
    //    source. Do not reintroduce a sun disc, halo or lens flare without
    //    checking it from the top-down camera first."
    //
    // dustline has a bloom pass too (`render/post.ts`) and a chase camera that
    // looks down at a shallower angle, so that failure may well not reproduce
    // here — but I have not tested it, and a hot additive billboard is not
    // something to put back on a guess. The forward-scatter lobe in the dome
    // shader is the same sun, painted at the back of the world where geometry
    // occludes it, and it is what v1 ships.

    // ---- 2. stars, on a world dark enough to have them ----
    //
    // v1 gates these on `T.stars`, a per-theme flag it sets for its night city.
    // Derived here instead of adding a field: a sky is a night sky when its
    // zenith is nearly black AND its sun is barely on. MEASURED against the
    // seven shipped weathers in `tracks/presets.ts`, none qualifies — the
    // darkest is `storm`, whose zenith #26313d has a relative luminance of
    // 0.186 and whose sun is at 1.05 — so no track in the game gets stars
    // today, and a night preset gets them without touching this file.
    if (luminance(S.stops[0]) < 0.10 && S.sunIntensity <= 0.6) {
      const pos = new Float32Array(340 * 3);
      for (let i = 0; i < 340; i++) {
        const a = rng.float() * TAU;
        const el = 0.08 + rng.float() * 1.35;          // keep off the glow band
        const r = domeR * 0.95;                        // v1: 2850 inside a 3000 dome
        pos[i * 3] = Math.cos(a) * Math.cos(el) * r;
        pos[i * 3 + 1] = Math.sin(el) * r;
        pos[i * 3 + 2] = Math.sin(a) * Math.cos(el) * r;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const stars = new THREE.Points(geo, new THREE.PointsMaterial({
        color: 0xcfd8ff, size: 2.4, sizeAttenuation: false,
        fog: false, transparent: true, opacity: 0.85, depthWrite: false,
      }));
      stars.name = 'stars';
      this.add(stars);
    }

    // ---- 3 and 4. the two haze rings ----
    //
    // v1 tints ring one with `hazeColor`, which defaults to the fog colour (25
    // of its 30 themes take that default), and ring two with the same colour
    // lerped 0.4 toward `skyHorizon`. dustline has no `skyHorizon` because its
    // stops describe the whole ramp rather than its ends, so the colour is read
    // off the dome itself at elevation 0 — which is what that field meant.
    const hazeMap = hazeTexture().clone();
    this.owned.push(hazeMap);
    const HAZE_OPACITY = 0.9;                          // v1's default
    const ring1 = hazeRing(hazeR1, {
      map: hazeMap, color: S.fogColor, opacity: HAZE_OPACITY,
    });
    ring1.name = 'haze-band';
    this.add(ring1);
    const ring2 = hazeRing(hazeR2, {
      map: hazeMap,
      color: new THREE.Color(S.fogColor).lerp(skyColorAt(S.stops, 0), 0.4),
      opacity: HAZE_OPACITY * 0.55,
      heightFrac: 0.331, liftFrac: 0.1034,             // v1's far ring: 480 and 150 over 1450
    });
    ring2.name = 'haze-band-far';
    this.add(ring2);

    // ---- 5. the cloud field ----
    //
    // v1: "Still one sprite per cloud - and a sprite IS a draw call, so the
    // count is held to 1.5x, not the 2.5x the design wanted." Kept at 1.5x, and
    // the arithmetic is worth stating: the shipped weathers ask for 9 to 26
    // clouds, so this is 14 to 39 draw calls of sky. v1's own fix — one
    // instanced billboard layer, the whole sky in one draw — is designed there
    // and still open here.
    const nClouds = Math.ceil(S.clouds * 1.5);
    this.wrapX = 1100 * K;                             // v1 wraps at 1100 of a 1300 field
    if (nClouds > 0) {
      const cloudMap = cloudTexture().clone();
      this.owned.push(cloudMap);
      const field = new THREE.Group();
      field.name = 'clouds';
      const fogC = new THREE.Color(S.fogColor);
      const glowC = new THREE.Color(S.sunColor);
      // The sun's compass bearing, which is what decides which clouds are lit
      // warm. v1 stores `sunAz` per theme and builds its sun vector from it;
      // dustline stores the vector, so the bearing comes back out of it.
      const sunAz = Math.atan2(S.sunDir[2], S.sunDir[0]);
      // v1's `cloudOpacity`, which dustline has no field for. FITTED, not
      // guessed: over the 28 themes in `src/world/themes.js` that have any
      // cloud at all, opacity rises with count at 0.4175 + 0.0411 * count
      // (correlation 0.66 — the same weather that piles up cloud paints it
      // thicker), and it is clamped to the range those themes actually use,
      // 0.35 to 0.95. dustline's counts run higher than v1's, so its cloudiest
      // skies sit on the 0.95 clamp, which is where v1's overcast worlds are.
      const cloudOpacity = Math.min(0.95, Math.max(0.35, 0.4175 + 0.0411 * S.clouds));
      for (let i = 0; i < nClouds; i++) {
        const rr = rng.float();
        const a = (i / nClouds) * TAU + rng.float();
        const far = rng.float();                       // 0 near, 1 at the far edge
        const r = (500 + far * 800) * K;
        const tint = new THREE.Color(0xffffff);        // v1's `cloudTint` default
        // warm rim on the sun's side of the compass
        tint.lerp(glowC, 0.3 * Math.max(0, Math.cos(a - sunAz)));
        tint.lerp(fogC, 0.35 * far);                   // recession haze
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
          map: cloudMap, transparent: true, fog: false, depthWrite: false,
          opacity: cloudOpacity * (0.55 + 0.45 * rng.float()) * (1 - 0.35 * far),
          color: tint,
        }));
        sprite.position.set(
          Math.cos(a) * r,
          ((190 + rng.float() * 160) * (1 - 0.45 * far) + 60 * far) * K,
          Math.sin(a) * r,
        );
        const s = (120 + rr * rr * 260) * K;
        sprite.scale.set(s, s * (0.38 + rng.float() * 0.24), 1);
        field.add(sprite);
        this.drifting.push({ sprite, speed: (1.5 + rng.float() * 2.5) * (1 - 0.4 * far) * K });
      }
      this.add(field);
    }
  }

  private add(o: THREE.Object3D) {
    this.scene.add(o);
    this.objects.push(o);
  }

  /** Drift the clouds. v1's `Track.update` (`src/track.js:17498`) moves each
   *  one along +x at its own speed and sends it back to the far side of the
   *  field when it runs out. That is a wind, not a turntable: the field shears
   *  as the near clouds outrun the far ones, where dustline's old cloud group
   *  was spun about the world's y axis in `main.ts` and held formation. */
  update(dt: number): void {
    for (const c of this.drifting) {
      c.sprite.position.x += c.speed * dt;
      if (c.sprite.position.x > this.wrapX) c.sprite.position.x = -this.wrapX;
    }
  }

  /** Take the whole sky down: out of the scene, geometry and materials freed,
   *  and the two cloned sprite maps with them.
   *
   *  The CACHED sources in `templates/textures.ts` are deliberately left alone.
   *  They belong to `disposeCachedTextures()`, which the part cache calls; a
   *  rig that freed them would black out the next world's sky and log nothing
   *  about it. */
  dispose(): void {
    for (const o of this.objects) {
      this.scene.remove(o);
      o.traverse((n) => {
        const m = n as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else if (mat) mat.dispose();
      });
    }
    for (const t of this.owned) t.dispose();
    this.objects.length = 0;
    this.drifting.length = 0;
    this.owned.length = 0;
  }
}

/** Relative luminance of an '#rrggbb' string, for the night test above. Done on
 *  the raw bytes rather than through `THREE.Color`, which would convert to the
 *  linear working space first and answer a different question. */
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
