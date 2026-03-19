# Ocean Waves — TFN 2026 Treasure Cove Puzzle

A real-time WebGL ocean scene built with Three.js and custom GLSL shaders. Features Gerstner wave displacement, procedural clouds, day/night cycle with stars and moonlight, horizontal camera panning, and a jumping dolphin with splash effects.

**Live:** [game.tfnparty.com/2026/ocean-waves/](https://game.tfnparty.com/2026/ocean-waves/)

## Tech Stack

- **Three.js** (v0.170) — 3D rendering, scene management, mesh creation
- **Vite** (v6) — build tooling, dev server, HMR
- **GLSL** — custom vertex + fragment shaders for ocean and sky
- **TypeScript** — all game logic
- **Vercel** — deployment (monorepo at `tfn-games`)

## Architecture

```
src/
  main.ts      — Scene setup, camera, interaction, dolphin, animation loop
  shaders.ts   — All GLSL shaders (sky vertex/fragment, ocean vertex/fragment)
public/
  og-image.jpg — OG preview image for link sharing
index.html     — Entry point, meta tags, minimal CSS
```

The scene has three main layers:
1. **Sky dome** — `SphereGeometry(500)` with `BackSide` rendering and `depthWrite: false`, custom fragment shader for gradient, clouds, stars, sun/moon
2. **Ocean mesh** — `PlaneGeometry(200, 200, 256, 256)` rotated horizontal, custom vertex shader displaces Y with Gerstner waves + splash, custom fragment shader handles water lighting
3. **Dolphin mesh** — Procedural Three.js geometry (`CapsuleGeometry` + `ConeGeometry` + `SphereGeometry`), `MeshStandardMaterial`, animated on a parabolic jump arc

Both sky and ocean meshes follow the camera (`position.copy(camera.position)`) every frame so the scene appears infinite.

---

## Feature Breakdown

### Ocean Waves (Gerstner)

**Approach:** 7 layered Gerstner waves with different directions, wavelengths, and steepness values. Computed in the vertex shader — each vertex is displaced in XYZ.

**Key insight:** Gerstner waves displace both horizontally (X/Z) and vertically (Y), which creates the characteristic peaked crests that real ocean waves have. Simple sine waves only displace Y and look too smooth.

**Normal computation:** Finite differences — sample the wave function at 4 neighboring points (±epsilon in X and Z), compute tangent/bitangent, then cross product for the normal. This gives accurate normals for lighting even though the surface is procedurally displaced.

```glsl
vec3 px1 = position + vec3(e, 0, 0) + allWaves(position + vec3(e, 0, 0), t);
vec3 px2 = position - vec3(e, 0, 0) + allWaves(position - vec3(e, 0, 0), t);
// ... same for pz1, pz2
vec3 tangent = normalize(px1 - px2);
vec3 bitangent = normalize(pz1 - pz2);
vNormal = normalize(cross(bitangent, tangent));
```

**Performance note:** The `allWaves()` function is called 5 times per vertex (once for displacement + 4 for normals). With 256x256 = 65,536 vertices, that's 327,680 Gerstner evaluations per frame. Each evaluation sums 7 waves. This is GPU-bound and runs fine on modern hardware but could be optimized with an `allWaves` helper that returns both displacement and normals analytically.

**Evolution of the ocean approach:**
1. Started with a **fullscreen raymarched ocean** (single fragment shader, no mesh). This looked stunning — per-pixel wave evaluation with binary search refinement — but was extremely GPU-intensive and caused lag on most devices.
2. Switched to **Three.js mesh + vertex displacement**. A 256x256 `PlaneGeometry` with Gerstner wave displacement in the vertex shader. This is orders of magnitude faster because the GPU only evaluates 65K vertices instead of millions of pixels, and the fragment shader just handles lighting.
3. The mesh-based approach initially had whitecap/foam effects (`vFoam` varying based on wave height), but these were removed per design preference for cleaner waves.

### Ocean Lighting

The fragment shader implements:
- **Fresnel reflections** — `pow(1 - dot(N, V), 4)` blends between water color and reflected sky color at glancing angles
- **Specular sun/moon highlight** — `pow(dot(R, lightDir), 256)` for a tight bright spot
- **Subsurface scattering** — approximated as `pow(dot(-V, lightDir), 3) * N.y`, giving a glow where light passes through wave crests
- **Distance fog** — `1 - exp(-0.00015 * dist²)` fades to sky color at the horizon

At night, the specular shifts from warm gold `vec3(1.0, 0.9, 0.7)` to cool silver `vec3(0.7, 0.75, 0.9)`, and a second wider specular term (`pow(..., 30)`) creates a "moon path" shimmer column on the water. Rim lighting (`pow(1 - dot(N, V), 3)`) is added at night to catch wave edges in moonlight.

### Procedural Clouds

**Approach:** FBM (Fractional Brownian Motion) noise projected onto the sky dome.

**How it works:**
1. Project the ray direction onto a flat plane: `cloudUV = rd.xz / (rd.y + 0.1) * 0.3`
2. Animate drift: `cloudUV += uTime * 0.008`
3. Sample 4 octaves of value noise (FBM)
4. Threshold with `smoothstep(0.35, 0.65, cloud)` to create distinct cloud shapes
5. Fade near horizon: `cloud *= smoothstep(-0.05, 0.15, rd.y)`
6. Mix cloud color into sky color

**Horizon gap problem and fix:** Originally the sky gradient used `float t = max(rd.y, 0.0)` and clouds only rendered when `rd.y > 0.0`. Because the camera sits at Y=4 and looks slightly downward, the mathematical horizon (where `rd.y = 0`) sits above the visual horizon line where sky meets ocean. This created an ugly gap — a band of flat sky color between the clouds and the ocean surface.

The fix was threefold:
- Shift the sky gradient: `float t = max(rd.y + 0.05, 0.0)` — this lets the gradient continue 0.05 radians below the geometric horizon
- Extend cloud rendering: `if (rd.y > -0.05)` — clouds now render slightly below horizon too
- Protect the projection: `float cH = max(rd.y, 0.001)` — prevents division by zero when computing cloud UVs near the horizon (dividing by `rd.y` which approaches zero at the horizon would send cloud UVs to infinity, creating visual artifacts)

### Stars

**Problem:** Stars need to be fixed points in the sky that don't move when the camera pans.

This was the most iterated-on feature. Here's the full timeline:

**Attempt 1: Ratio-based UV projection**
```glsl
vec2 starUV = floor(rd.xz / max(rd.y, 0.01) * 300.0);
float star = step(0.997, hash(starUV));
```
**What happened:** Stars appeared in one region of the sky but when you dragged to pan the camera, they flickered/refreshed chaotically. The ratio `rd.xz / rd.y` is a 2D projection of the 3D direction — when the camera rotates, nearby ray directions shift through different grid cells rapidly, causing the hash values to jump and stars to pop in and out every frame.

**Attempt 2: Spherical coordinates with grid**
```glsl
float theta = acos(rd.y);
float phi = atan(rd.z, rd.x);
vec2 starUV = floor(vec2(phi * 100.0, theta * 100.0));
```
**What happened:** Stars were stable when panning — they didn't flicker anymore. But they were arranged in visible rows and columns. The `floor()` on evenly-spaced spherical coordinates creates a regular lat/long grid, and since each star sits at the center of its cell, the grid lines are clearly visible (especially near the zenith where meridian lines converge).

**Attempt 3: Jittered Voronoi in spherical coords**
```glsl
vec2 cell = vec2(phi * 200.0, theta * 200.0);
vec2 cellId = floor(cell);
vec2 cellF = fract(cell);
vec2 jitter = vec2(hash(cellId), hash(cellId + vec2(73.1, 19.7)));
float d = length(cellF - jitter);
float starDot = (1.0 - smoothstep(0.0, 0.08, d)) * step(0.99, hash(cellId * 1.31));
```
**What happened:** Grid pattern was gone — stars looked randomly placed. But a new problem appeared: when panning, stars flickered at cell boundaries. The `smoothstep` distance test meant that as a ray direction crossed from one grid cell to the neighbor, the star in the old cell would fade out and the star in the new cell would fade in, causing visible popping. Also, with the jitter offset, some stars would be visible in one cell but their jittered position actually placed them visually in the neighboring cell, which caused them to appear/disappear as the camera rotated.

**Attempt 4 (final): 3D direction quantization**
```glsl
vec3 starDir = normalize(rd) * 500.0;
vec3 starCell = floor(starDir);
float h = fract(sin(dot(starCell, vec3(127.1, 311.7, 74.7))) * 43758.5453);
float isStar = step(0.9925, h);
```
**Why this works:** Instead of projecting the 3D ray direction into 2D (which introduces distortion and boundary artifacts), we stay in 3D. `normalize(rd) * 500.0` maps each ray to a point on a sphere of radius 500. `floor()` quantizes to a regular 3D integer grid. Because the sphere radius is large (500), each grid cell subtends a tiny solid angle — roughly 1 pixel. The 3D hash `fract(sin(dot(...)))` is stable because `floor()` only changes when the ray direction moves past a cell boundary, and with cells this small, that corresponds to about 1 pixel of screen movement. There's still technically a grid, but at 500x resolution it's invisible — each star is exactly 1 pixel.

**No flickering** because there's no smoothstep/distance interpolation — it's a hard `step()` threshold. Either the cell hash passes or it doesn't. The ray direction for a given screen pixel is deterministic (based on camera orientation), so the same cell always gets the same hash, and the star either exists or doesn't — no fading in/out.

**Twinkle desync:** Initially all stars pulsed together because they shared the same `sin(uTime * 1.5)`. Fixed by giving each star its own speed and phase:
```glsl
float twinkle = 0.75 + 0.25 * sin(uTime * (0.5 + h * 3.0) + h * 627.3);
```
`h * 3.0` varies frequency from 0.5 to 3.5 Hz. `h * 627.3` offsets phase by a large pseudo-random amount. The `h` value is the same hash used to determine star existence, so it's unique per cell.

### Day/Night Toggle

**State:** `nightMode` (boolean) and `nightLerp` (0→1, animated).

**Animation:** Each frame: `nightLerp += (target - nightLerp) * 0.02` — smooth exponential ease toward target. Takes ~3 seconds for full transition.

**What changes with `uNight`:**
- Sky gradient: blue → dark navy
- Sun disc/glow → moon disc/glow (different world-space direction, cooler color)
- Stars: fade in proportionally with `uNight`
- Cloud color: white → dark grey
- Water base color: darker
- Specular: warm gold → cool silver
- Wider moon specular "path" on water (`pow(..., 30)`)
- Rim lighting on wave edges (only at night)
- Tone mapping exposure: 0.6 → 0.75 (slightly brighter to compensate for dark scene)
- Directional light intensity: 1.5 → 0.5
- Ambient light intensity: 0.8 → 0.4

**Light direction lerp:** The `uSunDir` uniform is shared between sky and ocean shaders. In JS, it lerps between `sunDirDay = (-0.5, 0.35, -1.0)` and `sunDirNight = (0.3, 0.25, 0.8)` — the moon is in a different part of the sky than the sun.

### Camera Panning

**Approach:** Pointer events (works for both mouse and touch) track horizontal drag delta to rotate the camera yaw.

```typescript
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastPointerX;
  lastPointerX = e.clientX;
  yaw -= dx * SENSITIVITY;
});
```

Initially the yaw was clamped to ±80° (`MAX_YAW = Math.PI * 0.45`). This felt restrictive — you couldn't look behind you. Removing the clamp and letting yaw be unbounded allows full 360° rotation.

The look-at target is computed from yaw:
```typescript
const lookX = camera.position.x + Math.sin(yaw) * lookDist;
const lookZ = camera.position.z - Math.cos(yaw) * lookDist;
camera.lookAt(lookX, 1, lookZ);
```

**Touch support:** `renderer.domElement.style.touchAction = 'none'` prevents browser scroll/zoom gestures from interfering. `setPointerCapture` ensures drag continues even if the pointer leaves the canvas. `pointercancel` handles edge cases like the browser interrupting the gesture.

**HUD hint:** A "Swipe to look around" message with a double-arrow SVG icon appears at the bottom of the screen. It fades out after 5 seconds or on first interaction (`{ once: true }`).

### Dolphin

**Mesh:** Built from Three.js primitives:
- Body: `CapsuleGeometry(0.3, 1.8)` aligned along Z axis, slightly flattened vertically with `scale(1, 0.7, 1)`
- Snout: `SphereGeometry(0.18)` scaled elongated `(1, 0.6, 1.5)`, positioned at the nose
- Dorsal fin: `ConeGeometry(0.15, 0.4)` tilted back slightly, on top of body
- Tail flukes: Two `ConeGeometry(0.08, 0.5)` cones, rotated outward and flattened `scale(1, 0.3, 1)`
- Pectoral fins: Two small `ConeGeometry(0.06, 0.35)` on sides, rotated and flattened

The current shape is recognizable as a dolphin at distance but looks rough up close — **replacing with a GLB model would be a significant visual upgrade**. The procedural approach was chosen to avoid external asset dependencies.

**Material:** `MeshStandardMaterial` with `color: 0x667788`, `metalness: 0.2`, `roughness: 0.3`, and critically `side: THREE.DoubleSide`. The `DoubleSide` is necessary because the fin and fluke geometries are very thin/flat — without it, they're invisible from one direction. The material requires scene lights to render (`AmbientLight` + `DirectionalLight` were added to the scene specifically for this).

**Jump animation:**
- **Parabolic Y:** `height * 4 * phase * (1 - phase)` — this formula gives a smooth parabola that's 0 at phase=0 and phase=1, with peak value = `height` at phase=0.5
- **XZ travel:** Linear movement along a random direction angle
- **Camera tracking:** This was the trickiest part. The camera moves forward at `CAM_SPEED = 1.5` units/second. If the dolphin just moved from its spawn point, it would quickly fall behind the camera and disappear. The fix: `camDrift = -CAM_SPEED * elapsed` is added to the dolphin's Z position, so it drifts forward at exactly the same rate as the camera.
- **Pitch rotation:** `Math.atan2(dydt, speed)` where `dydt = height * 4 * (1 - 2*phase)`. This is the derivative of the Y parabola, giving the instantaneous slope. `atan2` converts that slope into a rotation angle so the dolphin's nose follows the arc.
- **Random spawn:** 12-25 units ahead of camera (negative Z direction), ±20 units lateral (X) offset. Duration 2-3 seconds, height 3-5 units, speed 2-3.5 units/sec.
- **Random timing:** 5-15 seconds between jumps

**Splash effect:** Two shader-side effects driven by JS-computed uniforms:
1. **Vertex displacement** (`uSplashPos`, `uSplashStrength` in ocean vertex shader): Water mounds up near the dolphin using gaussian `exp(-dist² * 0.8)`, plus expanding ripple rings using `sin(dist * 8 - time * 12) * exp(-dist² * 0.3)`. The ripple term creates circular waves that expand outward from the splash point.
2. **Foam** (ocean fragment shader): White/grey foam mixed into water color using `exp(-dist² * 1.5)`. Color adapts to day/night.

Splash strength is driven by dolphin proximity to water surface: `max(0, 1 - y * 0.5)²`. This means full splash when the dolphin is at/below Y=0, diminishing as it rises, and zero when it's more than 2 units above water.

The splash position uniform is in **ocean-mesh-local coordinates** (relative to `ocean.position`), not world coordinates, because the ocean mesh moves with the camera.

---

## Critical Debugging Lessons

### The Invisible Dolphin Saga (MAJOR — hours lost)

This was the most significant debugging challenge. The dolphin mesh was completely invisible despite no console errors, no shader compilation failures, and correct-looking animation code. Here's the full timeline of what was tried and why nothing worked until the root cause was found.

**The setup:** The project has TWO versions of the scene:
1. A standalone `index.html` in the local project directory — a single self-contained file with all shaders inline, served by `python3 -m http.server`
2. A Vite-based version in the `tfn-games` repo — `src/main.ts` + `src/shaders.ts`, compiled by Vite, served by `npx vite`

All dolphin code was added to the Vite version (option 2). The preview server was running option 1.

**What was tried (all failed because they were testing the wrong file):**
1. Placed dolphin at fixed position `(0, 3, -10)` — invisible
2. Made dolphin huge (scale 5x) — invisible
3. Tried `MeshBasicMaterial` instead of `MeshStandardMaterial` — invisible
4. Added a basic red `BoxGeometry` test cube — also invisible
5. Added `depthTest: false` and `renderOrder: 999` to the test cube — still invisible
6. Changed dolphin Y to 8 (well above waves) — invisible
7. Added `side: THREE.DoubleSide` — invisible
8. Suspected sky sphere was occluding (it has `depthWrite: false` but maybe render order?) — nope
9. Suspected tone mapping was making materials invisible — nope
10. Suspected `CapsuleGeometry` didn't exist in Three.js 0.170 — it does

**The breakthrough:** After ~2 hours of debugging, checked what the dev server was actually serving. The `python3 -m http.server` was serving from the local project directory, which contained the OLD standalone `index.html`. This file has NO dolphin code — it's the original ocean-only scene. Every reload was loading the same old file, ignoring all the changes to `src/main.ts`.

**The fix:** Start the Vite dev server instead:
```json
{
  "runtimeExecutable": "bash",
  "runtimeArgs": ["-c", "cd /tmp/tfn-games/games/2026/ocean-waves && npx vite --port 8080"]
}
```

But even this had a subtlety: the `vite.config.ts` sets `base: '/2026/ocean-waves/'`, so the dev server URL is `http://localhost:8080/2026/ocean-waves/`, NOT `http://localhost:8080/`. Navigating to the wrong URL gives a 404 or serves the wrong content.

Also, passing the root directory as a CLI argument (`npx vite --port 8080 /path/to/game`) instead of `cd`-ing into it caused a different error: Vite resolved `index.html`'s reference to `/src/main.ts` relative to the CLI root, but the actual file was in the `cd` directory. The `cd` approach is required.

**The lesson:** When you have both a standalone HTML file and a Vite project, make absolutely sure your dev server is running the right one. A static HTTP server (`python -m http.server`) does NOT compile TypeScript, does NOT process `import` statements, and does NOT read `vite.config.ts`. If your code uses any of these, you MUST use the Vite dev server. And even then, watch the base path.

**How to verify which version is running:** Check the page source — if you see `<script type="module" src="/src/main.ts">` that's the Vite version. If you see a giant inline `<script>` block with all the GLSL embedded directly, that's the standalone version.

### WebGL Canvas toDataURL() Returns Blank Image

**Problem:** Needed to capture the ocean scene as a static image for OG/link preview (`og:image` meta tag). Used `canvas.toDataURL('image/png')` but got a 19KB mostly-blank grey image.

**Root cause:** WebGL canvases use double-buffering. After each frame is composited to the screen, the back buffer is cleared. By the time `toDataURL()` executes (in a separate microtask/macrotask), the buffer has already been wiped.

**Things that don't work:**
- Calling `toDataURL()` from a button click handler — still too late
- Calling `toDataURL()` in the same frame as render — timing depends on browser

**What works:**
- `gl.readPixels()` inside a `requestAnimationFrame` callback, immediately after the render call:
```javascript
requestAnimationFrame(() => {
  // renderer.render() has just completed
  const gl = canvas.getContext('webgl2');
  const pixels = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  // Flip vertically (WebGL is bottom-up) and draw to 2D canvas
  // Then export from 2D canvas
});
```
- Or create the renderer with `preserveDrawingBuffer: true` — this prevents the automatic buffer clear, so `toDataURL()` works at any time. But this has a performance cost (GPU can't reuse the buffer).

**Final approach:** Used the preview tool's screenshot feature to capture the frame, then processed it with `sips` (macOS image tool) to resize to 1200x900 and compress.

### Star Rendering: The Full Journey

See the Stars section above for the complete 4-attempt timeline. The key technical insights:

**Why 2D projections cause flickering:** Any projection from 3D ray direction to 2D UV space (whether `rd.xz/rd.y` or `theta/phi`) creates a mapping where small changes in 3D direction can cause large jumps in 2D UV. Specifically, near the boundaries of `floor()` cells, a tiny camera rotation shifts the UV across the cell boundary, changing the cell ID and thus the hash — so the star suddenly appears or disappears.

**Why 3D quantization is stable:** `floor(normalize(rd) * 500)` maps to a 3D integer grid. Small camera rotations change the ray direction smoothly, and at 500x resolution, the cell boundaries are so close together (subtending ~0.1°) that crossing one only changes 1 pixel. There's no magnification or distortion — every direction gets the same grid density. The star either exists in a cell or it doesn't, with no interpolation, so there's no partial visibility that could cause flickering.

**Why jittering made flickering worse:** Jittered Voronoi tests `distance(fract(cell), jitterOffset) < threshold`. When the camera rotates, `fract(cell)` changes smoothly but wraps at cell boundaries. At the wrap point, the distance to the jittered star position jumps discontinuously, causing the `smoothstep` to flip — the star pops in/out.

---

## Monorepo Integration

This game lives in the `tfn-games` monorepo:
- Source: `games/2026/ocean-waves/`
- Built output: `dist/2026/ocean-waves/`
- Build script: `"build:2026-ocean-waves": "cd games/2026/ocean-waves && npm install && npm run build"`
- Vercel rewrite: `"/2026/ocean-waves/(.*)" → "/2026/ocean-waves/index.html"`

The root `package.json` chains all game builds: `build:active` runs cannon-fire, flags, and ocean-waves sequentially.

## Local Development

```bash
cd games/2026/ocean-waves
npm install
npm run dev
# Opens at http://localhost:5173/2026/ocean-waves/
```

**Important:** The URL includes the base path `/2026/ocean-waves/`. Navigating to just `localhost:5173` will 404.

## Future Improvements

- **Dolphin GLB model** — Replace procedural geometry with a proper 3D model for realistic dolphin shape. The current capsule+cones approach looks like "a sad weird grey tube with spikes" up close.
- **Multiple dolphins** — Pod of 2-3 jumping together
- **Sound** — Ocean ambient, splash sounds, whale song at night
- **Underwater view** — Tilt camera below water surface for a different perspective
- **Fog/mist** — Low-lying fog at the horizon for atmosphere
- **Sunset/sunrise** — Animated time-of-day cycle instead of instant toggle
- **Wave interaction** — Click/tap to create ripples
- **Analytical normals** — Compute Gerstner wave normals analytically instead of with finite differences, reducing vertex shader cost by ~4x
