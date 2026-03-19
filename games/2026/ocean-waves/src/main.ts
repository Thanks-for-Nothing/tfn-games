import * as THREE from 'three';
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
const sunDir = new THREE.Vector3(-0.5, 0.35, -1.0).normalize();

// Sky dome
const skyMat = new THREE.ShaderMaterial({
  vertexShader: skyVertexShader,
  fragmentShader: skyFragmentShader,
  uniforms: { uSunDir: { value: sunDir } },
  side: THREE.BackSide,
  depthWrite: false,
});
const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(500, 16, 16), skyMat);
scene.add(skyMesh);

// Ocean mesh
const geo = new THREE.PlaneGeometry(200, 200, 256, 256);
geo.rotateX(-Math.PI / 2);

const oceanMat = new THREE.ShaderMaterial({
  vertexShader: oceanVertexShader,
  fragmentShader: oceanFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uSunDir: { value: sunDir },
    uCamPos: { value: new THREE.Vector3() },
  },
});

const ocean = new THREE.Mesh(geo, oceanMat);
scene.add(ocean);

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
let yaw = 0; // radians, 0 = looking forward (-Z)
const MAX_YAW = Math.PI * 0.45; // ~80 degrees each way
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
  yaw = Math.max(-MAX_YAW, Math.min(MAX_YAW, yaw - dx * SENSITIVITY));
});

renderer.domElement.addEventListener('pointerup', (e) => {
  dragging = false;
  renderer.domElement.releasePointerCapture(e.pointerId);
});

renderer.domElement.addEventListener('pointercancel', (e) => {
  dragging = false;
  renderer.domElement.releasePointerCapture(e.pointerId);
});

// Prevent default touch scrolling
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
`;
document.head.appendChild(style);

// Hide HUD after first interaction or after 5 seconds
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

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  oceanMat.uniforms.uTime.value = t;
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

  renderer.render(scene, camera);
}

animate();
