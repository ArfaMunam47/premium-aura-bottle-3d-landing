import * as THREE from 'three';

// Camera-driven cinematic story — bottle stays centered; camera creates movement.
const LOOK_CENTER = [0, 1.35, 0];
const MAX_SCALE = 0.86;
const MIN_CAM_Z = 6.5;

const STORY_PHASES = [
  'anticipation', 'unwrap', 'reveal', 'discover',
  'showcase', 'experience', 'desire', 'action'
];

function camFromOrbit(orbit, dist, height) {
  const z = Math.max(MIN_CAM_Z, dist);
  return [
    Math.sin(orbit) * 0.85,
    height,
    z
  ];
}

function detailLook(localT, sectionId) {
  if (sectionId === 'discover') {
    if (localT > 0.25 && localT < 0.45) return [0, 3.05, 0];
    if (localT > 0.45 && localT < 0.62) return [0, 1.15, 0];
    if (localT > 0.62 && localT < 0.78) return [0, 1.55, 0];
  }
  if (sectionId === 'showcase' && localT > 0.3 && localT < 0.55) {
    return [0, 2.8, 0];
  }
  return LOOK_CENTER;
}

function detailCamOffset(localT, sectionId) {
  if (sectionId === 'discover') {
    if (localT > 0.25 && localT < 0.45) return { orbit: 0.12, dist: -0.15, height: 0.55 };
    if (localT > 0.45 && localT < 0.62) return { orbit: 0.05, dist: -0.25, height: 0.15 };
  }
  return { orbit: 0, dist: 0, height: 0 };
}

export function createScrollStory(ctx) {
  const { camera, bottle, packaging, lights, scene } = ctx;

  const keyframes = [
    // ACT I — unveiling (bottle fixed at origin, camera only)
    {
      id: 'intro', phase: 'anticipation',
      orbit: 0, dist: 8.2, height: 0.28, rotY: 0, scale: 0.76,
      packagingOpen: 1, packagingVis: 0.12,
      ambient: 0.38, key: 1.6, reveal: 1.0, fog: 0.04
    },
    {
      id: 'unwrap', phase: 'unwrap',
      orbit: 0.06, dist: 7.6, height: 0.34, rotY: 0.04, scale: 0.78,
      packagingOpen: 1, packagingVis: 0,
      ambient: 0.42, key: 1.9, reveal: 1.4, fog: 0.036
    },
    {
      id: 'reveal', phase: 'reveal',
      orbit: 0, dist: 7.3, height: 0.4, rotY: 0.08, scale: 0.8,
      packagingVis: 0,
      ambient: 0.46, key: 2.1, reveal: 1.7, fog: 0.032,
      hold: true
    },
    {
      id: 'discover', phase: 'discover',
      orbit: 0.18, dist: 7.1, height: 0.42, rotY: 0.12, scale: 0.81,
      ambient: 0.46, key: 2.0, reveal: 1.3, fog: 0.03,
      discovery: true
    },
    // ACT II — showcase & story
    {
      id: 'showcase', phase: 'showcase',
      orbit: 0.28, dist: 6.9, height: 0.44, rotY: 0.16, scale: 0.82,
      ambient: 0.48, key: 2.1, reveal: 1.2, fog: 0.028
    },
    {
      id: 'promise', phase: 'experience',
      orbit: 0.1, dist: 7.8, height: 0.38, rotY: 0.2, scale: 0.7,
      ambient: 0.44, key: 1.85, reveal: 0.9, fog: 0.034
    },
    {
      id: 'usp', phase: 'experience',
      orbit: 0.22, dist: 7.9, height: 0.4, rotY: 0.24, scale: 0.68,
      ambient: 0.43, key: 1.8, reveal: 0.85, fog: 0.035
    },
    {
      id: 'how', phase: 'experience',
      orbit: 0.14, dist: 7.85, height: 0.38, rotY: 0.27, scale: 0.66,
      ambient: 0.43, key: 1.75, reveal: 0.8, fog: 0.036
    },
    {
      id: 'features', phase: 'experience',
      orbit: 0.2, dist: 7.9, height: 0.39, rotY: 0.3, scale: 0.64,
      ambient: 0.42, key: 1.7, reveal: 0.75, fog: 0.037
    },
    // ACT III — desire & action
    {
      id: 'proof', phase: 'desire',
      orbit: 0.12, dist: 8.0, height: 0.37, rotY: 0.33, scale: 0.62,
      ambient: 0.42, key: 1.65, reveal: 0.7, fog: 0.038
    },
    {
      id: 'pricing', phase: 'desire',
      orbit: 0.18, dist: 7.95, height: 0.38, rotY: 0.36, scale: 0.6,
      ambient: 0.42, key: 1.6, reveal: 0.65, fog: 0.039
    },
    {
      id: 'final', phase: 'action',
      orbit: 0, dist: 7.2, height: 0.42, rotY: 0.38, scale: 0.8,
      ambient: 0.48, key: 2.2, reveal: 1.5, fog: 0.028,
      hold: true
    }
  ];

  const sectionEls = keyframes.map(k => document.getElementById(k.id)).filter(Boolean);
  let progress = 0;
  let currentIndex = 0;
  let showcaseActive = false;
  let discoveryActive = false;
  let lastPhase = '';

  const tmpCamPos = new THREE.Vector3();
  const tmpLook = new THREE.Vector3();
  const bottleAnchor = new THREE.Vector3(0, 0, 0);

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpVal(a, b, t) { return lerp(a ?? 0, b ?? 0, t); }

  function updateStoryUI(phase) {
    if (phase === lastPhase) return;
    lastPhase = phase;
    document.body.dataset.storyPhase = phase;
    document.querySelectorAll('.story-dot').forEach(dot => {
      dot.classList.toggle('active', dot.dataset.phase === phase);
    });
    const progressRail = document.getElementById('story-progress');
    if (progressRail) {
      const phaseIdx = STORY_PHASES.indexOf(phase);
      const pct = phaseIdx >= 0 ? ((phaseIdx + 1) / STORY_PHASES.length) * 100 : 0;
      progressRail.style.setProperty('--story-pct', pct + '%');
    }
  }

  function update() {
    if (!ctx.introComplete) return { progress: 0, currentIndex: 0 };

    let idx = 0;
    for (let i = 0; i < sectionEls.length; i++) {
      const rect = sectionEls[i].getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.55) idx = i;
    }
    currentIndex = idx;

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    progress = docHeight > 0 ? window.scrollY / docHeight : 0;

    const cur = keyframes[idx];
    const next = keyframes[Math.min(idx + 1, keyframes.length - 1)];
    const curEl = sectionEls[idx];
    if (!curEl) return { progress, currentIndex };

    const rect = curEl.getBoundingClientRect();
    let localT = 1 - Math.max(0, Math.min(1, rect.top / (window.innerHeight * 0.85)));
    localT = Math.max(0, Math.min(1, localT));

    if (cur.hold) {
      localT = localT < 0.5 ? localT * 0.6 : 0.3 + (localT - 0.5) * 0.7;
    }

    showcaseActive = cur.id === 'showcase' && localT > 0.25 && localT < 0.9;
    discoveryActive = !!cur.discovery;
    ctx.onShowcaseToggle?.(showcaseActive);
    ctx.discoveryActive = discoveryActive;
    ctx.detailFocus = localT > 0.25 && localT < 0.78 && cur.id === 'discover';

    updateStoryUI(cur.phase);

    const orbit = lerpVal(cur.orbit, next.orbit, localT);
    const dist = lerpVal(cur.dist, next.dist, localT);
    const height = lerpVal(cur.height, next.height, localT);
    const rotY = lerpVal(cur.rotY, next.rotY, localT);
    const scale = Math.min(MAX_SCALE, lerpVal(cur.scale, next.scale, localT));

    const detail = detailCamOffset(localT, cur.id);
    const look = detailLook(localT, cur.id);

    const camPos = camFromOrbit(
      orbit + detail.orbit,
      dist + detail.dist,
      height + detail.height
    );

    const smooth = showcaseActive ? 0.1 : cur.hold ? 0.05 : 0.07;

    tmpCamPos.set(camPos[0], camPos[1], camPos[2]);
    camera.position.lerp(tmpCamPos, smooth);
    tmpLook.set(look[0], look[1], look[2]);
    if (!ctx.currentLookTarget) ctx.currentLookTarget = tmpLook.clone();
    ctx.currentLookTarget.lerp(tmpLook, smooth * 1.2);
    camera.lookAt(ctx.currentLookTarget);

    if (!ctx.userInteractingBottle) {
      bottle.rotation.y += (rotY - bottle.rotation.y) * 0.04;
      bottle.rotation.x *= 0.92;
      bottle.rotation.z *= 0.92;
      bottle.position.lerp(bottleAnchor, 0.1);
      bottle.scale.setScalar(bottle.scale.x + (scale - bottle.scale.x) * 0.06);
    }

    if (packaging && ctx.introComplete) {
      const packOpen = lerpVal(cur.packagingOpen, next.packagingOpen, localT);
      const packVis = lerpVal(cur.packagingVis, next.packagingVis, localT);
      packaging.setOpen(packOpen ?? 1);
      packaging.setVisibility(packVis);
      packaging.group.visible = packVis > 0.01;
    }

    if (lights) {
      lights.ambient.intensity += (lerpVal(cur.ambient, next.ambient, localT) - lights.ambient.intensity) * 0.05;
      lights.keyLight.intensity += (lerpVal(cur.key, next.key, localT) - lights.keyLight.intensity) * 0.05;
      if (lights.revealLight) {
        lights.revealLight.intensity += (lerpVal(cur.reveal, next.reveal, localT) - lights.revealLight.intensity) * 0.05;
      }
      const fog = lerpVal(cur.fog, next.fog, localT);
      if (scene.fog) scene.fog.density += (fog - scene.fog.density) * 0.05;
    }

    return { progress, currentIndex, showcaseActive, discoveryActive, phase: cur.phase };
  }

  return {
    update,
    keyframes,
    get progress() { return progress; },
    get currentIndex() { return currentIndex; },
    get phase() { return keyframes[currentIndex]?.phase; }
  };
}
