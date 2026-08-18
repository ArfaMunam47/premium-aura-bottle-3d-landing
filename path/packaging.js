import * as THREE from 'three';

// Luxury presentation box — lid halves open outward like premium packaging.
export function createPackaging() {
  const group = new THREE.Group();
  group.name = 'packaging';

  const boxMat = new THREE.MeshPhysicalMaterial({
    color: '#14120f',
    metalness: 0.15,
    roughness: 0.88
  });

  const innerMat = new THREE.MeshPhysicalMaterial({
    color: '#1c1a17',
    metalness: 0.1,
    roughness: 0.9
  });

  const ribbonMat = new THREE.MeshPhysicalMaterial({
    color: '#c9a962',
    metalness: 0.55,
    roughness: 0.35,
    emissive: '#3a3020',
    emissiveIntensity: 0.15
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 2.0), innerMat);
  base.name = 'packBase';
  base.position.y = -0.55;
  group.add(base);

  const wallGeo = new THREE.BoxGeometry(2.0, 0.5, 0.06);
  const wallBack = new THREE.Mesh(wallGeo, boxMat);
  wallBack.position.set(0, -0.18, -0.97);
  group.add(wallBack);

  const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 1.88), boxMat);
  wallLeft.position.set(-0.97, -0.18, 0);
  group.add(wallLeft);

  const wallRight = wallLeft.clone();
  wallRight.position.x = 0.97;
  group.add(wallRight);

  const lidPivotL = new THREE.Group();
  lidPivotL.name = 'lidPivotLeft';
  lidPivotL.position.set(-1.0, -0.08, 0);
  const lidLeft = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 2.04), boxMat);
  lidLeft.position.set(0.5, 0, 0);
  lidPivotL.add(lidLeft);
  group.add(lidPivotL);

  const lidPivotR = new THREE.Group();
  lidPivotR.name = 'lidPivotRight';
  lidPivotR.position.set(1.0, -0.08, 0);
  const lidRight = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 2.04), boxMat);
  lidRight.position.set(-0.5, 0, 0);
  lidPivotR.add(lidRight);
  group.add(lidPivotR);

  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.04, 0.18), ribbonMat);
  ribbon.name = 'ribbon';
  ribbon.position.y = 0.02;
  group.add(ribbon);

  const ribbonVert = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 2.04), ribbonMat);
  ribbonVert.position.y = -0.18;
  group.add(ribbonVert);

  const veil = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 2.2),
    new THREE.MeshPhysicalMaterial({
      color: '#e8e4dc',
      transparent: true,
      opacity: 0.35,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  veil.name = 'tissueVeil';
  veil.position.set(0, 0.8, 0.3);
  veil.rotation.x = -0.15;
  group.add(veil);

  group.position.y = 0.1;
  group.scale.setScalar(1.05);

  return {
    group,
    lidPivotL,
    lidPivotR,
    veil,
    ribbon,
    setOpen(amount) {
      const t = Math.max(0, Math.min(1, amount));
      lidPivotL.rotation.z = -t * Math.PI * 0.62;
      lidPivotR.rotation.z = t * Math.PI * 0.62;
      lidPivotL.rotation.x = t * 0.12;
      lidPivotR.rotation.x = t * 0.12;
      veil.material.opacity = 0.35 * (1 - t);
      ribbon.material.emissiveIntensity = 0.15 + t * 0.25;
      group.position.y = 0.1 - t * 0.08;
    },
    setVisibility(amount) {
      const t = Math.max(0, Math.min(1, amount));
      group.visible = t > 0.01;
      group.traverse(child => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = t;
          child.material.needsUpdate = true;
        }
      });
    }
  };
}
