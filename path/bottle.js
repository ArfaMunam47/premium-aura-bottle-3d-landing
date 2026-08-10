import * as THREE from 'three';

// Builds a stylized smart water bottle as a group of named parts so it can be exploded/reassembled.
export function createBottle() {
  const group = new THREE.Group();
  group.name = 'auraBottle';

  const bodyColor = new THREE.Color('#e8ecef');

  const steelMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    metalness: 0.85,
    roughness: 0.18,
    clearcoat: 0.8, // Slightly reduced for Firefox
    clearcoatRoughness: 0.15,
    reflectivity: 0.9,
    envMapIntensity: 1.2, // Reduced for Firefox
    name: 'bodyMat'
  });

  const darkMat = new THREE.MeshPhysicalMaterial({
    color: '#1a1c22',
    metalness: 0.6,
    roughness: 0.35,
    clearcoat: 0.5
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#bfe9ff',
    metalness: 0,
    roughness: 0.05,
    transmission: 0.6, // Reduced for Firefox compatibility
    thickness: 0.4,
    ior: 1.3,
    transparent: true,
    opacity: 0.7,
    // Firefox-specific adjustments
    clearcoat: 0.3,
    clearcoatRoughness: 0.2
  });

  const accentMat = new THREE.MeshPhysicalMaterial({
    color: '#4dd9ff',
    metalness: 0.3,
    roughness: 0.2,
    emissive: new THREE.Color('#2fb8e8'),
    emissiveIntensity: 0.6,
    // Ensure visibility in Firefox
    clearcoat: 0.5,
    clearcoatRoughness: 0.3
  });

  // Body (main cylinder with slight barrel curve using LatheGeometry for premium shape)
  const points = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const y = t * 3.2;
    let r = 0.62;
    // subtle barrel curve
    r += Math.sin(t * Math.PI) * 0.035;
    // taper near top
    if (t > 0.85) r -= (t - 0.85) * 1.4;
    points.push(new THREE.Vector2(Math.max(r, 0.35), y));
  }
  const bodyGeo = new THREE.LatheGeometry(points, 48);
  const body = new THREE.Mesh(bodyGeo, steelMat);
  body.name = 'bottleBody';
  body.position.y = 0;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Base cap (dark ring)
  const baseGeo = new THREE.CylinderGeometry(0.63, 0.63, 0.08, 48);
  const base = new THREE.Mesh(baseGeo, darkMat);
  base.name = 'bottleBase';
  base.position.y = 0.02;
  group.add(base);

  // UV-C indicator ring (glowing accent band)
  const ringGeo = new THREE.TorusGeometry(0.64, 0.02, 12, 48);
  const ring = new THREE.Mesh(ringGeo, accentMat);
  ring.name = 'bottleRing';
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.6;
  group.add(ring);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.34, 0.4, 0.28, 32);
  const neck = new THREE.Mesh(neckGeo, steelMat);
  neck.name = 'bottleNeck';
  neck.position.y = 3.3;
  group.add(neck);

  // Cap (lid) - separate group so it can rotate/lift open
  const capGroup = new THREE.Group();
  capGroup.name = 'bottleCap';
  const capGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.5, 32);
  const cap = new THREE.Mesh(capGeo, darkMat);
  cap.name = 'capBody';
  cap.position.y = 0.25;
  capGroup.add(cap);
  const capTopGeo = new THREE.CylinderGeometry(0.39, 0.39, 0.06, 32);
  const capTop = new THREE.Mesh(capTopGeo, steelMat);
  capTop.name = 'capTop';
  capTop.position.y = 0.53;
  capGroup.add(capTop);
  capGroup.position.y = 3.44;
  group.add(capGroup);

  // Interior glass tube (visible when exploded / view inside)
  const innerGeo = new THREE.CylinderGeometry(0.5, 0.55, 3.0, 32, 1, true);
  const inner = new THREE.Mesh(innerGeo, glassMat);
  inner.name = 'bottleInner';
  inner.position.y = 1.55;
  group.add(inner);

  // UV-C LED chip (small internal part, visible in exploded view)
  const ledGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const ledMat = new THREE.MeshStandardMaterial({ color: '#4dd9ff', emissive: '#4dd9ff', emissiveIntensity: 2 });
  const led = new THREE.Mesh(ledGeo, ledMat);
  led.name = 'uvLed';
  led.position.y = 3.1;
  group.add(led);

  // Bottom sensor disc
  const sensorGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 24);
  const sensorMat = new THREE.MeshStandardMaterial({ color: '#333', metalness: 0.6, roughness: 0.4 });
  const sensor = new THREE.Mesh(sensorGeo, sensorMat);
  sensor.name = 'sensorDisc';
  sensor.position.y = 0.08;
  group.add(sensor);

  group.scale.setScalar(0.9);

  // Store rest positions for explode/reassemble
  const parts = [body, base, ring, neck, capGroup, inner, led, sensor];
  parts.forEach(p => { p.userData.restPos = p.position.clone(); });

  // Explode direction offsets
  const explodeOffsets = {
    bottleBody: new THREE.Vector3(0, 0, 0),
    bottleBase: new THREE.Vector3(0, -1.1, 0),
    bottleRing: new THREE.Vector3(0.9, 0.3, 0),
    bottleNeck: new THREE.Vector3(0, 0.9, 0),
    bottleCap: new THREE.Vector3(0, 1.9, 0),
    bottleInner: new THREE.Vector3(-1.0, 0, 0.4),
    uvLed: new THREE.Vector3(-0.6, 0.6, 0.8),
    sensorDisc: new THREE.Vector3(0, -1.6, 0)
  };

  return { group, parts, explodeOffsets, materials: { steelMat, glassMat, accentMat } };
}