export const skyVertexShader = `
varying vec3 vWorldDir;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldDir = wp.xyz - cameraPosition;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const skyFragmentShader = `
uniform vec3 uSunDir;
uniform float uNight;
uniform float uTime;
varying vec3 vWorldDir;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 rd = normalize(vWorldDir);
  // Allow sky gradient to continue slightly below horizon
  float t = max(rd.y + 0.05, 0.0);

  // Day sky gradient
  vec3 dayCol = mix(vec3(0.55, 0.7, 0.85), vec3(0.05, 0.15, 0.4), pow(t, 0.5));
  // Night sky gradient
  vec3 nightCol = mix(vec3(0.03, 0.04, 0.1), vec3(0.01, 0.01, 0.04), pow(t, 0.3));
  vec3 col = mix(dayCol, nightCol, uNight);

  // Sun (day)
  float sun = clamp(dot(rd, uSunDir), 0.0, 1.0);
  float dayFactor = 1.0 - uNight;
  col += vec3(1.0, 0.9, 0.7) * pow(sun, 256.0) * 1.5 * dayFactor;
  col += vec3(1.0, 0.9, 0.7) * pow(sun, 8.0) * 0.15 * dayFactor;
  col += vec3(0.4, 0.25, 0.1) * pow(sun, 3.0) * smoothstep(-0.05, 0.1, rd.y) * 0.3 * dayFactor;

  // Moon (night)
  float moon = clamp(dot(rd, uSunDir), 0.0, 1.0);
  col += vec3(0.9, 0.92, 1.0) * pow(moon, 400.0) * 2.0 * uNight;
  col += vec3(0.2, 0.25, 0.4) * pow(moon, 6.0) * 0.2 * uNight;

  // Stars (night only) — 3D direction hash, no grid artifacts
  if (rd.y > 0.01) {
    // Quantize direction on the unit sphere at a fixed resolution
    vec3 starDir = normalize(rd) * 500.0;
    vec3 starCell = floor(starDir);
    float h = fract(sin(dot(starCell, vec3(127.1, 311.7, 74.7))) * 43758.5453);
    float isStar = step(0.9925, h);
    float twinkle = 0.75 + 0.25 * sin(uTime * (0.5 + h * 3.0) + h * 627.3);
    float brightness = fract(h * 17.3) * 0.6 + 0.4;
    col += vec3(isStar * twinkle * brightness) * uNight * smoothstep(0.01, 0.1, rd.y);
  }

  // Clouds — extend slightly below horizon
  if (rd.y > -0.05) {
    float cH = max(rd.y, 0.001);
    vec2 cloudUV = rd.xz / (cH + 0.1) * 0.3;
    cloudUV += uTime * 0.008;
    float cloud = fbm(cloudUV * 3.0);
    cloud = smoothstep(0.35, 0.65, cloud);
    cloud *= smoothstep(-0.05, 0.15, rd.y);

    vec3 dayCloud = vec3(0.95, 0.95, 0.97);
    vec3 nightCloud = vec3(0.08, 0.08, 0.14);
    vec3 cloudCol = mix(dayCloud, nightCloud, uNight);
    col = mix(col, cloudCol, cloud * 0.55);
  }

  gl_FragColor = vec4(col, 1.0);
}`;

export const oceanVertexShader = `
uniform float uTime;
varying vec3 vWorldPos;
varying vec3 vNormal;

vec3 gerstner(vec3 pos, vec2 dir, float steepness, float wavelength, float t) {
  float k = 6.28318 / wavelength;
  float c = sqrt(9.81 / k);
  float f = k * (dot(dir, pos.xz) - c * t);
  float a = steepness / k;
  return vec3(dir.x * a * cos(f), a * sin(f), dir.y * a * cos(f));
}

vec3 allWaves(vec3 p, float t) {
  vec3 d = vec3(0.0);
  d += gerstner(p, normalize(vec2(1.0, 0.6)), 0.25, 20.0, t);
  d += gerstner(p, normalize(vec2(0.3, 1.0)), 0.2, 14.0, t * 1.1);
  d += gerstner(p, normalize(vec2(-0.5, 0.7)), 0.15, 9.0, t * 0.9);
  d += gerstner(p, normalize(vec2(0.8, -0.3)), 0.12, 6.0, t * 1.2);
  d += gerstner(p, normalize(vec2(-0.2, -0.8)), 0.1, 4.0, t * 1.05);
  d += gerstner(p, normalize(vec2(0.6, 0.2)), 0.08, 2.5, t * 1.3);
  d += gerstner(p, normalize(vec2(-0.7, 0.5)), 0.06, 1.8, t * 0.95);
  return d;
}

void main() {
  float t = uTime;
  vec3 p = position;
  vec3 displacement = allWaves(p, t);
  p += displacement;
  float e = 0.2;
  vec3 px1 = position + vec3(e, 0.0, 0.0) + allWaves(position + vec3(e, 0.0, 0.0), t);
  vec3 px2 = position - vec3(e, 0.0, 0.0) + allWaves(position - vec3(e, 0.0, 0.0), t);
  vec3 pz1 = position + vec3(0.0, 0.0, e) + allWaves(position + vec3(0.0, 0.0, e), t);
  vec3 pz2 = position - vec3(0.0, 0.0, e) + allWaves(position - vec3(0.0, 0.0, e), t);

  vec3 tangent = normalize(px1 - px2);
  vec3 bitangent = normalize(pz1 - pz2);
  vNormal = normalize(cross(bitangent, tangent));

  vWorldPos = (modelMatrix * vec4(p, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

export const oceanFragmentShader = `
uniform vec3 uSunDir;
uniform vec3 uCamPos;
uniform float uNight;
varying vec3 vWorldPos;
varying vec3 vNormal;

vec3 sky(vec3 rd) {
  float t = max(rd.y, 0.0);
  vec3 dayCol = mix(vec3(0.55, 0.7, 0.85), vec3(0.05, 0.15, 0.4), pow(t, 0.5));
  vec3 nightCol = mix(vec3(0.03, 0.04, 0.1), vec3(0.01, 0.01, 0.04), pow(t, 0.3));
  vec3 col = mix(dayCol, nightCol, uNight);

  float sun = clamp(dot(rd, uSunDir), 0.0, 1.0);
  float dayFactor = 1.0 - uNight;
  col += vec3(1.0, 0.9, 0.7) * pow(sun, 256.0) * 1.5 * dayFactor;
  col += vec3(1.0, 0.9, 0.7) * pow(sun, 8.0) * 0.15 * dayFactor;
  col += vec3(0.8, 0.85, 0.95) * pow(sun, 512.0) * 1.2 * uNight;
  col += vec3(0.3, 0.35, 0.5) * pow(sun, 12.0) * 0.1 * uNight;
  return col;
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCamPos - vWorldPos);
  vec3 R = reflect(-V, N);

  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);
  fresnel = mix(0.04, 1.0, fresnel);

  vec3 reflColor = sky(R);

  // Day: tight sun specular. Night: wider moon path + tight highlight
  float daySpec = pow(max(dot(R, uSunDir), 0.0), 256.0);
  float nightSpecTight = pow(max(dot(R, uSunDir), 0.0), 200.0);
  float nightSpecWide = pow(max(dot(R, uSunDir), 0.0), 30.0);
  float spec = mix(daySpec, nightSpecTight, uNight);

  float sss = pow(max(dot(-V, uSunDir), 0.0), 3.0) * max(N.y, 0.0);

  vec3 dayScatter = vec3(0.0, 0.15, 0.12);
  vec3 nightScatter = vec3(0.0, 0.04, 0.06);
  vec3 scatter = mix(dayScatter, nightScatter, uNight) * sss;

  vec3 dayWater = vec3(0.0, 0.04, 0.12);
  vec3 nightWater = vec3(0.0, 0.01, 0.03);
  vec3 waterCol = mix(dayWater, nightWater, uNight) + scatter * 0.8;

  vec3 col = mix(waterCol, reflColor, fresnel);

  vec3 daySpecCol = vec3(1.0, 0.9, 0.7);
  vec3 nightSpecCol = vec3(0.7, 0.75, 0.9);
  col += mix(daySpecCol, nightSpecCol, uNight) * spec * 2.0;

  // Moon path — wide shimmer on water at night
  col += vec3(0.15, 0.18, 0.25) * nightSpecWide * uNight;

  // Rim lighting at night — catch wave edges
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col += vec3(0.06, 0.08, 0.12) * rim * uNight;

  col += scatter * 0.3;

  float dist = length(vWorldPos - uCamPos);
  float fog = 1.0 - exp(-0.00015 * dist * dist);
  vec3 fogCol = sky(normalize(vWorldPos - uCamPos));
  col = mix(col, fogCol, fog);

  gl_FragColor = vec4(col, 1.0);
}`;
