import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  skyVertexShader,
  skyFragmentShader,
  oceanVertexShader,
  oceanFragmentShader,
} from './shaders';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// Lights for dolphin mesh
const ambientLight = new THREE.AmbientLight(0x8899aa, 0.8);
scene.add(ambientLight);
const hemiLight = new THREE.HemisphereLight(0x88aacc, 0x445566, 0.6);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffeedd, 1.5);
dirLight.position.set(-0.5, 0.35, -1.0);
scene.add(dirLight);
// Second light from front/above so dolphin isn't silhouetted against sky
const fillLight = new THREE.DirectionalLight(0xaabbcc, 0.8);
fillLight.position.set(0, 1, 1);
scene.add(fillLight);

const sunDirDay = new THREE.Vector3(-0.5, 0.35, -1.0).normalize();
const sunDirNight = new THREE.Vector3(0.3, 0.25, 0.8).normalize();
const currentSunDir = sunDirDay.clone();

// Sky dome
const skyMat = new THREE.ShaderMaterial({
  vertexShader: skyVertexShader,
  fragmentShader: skyFragmentShader,
  uniforms: {
    uSunDir: { value: currentSunDir },
    uNight: { value: 0 },
    uTime: { value: 0 },
  },
  side: THREE.BackSide,
  depthWrite: false,
});
const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(500, 16, 16), skyMat);
scene.add(skyMesh);

// Ocean mesh
const splashPos = new THREE.Vector3(0, 0, -9999);

const geo = new THREE.PlaneGeometry(200, 200, 256, 256);
geo.rotateX(-Math.PI / 2);

const oceanMat = new THREE.ShaderMaterial({
  vertexShader: oceanVertexShader,
  fragmentShader: oceanFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uSunDir: { value: currentSunDir },
    uCamPos: { value: new THREE.Vector3() },
    uNight: { value: 0 },
    uSplashPos: { value: splashPos },
    uSplashStrength: { value: 0 },
  },
});

const ocean = new THREE.Mesh(geo, oceanMat);
scene.add(ocean);

// --- GLB Dolphin ---
let dolphinTemplate: THREE.Mesh | null = null;
let dolphinMat: THREE.MeshPhongMaterial | null = null;
const dolphinMesh = new THREE.Group();
dolphinMesh.visible = false;
scene.add(dolphinMesh);

const BASE_PATH = import.meta.env.BASE_URL || '/';

const loader = new GLTFLoader();
loader.load(
  `${BASE_PATH}dolphin.glb`,
  (gltf) => {
    const mesh = gltf.scene.children[0] as THREE.Mesh;
    dolphinTemplate = mesh;

    // Measure the model to set correct scale
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    console.log('Dolphin GLB bounds:', size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2));

    // Clone and setup material
    const dolphinClone = mesh.clone();
    dolphinClone.geometry = mesh.geometry.clone();

    dolphinClone.geometry.rotateZ(-Math.PI / 2);
    dolphinClone.geometry.rotateY(Math.PI);

    // Bright dolphin material that catches light from all angles
    dolphinMat = new THREE.MeshPhongMaterial({
      color: 0x7799aa,
      specular: 0x99aabb,
      shininess: 60,
      side: THREE.DoubleSide,
      emissive: 0x223344,
      emissiveIntensity: 0.1,
    });
    dolphinClone.material = dolphinMat;
    dolphinMesh.add(dolphinClone);

    // Scale so the dolphin is ~6 units long (nose to tail) — visible at distance
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetLength = 12.0;
    const s = targetLength / maxDim;
    dolphinMesh.scale.set(s, s, s);

    console.log('Dolphin GLB loaded successfully');
  },
  undefined,
  (err) => {
    console.warn('Failed to load dolphin GLB, using fallback', err);
    // Fallback: simple elongated sphere
    const fallbackGeo = new THREE.SphereGeometry(0.4, 12, 8);
    fallbackGeo.scale(1.0, 0.6, 2.5);
    const fallbackMat = new THREE.MeshStandardMaterial({
      color: 0x556677,
      metalness: 0.15,
      roughness: 0.4,
      side: THREE.DoubleSide,
    });
    dolphinMesh.add(new THREE.Mesh(fallbackGeo, fallbackMat));
    dolphinMesh.scale.set(3.5, 3.5, 3.5);
  }
);

// --- Dolphin jump state ---
const CAM_SPEED = 1.5;

interface JumpState {
  active: boolean;
  phase: number;
  duration: number;
  startTime: number;
  originX: number;
  originZ: number;
  direction: number;
  height: number;
  speed: number;
  nextJumpAt: number;
}

const jump: JumpState = {
  active: false,
  phase: 0,
  duration: 2.5,
  startTime: 0,
  originX: 0,
  originZ: 0,
  direction: 0,
  height: 4,
  speed: 3,
  nextJumpAt: 2,
};

function startJump(camX: number, camZ: number, t: number) {
  jump.active = true;
  jump.phase = 0;
  jump.startTime = t;
  jump.duration = 0.9 + Math.random() * 0.4;
  jump.height = 0.8 + Math.random() * 0.8;  // shallow arc: 0.8-1.6 units
  jump.speed = 6 + Math.random() * 3;        // much faster forward: 6-9 units/sec
  // Direction: roughly left-to-right (perpendicular to camera view)
  // Random side: +X or -X, with slight variation
  jump.direction = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 0.6);
  // Place ahead of camera in Z, centered or slightly offset in X
  jump.originZ = camZ - 40 - Math.random() * 30;
  jump.originX = camX + (Math.random() - 0.5) * 15;
}

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 0);
camera.lookAt(0, 0, -50);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Horizontal look-around ---
let yaw = 0;
const SENSITIVITY = 0.003;
let dragging = false;
let lastPointerX = 0;

renderer.domElement.addEventListener('pointerdown', (e) => {
  dragging = true;
  lastPointerX = e.clientX;
  renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastPointerX;
  lastPointerX = e.clientX;
  yaw -= dx * SENSITIVITY;
});
renderer.domElement.addEventListener('pointerup', (e) => {
  dragging = false;
  renderer.domElement.releasePointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointercancel', (e) => {
  dragging = false;
  renderer.domElement.releasePointerCapture(e.pointerId);
});
renderer.domElement.style.touchAction = 'none';

// --- HUD ---
const hud = document.createElement('div');
hud.id = 'hud';
hud.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12H19M5 12L9 8M5 12L9 16M19 12L15 8M19 12L15 16"/></svg><span>Swipe to look around</span>`;
document.body.appendChild(hud);

const MOON_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const SUN_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

const toggleBtn = document.createElement('button');
toggleBtn.id = 'toggle-night';
toggleBtn.innerHTML = MOON_SVG;
document.body.appendChild(toggleBtn);

let nightMode = false;
let nightLerp = 0;
toggleBtn.addEventListener('click', () => {
  nightMode = !nightMode;
  toggleBtn.innerHTML = nightMode ? SUN_SVG : MOON_SVG;
});

const style = document.createElement('style');
style.textContent = `
  #hud { position:fixed; bottom:32px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:8px; color:rgba(255,255,255,0.7); font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; font-size:14px; pointer-events:none; user-select:none; transition:opacity 1s ease; opacity:1; }
  #hud.hidden { opacity:0; }
  #hud svg { flex-shrink:0; }
  #toggle-night { position:fixed; top:20px; right:20px; width:44px; height:44px; border-radius:50%; border:1px solid rgba(255,255,255,0.25); background:rgba(0,0,0,0.3); color:rgba(255,255,255,0.8); cursor:pointer; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); transition:background 0.3s,border-color 0.3s; z-index:10; }
  #toggle-night:hover { background:rgba(0,0,0,0.5); border-color:rgba(255,255,255,0.4); }
`;
document.head.appendChild(style);

let hudHidden = false;
function hideHud() { if (hudHidden) return; hudHidden = true; hud.classList.add('hidden'); }
renderer.domElement.addEventListener('pointerdown', hideHud, { once: true });
setTimeout(hideHud, 5000);

// --- Animation loop ---
const clock = new THREE.Clock();
let lastTime = 0;

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const dt = t - lastTime;
  lastTime = t;

  // Day/night
  const nightTarget = nightMode ? 1 : 0;
  nightLerp += (nightTarget - nightLerp) * 0.02;
  skyMat.uniforms.uNight.value = nightLerp;
  skyMat.uniforms.uTime.value = t;
  oceanMat.uniforms.uTime.value = t;
  oceanMat.uniforms.uNight.value = nightLerp;
  currentSunDir.lerpVectors(sunDirDay, sunDirNight, nightLerp);
  dirLight.position.copy(currentSunDir);
  dirLight.intensity = 1.5 - nightLerp * 1.0;
  ambientLight.intensity = 0.8 - nightLerp * 0.4;
  hemiLight.intensity = 0.6 - nightLerp * 0.4;
  fillLight.intensity = 0.8 - nightLerp * 0.5;
  renderer.toneMappingExposure = 0.6 + nightLerp * 0.15;

  // Update dolphin material to match lighting environment
  if (dolphinMat) {
    const dayColor = new THREE.Color(0xaabbcc);
    const nightColor = new THREE.Color(0x334455);
    dolphinMat.color.copy(dayColor).lerp(nightColor, nightLerp);
    const daySpec = new THREE.Color(0x99aabb);
    const nightSpec = new THREE.Color(0x445566);
    dolphinMat.specular.copy(daySpec).lerp(nightSpec, nightLerp);
    const dayEmissive = new THREE.Color(0x223344);
    const nightEmissive = new THREE.Color(0x112233);
    dolphinMat.emissive.copy(dayEmissive).lerp(nightEmissive, nightLerp);
    dolphinMat.emissiveIntensity = 0.1 + nightLerp * 0.15;
  }

  oceanMat.uniforms.uCamPos.value.copy(camera.position);

  // Camera moves forward
  camera.position.z = -t * CAM_SPEED;
  const lookDist = 50;
  const lookX = camera.position.x + Math.sin(yaw) * lookDist;
  const lookZ = camera.position.z - Math.cos(yaw) * lookDist;
  camera.lookAt(lookX, 1, lookZ);

  // Keep ocean and sky centered on camera
  ocean.position.x = camera.position.x;
  ocean.position.z = camera.position.z;
  skyMesh.position.copy(camera.position);

  // --- Dolphin jump ---
  if (!jump.active && t >= jump.nextJumpAt) {
    startJump(camera.position.x, camera.position.z, t);
  }

  let currentSplashStrength = oceanMat.uniforms.uSplashStrength.value as number;
  // Decay splash smoothly — takes ~1 second to fully fade
  currentSplashStrength *= Math.max(0, 1 - dt * 3.0);

  if (jump.active) {
    jump.phase += dt / jump.duration;

    // Let phase go well past 1.0 so dolphin fully submerges + lingers 1s underwater
    if (jump.phase >= 1.4 + (1.0 / jump.duration)) {
      jump.active = false;
      dolphinMesh.visible = false;
      jump.nextJumpAt = t + 5 + Math.random() * 10;
      // Don't reset splashPos — let the decay handle fade-out
    } else {
      dolphinMesh.visible = true;
      const p = jump.phase;

      // Parabolic Y: 0 at p=0 and p=1, negative past p=1 (submerging)
      const y = jump.height * 4 * p * (1 - p);

      // XZ travel — mainly lateral (left to right)
      const elapsed = t - jump.startTime;
      const travelDist = jump.speed * jump.duration;
      const dx = -Math.sin(jump.direction) * travelDist * p;
      const dz = -Math.cos(jump.direction) * travelDist * p;
      // Also drift with camera so dolphin doesn't fall behind
      const camDrift = -CAM_SPEED * elapsed;

      const worldX = jump.originX + dx;
      const worldZ = jump.originZ + dz + camDrift;

      dolphinMesh.position.set(worldX, y, worldZ);

      const dydt = jump.height * 4 * (1 - 2 * p);
      // Clamp pitch to ±35° for a natural shallow arc
      const rawPitch = Math.atan2(dydt, jump.speed);
      const maxPitch = 0.6; // ~35 degrees
      const pitch = Math.max(-maxPitch, Math.min(maxPitch, rawPitch));
      dolphinMesh.rotation.order = 'YXZ';
      dolphinMesh.rotation.set(pitch, jump.direction, 0);

      // Splash strength: boost when near water, otherwise let decay handle it
      const splashY = Math.max(0, 1 - y * 0.5);
      const targetSplash = splashY * splashY * 1.5;
      currentSplashStrength = Math.max(currentSplashStrength, targetSplash);

      // Splash position relative to ocean mesh center
      splashPos.set(worldX - ocean.position.x, 0, worldZ - ocean.position.z);
    }
  }

  oceanMat.uniforms.uSplashPos.value.copy(splashPos);
  oceanMat.uniforms.uSplashStrength.value = currentSplashStrength;

  renderer.render(scene, camera);
}

animate();
