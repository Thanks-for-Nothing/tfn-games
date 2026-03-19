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

### Ocean Lighting

The fragment shader implements:
- **Fresnel reflections** — `pow(1 - dot(N, V), 4)` blends between water color and reflected sky color at glancing angles
- **Specular sun/moon highlight** — `pow(dot(R, lightDir), 256)` for a tight bright spot
- **Subsurface scattering** — approximated as `pow(dot(-V, lightDir), 3) * N.y`, giving a glow where light passes through wave crests
- **Distance fog** — `1 - exp(-0.00015 * dist²)` fades to sky color at the horizon

### Procedural Clouds

**Approach:** FBM (Fractional Brownian Motion) noise projected onto the sky dome.

**How it works:**
1. Project the ray direction onto a flat plane: `cloudUV = rd.xz / (rd.y + 0.1) * 0.3`
2. Animate drift: `cloudUV += uTime * 0.008`
3. Sample 4 octaves of value noise (FBM)
4. Threshold with `smoothstep(0.35, 0.65, cloud)` to create distinct cloud shapes
5. Fade near horizon: `cloud *= smoothstep(-0.05, 0.15, rd.y)`
6. Mix cloud color into sky color

**Horizon gap fix:** Originally clouds only rendered above `rd.y > 0`, causing a visible seam between sky and ocean. Fixed by:
- Extending the sky gradient below horizon: `float t = max(rd.y + 0.05, 0.0)`
- Rendering clouds down to `rd.y > -0.05`
- Using `max(rd.y, 0.001)` for the cloud UV projection denominator to avoid division by zero

### Stars

**Problem:** Stars need to be fixed points in the sky that don't move when the camera pans.

**Failed approaches:**
1. **`rd.xz / rd.y` projection** — Stars flicker/swim when panning because the ratio changes discontinuously at cell boundaries
2. **Spherical coordinates (theta/phi) with grid** — Stars appear in visible grid lines due to `floor()` quantization of the spherical coordinates
3. **Jittered Voronoi in spherical coords** — Better randomness but still flickered at cell boundaries during panning, and the smoothstep distance test caused stars to pop in/out

**Working solution:** Quantize the 3D ray direction directly:
```glsl
vec3 starDir = normalize(rd) * 500.0;
vec3 starCell = floor(starDir);
float h = fract(sin(dot(starCell, vec3(127.1, 311.7, 74.7))) * 43758.5453);
float isStar = step(0.9925, h);
```

This works because `normalize(rd) * 500.0` maps each ray direction to a point on a sphere of radius 500, then `floor()` quantizes to a 3D grid. The grid cells are very small at that scale, so each cell maps to roughly one pixel. The hash of the cell ID determines if that cell contains a star. Since the quantization is in world-space 3D (not screen-space), the stars don't move when the camera pans.

**Twinkle:** Each star gets its own random speed and phase offset:
```glsl
float twinkle = 0.75 + 0.25 * sin(uTime * (0.5 + h * 3.0) + h * 627.3);
```
The `h * 3.0` varies the speed (0.5x to 3.5x), and `h * 627.3` offsets the phase so stars don't pulse in sync.

### Day/Night Toggle

**State:** `nightMode` (boolean) and `nightLerp` (0→1, animated).

**Animation:** Each frame: `nightLerp += (target - nightLerp) * 0.02` — smooth exponential ease toward target. Takes ~3 seconds for full transition.

**What changes with `uNight`:**
- Sky gradient: blue → dark navy
- Sun disc/glow → moon disc/glow (different position, cooler color)
- Stars: fade in with `uNight`
- Cloud color: white → dark grey
- Water base color: darker
- Specular: warm gold → cool silver
- Wider moon specular "path" on water
- Rim lighting on wave edges (only at night)
- Tone mapping exposure: 0.6 → 0.75 (slightly brighter to compensate)
- Directional light intensity dims

**Moon path:** A second, wider specular term (`pow(..., 30)`) creates a realistic shimmer column on the water pointing toward the moon.

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

The yaw is unclamped — you can spin 360°. The look-at target is computed from yaw:
```typescript
const lookX = camera.position.x + Math.sin(yaw) * lookDist;
const lookZ = camera.position.z - Math.cos(yaw) * lookDist;
camera.lookAt(lookX, 1, lookZ);
```

**Touch support:** `renderer.domElement.style.touchAction = 'none'` prevents browser scroll/zoom gestures from interfering. `setPointerCapture` ensures drag continues even if the pointer leaves the canvas.

### Dolphin

**Mesh:** Built from Three.js primitives:
- Body: `CapsuleGeometry` aligned along Z, slightly flattened vertically
- Snout: `SphereGeometry` scaled elongated, positioned at nose
- Dorsal fin: `ConeGeometry` on top
- Tail flukes: Two `ConeGeometry` cones, rotated and flattened
- Pectoral fins: Two small `ConeGeometry` on sides

The current shape is functional but not beautiful — **replacing with a GLB model would be a significant visual upgrade**.

**Material:** `MeshStandardMaterial` with `side: DoubleSide` (needed because some faces are thin/flat). Requires scene lights (`AmbientLight` + `DirectionalLight`).

**Jump animation:**
- Parabolic Y: `height * 4 * phase * (1 - phase)` — smooth arc, 0 at start/end, peak at midpoint
- XZ: Linear travel along a random direction
- Camera tracking: The dolphin also drifts forward at camera speed (`-CAM_SPEED * elapsed`) so it doesn't fall behind as the camera moves
- Pitch rotation: `Math.atan2(dydt, speed)` — nose points along the arc tangent
- Random spawn: 12-25 units ahead of camera, ±20 units lateral offset
- Random timing: 5-15 seconds between jumps

**Splash effect:** Two parts:
1. **Vertex displacement** in ocean shader: Water mounds up near the dolphin position using gaussian `exp(-dist² * 0.8)`, plus ripple rings using `sin(dist * 8 - time * 12) * exp(-dist² * 0.3)`
2. **Foam** in ocean fragment shader: White/grey foam mixed into water color using gaussian falloff from splash position

Splash strength is driven by how close the dolphin is to Y=0 (water surface): `max(0, 1 - y * 0.5)²`

---

## Critical Debugging Lessons

### Preview Server Mismatch (MAJOR)

**Problem:** The dolphin mesh was invisible despite no errors. Spent significant time debugging depth testing, render order, material types, and positioning — none of which was the actual issue.

**Root cause:** The preview dev server (`python3 -m http.server`) was serving the **standalone local `index.html`** file, which is a separate self-contained copy of the scene that does NOT include the dolphin code. All dolphin changes were in `src/main.ts` and `src/shaders.ts`, which are compiled by Vite. The static HTTP server serves raw files — it doesn't run Vite's build pipeline.

**Fix:** Switch to the Vite dev server. The launch config needed to run Vite from the correct working directory:
```json
{
  "runtimeExecutable": "bash",
  "runtimeArgs": ["-c", "cd /tmp/tfn-games/games/2026/ocean-waves && npx vite --port 8080"]
}
```

**Key learning:** The `vite.config.ts` sets `base: '/2026/ocean-waves/'`, so the dev server URL is `http://localhost:8080/2026/ocean-waves/`, NOT just `http://localhost:8080/`. If you pass the root directory as a CLI argument to Vite instead of cd-ing into it, the `index.html` references to `/src/main.ts` resolve to the wrong path.

### WebGL Canvas toDataURL() Returns Blank

**Problem:** Tried to capture the ocean scene as an OG preview image using `canvas.toDataURL()`, but got a blank/grey image.

**Root cause:** WebGL canvases clear their drawing buffer after compositing by default. By the time JavaScript calls `toDataURL()`, the buffer has already been cleared.

**Fix:** Used `requestAnimationFrame` callback to call `gl.readPixels()` immediately after a render, then drew the pixels onto a 2D canvas for export. Alternatively, creating the renderer with `preserveDrawingBuffer: true` would also work but has a performance cost.

### MeshStandardMaterial Invisible in Custom Shader Scene

**Problem:** Objects using `MeshStandardMaterial` or `MeshBasicMaterial` were completely invisible in the scene, even with `depthTest: false`.

**Root cause:** This was actually the preview server mismatch issue above — the materials work fine when served through Vite. However, `MeshStandardMaterial` does require proper scene lighting (`AmbientLight` + `DirectionalLight`) to be visible. Without lights, standard materials render black.

### Star Grid Pattern

**Problem:** Stars appeared in visible rows/columns instead of randomly scattered.

**Root cause:** Using `floor()` on evenly-spaced coordinates (whether 2D spherical or 3D cartesian) creates a regular grid. Each star is placed at the center of its grid cell, making the grid pattern visible.

**Attempted fix:** Jittered Voronoi — offset each star's position within its cell by a hash-based random offset. This helped but introduced flickering at cell boundaries during panning.

**Final fix:** Used a much higher grid resolution (500x) with `step(0.9925, hash)` to make only ~0.75% of cells contain stars. At this density and resolution, the grid pattern is invisible to the eye.

---

## Monorepo Integration

This game lives in the `tfn-games` monorepo:
- Source: `games/2026/ocean-waves/`
- Built output: `dist/2026/ocean-waves/`
- Build script: `"build:2026-ocean-waves": "cd games/2026/ocean-waves && npm install && npm run build"`
- Vercel rewrite: `"/2026/ocean-waves/(.*)" → "/2026/ocean-waves/index.html"`

## Local Development

```bash
cd games/2026/ocean-waves
npm install
npm run dev
# Opens at http://localhost:5173/2026/ocean-waves/
```

## Future Improvements

- **Dolphin GLB model** — Replace procedural geometry with a proper 3D model for realistic dolphin shape
- **Multiple dolphins** — Pod of 2-3 jumping together
- **Sound** — Ocean ambient, splash sounds, whale song at night
- **Underwater view** — Tilt camera below water surface for a different perspective
- **Fog/mist** — Low-lying fog at the horizon for atmosphere
- **Sunset/sunrise** — Animated time-of-day cycle instead of instant toggle
- **Wave interaction** — Click/tap to create ripples
