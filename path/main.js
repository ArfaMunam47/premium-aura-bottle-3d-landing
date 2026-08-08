import * as THREE from 'three';
import { initScene } from './scene.js';
import { createScrollStory } from './scrollStory.js';
import { initUI } from './ui.js';

// Hide the loader first so the page never gets stuck on the AURA screen.
initUI();

const canvas = document.getElementById('bg-canvas');
let ctx;
try {
  ctx = initScene(canvas);
} catch (err) {
  console.error('3D init failed:', err);
  // Keep the page usable even if WebGL/3D fails.
  document.getElementById('loader').classList.add('hidden');
}
const { scene, camera, renderer, controls, bottle, parts, explodeOffsets, materials, particles, crystals, lights } = ctx;

// Showcase interaction state
let showcaseMode = false;
let exploded = false;
let capOpen = false;
const clock = new THREE.Clock();

ctx.onShowcaseToggle = (active) => {
  if (active === showcaseMode) return;
  showcaseMode = active;
  controls.enabled = active;
  ctx.userInteractingBottle = active;
  if (active) {
    controls.target.copy(bottle.position).add(new THREE.Vector3(0, 1.2, 0));
  }
};

const story = createScrollStory(ctx);

// Color swatches
document.querySelectorAll('.swatch').forEach(sw => {
  sw.addEventListener('click', () => {
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
    const color = sw.dataset.color;
    materials.steelMat.color.set(color);
  });
});

// Explode / reassemble
const btnExplode = document.getElementById('btn-explode');
btnExplode.addEventListener('click', () => {
  exploded = !exploded;
  btnExplode.textContent = exploded ? 'Reassemble' : 'Exploded View';
});

// Cap open/close
const btnCap = document.getElementById('btn-cap');
btnCap.addEventListener('click', () => {
  capOpen = !capOpen;
  btnCap.textContent = capOpen ? 'Close Cap' : 'Open Cap';
});

// Reset
document.getElementById('btn-reset').addEventListener('click', () => {
  exploded = false;
  capOpen = false;
  btnExplode.textContent = 'Exploded View';
  btnCap.textContent = 'Open Cap';
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  document.querySelector('.swatch[data-color="#e8ecef"]').classList.add('active');
  materials.steelMat.color.set('#e8ecef');
  controls.reset();
});

const capPart = parts.find(p => p.name === 'bottleCap');
const capRest = capPart.userData.restPos.clone();

function updateExplode(dt) {
  parts.forEach(part => {
    const rest = part.userData.restPos;
    const offset = explodeOffsets[part.name] || new THREE.Vector3();
    const targetLocal = exploded ? rest.clone().add(offset) : rest.clone();
    if (part.name === 'bottleCap') {
      // handled separately for open/close
      return;
    }
    part.position.lerp(targetLocal, 0.08);
  });

  // Cap: open = lift up + rotate, exploded overrides further up
  let capTarget = capRest.clone();
  if (capOpen) capTarget.y += 0.9;
  if (exploded) capTarget = capRest.clone().add(explodeOffsets.bottleCap);
  capPart.position.lerp(capTarget, 0.09);
  capPart.rotation.y += ((capOpen ? Math.PI * 0.4 : 0) - capPart.rotation.y) * 0.09;
}

// Mouse parallax tilt (subtle) when not in showcase mode
let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = (e.clientY / window.innerHeight) * 2 - 1;
});

function animate() {
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  story.update();
  updateExplode(dt);

  if (!showcaseMode) {
    // gentle idle bob + breathing + mouse tilt
    bottle.position.y += Math.sin(t * 0.8) * 0.0015;
    bottle.rotation.z += (Math.sin(t * 0.5) * 0.03 - bottle.rotation.z) * 0.03;
    bottle.rotation.x += (mouseY * 0.08 - bottle.rotation.x) * 0.03;
  } else {
    controls.update();
  }

  // Ring pulse
  const ring = bottle.getObjectByName('bottleRing');
  if (ring) {
    const pulse = 0.5 + Math.sin(t * 2) * 0.3;
    ring.material.emissiveIntensity = 0.4 + pulse * 0.5;
  }

  // Particles gentle drift
  particles.rotation.y += 0.0006;
  const posAttr = particles.geometry.attributes.position;
  const base = particles.userData.basePositions;
  for (let i = 0; i < posAttr.count; i++) {
    posAttr.array[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.6 + i) * 0.15;
  }
  posAttr.needsUpdate = true;

  // Crystals float + rotate
  crystals.children.forEach(c => {
    c.rotation.x += 0.003;
    c.rotation.y += 0.004;
    c.position.y = c.userData.baseY + Math.sin(t * c.userData.floatSpeed + c.userData.floatOffset) * 0.4;
  });

  // Rim lights subtle color drift
  lights.blueRim.intensity = 5 + Math.sin(t * 0.7) * 1.5;
  lights.purpleRim.intensity = 5 + Math.cos(t * 0.6) * 1.5;

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);