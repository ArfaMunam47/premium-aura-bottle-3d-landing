import * as THREE from 'three';
import { initScene } from './scene.js';
import { createScrollStory } from './scrollStory.js';
import { initUI } from './ui.js';

// Hide the loader first so the page never gets stuck on the AURA screen.
initUI();

// Wait for DOM to be fully ready before initializing 3D
let ctx;
let has3DError = false;

function init3D() {
  const canvas = document.getElementById('bg-canvas');
  
  // Ensure canvas exists and is visible
  if (!canvas) {
    console.error('❌ Canvas element not found!');
    has3DError = true;
    return;
  }
  
  console.log('✅ Canvas element found');
  console.log('  - Canvas size:', canvas.width, 'x', canvas.height);
  console.log('  - Canvas display:', window.getComputedStyle(canvas).display);
  console.log('  - Canvas visibility:', window.getComputedStyle(canvas).visibility);
  
  try {
    console.log('🎬 Initializing 3D scene...');
    console.log('  - Browser:', navigator.userAgent);
    console.log('  - WebGL support:', !!document.createElement('canvas').getContext('webgl2') || !!document.createElement('canvas').getContext('webgl'));
    
    // Ensure canvas is properly sized before initialization
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log('✅ Canvas pre-sized:', canvas.width, 'x', canvas.height);
    
    ctx = initScene(canvas);
    console.log('✅ 3D scene initialized successfully');
    console.log('  - Context returned:', !!ctx);
  } catch (err) {
    has3DError = true;
    console.error('❌ 3D init failed:', err);
    console.error('Error details:', err.message, err.stack);
    // Keep the page usable even if WebGL/3D fails.
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
    
    // Show a message to the user
    const root = document.getElementById('root');
    if (root) {
      const warning = document.createElement('div');
      warning.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:rgba(255,100,100,0.9);color:white;padding:15px 25px;border-radius:10px;z-index:99999;font-family:Arial,sans-serif;max-width:90%;text-align:center;';
      warning.textContent = '3D features require WebGL. Please ensure hardware acceleration is enabled in your browser settings.';
      document.body.appendChild(warning);
    }
  }

  if (!ctx) {
    console.error('❌ Context is null - 3D scene not initialized');
    console.error('  - has3DError:', has3DError);
    return;
  }
  
  console.log('✅ Starting animation loop setup...');
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
    if (has3DError) return;
    
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

    // Ring pulse (enhanced)
    const ring = bottle.getObjectByName('bottleRing');
    if (ring) {
      const pulse = 0.5 + Math.sin(t * 2) * 0.3;
      ring.material.emissiveIntensity = 0.4 + pulse * 0.5;
    }

    // Particles gentle drift (enhanced)
    particles.rotation.y += 0.0006;
    const posAttr = particles.geometry.attributes.position;
    const base = particles.userData.basePositions;
    for (let i = 0; i < posAttr.count; i++) {
      posAttr.array[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.6 + i) * 0.15;
    }
    posAttr.needsUpdate = true;

    // Crystals float + rotate (enhanced)
    crystals.children.forEach(c => {
      c.rotation.x += 0.003;
      c.rotation.y += 0.004;
      c.position.y = c.userData.baseY + Math.sin(t * c.userData.floatSpeed + c.userData.floatOffset) * 0.4;
    });

    // Premium lighting animations
    lights.blueRim.intensity = 5 + Math.sin(t * 0.7) * 1.5;
    lights.purpleRim.intensity = 5 + Math.cos(t * 0.6) * 1.5;
    
    // Animate new accent lights
    if (lights.topLight) {
      lights.topLight.intensity = 2 + Math.sin(t * 0.8) * 0.5;
    }
    if (lights.bottomLight) {
      lights.bottomLight.intensity = 1.5 + Math.cos(t * 0.9) * 0.4;
    }

    renderer.render(scene, camera);
    
    // Log FPS every 60 frames
    if (Math.floor(t * 60) % 60 === 0 && ctx && ctx.isFirefox) {
      console.log('🎬 Rendering... FPS:', Math.round(1 / dt));
    }
  }
  
  if (!has3DError && renderer) {
    console.log('🚀 Starting animation loop...');
    
    // Use requestAnimationFrame fallback for better compatibility
    if (renderer.setAnimationLoop) {
      renderer.setAnimationLoop(animate);
      console.log('✅ Animation loop started via setAnimationLoop');
    } else {
      // Fallback for older browsers
      function fallbackLoop() {
        if (has3DError) return;
        animate();
        requestAnimationFrame(fallbackLoop);
      }
      fallbackLoop();
      console.log('✅ Animation loop started via requestAnimationFrame fallback');
    }
    
    // Verify animation is running
    setTimeout(() => {
      console.log('🔍 Animation loop health check...');
      console.log('  - Renderer info:', renderer.info.render);
      console.log('  - Scene children:', scene.children.length);
      console.log('  - Animation running:', !has3DError);
    }, 2000);
  } else {
    console.error('❌ Cannot start animation loop - renderer or context missing');
    console.error('  - has3DError:', has3DError);
    console.error('  - renderer:', !!renderer);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init3D);
} else {
  // DOM already loaded
  init3D();
}

// Also initialize on window load as backup
window.addEventListener('load', () => {
  if (!ctx && !has3DError) {
    console.log('🔄 Retrying 3D initialization on window load...');
    init3D();
  }
});