// THE IMAGE PIPELINE — PORTED FROM IGNITE RALLY.
//
// Two blocks of v1's `src/main.js`: the composer chain built in the `Game`
// constructor at :912-942, and the PMREM environment dome built in
// `_applyTheme` at :1926-1955. Between them they are everything that decides
// what a frame looks like AFTER the geometry is drawn — bloom, the film grade,
// the tone-mapped output, and the small gradient dome that gives standard
// materials something to reflect. dustline had none of it, which is most of
// why the same world reads flat here and lit there.
//
// VERBATIM FROM v1:
//
//   - THE PASS ORDER: RenderPass -> UnrealBloomPass -> grade -> OutputPass.
//     The grade sits BEFORE OutputPass deliberately, and v1's comment says why:
//     "runs pre-OutputPass (linear space), so it grades under the tone map".
//     OutputPass is not optional decoration — three only applies
//     `renderer.toneMapping` to materials when the render target is the canvas
//     (`WebGLPrograms.getParameters`: tone mapping is forced to NoToneMapping
//     whenever `currentRenderTarget !== null`). Inside a composer everything
//     draws into a half-float target, so OutputPass is what applies ACES and
//     `toneMappingExposure`. Drop it and the picture is raw linear.
//   - THE BLOOM NUMBERS: strength 0.38, radius 0.45, threshold 0.88. v1 calls
//     this "a whisper of bloom for lamps, tracers and explosions" — a 0.88
//     threshold means almost nothing in the world qualifies, only emissive
//     things, which is why it never turns into a haze.
//   - THE GRADE SHADER, character for character, including its uniform values:
//     uVig 0.30, uSat 1.07, uCon 1.05, uAber 0.0006.
//   - THE PMREM DOME: a 2x64 canvas gradient on a back-side sphere baked
//     through PMREMGenerator at roughness 0.06, and the four multipliers that
//     dim it (0.34 top, 0.30 horizon, 0.20 ground, and the ground again by 0.6
//     for the bottom stop). v1's comment records what the dimming is for: the
//     IBL is a THIRD ambient term on top of the hemisphere light, and at full
//     strength it re-fills every shadow the key/fill ratio just opened up. It
//     is there for sheen on paint and wet road, not for lighting the world.
//
// DELIBERATELY CHANGED:
//
//   1. THE PASSES COME FROM THE NPM PACKAGE. v1 imports from its vendored
//      `lib/postprocessing/`. dustline imports `three/examples/jsm/...` from
//      its own `three` dependency, so nothing here reaches across into v1 and
//      the chain is whatever version of three dustline is pinned to.
//   2. THE WHOLE CHAIN IS OPTIONAL, and it switches itself off under a
//      software rasteriser. See `postWanted` below for the reasoning; v1 has
//      no such switch because v1 has no headless test suite.
//   3. THE DOME READS `TrackDef.sky`, not v1's theme object. v1 takes
//      `skyTop` / `skyHorizon` / `hemiGround`; the same three colours here are
//      `sky.stops[0]` (zenith), `sky.stops[3]` (horizon) and `sky.hemiGround`,
//      which is the same gradient `render/scenery.ts` paints on the sky dome.
//   4. THE BLOOM RESOLUTION comes from `renderer.getSize()` rather than
//      `innerWidth`/`innerHeight`. Same numbers while the canvas is full
//      screen, and no module-level dependency on the window.
//
// NOT PORTED: v1 also retunes the chain per level (`src/main.js:2680` drops
// exposure to 1.12 for one view). There is no equivalent hook in dustline yet.

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import type { TrackDef } from '../tracks/trackDef';

/** v1's bloom tuning, `src/main.js:915`. */
export const BLOOM = { strength: 0.38, radius: 0.45, threshold: 0.88 };

/** v1's grade uniforms, `src/main.js:920`. */
export const GRADE = { vig: 0.30, sat: 1.07, con: 1.05, aber: 0.0006 };

/** v1's film grade, copied from `src/main.js:919-940`. Vignette, saturation,
 *  contrast and a radial chromatic fringe, in one full-screen pass. */
const GRADE_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uVig: { value: GRADE.vig },
    uSat: { value: GRADE.sat },
    uCon: { value: GRADE.con },
    uAber: { value: GRADE.aber },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uVig, uSat, uCon, uAber; varying vec2 vUv;
    void main() {
      vec2 q = vUv - 0.5;
      float r2 = dot(q, q);
      // subtle radial chromatic fringe, only toward the frame edges
      vec2 off = q * r2 * uAber * 12.0;
      vec4 c = texture2D(tDiffuse, vUv);
      c.r = texture2D(tDiffuse, vUv - off).r;
      c.b = texture2D(tDiffuse, vUv + off).b;
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb = mix(vec3(l), c.rgb, uSat);
      c.rgb = (c.rgb - 0.5) * uCon + 0.5;
      c.rgb *= 1.0 - uVig * smoothstep(0.35, 0.95, r2 * 2.6);
      gl_FragColor = c;
    }`,
};

/** SHOULD THIS MACHINE RUN THE CHAIN?
 *
 *  The headless tools (`tools/components-smoke.mjs`, `tools/editor-smoke.mjs`,
 *  `tools/verify-deploy.mjs`, `tools/make-shots.mjs`, `tools/shot-component.mjs`)
 *  all launch Chromium with `--use-gl=swiftshader`, and none of them passes a
 *  URL flag we could key off — they navigate to a share link or to
 *  `index.html?track=<id>` and then read `window.__dust`. So the switch cannot
 *  be a flag alone: it has to be something those pages trip on their own.
 *
 *  Hence two ways in, in this order:
 *    - `?nopost` / `?post=0` forces the chain off, `?post=1` forces it on.
 *      Explicit wins over everything, including the sniff below.
 *    - otherwise, the chain is off when the GL renderer string names a
 *      software rasteriser. UnrealBloomPass is five mip levels of separable
 *      blur, which is cheap on a GPU and not cheap on a CPU.
 *
 *  MEASURED, in the Chromium the tools launch (`/opt/pw-browsers/chromium-1194`)
 *  with their own flags: `UNMASKED_RENDERER_WEBGL` reads
 *
 *    ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)),
 *    SwiftShader driver)
 *
 *  which this matches, and the game boots there with `post.enabled === false`.
 *  The plain `RENDERER` fallback reads "WebKit WebGL" and matches nothing, so
 *  the sniff is only as good as the extension: a browser that withholds
 *  `WEBGL_debug_renderer_info` gets the chain. If a tool ever ends up on the
 *  fallback path, `&nopost` on its URL settles it without touching this. */
export function postWanted(renderer: THREE.WebGLRenderer, search = location.search): boolean {
  const q = new URLSearchParams(search);
  if (q.has('nopost') || q.get('post') === '0') return false;
  if (q.get('post') === '1') return true;
  return !isSoftwareGL(renderer);
}

function isSoftwareGL(renderer: THREE.WebGLRenderer): boolean {
  try {
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(dbg
      ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER));
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch {
    return false;   // no context to ask: assume a real GPU rather than degrade
  }
}

/** The composer chain, or a direct draw when it is switched off.
 *
 *  Built lazily: with post disabled nothing here allocates a render target, so
 *  the software-rasteriser path costs exactly what `renderer.render` costs and
 *  not one texture more. Turning it back on at runtime builds the chain then. */
export class Post {
  enabled: boolean;
  bloom: UnrealBloomPass | null = null;
  grade: ShaderPass | null = null;

  private composer: EffectComposer | null = null;
  private renderPass: RenderPass | null = null;
  private output: OutputPass | null = null;
  private w: number;
  private h: number;

  constructor(private renderer: THREE.WebGLRenderer, enabled = postWanted(renderer)) {
    const size = renderer.getSize(new THREE.Vector2());
    this.w = size.x;
    this.h = size.y;
    this.enabled = enabled;
  }

  setSize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.composer?.setSize(w, h);
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (!this.enabled) {
      this.renderer.info.autoReset = true;
      this.renderer.render(scene, camera);
      return;
    }
    // KEEP `renderer.info` MEANING "THIS FRAME".
    //
    // `info` resets itself inside every `renderer.render` call, and a composer
    // frame is a dozen of those — the last being OutputPass's full-screen
    // quad. Measured on dustbowl under swiftshader: 208,158 tris / 151 draws
    // with the chain off, 1 tri / 1 draw with it on. The second number is the
    // quad, not the frame. `tools/verify-deploy.mjs` reads exactly this
    // counter to report what a track costs, and `main.ts` exposes
    // `__dust.renderer` for that purpose, so the chain resets the counter once
    // per frame itself. Not from v1: v1 has the same wart and no tool reading
    // the counter.
    //
    // ONE HONEST CAVEAT ABOUT THE NUMBER THIS PRODUCES. Three resets `info`
    // AFTER it renders the shadow map, not before (`three.module.js`: the
    // shadow render at :29594, the reset at :29600), so its own counters have
    // always excluded the shadow pass. Resetting by hand up here includes it.
    // Measured on the same frame of dustbowl: 208,122 tris / 148 draws with
    // the chain off against 257,957 / 285 with it on, and the difference is
    // the shadow pass plus this chain's own full-screen quads — not 50,000
    // triangles of new scene geometry. Readings taken with post on are
    // therefore not comparable with readings taken with it off.
    this.renderer.info.autoReset = false;
    this.renderer.info.reset();
    const composer = this.build(scene, camera);
    // The scene and camera are handed in per frame rather than frozen into the
    // RenderPass at construction, so a caller that swaps either one (a replay
    // camera, a rebuilt world) does not have to know a composer exists.
    const pass = this.renderPass!;
    if (pass.scene !== scene) pass.scene = scene;
    if (pass.camera !== camera) pass.camera = camera;
    composer.render();
  }

  private build(scene: THREE.Scene, camera: THREE.Camera): EffectComposer {
    if (this.composer) return this.composer;
    const composer = new EffectComposer(this.renderer);
    composer.setSize(this.w, this.h);
    this.renderPass = new RenderPass(scene, camera);
    composer.addPass(this.renderPass);
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(this.w, this.h), BLOOM.strength, BLOOM.radius, BLOOM.threshold);
    composer.addPass(this.bloom);
    this.grade = new ShaderPass(GRADE_SHADER);
    composer.addPass(this.grade);
    this.output = new OutputPass();
    composer.addPass(this.output);
    this.composer = composer;
    return composer;
  }

  /** Frees the render targets and every pass that owns GPU state.
   *  `EffectComposer.dispose` only frees its own two targets and the copy pass,
   *  so the bloom's mip chain and the two full-screen materials are dropped
   *  here by hand. */
  dispose(): void {
    this.bloom?.dispose();
    this.grade?.dispose();
    this.output?.dispose();
    this.composer?.dispose();
    this.composer = null;
    this.renderPass = null;
    this.bloom = null;
    this.grade = null;
    this.output = null;
  }
}

/** IMAGE-BASED LIGHTING — v1 `src/main.js:1926-1955`, "a tiny theme-tinted
 *  gradient dome through PMREM".
 *
 *  Standard materials with no environment have nothing to reflect, so metalness
 *  reads as black and a glossy surface reads as matte. This bakes a 2x64 sky
 *  gradient into a PMREM cube and hangs it on `scene.environment`, which costs
 *  one bake at load and nothing per frame.
 *
 *  The multipliers are v1's and they are deliberately low — read the note in
 *  the header about the third ambient term. The mutation of `gnd` for the last
 *  stop is v1's too: the 0.56 stop is already written into the gradient by the
 *  time `gnd` is dimmed again for the bottom, so both stops come off one
 *  colour object. Returns the environment texture; the caller owns disposing
 *  it if it ever rebuilds the world. */
export function buildEnvironment(
  renderer: THREE.WebGLRenderer, scene: THREE.Scene, def: TrackDef,
): THREE.Texture {
  const top = new THREE.Color(def.sky.stops[0]).multiplyScalar(0.34);
  const hor = new THREE.Color(def.sky.stops[3]).multiplyScalar(0.30);
  const gnd = new THREE.Color(def.sky.hemiGround).multiplyScalar(0.20);
  const cnv = document.createElement('canvas');
  cnv.width = 2; cnv.height = 64;
  const cx = cnv.getContext('2d')!;
  const gr = cx.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, '#' + top.getHexString());
  gr.addColorStop(0.5, '#' + hor.getHexString());
  gr.addColorStop(0.56, '#' + gnd.getHexString());
  gr.addColorStop(1, '#' + gnd.multiplyScalar(0.6).getHexString());
  cx.fillStyle = gr;
  cx.fillRect(0, 0, 2, 64);

  const envTex = new THREE.CanvasTexture(cnv);
  envTex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(10, 16, 12),
    new THREE.MeshBasicMaterial({ map: envTex, side: THREE.BackSide }));
  const envScene = new THREE.Scene();
  envScene.add(dome);
  const env = pmrem.fromScene(envScene, 0.06).texture;
  scene.environment = env;
  pmrem.dispose();
  dome.geometry.dispose();
  dome.material.dispose();
  envTex.dispose();
  return env;
}
