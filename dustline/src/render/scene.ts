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
  scene.background = new THREE.Color(0x9ec8e8);
  scene.fog = new THREE.Fog(0x9ec8e8, 260, 1000);

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
  const asphaltPaint = new THREE.MeshStandardMaterial({ color: 0x3c3e42, roughness: 0.92 });
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

export function buildCarVisual(scene: THREE.Scene): CarVisual {
  const c = carData.chassis;
  const root = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(c.halfExtents[0] * 2, c.halfExtents[1] * 2, c.halfExtents[2] * 2),
    new THREE.MeshStandardMaterial({ color: 0xff5c2e, roughness: 0.5, metalness: 0.15 }),
  );
  body.castShadow = true;
  root.add(body);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(c.halfExtents[0] * 1.5, 0.42, c.halfExtents[2] * 0.9),
    new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.35 }),
  );
  cabin.position.set(0, c.halfExtents[1] + 0.2, -0.25);
  cabin.castShadow = true;
  root.add(cabin);

  const wheels: THREE.Mesh[] = [];
  const r = carData.tire.wheelRadius;
  const wheelGeo = new THREE.CylinderGeometry(r, r, 0.3, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: 0.95 });
  for (let i = 0; i < 4; i++) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.castShadow = true;
    root.add(w);
    wheels.push(w);
  }
  scene.add(root);
  return { root, wheels };
}
