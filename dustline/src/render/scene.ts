// M1 world: flat ground with a painted figure-8 tuning circuit, simple sun
// + sky, a chassis mesh with four visual wheels. Stylized, readable (§7.1).

import * as THREE from 'three';
import carData from '../data/car.json';

export function buildRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

export function buildWorld(scene: THREE.Scene) {
  scene.fog = new THREE.Fog(0xcfe6f4, 240, 980);

  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x5f7748, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d8, 2.2);
  sun.position.set(60, 90, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -90; sc.right = 90; sc.top = 90; sc.bottom = -90;
  scene.add(sun);

  // spawn-pad figure-8 painted on the flat tarmac apron: the M1 tuning
  // playground lives on inside the M2 rally world
  const asphaltPaint = new THREE.MeshStandardMaterial({ color: 0x5a5d63, roughness: 0.92 });
  for (const sx of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(9, 15, 48), asphaltPaint);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(sx * 17, 0.04, -24);
    scene.add(ring);
  }
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
