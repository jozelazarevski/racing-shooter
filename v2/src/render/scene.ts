/* Rendering. One file, because at this stage the whole renderer is a terrain
 * mesh, four instanced prop meshes, a car and a sky.
 *
 * The one rule worth stating: the terrain mesh is built from the SAME
 * Float32Array that Rapier collides against. Not a copy, not a re-derivation —
 * the same buffer. If they ever diverge you get the v1 bug where the car drives
 * through what you can see, and the only reliable way to prevent divergence is
 * to have nothing to diverge.
 */
import * as THREE from 'three';
import { Tier } from '../../../spec/rally.constants.ts';
import { Particles } from './particles.ts';
import type { Stage } from '../world/stage.ts';
import type { Heightfield } from '../world/terrain.ts';
import { WHEEL_RADIUS } from '../physics/vehicle.ts';

/** Palette per biome. Placeholder for the RALLY_WORLD_BIBLE region palettes,
 *  which land in Phase 4 — these are honest stand-ins, not the specified
 *  values, and are marked as such in PHASES.md. */
const PALETTE: Record<string, { ground: number; road: number; rock: number; sky: number; fog: number; sun: number }> = {
  alpine_forest:       { ground: 0x4a6741, road: 0x8a8175, rock: 0x6b6660, sky: 0x9dc4e0, fog: 0xaecbdd, sun: 0xfff4e0 },
  nordic_pine:         { ground: 0x53684a, road: 0x94897a, rock: 0x767068, sky: 0xa8c8dc, fog: 0xc2d6e2, sun: 0xfff0d8 },
  mediterranean_scrub: { ground: 0x8a8552, road: 0x50504e, rock: 0x9c8f75, sky: 0x7fb5dd, fog: 0xc9d8e0, sun: 0xfff8e8 },
  farmland:            { ground: 0x6f8a4a, road: 0x8f8676, rock: 0x8a8175, sky: 0x9ac4e2, fog: 0xbfd4e0, sun: 0xfff6e4 },
  desert_wash:         { ground: 0xa8905e, road: 0xb09a70, rock: 0xa08a68, sky: 0xc4d8e6, fog: 0xdcd0b8, sun: 0xfff2d0 },
  moorland:            { ground: 0x6b6a4a, road: 0x8a8478, rock: 0x77726a, sky: 0x93a8b8, fog: 0xa8b6c0, sun: 0xf0eee4 },
};

const SNOW = { ground: 0xdfe6ec, road: 0xc8d2da, rock: 0x9aa4ac, sky: 0xbdd0e0, fog: 0xdae6ee, sun: 0xfffaf0 };

export interface Renderer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  car: THREE.Group;
  wheels: THREE.Mesh[];
  rival: THREE.Group;
  particles: Particles;
  /** Tracer segments, one instanced mesh. */
  tracers: THREE.InstancedMesh;
  /** Hide a prop that has been shot away. Object id -> where its instance
   *  lives, so a destroyed collider and its visible mesh go together. */
  hideObject(id: string): void;
  /** Keep the shadow frustum on the car. */
  followSun(x: number, y: number, z: number): void;
  resize(): void;
}

export function createRenderer(canvas: HTMLCanvasElement, stage: Stage): Renderer {
  const pal = stage.def.surface === 'snow' ? SNOW : (PALETTE[stage.def.biome] ?? PALETTE.alpine_forest!);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  // Tone mapping and sRGB. Without them the specified palettes come out flat
  // and washed: a Lambert surface lit by a 2.1-intensity sun clips to white in
  // linear space long before it should.
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  // Shadows, but only from the car: a 4 km stage of shadow-casting trees is not
  // a frame budget. The car's own shadow is the one that matters — it is what
  // tells you where you are about to land after a crest.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(pal.fog, 220, 820);
  scene.add(buildSky(pal));

  const sun = new THREE.DirectionalLight(pal.sun, 2.3);
  sun.position.set(-0.4, 1, 0.6).multiplyScalar(120);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  // A tight orthographic frustum that follows the car. A frustum big enough to
  // cover the stage would put a 4 km scene into 1024 texels and the shadow
  // would be a smear.
  const sc = sun.shadow.camera as THREE.OrthographicCamera;
  sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14;
  sc.near = 1; sc.far = 320;
  scene.add(sun);
  scene.add(sun.target);
  scene.add(new THREE.HemisphereLight(pal.sky, pal.ground, 1.0));

  scene.add(buildTerrain(stage.heightfield, pal));
  const instanceIndex = new Map<string, { mesh: THREE.InstancedMesh; i: number }>();
  for (const m of buildProps(stage, pal, instanceIndex)) scene.add(m);

  const { car, wheels } = buildCar(0xe8442c);
  scene.add(car);
  const rival = buildCar(0x2f7fd4).car;
  scene.add(rival);

  const particles = new Particles();
  scene.add(particles.points);

  // Tracers. A thin box scaled along its length per shot — one draw call for
  // every shell in flight, and nothing allocated when firing.
  const tracers = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.09, 0.09, 1),
    new THREE.MeshBasicMaterial({ color: 0xffd08a }),
    24,
  );
  tracers.frustumCulled = false;
  tracers.count = 24;
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < 24; i++) tracers.setMatrixAt(i, zero);
  scene.add(tracers);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.4, 900);

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();

  // The sun follows the car so the shadow frustum stays tight.
  const sunOffset = sun.position.clone();
  const followSun = (x: number, y: number, z: number) => {
    sun.target.position.set(x, y, z);
    sun.position.copy(sunOffset).add(new THREE.Vector3(x, y, z));
    sun.target.updateMatrixWorld();
  };

  const hideObject = (id: string) => {
    const at = instanceIndex.get(id);
    if (!at) return;
    at.mesh.setMatrixAt(at.i, zero);
    at.mesh.instanceMatrix.needsUpdate = true;
  };

  return { scene, camera, renderer, car, wheels, rival, particles, tracers, hideObject, followSun, resize };
}

/** A gradient sky dome rather than a flat background colour.
 *
 * A solid clear colour makes every stage look like it was shot against paper.
 * A two-stop vertical gradient — horizon haze into zenith — costs one inverted
 * sphere and no texture, and it is what makes the fog colour read as distance
 * rather than as a grey wall. */
function buildSky(pal: (typeof PALETTE)[string]): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color(pal.sky) },
      uBottom: { value: new THREE.Color(pal.fog) },
    },
    vertexShader: `
      varying float vH;
      void main() {
        vH = normalize(position).y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uTop;
      uniform vec3 uBottom;
      varying float vH;
      void main() {
        gl_FragColor = vec4(mix(uBottom, uTop, smoothstep(-0.06, 0.42, vH)), 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat);
  sky.scale.setScalar(880);   // just inside the far plane
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  return sky;
}

/**
 * Terrain mesh from the physics heightfield.
 *
 * Strided so the vertex count stays sane: a 6 km stage is three quarters of a
 * million grid points and there is no reason to draw all of them. The COLLIDER
 * still uses every one — visual decimation is safe, physical decimation is the
 * bug this whole rewrite is about.
 */
function buildTerrain(hf: Heightfield, pal: (typeof PALETTE)[string]): THREE.Mesh {
  const MAX_VERTS = 150_000;
  let stride = 1;
  while (((hf.nx / stride + 1) * (hf.nz / stride + 1)) > MAX_VERTS) stride++;

  const cx = Math.floor(hf.nx / stride) + 1;
  const cz = Math.floor(hf.nz / stride) + 1;
  const positions = new Float32Array(cx * cz * 3);
  const colors = new Float32Array(cx * cz * 3);
  const s = hf.nz + 1;   // buffer stride: see Heightfield.heights

  const ground = new THREE.Color(pal.ground);
  const road = new THREE.Color(pal.road);
  const rock = new THREE.Color(pal.rock);
  const c = new THREE.Color();

  for (let j = 0; j < cz; j++) {
    for (let i = 0; i < cx; i++) {
      const gi = Math.min(hf.nx, i * stride);
      const gj = Math.min(hf.nz, j * stride);
      const idx = gi * s + gj;
      const h = hf.heights[idx]!;
      const o = (j * cx + i) * 3;
      positions[o] = hf.x0 + gi * hf.cell;
      positions[o + 1] = h;
      positions[o + 2] = hf.z0 + gj * hf.cell;

      // Steep ground reads as rock. Cheap, and it stops a hillside looking
      // like a putting green.
      const hx = hf.heights[Math.min(hf.nx, gi + 1) * s + gj]! - h;
      const hz = hf.heights[gi * s + Math.min(hf.nz, gj + 1)]! - h;
      const slope = Math.min(1, Math.hypot(hx, hz) / hf.cell / 0.7);
      c.copy(ground).lerp(rock, slope).lerp(road, hf.roadMask[idx]!);
      colors[o] = c.r;
      colors[o + 1] = c.g;
      colors[o + 2] = c.b;
    }
  }

  const indices: number[] = [];
  for (let j = 0; j < cz - 1; j++) {
    for (let i = 0; i < cx - 1; i++) {
      const a = j * cx + i;
      indices.push(a, a + cx, a + 1, a + 1, a + cx, a + cx + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(indices.length > 65535 ? new THREE.Uint32BufferAttribute(indices, 1) : new THREE.Uint16BufferAttribute(indices, 1));
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  mesh.receiveShadow = true;
  return mesh;
}

/** InstancedMesh per tier PER SPATIAL CHUNK, per §12: "Trees, rocks, and fence
 *  sections use GPU instancing with per instance colour and scale variation.
 *  Never place them as individual meshes."
 *
 *  The chunking is what makes frustum culling work. One instanced mesh for a
 *  whole 5 km stage has a bounding sphere covering the whole stage, so it is
 *  never culled and every blade of grass behind the camera is still submitted:
 *  measured, 1.09 million triangles per frame with nothing off screen. Split
 *  into 300 m chunks, the renderer draws the handful the camera can actually
 *  see and the fog hides the rest. */
function buildProps(
  stage: Stage,
  pal: (typeof PALETTE)[string],
  index: Map<string, { mesh: THREE.InstancedMesh; i: number }>,
): THREE.Object3D[] {
  const CHUNK = 300;
  const out: THREE.Object3D[] = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const col = new THREE.Color();
  const axis = new THREE.Vector3(0, 1, 0);

  // Low-poly on purpose. These are read at speed from a moving car; the
  // silhouette carries the §3.4 "what will this do to me" information and the
  // triangle count does not.
  const geoms: Record<number, THREE.BufferGeometry> = {
    0: new THREE.ConeGeometry(0.22, 0.55, 3),
    1: new THREE.OctahedronGeometry(0.55, 0),
    2: new THREE.OctahedronGeometry(0.9, 0),
    3: new THREE.CylinderGeometry(0.16, 0.22, 1, 5),
    4: new THREE.CylinderGeometry(0.22, 0.34, 1, 6),
  };
  const canopyGeo = new THREE.ConeGeometry(1, 1, 6);
  const base: Record<number, number> = { 0: 0x7f9455, 1: 0x6d8a4a, 2: 0x5d7a42, 3: 0x6b5a3e, 4: 0x5a4a33 };
  // Tier 0 is grass at 40-70 per 100 m2 — well over a hundred thousand blades
  // on a stage. Thinned for DRAWING only; the world model keeps every one and
  // nothing collides with them anyway.
  const KEEP: Record<number, number> = { 0: 0.10, 1: 0.34, 2: 0.7, 3: 1, 4: 1 };

  // Bucket by 300 m chunk, then by tier.
  const chunks = new Map<string, WorldObjectLite[]>();
  for (let i = 0; i < stage.objects.length; i++) {
    const o = stage.objects[i]!;
    const keep = KEEP[o.tier]!;
    if (keep < 1 && (i % Math.round(1 / keep)) !== 0) continue;
    const [x, , z] = o.transform.position;
    const key = `${o.tier}|${Math.floor(x / CHUNK)}|${Math.floor(z / CHUNK)}`;
    let list = chunks.get(key);
    if (!list) { list = []; chunks.set(key, list); }
    list.push(o);
  }

  for (const [key, items] of chunks) {
    const tier = Number(key.split('|')[0]);
    const mesh = new THREE.InstancedMesh(
      geoms[tier]!,
      new THREE.MeshLambertMaterial({ vertexColors: true }),
      items.length,
    );
    for (let i = 0; i < items.length; i++) {
      const o = items[i]!;
      const [x, y, z] = o.transform.position;
      const h = tier >= 3 ? o.collider.height : o.transform.scale;
      q.setFromAxisAngle(axis, o.transform.rotationY);
      m.compose(
        new THREE.Vector3(x, y + (tier >= 3 ? h / 2 : 0.25 * o.transform.scale), z),
        q,
        new THREE.Vector3(o.transform.scale, tier >= 3 ? h : o.transform.scale, o.transform.scale),
      );
      mesh.setMatrixAt(i, m);
      // Only tiers that can be shot away need an entry; grass has no collider.
      if (tier >= 1 && tier <= 3) index.set(o.id, { mesh, i });
      // §3.4: foliage never pure green, saturation under 55%.
      col.setHex(base[tier]!).offsetHSL(0, 0, (i % 7) * 0.012 - 0.03);
      mesh.setColorAt(i, col);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    out.push(mesh);

    // Tier 4 canopies, so a mature tree reads as a tree and not a post.
    if (tier === 4) {
      const canopy = new THREE.InstancedMesh(
        canopyGeo,
        new THREE.MeshLambertMaterial({ color: pal.ground }),
        items.length,
      );
      for (let i = 0; i < items.length; i++) {
        const o = items[i]!;
        const [x, y, z] = o.transform.position;
        const h = o.collider.height;
        m.compose(
          new THREE.Vector3(x, y + h * 0.72, z),
          new THREE.Quaternion(),
          new THREE.Vector3(h * 0.26, h * 0.62, h * 0.26),
        );
        canopy.setMatrixAt(i, m);
      }
      canopy.instanceMatrix.needsUpdate = true;
      canopy.computeBoundingSphere();
      out.push(canopy);
    }
  }
  return out;
}

type WorldObjectLite = Stage['objects'][number];

function buildCar(colour: number): { car: THREE.Group; wheels: THREE.Mesh[] } {
  const car = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.62, 4.2),
    new THREE.MeshLambertMaterial({ color: colour }),
  );
  body.position.y = 0.1;
  body.castShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.5, 1.9),
    new THREE.MeshLambertMaterial({ color: 0x27313a }),
  );
  cabin.position.set(0, 0.55, -0.15);
  cabin.castShadow = true;
  car.add(cabin);

  const wheelGeo = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.26, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheels: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const wheel = new THREE.Mesh(wheelGeo, new THREE.MeshLambertMaterial({ color: 0x1a1a1c }));
    wheels.push(wheel);
    car.add(wheel);
  }
  return { car, wheels };
}

export { Tier };
