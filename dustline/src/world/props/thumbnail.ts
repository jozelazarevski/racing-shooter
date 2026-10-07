// Palette thumbnails, rendered FROM THE GEOMETRY.
//
// The alternative — an artist-drawn icon per component — is a picture that is
// accurate on the day it is made and drifts silently forever after. Rendering
// the real parts means a thumbnail cannot be wrong: change the tree, the icon
// changes with it, because it IS the tree.
//
// One small WebGL context, shared and reused across every thumbnail. Browsers
// cap the number of live contexts (commonly 16) and silently kill the oldest
// when you pass it, so a renderer per palette entry would blank the earlier
// ones as soon as the library grew.

import * as THREE from 'three';
import type { PropTemplate } from './types';
import { Rng } from '../../core/rng';

let renderer: THREE.WebGLRenderer | null = null;
const cache = new Map<string, string>();

function getRenderer(size: number): THREE.WebGLRenderer {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
  }
  renderer.setSize(size, size, false);
  return renderer;
}

/** A data-URL PNG of the component, lit and framed like the palette wants it.
 *  Cached per (id, size): the palette redraws whenever a filter changes, and
 *  re-rendering fifty components each time would be visible. */
export function thumbnail(template: PropTemplate, size = 96): string {
  const key = `${template.id}@${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const r = getRenderer(size);
  const scene = new THREE.Scene();

  scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x4a5a44, 1.5));
  const key1 = new THREE.DirectionalLight(0xfff2d8, 2.1);
  key1.position.set(3, 5, 4);
  scene.add(key1);

  // A thumbnail must show the SNOW-FREE, ordinary case, so the context is a
  // neutral gravel lie rather than whatever surface sorts first.
  const ctx = {
    x: 0, z: 0, y: 0, ground: 0, depth: 0, surface: 'gravel' as const, scale: 1,
    rng: new Rng(0x5eed),          // fixed: a thumbnail that flickers is a bug
  };

  const group = new THREE.Group();
  for (const part of template.build()) {
    if (part.when && !part.when(ctx)) continue;
    const mat = (part.material as THREE.MeshStandardMaterial).clone();
    const tint = part.tint?.(ctx);
    if (tint) mat.color.copy(tint);
    const mesh = new THREE.Mesh(part.geometry, mat);
    if (part.offsetY) mesh.position.y += part.offsetY;
    group.add(mesh);
  }
  scene.add(group);

  // frame it: measure what was actually built rather than trusting a guess
  const box = new THREE.Box3().setFromObject(group);
  const centre = box.getCenter(new THREE.Vector3());
  const span = Math.max(box.getSize(new THREE.Vector3()).length(), 0.5);

  // Framing is COMPUTED from the bounding sphere, not hand-set per component.
  // A per-template distance is a number somebody has to keep right, and gets
  // wrong the moment the geometry changes — which is the exact failure mode
  // rendering the thumbnail was supposed to remove. `previewDist` remains as an
  // override for the rare component that wants an unusual crop.
  const fov = 35;
  const dims = box.getSize(new THREE.Vector3());
  const radius = Math.max(dims.x, dims.y, dims.z, 0.4) * 0.5;
  const fitted = (radius / Math.sin((fov * Math.PI) / 360)) * 1.18;
  const cam = new THREE.PerspectiveCamera(fov, 1, 0.05, 500);
  const dist = template.authoring.previewDist ?? fitted;
  cam.position.set(dist * 0.55, centre.y + dist * 0.42, dist * 0.72);
  cam.lookAt(centre);
  void span;

  r.setClearColor(0x000000, 0);
  r.render(scene, cam);
  const url = r.domElement.toDataURL('image/png');

  // The cloned materials are ours; the geometry belongs to the template's own
  // build() call above and is not shared with the world, so it goes too.
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    (m.material as THREE.Material)?.dispose();
  });

  cache.set(key, url);
  return url;
}
