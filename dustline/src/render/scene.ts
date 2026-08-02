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
  scene.fog = new THREE.Fog(0x9ec8e8, 220, 900);

  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x5f7748, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d8, 2.2);
  sun.position.set(60, 90, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -90; sc.right = 90; sc.top = 90; sc.bottom = -90;
  scene.add(sun);

  // ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshStandardMaterial({ color: 0x77995a, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // figure-8 tarmac: two flat rings + a crossing strip
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x494b4f, roughness: 0.92 });
  const edgePaint = new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.9 });
  const R_IN = 18, R_OUT = 30, CX = 34;
  for (const sx of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(R_IN, R_OUT, 64), asphalt);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(sx * CX, 0.02, 0);
    ring.receiveShadow = true;
    scene.add(ring);
    for (const r of [R_IN, R_OUT]) {
      const stripe = new THREE.Mesh(new THREE.RingGeometry(r - 0.35, r + 0.35, 64), edgePaint);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(sx * CX, 0.03, 0);
      scene.add(stripe);
    }
  }
  const cross = new THREE.Mesh(new THREE.PlaneGeometry(2 * CX, R_OUT - R_IN + 4), asphalt);
  cross.rotation.x = -Math.PI / 2;
  cross.position.set(0, 0.025, 0);
  cross.receiveShadow = true;
  scene.add(cross);

  // reference cones so speed & drift read against something
  const coneGeo = new THREE.ConeGeometry(0.4, 1.0, 8);
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xff7a2e, roughness: 0.8 });
  const cones = new THREE.InstancedMesh(coneGeo, coneMat, 40);
  const m4 = new THREE.Matrix4();
  let ci = 0;
  for (const sx of [-1, 1]) {
    for (let a = 0; a < 20; a++) {
      const ang = (a / 20) * Math.PI * 2;
      const r = (R_IN + R_OUT) / 2;
      m4.setPosition(sx * CX + Math.cos(ang) * (R_OUT + 3), 0.5, Math.sin(ang) * (R_OUT + 3));
      cones.setMatrixAt(ci++, m4);
      if (ci >= 40) break;
    }
    if (ci >= 40) break;
  }
  cones.castShadow = true;
  scene.add(cones);
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
