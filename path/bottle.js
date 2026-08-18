import * as THREE from 'three';

function createLabelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#14161c';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = 'rgba(201, 169, 98, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, 496, 112);
  ctx.fillStyle = '#e8e4dc';
  ctx.font = '600 52px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AURA', 256, 52);
  ctx.fillStyle = '#c9a962';
  ctx.font = '500 14px Inter, system-ui, sans-serif';
  ctx.letterSpacing = '0.35em';
  ctx.fillText('SMART HYDRATION', 256, 92);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Premium smart water bottle with believable liquid, label, and material depth.
export function createBottle() {
  const group = new THREE.Group();
  group.name = 'auraBottle';

  const bodyColor = new THREE.Color('#e8ecef');

  const steelMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    metalness: 0.92,
    roughness: 0.14,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    reflectivity: 0.95,
    envMapIntensity: 1.1,
    name: 'bodyMat'
  });

  const darkMat = new THREE.MeshPhysicalMaterial({
    color: '#1a1c22',
    metalness: 0.65,
    roughness: 0.32,
    clearcoat: 0.55
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#d8eef8',
    metalness: 0,
    roughness: 0.04,
    transmission: 0.72,
    thickness: 0.35,
    ior: 1.45,
    transparent: true,
    opacity: 0.85,
    clearcoat: 0.4,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.0
  });

  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: '#7ec8e8',
    metalness: 0,
    roughness: 0.02,
    transmission: 0.55,
    thickness: 0.8,
    ior: 1.33,
    transparent: true,
    opacity: 0.92,
    clearcoat: 0.15,
    envMapIntensity: 0.9,
    attenuationColor: new THREE.Color('#4a9ab8'),
    attenuationDistance: 1.8
  });

  const surfaceMat = new THREE.MeshPhysicalMaterial({
    color: '#a8dff0',
    metalness: 0,
    roughness: 0.01,
    transmission: 0.4,
    thickness: 0.1,
    ior: 1.33,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  });

  const windowMat = new THREE.MeshPhysicalMaterial({
    color: '#c8e8f8',
    metalness: 0,
    roughness: 0.05,
    transmission: 0.88,
    thickness: 0.15,
    ior: 1.45,
    transparent: true,
    opacity: 0.6,
    clearcoat: 0.3
  });

  const accentMat = new THREE.MeshPhysicalMaterial({
    color: '#c9a962',
    metalness: 0.45,
    roughness: 0.22,
    emissive: new THREE.Color('#5a4828'),
    emissiveIntensity: 0.25,
    clearcoat: 0.55
  });

  const ledMat = new THREE.MeshStandardMaterial({
    color: '#c9a962',
    emissive: '#a08040',
    emissiveIntensity: 0.9,
    metalness: 0.35,
    roughness: 0.2
  });

  const sensorMat = new THREE.MeshStandardMaterial({
    color: '#2a2c32',
    metalness: 0.7,
    roughness: 0.35
  });

  const labelTex = createLabelTexture();
  const labelMat = new THREE.MeshPhysicalMaterial({
    map: labelTex,
    metalness: 0.15,
    roughness: 0.55,
    clearcoat: 0.2,
    envMapIntensity: 0.5
  });

  // Body profile
  const points = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const y = t * 3.2;
    let r = 0.62;
    r += Math.sin(t * Math.PI) * 0.035;
    if (t > 0.85) r -= (t - 0.85) * 1.4;
    points.push(new THREE.Vector2(Math.max(r, 0.35), y));
  }
  const bodyGeo = new THREE.LatheGeometry(points, 56);
  bodyGeo.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeo, steelMat);
  body.name = 'bottleBody';
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Viewing window — reveals liquid inside
  const windowGeo = new THREE.CylinderGeometry(0.58, 0.6, 1.35, 32, 1, true, 0, Math.PI * 0.35);
  const viewWindow = new THREE.Mesh(windowGeo, windowMat);
  viewWindow.name = 'viewWindow';
  viewWindow.position.y = 1.35;
  viewWindow.rotation.y = 0;
  group.add(viewWindow);

  // Inner glass liner
  const innerGeo = new THREE.CylinderGeometry(0.48, 0.52, 2.85, 36, 1, true);
  const inner = new THREE.Mesh(innerGeo, glassMat);
  inner.name = 'bottleInner';
  inner.position.y = 1.48;
  group.add(inner);

  // Liquid fill — lathe profile for natural meniscus shape
  const fillLevel = 2.05;
  const liquidPoints = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const y = 0.25 + t * fillLevel;
    const r = 0.46 - t * 0.02;
    liquidPoints.push(new THREE.Vector2(r, y));
  }
  const liquidGeo = new THREE.LatheGeometry(liquidPoints, 36);
  const liquidFill = new THREE.Mesh(liquidGeo, liquidMat);
  liquidFill.name = 'liquidFill';
  liquidFill.userData.baseY = liquidFill.position.y;
  group.add(liquidFill);

  // Liquid surface meniscus
  const surfaceY = 0.25 + fillLevel;
  const liquidSurface = new THREE.Mesh(
    new THREE.CircleGeometry(0.44, 36),
    surfaceMat
  );
  liquidSurface.name = 'liquidSurface';
  liquidSurface.rotation.x = -Math.PI / 2;
  liquidSurface.position.y = surfaceY;
  liquidSurface.userData.baseY = surfaceY;
  group.add(liquidSurface);

  // Label band
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(0.635, 0.635, 0.42, 48, 1, true, Math.PI * 0.65, Math.PI * 0.7),
    labelMat
  );
  label.name = 'labelBand';
  label.position.y = 1.05;
  label.rotation.y = Math.PI * 0.15;
  group.add(label);

  // Base ring
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.63, 0.63, 0.08, 48), darkMat);
  base.name = 'bottleBase';
  base.position.y = 0.02;
  base.castShadow = true;
  group.add(base);

  // UV-C accent ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.64, 0.018, 12, 48),
    accentMat
  );
  ring.name = 'bottleRing';
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.6;
  group.add(ring);

  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.4, 0.28, 32),
    steelMat
  );
  neck.name = 'bottleNeck';
  neck.position.y = 3.3;
  group.add(neck);

  // Cap assembly
  const capGroup = new THREE.Group();
  capGroup.name = 'bottleCap';
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.5, 32), darkMat);
  cap.name = 'capBody';
  cap.position.y = 0.25;
  capGroup.add(cap);
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.06, 32), steelMat);
  capTop.name = 'capTop';
  capTop.position.y = 0.53;
  capGroup.add(capTop);
  const capKnurl = new THREE.Mesh(
    new THREE.TorusGeometry(0.39, 0.012, 8, 32),
    darkMat
  );
  capKnurl.rotation.x = Math.PI / 2;
  capKnurl.position.y = 0.38;
  capGroup.add(capKnurl);
  capGroup.position.y = 3.44;
  group.add(capGroup);

  const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), ledMat);
  led.name = 'uvLed';
  led.position.set(0, 3.08, 0.42);
  group.add(led);

  const sensor = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.025, 24), sensorMat);
  sensor.name = 'sensorDisc';
  sensor.position.y = 0.08;
  group.add(sensor);

  group.scale.setScalar(0.9);

  const parts = [body, viewWindow, inner, liquidFill, liquidSurface, label, base, ring, neck, capGroup, led, sensor];
  parts.forEach(p => {
    p.userData.restPos = p.position.clone();
  });

  const explodeOffsets = {
    bottleBody: new THREE.Vector3(0, 0, 0),
    viewWindow: new THREE.Vector3(0.7, 0.2, 0.3),
    bottleInner: new THREE.Vector3(-0.8, 0, 0.35),
    liquidFill: new THREE.Vector3(-0.5, 0, 0.5),
    liquidSurface: new THREE.Vector3(-0.4, 0.3, 0.5),
    labelBand: new THREE.Vector3(0.9, 0.1, 0),
    bottleBase: new THREE.Vector3(0, -1.0, 0),
    bottleRing: new THREE.Vector3(0.7, 0.25, 0),
    bottleNeck: new THREE.Vector3(0, 0.8, 0),
    bottleCap: new THREE.Vector3(0, 1.7, 0),
    uvLed: new THREE.Vector3(-0.5, 0.5, 0.7),
    sensorDisc: new THREE.Vector3(0, -1.4, 0)
  };

  return {
    group,
    parts,
    explodeOffsets,
    materials: { steelMat, glassMat, accentMat, liquidMat, labelMat }
  };
}
