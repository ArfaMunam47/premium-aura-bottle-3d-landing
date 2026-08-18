import * as THREE from 'three';

export function createParticles(count = 160) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const palette = [
    new THREE.Color('#e8e4dc'),
    new THREE.Color('#c9a962'),
    new THREE.Color('#a8a49c'),
    new THREE.Color('#d4c4a8')
  ];

  for (let i = 0; i < count; i++) {
    const radius = 3 + Math.random() * 7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 2;

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.45,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const points = new THREE.Points(geo, mat);
  points.name = 'floatingParticles';
  points.userData.basePositions = positions.slice();
  return points;
}

export function createPlatform() {
  const group = new THREE.Group();
  group.name = 'platform';

  const ringGeo = new THREE.TorusGeometry(1.6, 0.015, 16, 80);
  const ringMat = new THREE.MeshPhysicalMaterial({
    color: '#2a2c32',
    metalness: 0.7,
    roughness: 0.35,
    emissive: '#1a1c22',
    emissiveIntensity: 0.15
  });

  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.rotation.x = Math.PI / 2;
  ring1.position.y = -1.3;
  group.add(ring1);

  const ring2 = ring1.clone();
  ring2.scale.setScalar(1.25);
  ring2.position.y = -1.48;
  ring2.material = ringMat.clone();
  ring2.material.opacity = 0.6;
  ring2.material.transparent = true;
  group.add(ring2);

  const discGeo = new THREE.CircleGeometry(1.4, 64);
  const discMat = new THREE.MeshPhysicalMaterial({
    color: '#12141a',
    metalness: 0.4,
    roughness: 0.5
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = -1.35;
  group.add(disc);

  return group;
}

export function createCrystals(count = 6) {
  const group = new THREE.Group();
  group.name = 'crystals';
  const colors = ['#c9a962', '#8a8d94', '#d4c4a8', '#6a6d74'];

  for (let i = 0; i < count; i++) {
    const geo = new THREE.OctahedronGeometry(0.12 + Math.random() * 0.18, 0);
    const mat = new THREE.MeshPhysicalMaterial({
      color: colors[i % colors.length],
      metalness: 0.5,
      roughness: 0.2,
      transparent: true,
      opacity: 0.35,
      emissive: colors[i % colors.length],
      emissiveIntensity: 0.08
    });
    const mesh = new THREE.Mesh(geo, mat);
    const angle = (i / count) * Math.PI * 2;
    const radius = 4.5 + Math.random() * 2.5;
    mesh.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 5,
      Math.sin(angle) * radius - 2
    );
    mesh.userData.floatSpeed = 0.3 + Math.random() * 0.4;
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;
    mesh.userData.baseY = mesh.position.y;
    group.add(mesh);
  }
  return group;
}
