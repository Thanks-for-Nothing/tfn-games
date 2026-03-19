import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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

// Add ambient + directional light for dolphin MeshStandardMaterial
const ambientLight = new THREE.AmbientLight(0x8899aa, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
dirLight.position.set(-0.5, 0.35, -1.0);
scene.add(dirLight);

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

// --- Procedural dolphin ---
function createDolphin(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x556677,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Body — lathe from profile curve
  const pts: THREE.Vector2[] = [];
  const profileR = [0, 0.08, 0.18, 0.28, 0.32, 0.3, 0.25, 0.18, 0.1, 0.05, 0.03];
  const profileZ = [0, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 0.95, 0.98, 1.0];
  const bodyLen = 2.5;
  for (let i = 0; i < profileR.length; i++) {
    pts.push(new THREE.Vector2(profileR[i] * 0.6, profileZ[i] * bodyLen));
  }
  const bodyGeo = new THREE.LatheGeometry(pts, 12);
  bodyGeo.rotateX(-Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, mat);
  group.add(bodyMesh);

  // Dorsal fin
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(-0.15, 0.4);
  finShape.lineTo(0.25, 0);
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.02, bevelEnabled: false });
  finGeo.translate(-0.01, 0.25, -0.8);
  finGeo.rotateY(Math.PI / 2);
  const finMesh = new THREE.Mesh(finGeo, mat);
  group.add(finMesh);

  // Tail flukes — two flat triangles
  for (const side of [-1, 1]) {
    const tailShape = new THREE.Shape();
    tailShape.moveTo(0, 0);
    tailShape.lineTo(side * 0.4, 0.15);
    tailShape.lineTo(side * 0.1, -0.05);
    const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.015, bevelEnabled: false });
    tailGeo.rotateX(Math.PI / 2);
    tailGeo.translate(0, 0.02, -bodyLen + 0.05);
    const tailMesh = new THREE.Mesh(tailGeo, mat);
    group.add(tailMesh);
  }

  // Pectoral fins
  for (const side of [-1, 1]) {
    const pecShape = new THREE.Shape();
    pecShape.moveTo(0, 0);
    pecShape.lineTo(side * 0.3, -0.15);
    pecShape.lineTo(side * 0.05, -0.1);
    const pecGeo = new THREE.ExtrudeGeometry(pecShape, { depth: 0.01, bevelEnabled: false });
    pecGeo.translate(0, -0.1, -0.6);
    const pecMesh = new THREE.Mesh(pecGeo, mat);
    group.add(pecMesh);
  }

  group.scale.set(0.8, 0.8, 0.8);
  return group;
}

const dolphin = createDolphin();
dolphin.visible = false;
scene.add(dolphin);

// --- Dolphin jump state ---
interface JumpState {
  active: boolean;
  phase: number;
  duration: number;
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
  originX: 0,
  originZ: 0,
  direction: 0,
  height: 4,
  speed: 3,
  nextJumpAt: 3 + Math.random() * 5,
};

function startJump(camPos: THREE.Vector3, camZ: number) {
  jump.active = true;
  jump.phase = 0;
  jump.duration = 2.0 + Math.random() * 1.0;
  jump.height = 3 + Math.random() * 2;
  jump.speed = 2 + Math.random() * 2;
  jump.direction = (Math.random() - 0.5) * 0.6;
  // Spawn 20-50 units ahead, ±20 X offset
  jump.originZ = camZ - 20 - Math.random() * 30;
  jump.originX = camPos.x + (Math.random() - 0.5) * 40;
}

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
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
hud.innerHTML = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12H19M5 12L9 8M5 12L9 16M19 12L15 8M19 12L15 16"/>
  </svg>
  <span>Swipe to look around</span>
`;
document.body.appendChild(hud);

// --- Day/Night toggle button ---
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

// --- Styles ---
const style = document.createElement('style');
style.textContent = `
  #hud {
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255,255,255,0.7);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    pointer-events: none;
    user-select: none;
    transition: opacity 1s ease;
    opacity: 1;
  }
  #hud.hidden { opacity: 0; }
  #hud svg { flex-shrink: 0; }
  #toggle-night {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.25);
    background: rgba(0,0,0,0.3);
    color: rgba(255,255,255,0.8);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    transition: background 0.3s, border-color 0.3s;
    z-index: 10;
  }
  #toggle-night:hover {
    background: rgba(0,0,0,0.5);
    border-color: rgba(255,255,255,0.4);
  }
`;
document.head.appendChild(style);

// Hide swipe HUD after first interaction or after 5 seconds
let hudHidden = false;
function hideHud() {
  if (hudHidden) return;
  hudHidden = true;
  hud.classList.add('hidden');
}
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

  // Animate day/night lerp
  const nightTarget = nightMode ? 1 : 0;
  nightLerp += (nightTarget - nightLerp) * 0.02;

  // Update uniforms
  skyMat.uniforms.uNight.value = nightLerp;
  skyMat.uniforms.uTime.value = t;
  oceanMat.uniforms.uTime.value = t;
  oceanMat.uniforms.uNight.value = nightLerp;

  // Lerp sun/moon direction
  currentSunDir.lerpVectors(sunDirDay, sunDirNight, nightLerp);

  // Update directional light to match
  dirLight.position.copy(currentSunDir);
  dirLight.intensity = 1.2 - nightLerp * 0.8;
  ambientLight.intensity = 0.6 - nightLerp * 0.3;

  // Adjust exposure
  renderer.toneMappingExposure = 0.6 + nightLerp * 0.15;

  oceanMat.uniforms.uCamPos.value.copy(camera.position);

  // Move forward
  camera.position.z = -t * 1.5;

  // Look direction based on yaw
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
    startJump(camera.position, camera.position.z);
  }

  let currentSplashStrength = 0;

  if (jump.active) {
    jump.phase += dt / jump.duration;

    if (jump.phase >= 1) {
      jump.active = false;
      dolphin.visible = false;
      jump.nextJumpAt = t + 5 + Math.random() * 10;
      splashPos.set(0, 0, -9999);
    } else {
      dolphin.visible = true;
      const p = jump.phase;

      // Parabolic Y: 0 at start/end, peak at p=0.5
      const y = jump.height * 4 * p * (1 - p);

      // XZ: linear travel
      const travelDist = jump.speed * jump.duration;
      const dx = Math.sin(jump.direction) * travelDist * p;
      const dz = -Math.cos(jump.direction) * travelDist * p;

      const worldX = jump.originX + dx;
      const worldZ = jump.originZ + dz;

      dolphin.position.set(worldX, y, worldZ);

      // Pitch: follow arc tangent
      const dydt = jump.height * 4 * (1 - 2 * p);
      const pitch = Math.atan2(dydt, jump.speed);
      dolphin.rotation.set(pitch, jump.direction + Math.PI, 0);

      // Splash: strongest when dolphin is near water (y near 0)
      const splashY = Math.max(0, 1 - y * 0.5);
      currentSplashStrength = splashY * splashY * 1.5;

      // Splash position relative to ocean mesh center
      splashPos.set(worldX - ocean.position.x, 0, worldZ - ocean.position.z);
    }
  }

  oceanMat.uniforms.uSplashPos.value.copy(splashPos);
  oceanMat.uniforms.uSplashStrength.value = currentSplashStrength;

  renderer.render(scene, camera);
}

animate();
