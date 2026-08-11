import * as THREE from 'three';

// Colorful floating particles surrounding the product
export function createParticles(count = 260) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const palette = [
    new THREE.Color('#4d9fff'),
    new THREE.Color('#b06bff'),
    new THREE.Color('#4dd9ff'),
    new THREE.Color('#34d399'),
    new THREE.Color('#ff9d4d'),
    new THREE.Color('#ff6bb0'),
    new THREE.Color('#f5c453')
  ];

  for (let i = 0; i < count; i++) {
    const radius = 3 + Math.random() * 7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 2;

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    sizes[i] = Math.random() * 0.06 + 0.02;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const points = new THREE.Points(geo, mat);
  points.name = 'floatingParticles';
  points.userData.basePositions = positions.slice();
  return points;
}

// Floating glass platform / ring beneath the product
export function createPlatform() {
  const group = new THREE.Group();
  group.name = 'platform';

  const ringGeo = new THREE.TorusGeometry(1.6, 0.02, 16, 100);
  const ringMat = new THREE.MeshPhysicalMaterial({
    color: '#6ec6ff',
    emissive: '#4d9fff',
    emissiveIntensity: 0.4,
    metalness: 0.2,
    roughness: 0.3,
    transparent: true,
    opacity: 0.5,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.0
  });
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.name = 'platformRing1';
  ring1.rotation.x = Math.PI / 2;
  ring1.position.y = -1.3;
  group.add(ring1);

  const ring2 = ring1.clone();
  ring2.name = 'platformRing2';
  ring2.scale.setScalar(1.3);
  ring2.position.y = -1.5;
  ring2.material = ringMat.clone();
  ring2.material.color.set('#c084fc');
  ring2.material.emissive.set('#b06bff');
  ring2.material.opacity = 0.3;
  group.add(ring2);

  const discGeo = new THREE.CircleGeometry(1.4, 64);
  const discMat = new THREE.MeshPhysicalMaterial({
    color: '#0d0f16',
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.2,
    transparent: true,
    opacity: 0.3,
    clearcoat: 0.3,
    clearcoatRoughness: 0.15
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.name = 'platformDisc';
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = -1.35;
  group.add(disc);

  return group;
}

// Abstract floating crystal shards for depth/background
export function createCrystals() {
  const group = new THREE.Group();
  group.name = 'crystals';
  const colors = ['#4d9fff', '#b06bff', '#4dd9ff', '#ff9d4d', '#ff6bb0'];

  for (let i = 0; i < 10; i++) {
    const geo = new THREE.OctahedronGeometry(0.15 + Math.random() * 0.25, 0);
    const mat = new THREE.MeshPhysicalMaterial({
      color: colors[i % colors.length],
      metalness: 0.3,
      roughness: 0.15,
      transmission: 0.4,
      transparent: true,
      opacity: 0.6,
      emissive: colors[i % colors.length],
      emissiveIntensity: 0.2,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `crystal_${i}`;
    const angle = (i / 10) * Math.PI * 2;
    const radius = 4 + Math.random() * 3;
    mesh.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 6, Math.sin(angle) * radius - 2);
    mesh.userData.floatSpeed = 0.4 + Math.random() * 0.6;
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;
    mesh.userData.baseY = mesh.position.y;
    group.add(mesh);
  }
  return group;
}