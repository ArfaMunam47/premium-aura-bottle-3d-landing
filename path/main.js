import * as THREE from 'three';
import { initScene } from './scene.js';
import { createScrollStory } from './scrollStory.js';
import { initUI } from './ui.js';
import { runIntroSequence } from './introSequence.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ui = initUI({ prefersReducedMotion });

let ctx;
let has3DError = false;

function init3D() {
  if (ctx || has3DError) return;

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) {
    has3DError = true;
    return;
  }

  try {
    ctx = initScene(canvas, { prefersReducedMotion });
  } catch (err) {
    has3DError = true;
    console.error('3D init failed:', err);
    document.getElementById('loader')?.classList.add('hidden');
    showWebGLWarning();
    return;
  }

  const {
    scene, camera, renderer, controls, bottle, parts, explodeOffsets,
    materials, particles, crystals, platform, lights, packaging, contactShadow
  } = ctx;

  let showcaseMode = false;
  let exploded = false;
  let capOpen = false;
  const clock = new THREE.Clock();

  const liquidSurface = bottle.getObjectByName('liquidSurface');

  ctx.onShowcaseToggle = (active) => {
    if (active === showcaseMode) return;
    showcaseMode = active;
    controls.enabled = active;
    ctx.userInteractingBottle = active;
    canvas.classList.toggle('interactive', active);
    if (active) {
      controls.target.set(0, 1.35, 0);
    }
  };

  const story = createScrollStory(ctx);

  document.querySelectorAll('.swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      materials.steelMat.color.set(sw.dataset.color);
    });
  });

  const btnExplode = document.getElementById('btn-explode');
  const btnCap = document.getElementById('btn-cap');
  const btnReset = document.getElementById('btn-reset');

  btnExplode?.addEventListener('click', () => {
    exploded = !exploded;
    btnExplode.textContent = exploded ? 'Reassemble' : 'Exploded View';
  });
  btnCap?.addEventListener('click', () => {
    capOpen = !capOpen;
    btnCap.textContent = capOpen ? 'Close Cap' : 'Open Cap';
  });
  btnReset?.addEventListener('click', () => {
    exploded = false;
    capOpen = false;
    btnExplode.textContent = 'Exploded View';
    btnCap.textContent = 'Open Cap';
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    document.querySelector('.swatch[data-color="#e8ecef"]')?.classList.add('active');
    materials.steelMat.color.set('#e8ecef');
    controls.reset();
    controls.target.set(0, 1.35, 0);
  });

  const capPart = parts.find(p => p.name === 'bottleCap');
  const capRest = capPart.userData.restPos.clone();

  function updateExplode() {
    parts.forEach(part => {
      const rest = part.userData.restPos;
      const offset = explodeOffsets[part.name] || new THREE.Vector3();
      const targetLocal = exploded ? rest.clone().add(offset) : rest.clone();
      if (part.name === 'bottleCap') return;
      part.position.lerp(targetLocal, 0.08);
    });
    let capTarget = capRest.clone();
    if (capOpen) capTarget.y += 0.9;
    if (exploded) capTarget = capRest.clone().add(explodeOffsets.bottleCap);
    capPart.position.lerp(capTarget, 0.09);
    capPart.rotation.y += ((capOpen ? Math.PI * 0.4 : 0) - capPart.rotation.y) * 0.09;
  }

  let mouseX = 0;
  let mouseY = 0;
  let smoothMouseX = 0;
  let smoothMouseY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const posAttr = particles.geometry.attributes.position;
  const base = particles.userData.basePositions;
  let frameCount = 0;
  let envRevealed = false;

  function animate() {
    if (has3DError) return;

    const t = clock.elapsedTime;
    smoothMouseX += (mouseX - smoothMouseX) * 0.04;
    smoothMouseY += (mouseY - smoothMouseY) * 0.04;

    const storyState = story.update() || {};
    updateExplode();

    const introDone = ctx.introComplete;
    const phase = storyState.phase || 'anticipation';
    const pastReveal = ['discover', 'showcase', 'experience', 'desire', 'action'].includes(phase);

    if (introDone && pastReveal && !envRevealed) {
      envRevealed = true;
      platform.visible = true;
      if (contactShadow) contactShadow.visible = true;
      crystals.visible = true;
      particles.visible = true;
    }

    if (showcaseMode) {
      controls.update();
    } else if (introDone && !prefersReducedMotion && !ctx.detailFocus) {
      const tilt = ctx.discoveryActive ? 0.018 : 0.008;
      bottle.rotation.x += (smoothMouseY * tilt - bottle.rotation.x) * 0.03;
      bottle.rotation.z += (-smoothMouseX * tilt * 0.4 - bottle.rotation.z) * 0.03;
    }

    if (lights.revealLight && introDone) {
      lights.revealLight.position.x += (smoothMouseX * 0.8 - lights.revealLight.position.x) * 0.03;
      lights.revealLight.position.z += ((3.2 + smoothMouseY * 0.3) - lights.revealLight.position.z) * 0.03;
    }

    if (liquidSurface && introDone && !prefersReducedMotion) {
      const baseY = liquidSurface.userData.baseY;
      liquidSurface.position.y = baseY + Math.sin(t * 0.6) * 0.004;
      liquidSurface.rotation.z = Math.sin(t * 0.4) * 0.008;
    }

    const ring = bottle.getObjectByName('bottleRing');
    if (ring && introDone && !prefersReducedMotion) {
      ring.material.emissiveIntensity = 0.22 + Math.sin(t * 0.8) * 0.08;
    }

    if (introDone && pastReveal && !prefersReducedMotion && frameCount % 4 === 0) {
      particles.rotation.y += 0.0002;
      for (let i = 0; i < posAttr.count; i++) {
        posAttr.array[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.4 + i) * 0.03;
      }
      posAttr.needsUpdate = true;
    }

    if (introDone && !prefersReducedMotion && frameCount % 5 === 0) {
      if (lights.blueRim) lights.blueRim.intensity += (3.0 + Math.sin(t * 0.35) * 0.25 - lights.blueRim.intensity) * 0.04;
      if (lights.purpleRim) lights.purpleRim.intensity += (2.2 + Math.cos(t * 0.3) * 0.2 - lights.purpleRim.intensity) * 0.04;
    }

    renderer.render(scene, camera);
    frameCount++;
  }

  if (renderer.setAnimationLoop) {
    renderer.setAnimationLoop(animate);
  } else {
    function fallbackLoop() {
      animate();
      requestAnimationFrame(fallbackLoop);
    }
    fallbackLoop();
  }

  ui.onLoaderReady?.();
  ctx.prefersReducedMotion = prefersReducedMotion;
  runIntroSequence(ctx, () => ui.onIntroComplete?.());
}

function showWebGLWarning() {
  const warning = document.createElement('div');
  warning.className = 'webgl-warning';
  warning.setAttribute('role', 'alert');
  warning.textContent = '3D features require WebGL. Please enable hardware acceleration in your browser settings.';
  document.body.appendChild(warning);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init3D);
} else {
  init3D();
}

window.addEventListener('load', () => {
  if (!ctx && !has3DError) init3D();
});
