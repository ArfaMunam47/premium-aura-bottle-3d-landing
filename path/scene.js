import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createBottle } from './bottle.js';
import { createParticles, createPlatform, createCrystals } from './environment.js';
import { createPackaging } from './packaging.js';

const isMobile = () => window.innerWidth < 768;

export function initScene(canvas, options = {}) {
  const { prefersReducedMotion = false } = options;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0b0e, 0.04);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.4, 7);

  const testCanvas = document.createElement('canvas');
  const testGL = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
  if (!testGL) throw new Error('WebGL not supported');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile(),
    alpha: false,
    powerPreference: isMobile() ? 'default' : 'high-performance',
    failIfMajorPerformanceCaveat: false,
    stencil: false,
    depth: true,
    premultipliedAlpha: false
  });

  const maxDpr = isMobile() ? 1.5 : 2;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
  renderer.setClearColor(0x0a0b0e, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = !isMobile();
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const ambient = new THREE.AmbientLight(0xfff8f0, 0.45);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xfff5e8, 2.0);
  keyLight.position.set(4, 6, 5);
  if (!isMobile()) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.bias = -0.001;
  }
  scene.add(keyLight);

  const warmRim = new THREE.PointLight(0xc9a962, 4, 14);
  warmRim.position.set(-3, 1, -2);
  scene.add(warmRim);

  const coolRim = new THREE.PointLight(0x8a9aaa, 3, 12);
  coolRim.position.set(3, -1, -3);
  scene.add(coolRim);

  const fillLight = new THREE.PointLight(0xd4c4a8, 2, 10);
  fillLight.position.set(0, -2, 3);
  scene.add(fillLight);

  const topLight = new THREE.PointLight(0xffffff, 1.5, 8);
  topLight.position.set(0, 5, 2);
  scene.add(topLight);

  const bottomLight = new THREE.PointLight(0x6a5a48, 1, 6);
  bottomLight.position.set(0, -3, 0);
  scene.add(bottomLight);

  const revealLight = new THREE.SpotLight(0xfff0d8, 0, 12, Math.PI / 5, 0.4);
  revealLight.position.set(0, 6, 3);
  revealLight.target.position.set(0, 1.2, 0);
  scene.add(revealLight);
  scene.add(revealLight.target);

  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    const envMesh = new THREE.Mesh(
      new THREE.SphereGeometry(20, 32, 32),
      new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: 0x1a1c22 })
    );
    envScene.add(envMesh);
    const envRT = pmrem.fromScene(envScene, 0.04);
    if (envRT?.texture) scene.environment = envRT.texture;
    pmrem.dispose();
  } catch {
    // Environment map is optional
  }

  const { group: bottle, parts, explodeOffsets, materials } = createBottle();
  bottle.position.set(0, 0, 0);
  scene.add(bottle);

  const contactShadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 40),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.32,
      depthWrite: false
    })
  );
  contactShadow.name = 'contactShadow';
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = -1.34;
  contactShadow.visible = false;
  scene.add(contactShadow);

  const packaging = createPackaging();
  scene.add(packaging.group);

  const platform = createPlatform();
  platform.visible = false;
  scene.add(platform);

  const particleCount = isMobile() ? 60 : prefersReducedMotion ? 40 : 100;
  const particles = createParticles(particleCount);
  particles.visible = false;
  scene.add(particles);

  const crystalCount = isMobile() ? 3 : 5;
  const crystals = createCrystals(crystalCount);
  crystals.visible = false;
  scene.add(crystals);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 5.8;
  controls.maxDistance = 11;
  controls.enabled = false;
  controls.target.set(0, 1.35, 0);

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
  }
  window.addEventListener('resize', onResize);

  renderer.render(scene, camera);

  return {
    scene,
    camera,
    renderer,
    controls,
    bottle,
    parts,
    explodeOffsets,
    materials,
    packaging,
    platform,
    particles,
    crystals,
    contactShadow,
    introComplete: false,
    lights: {
      keyLight,
      blueRim: warmRim,
      purpleRim: coolRim,
      fillLight,
      ambient,
      topLight,
      bottomLight,
      revealLight
    },
    dispose() {
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    }
  };
}
