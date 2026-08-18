// Cinematic opening: luxury packaging opens, light sweeps in, bottle is revealed.

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function setBottleOpacity(group, opacity) {
  group.traverse(child => {
    if (child.isMesh && child.material) {
      child.material.transparent = true;
      child.material.opacity = opacity;
      child.material.needsUpdate = true;
    }
  });
}

export function runIntroSequence(ctx, onComplete) {
  const {
    packaging,
    bottle,
    lights,
    camera,
    scene,
    prefersReducedMotion
  } = ctx;

  const startCam = { x: 0, y: 0.15, z: 8.8 };
  const endCam = { x: 0, y: 0.4, z: 7.3 };
  const lookAt = { x: 0, y: 1.2, z: 0 };

  camera.position.set(startCam.x, startCam.y, startCam.z);
  camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

  bottle.visible = true;
  bottle.scale.setScalar(0.72);
  setBottleOpacity(bottle, prefersReducedMotion ? 1 : 0);

  packaging.setOpen(0);
  packaging.setVisibility(1);
  packaging.group.visible = true;

  if (scene.fog) scene.fog.density = 0.065;
  lights.ambient.intensity = 0.15;
  lights.keyLight.intensity = 0.4;
  lights.revealLight.intensity = 0;
  if (lights.blueRim) lights.blueRim.intensity = 0.5;
  if (lights.purpleRim) lights.purpleRim.intensity = 0.3;

  document.body.classList.add('intro-playing');
  document.body.style.overflow = 'hidden';

  if (prefersReducedMotion) {
    packaging.setOpen(1);
    packaging.setVisibility(0);
    bottle.scale.setScalar(0.8);
    setBottleOpacity(bottle, 1);
    camera.position.set(endCam.x, endCam.y, endCam.z);
    lights.ambient.intensity = 0.45;
    lights.keyLight.intensity = 2.0;
    lights.revealLight.intensity = 1.5;
    if (scene.fog) scene.fog.density = 0.04;
    finish();
    return;
  }

  const duration = 4200;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);

    // Phase 1 (0–30%): anticipation, dim hold
    // Phase 2 (30–65%): lid opens
    // Phase 3 (65–85%): bottle fades in, veil lifts
    // Phase 4 (85–100%): camera pull-back, packaging fades

    const openT = easeInOutCubic(Math.max(0, Math.min(1, (t - 0.25) / 0.4)));
    packaging.setOpen(openT);

    const bottleT = easeOutCubic(Math.max(0, Math.min(1, (t - 0.5) / 0.35)));
    setBottleOpacity(bottle, bottleT * 0.3 + bottleT * 0.7);
    bottle.scale.setScalar(0.72 + bottleT * 0.13);

    const packFade = easeOutCubic(Math.max(0, Math.min(1, (t - 0.72) / 0.28)));
    packaging.setVisibility(1 - packFade);

    const camT = easeInOutCubic(Math.max(0, Math.min(1, (t - 0.15) / 0.85)));
    camera.position.x = startCam.x + (endCam.x - startCam.x) * camT;
    camera.position.y = startCam.y + (endCam.y - startCam.y) * camT;
    camera.position.z = startCam.z + (endCam.z - startCam.z) * camT;
    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

    lights.ambient.intensity = 0.15 + camT * 0.3;
    lights.keyLight.intensity = 0.4 + openT * 1.6;
    lights.revealLight.intensity = openT * 2.2;
    if (lights.blueRim) lights.blueRim.intensity = 0.5 + openT * 3;
    if (lights.purpleRim) lights.purpleRim.intensity = 0.3 + openT * 2.5;
    if (scene.fog) scene.fog.density = 0.065 - camT * 0.025;

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      packaging.setVisibility(0);
      packaging.group.visible = false;
      setBottleOpacity(bottle, 1);
      bottle.scale.setScalar(0.8);
      finish();
    }
  }

  function finish() {
    document.body.classList.remove('intro-playing');
    document.body.classList.add('intro-complete');
    document.body.style.overflow = '';
    ctx.introComplete = true;
    ctx.introPackagingOpen = 1;
    onComplete?.();
  }

  requestAnimationFrame(tick);
}
