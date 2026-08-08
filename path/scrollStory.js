import * as THREE from 'three';

// Defines camera + bottle keyframes per section id, and drives interpolation based on scroll progress.
export function createScrollStory(ctx) {
  const { camera, bottle } = ctx;

  const keyframes = [
    { id: 'hero', camPos: [0, 0.4, 7], camLook: [0, 1.4, 0], bottleRot: [0, 0, 0], bottleScale: 1, bottlePos: [0, 0, 0] },
    { id: 'pain', camPos: [1.4, 1.1, 6.2], camLook: [0, 1.2, 0], bottleRot: [0, Math.PI * 0.6, 0], bottleScale: 0.85, bottlePos: [-1.6, -0.3, -1] },
    { id: 'promise', camPos: [0, 0.6, 5.4], camLook: [0, 1.4, 0], bottleRot: [0, Math.PI * 1.2, 0], bottleScale: 1.05, bottlePos: [0, 0.2, 0] },
    { id: 'usp', camPos: [-1.8, 0.9, 6.4], camLook: [0, 1.3, 0], bottleRot: [0, Math.PI * 1.8, 0], bottleScale: 0.8, bottlePos: [1.8, -0.2, -1] },
    { id: 'showcase', camPos: [0, 0.9, 4.6], camLook: [0, 1.3, 0], bottleRot: [0, Math.PI * 2.4, 0], bottleScale: 1.15, bottlePos: [0, 0.1, 0] },
    { id: 'how', camPos: [2.0, 1.4, 6.8], camLook: [0, 1.2, 0], bottleRot: [0, Math.PI * 3.0, 0], bottleScale: 0.75, bottlePos: [-1.9, -0.4, -1.4] },
    { id: 'features', camPos: [-1.6, 0.7, 6.6], camLook: [0, 1.3, 0], bottleRot: [0, Math.PI * 3.6, 0], bottleScale: 0.7, bottlePos: [1.9, -0.1, -1.5] },
    { id: 'compare', camPos: [0, 1.0, 6.0], camLook: [0, 1.3, 0], bottleRot: [0, Math.PI * 4.2, 0], bottleScale: 0.8, bottlePos: [0, 0.3, -0.8] },
    { id: 'proof', camPos: [1.6, 0.6, 6.2], camLook: [0, 1.2, 0], bottleRot: [0, Math.PI * 4.8, 0], bottleScale: 0.72, bottlePos: [-1.7, -0.2, -1.2] },
    { id: 'press', camPos: [0, 0.6, 6.5], camLook: [0, 1.2, 0], bottleRot: [0, Math.PI * 5.1, 0], bottleScale: 0.6, bottlePos: [0, -0.4, -2] },
    { id: 'audience', camPos: [-1.5, 0.8, 6.2], camLook: [0, 1.3, 0], bottleRot: [0, Math.PI * 5.6, 0], bottleScale: 0.72, bottlePos: [1.7, -0.1, -1.2] },
    { id: 'outcomes', camPos: [0, 0.9, 5.6], camLook: [0, 1.4, 0], bottleRot: [0, Math.PI * 6.1, 0], bottleScale: 0.9, bottlePos: [0, 0.2, -0.5] },
    { id: 'pricing', camPos: [1.5, 0.7, 6.3], camLook: [0, 1.2, 0], bottleRot: [0, Math.PI * 6.6, 0], bottleScale: 0.7, bottlePos: [-1.6, -0.2, -1.2] },
    { id: 'faq', camPos: [-1.4, 0.8, 6.4], camLook: [0, 1.3, 0], bottleRot: [0, Math.PI * 7.1, 0], bottleScale: 0.68, bottlePos: [1.7, -0.1, -1.3] },
    { id: 'final', camPos: [0, 0.5, 5.0], camLook: [0, 1.6, 0], bottleRot: [0, Math.PI * 7.6, 0], bottleScale: 1.1, bottlePos: [0, 0.8, 0] }
  ];

  const sectionEls = keyframes.map(k => document.getElementById(k.id)).filter(Boolean);
  let progress = 0; // global 0..1 across all sections
  let currentIndex = 0;
  let showcaseActive = false;

  const tmpCamPos = new THREE.Vector3();
  const tmpLook = new THREE.Vector3();

  function lerpArr(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];
  }

  function update() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progress = docHeight > 0 ? scrollY / docHeight : 0;

    // Find which section we're in based on element positions
    let idx = 0;
    for (let i = 0; i < sectionEls.length; i++) {
      const rect = sectionEls[i].getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.5) idx = i;
    }
    currentIndex = idx;

    const cur = keyframes[idx];
    const next = keyframes[Math.min(idx + 1, keyframes.length - 1)];
    const curEl = sectionEls[idx];
    const rect = curEl.getBoundingClientRect();
    let localT = 1 - Math.max(0, Math.min(1, rect.top / window.innerHeight));
    localT = Math.max(0, Math.min(1, localT));

    showcaseActive = cur.id === 'showcase' && localT > 0.15 && localT < 0.95;
    ctx.onShowcaseToggle && ctx.onShowcaseToggle(showcaseActive);

    if (!showcaseActive) {
      const camPos = lerpArr(cur.camPos, next.camPos, localT);
      const camLook = lerpArr(cur.camLook, next.camLook, localT);
      const bottleRot = lerpArr(cur.bottleRot, next.bottleRot, localT);
      const bottlePos = lerpArr(cur.bottlePos, next.bottlePos, localT);
      const bottleScale = cur.bottleScale + (next.bottleScale - cur.bottleScale) * localT;

      tmpCamPos.set(camPos[0], camPos[1], camPos[2]);
      camera.position.lerp(tmpCamPos, 0.09);
      tmpLook.set(camLook[0], camLook[1], camLook[2]);
      const lookTarget = ctx.currentLookTarget || tmpLook.clone();
      lookTarget.lerp(tmpLook, 0.09);
      ctx.currentLookTarget = lookTarget;
      camera.lookAt(lookTarget);

      if (!ctx.userInteractingBottle) {
        bottle.rotation.y += (bottleRot[1] - bottle.rotation.y) * 0.06 + 0.0025;
        bottle.position.x += (bottlePos[0] - bottle.position.x) * 0.08;
        bottle.position.y += (bottlePos[1] - bottle.position.y) * 0.08;
        bottle.position.z += (bottlePos[2] - bottle.position.z) * 0.08;
        bottle.scale.setScalar(bottle.scale.x + (bottleScale - bottle.scale.x) * 0.08);
      }
    }

    return { progress, currentIndex, showcaseActive };
  }

  return { update, keyframes, get progress() { return progress; }, get currentIndex() { return currentIndex; } };
}