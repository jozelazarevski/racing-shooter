// The 3D preview: the REAL world, not an impression of it.
//
// This builds the actual `Terrain` from the actual `TrackDef` with the actual
// scenery placement, so what you see is what you will drive. That is the whole
// value — a preview that approximates would be a second implementation to keep
// in sync, and the moment it drifted it would be worse than nothing.
//
// It costs what the game costs: measured, ~66 ms for the road-distance bake and
// the vertex/colour loop together, before Rapier. That is far too slow to run
// on a mouse move and completely fine on a pause, so the editor debounces —
// the 2D map is the live surface, this catches up when you stop moving.
//
// No physics: Rapier is not initialised here and `build()` is given nulls, so
// no colliders are created. The preview is for looking at.

import * as THREE from 'three';
import type { TrackDef } from '../tracks/trackDef';
import { Terrain } from '../tracks/terrain';
import { buildWorld } from '../render/scene';
import { buildSky, buildClouds, buildMountains, buildVegetation } from '../render/scenery';

/** Orbit camera. Written here rather than pulled from three's examples because
 *  the whole editor is four files and a dependency for 60 lines of mouse maths
 *  is a poor trade. */
class Orbit {
  camera = new THREE.PerspectiveCamera(55, 1, 1, 6000);
  target = new THREE.Vector3(0, 0, 0);
  private yaw = 0.7;
  private pitch = 0.62;
  private dist = 520;
  private dragging: 'orbit' | 'pan' | null = null;
  private lastX = 0;
  private lastY = 0;

  constructor(private dom: HTMLElement) {
    dom.addEventListener('pointerdown', (e) => {
      this.dragging = e.button === 2 || e.shiftKey ? 'pan' : 'orbit';
      this.lastX = e.clientX; this.lastY = e.clientY;
      dom.setPointerCapture(e.pointerId);
    });
    dom.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY;
      this.lastX = e.clientX; this.lastY = e.clientY;
      if (this.dragging === 'orbit') {
        this.yaw -= dx * 0.005;
        this.pitch = Math.max(0.06, Math.min(1.45, this.pitch - dy * 0.005));
      } else {
        const s = this.dist * 0.0016;
        const sinY = Math.sin(this.yaw), cosY = Math.cos(this.yaw);
        this.target.x -= (dx * cosY - dy * sinY) * s;
        this.target.z -= (dx * sinY + dy * cosY) * s;
      }
    });
    const stop = (e: PointerEvent) => {
      this.dragging = null;
      try { dom.releasePointerCapture(e.pointerId); } catch { /* already gone */ }
    };
    dom.addEventListener('pointerup', stop);
    dom.addEventListener('pointercancel', stop);
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.dist = Math.max(25, Math.min(2200, this.dist * (e.deltaY > 0 ? 1.1 : 0.9)));
    }, { passive: false });
  }

  /** Look at a point from a given distance — used to jump to a corner. */
  focus(x: number, z: number, dist?: number) {
    this.target.set(x, 0, z);
    if (dist) this.dist = dist;
  }

  /** Frame a bounding box from above. The default view has to show the whole
   *  track: a preview that opens at ground level inside the scenery shows you a
   *  bush, and you cannot tell whether the thing you just edited got better.
   *
   *  `horizonRadius` is where the decorative mountains stand. The camera is
   *  kept inside that ring — pull back past it and the frame fills with the
   *  backs of horizon geometry while the track becomes a smudge in the middle,
   *  which is what "just fit the bounding box" actually produced. */
  frame(minX: number, minZ: number, maxX: number, maxZ: number, horizonRadius: number) {
    this.target.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
    const span = Math.max(maxX - minX, maxZ - minZ, 60);
    this.dist = Math.min(span * 1.15, horizonRadius * 0.72);
    this.pitch = 1.02;                 // ~58 degrees: reads as a map, drives as a place
    this.yaw = 0.55;
  }

  update(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    const r = Math.cos(this.pitch) * this.dist;
    this.camera.position.set(
      this.target.x + Math.sin(this.yaw) * r,
      this.target.y + Math.sin(this.pitch) * this.dist,
      this.target.z + Math.cos(this.yaw) * r,
    );
    this.camera.lookAt(this.target);
  }
}

function disposeDeep(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else if (mat) {
      const withMap = mat as THREE.MeshStandardMaterial;
      withMap.map?.dispose();
      // The emissive map goes with it. It was not here before anything used
      // one, and a texture the disposer does not know about is a canvas leaked
      // on every rebuild — which, at a rebuild per keystroke, adds up fast.
      withMap.emissiveMap?.dispose();
      mat.dispose();
    }
  });
}

export class Preview {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  orbit: Orbit;
  private built: THREE.Object3D[] = [];
  private carMarker: THREE.Mesh;
  /** wall-clock cost of the last rebuild, shown in the status bar */
  lastBuildMs = 0;
  /** how many of each component the last build actually placed */
  componentCounts: Record<string, number> = {};
  terrain: Terrain | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.orbit = new Orbit(canvas);

    // a car-sized box at the start line, because "is this road wide enough"
    // is impossible to judge from an empty ribbon and obvious next to a car
    this.carMarker = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.9, 3.9),
      new THREE.MeshStandardMaterial({ color: 0xff5c2e, roughness: 0.4 }),
    );
    this.carMarker.castShadow = true;
    this.scene.add(this.carMarker);
  }

  focus(x: number, z: number, dist?: number) { this.orbit.focus(x, z, dist); }

  /** Everything the last rebuild added to the scene. Exposed so
   *  `tools/verify-worlds.mjs` can fingerprint the built world rather than
   *  trusting that it was built correctly. */
  get objects(): THREE.Object3D[] { return this.built; }

  /** Where on the ground is this screen point?
   *
   *  Raycasts the built world so a drop lands where the cursor is even on a
   *  hillside — a flat y=0 plane would put a prop metres from where you aimed
   *  wherever the terrain is not at sea level, which is most of it. Falls back
   *  to the ground plane if the ray misses everything (over the sky dome). */
  pick(clientX: number, clientY: number): { x: number; z: number } | null {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - r.left) / r.width) * 2 - 1,
      -((clientY - r.top) / r.height) * 2 + 1,
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.orbit.camera);
    const targets = this.built.filter((o) => (o as THREE.Mesh).isMesh && !(o as THREE.InstancedMesh).isInstancedMesh);
    const hits = ray.intersectObjects(targets, false);
    if (hits.length) return { x: hits[0].point.x, z: hits[0].point.z };
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const at = new THREE.Vector3();
    return ray.ray.intersectPlane(plane, at) ? { x: at.x, z: at.z } : null;
  }

  /** Screen position of a world point, for drawing a selection marker over the
   *  3D view. Returns null when the point is behind the camera. */
  project(x: number, y: number, z: number): { sx: number; sy: number } | null {
    const r = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector3(x, y, z).project(this.orbit.camera);
    if (v.z > 1) return null;
    return { sx: (v.x * 0.5 + 0.5) * r.width, sy: (-v.y * 0.5 + 0.5) * r.height };
  }

  /** Point the camera at the whole of a track. */
  frameTrack(def: TrackDef) {
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    for (const [x, z] of def.road.points) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    if (!Number.isFinite(minX)) return;
    this.orbit.frame(minX, minZ, maxX, maxZ, def.sky.mountains.radius || def.world.size * 0.7);
  }

  rebuild(def: TrackDef) {
    const t0 = performance.now();
    for (const o of this.built) {
      this.scene.remove(o);
      disposeDeep(o);
    }
    this.built = [];

    const terrain = new Terrain(def);
    this.terrain = terrain;
    this.built.push(...buildWorld(this.scene, def, terrain.spawn.x, terrain.spawn.z));
    this.built.push(...terrain.build(this.scene, null as never, null as never));
    this.built.push(buildSky(this.scene, def));
    this.built.push(buildClouds(this.scene, def));
    this.built.push(...buildMountains(this.scene, def));
    const comps = buildVegetation(this.scene, terrain, null, null);
    this.built.push(...comps.objects);
    this.componentCounts = comps.counts;

    const s = terrain.spawn;
    this.carMarker.position.set(s.x, terrain.heightAt(s.x, s.z) + 0.7, s.z);
    this.lastBuildMs = performance.now() - t0;
  }

  render() {
    const r = this.canvas.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    if (this.canvas.width !== Math.round(r.width * this.renderer.getPixelRatio())) {
      this.renderer.setSize(r.width, r.height, false);
    }
    this.orbit.update(r.width / r.height);
    this.renderer.render(this.scene, this.orbit.camera);
  }
}
