import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createBottle } from './bottle.js';
import { createParticles, createPlatform, createCrystals } from './environment.js';

export function initScene(canvas) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x08090d, 0.045);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.4, 7);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  ambient.name = 'ambientLight';
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.name = 'keyLight';
  keyLight.position.set(4, 6, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 20;
  keyLight.shadow.bias = -0.001;
  scene.add(keyLight);

  const blueRim = new THREE.PointLight(0x4d9fff, 6, 12);
  blueRim.name = 'blueRim';
  blueRim.position.set(-3, 1, -2);
  scene.add(blueRim);

  const purpleRim = new THREE.PointLight(0xb06bff, 6, 12);
  purpleRim.name = 'purpleRim';
  purpleRim.position.set(3, -1, -3);
  scene.add(purpleRim);

  const fillLight = new THREE.PointLight(0x4dd9ff, 3, 10);
  fillLight.name = 'fillLight';
  fillLight.position.set(0, -2, 3);
  scene.add(fillLight);

  // Environment map (simple gradient via cube render target using scene background colors)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envGeo = new THREE.SphereGeometry(20, 32, 32);
  const envMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {},
    vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vPos;
      void main() {
        float t = normalize(vPos).y * 0.5 + 0.5;
        vec3 top = vec3(0.30, 0.62, 1.0);
        vec3 bottom = vec3(0.69, 0.42, 1.0);
        vec3 col = mix(bottom, top, t);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const envMesh = new THREE.Mesh(envGeo, envMat);
  envScene.add(envMesh);
  const envRT = pmrem.fromScene(envScene, 0.04);
  scene.environment = envRT.texture;

  // Bottle
  const { group: bottle, parts, explodeOffsets, materials } = createBottle();
  bottle.position.set(0, 0, 0);
  scene.add(bottle);

  // Platform + particles + crystals
  const platform = createPlatform();
  scene.add(platform);
  const particles = createParticles();
  scene.add(particles);
  const crystals = createCrystals();
  scene.add(crystals);

  // Orbit controls (only enabled fully in showcase section)
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 12;
  controls.enabled = false;
  controls.target.set(0, 1.4, 0);

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  return { scene, camera, renderer, controls, bottle, parts, explodeOffsets, materials, platform, particles, crystals, lights: { keyLight, blueRim, purpleRim, fillLight, ambient } };
}