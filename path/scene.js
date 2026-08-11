import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createBottle } from './bottle.js';
import { createParticles, createPlatform, createCrystals } from './environment.js';

export function initScene(canvas) {
  try {
    console.log('🚀 Starting 3D scene initialization...');
    
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08090d, 0.045);
    console.log('✅ Scene created');

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.4, 7);
    console.log('✅ Camera created');

    // Firefox-compatible WebGL context creation
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    console.log('🌐 Browser detection - Firefox:', isFirefox);
    
    // Check WebGL support before creating renderer
    const testCanvas = document.createElement('canvas');
    const testGL = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
    if (!testGL) {
      throw new Error('WebGL not supported');
    }
    console.log('✅ WebGL context test passed');
    
    // Ensure canvas is properly sized before creating renderer
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log(`✅ Canvas sized: ${canvas.width}x${canvas.height}`);
    
    // Create renderer with Chrome-optimized settings
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ 
        canvas, 
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false
      });
      console.log('✅ WebGLRenderer created successfully');
    } catch (e) {
      console.error('❌ Failed to create WebGLRenderer:', e);
      throw new Error('Failed to create WebGLRenderer: ' + e.message);
    }
    
    console.log('✅ WebGLRenderer created');
    
    // Check if WebGL2 is supported (required for advanced features)
    const isWebGL2 = renderer.capabilities.isWebGL2;
    console.log('WebGL2 supported:', isWebGL2);
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Set clear color
    renderer.setClearColor(0x08090d, 1);
    
    // Color space and tone mapping
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    
    console.log('✅ Renderer configured');
    console.log('  - Size:', renderer.getSize(new THREE.Vector2()));
    console.log('  - Pixel Ratio:', renderer.getPixelRatio());
    
    // Shadow settings with Firefox compatibility
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Additional Firefox optimizations
    if (isFirefox) {
      renderer.shadowMap.type = THREE.PCFShadowMap; // More compatible with Firefox
      console.log('🔧 Applied Firefox-specific shadow settings');
    }

    // Premium lighting setup
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

    // Enhanced rim lights for premium look
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

    // Additional premium accent lights
    const topLight = new THREE.PointLight(0xffffff, 2, 8);
    topLight.name = 'topLight';
    topLight.position.set(0, 5, 2);
    scene.add(topLight);

    const bottomLight = new THREE.PointLight(0xb06bff, 1.5, 6);
    bottomLight.name = 'bottomLight';
    bottomLight.position.set(0, -3, 0);
    scene.add(bottomLight);

    // Environment map (Chrome/Firefox-compatible)
    let envRT = null;
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      
      const envScene = new THREE.Scene();
      const envGeo = new THREE.SphereGeometry(20, 32, 32);
      
      // Use a simpler material for compatibility
      const envMat = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        color: 0x4d9fff
      });
      
      const envMesh = new THREE.Mesh(envGeo, envMat);
      envScene.add(envMesh);
      
      envRT = pmrem.fromScene(envScene, 0.04);
      if (envRT && envRT.texture) {
        scene.environment = envRT.texture;
        console.log('✅ Environment map created');
      }
      pmrem.dispose();
    } catch (e) {
      console.warn('⚠️ PMREM generation failed, continuing without environment map:', e);
      // Fallback: skip environment map - not critical
    }

    // Bottle
    console.log('🔨 Creating bottle...');
    const { group: bottle, parts, explodeOffsets, materials } = createBottle();
    bottle.position.set(0, 0, 0);
    scene.add(bottle);
    console.log('✅ Bottle created and added to scene');
    console.log('  - Bottle has', parts.length, 'parts');
    console.log('  - Bottle position:', bottle.position);
    
    // Firefox-specific material adjustments
    if (isFirefox) {
      console.log('🔧 Applying Firefox material fixes...');
      // Reduce transmission for better Firefox compatibility
      parts.forEach(part => {
        if (part.material && part.material.transmission) {
          part.material.transmission = 0.5; // Lower transmission for Firefox
          part.material.needsUpdate = true;
          console.log('  - Adjusted transmission for:', part.name);
        }
      });
    }

    // Platform + particles + crystals
    console.log('✨ Creating environment...');
    const platform = createPlatform();
    scene.add(platform);
    console.log('  - Platform added');
    
    const particles = createParticles();
    scene.add(particles);
    console.log('  - Particles added:', particles.geometry.attributes.position.count, 'particles');
    
    const crystals = createCrystals();
    scene.add(crystals);
    console.log('  - Crystals added:', crystals.children.length, 'crystals');
    console.log('✅ Environment created');

    // Orbit controls (only enabled fully in showcase section)
    console.log('🎮 Creating orbit controls...');
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 12;
    controls.enabled = false;
    controls.target.set(0, 1.4, 0);
    console.log('✅ Controls created');
    console.log('  - Camera position:', camera.position);
    console.log('  - Controls target:', controls.target);

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    // Log WebGL info for debugging
    console.log('✅ Scene initialized successfully!');
    console.log('WebGL2 supported:', isWebGL2);
    console.log('Firefox detected:', isFirefox);
    console.log('Renderer info:', renderer.info.render);
    console.log('Scene objects:', scene.children.length, 'total objects');
    console.log('  -', bottle ? 'Bottle' : 'No bottle');
    console.log('  -', platform ? 'Platform' : 'No platform');
    console.log('  -', particles ? 'Particles' : 'No particles');
    console.log('  -', crystals ? 'Crystals' : 'No crystals');
    
    // Test render to ensure canvas is working
    console.log('🎨 Performing test render...');
    renderer.render(scene, camera);
    console.log('✅ Test render complete');
    
    // Force a second render to ensure everything is working
    requestAnimationFrame(() => {
      renderer.render(scene, camera);
      console.log('✅ Second test render complete');
    });

    // Premium post-processing effects (if WebGL2 available)
    let composer = null;
    if (isWebGL2 && !isFirefox) {
      try {
        // Note: For full post-processing, you'd need to import EffectComposer
        // For now, we'll enhance the renderer settings
        renderer.toneMappingExposure = 1.1;
      } catch (e) {
        console.warn('Post-processing not available:', e);
      }
    }

    return { 
      scene, 
      camera, 
      renderer, 
      controls, 
      bottle, 
      parts, 
      explodeOffsets, 
      materials, 
      platform, 
      particles, 
      crystals, 
      lights: { 
        keyLight, 
        blueRim, 
        purpleRim, 
        fillLight, 
        ambient,
        topLight,
        bottomLight
      },
      isFirefox,
      isWebGL2,
      composer
    };
    
  } catch (error) {
    console.error('❌ Failed to initialize 3D scene:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}