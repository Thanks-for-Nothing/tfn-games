export const skyVertexShader = `
varying vec3 vWorldDir;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldDir = wp.xyz - cameraPosition;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const skyFragmentShader = `
uniform vec3 uSunDir;
varying vec3 vWorldDir;
void main() {
  vec3 rd = normalize(vWorldDir);
  float t = max(rd.y, 0.0);
  vec3 col = mix(vec3(0.55, 0.7, 0.85), vec3(0.05, 0.15, 0.4), pow(t, 0.5));
  float sun = clamp(dot(rd, uSunDir), 0.0, 1.0);
  col += vec3(1.0, 0.9, 0.7) * pow(sun, 256.0) * 1.5;
  col += vec3(1.0, 0.9, 0.7) * pow(sun, 8.0) * 0.15;
  col += vec3(0.4, 0.25, 0.1) * pow(sun, 3.0) * smoothstep(-0.02, 0.1, rd.y) * 0.3;
  gl_FragColor = vec4(col, 1.0);
}`;

export const oceanVertexShader = `
uniform float uTime;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vFoam;

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
  vFoam = max(0.0, displacement.y * 1.5 - 0.6);

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
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vFoam;

vec3 sky(vec3 rd) {
  float t = max(rd.y, 0.0);
  vec3 col = mix(vec3(0.55, 0.7, 0.85), vec3(0.05, 0.15, 0.4), pow(t, 0.5));
  float sun = clamp(dot(rd, uSunDir), 0.0, 1.0);
  col += vec3(1.0, 0.9, 0.7) * pow(sun, 256.0) * 1.5;
  col += vec3(1.0, 0.9, 0.7) * pow(sun, 8.0) * 0.15;
  return col;
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCamPos - vWorldPos);
  vec3 R = reflect(-V, N);

  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);
  fresnel = mix(0.04, 1.0, fresnel);

  vec3 reflColor = sky(R);
  float spec = pow(max(dot(R, uSunDir), 0.0), 256.0);
  float sss = pow(max(dot(-V, uSunDir), 0.0), 3.0) * max(N.y, 0.0);
  vec3 scatter = vec3(0.0, 0.15, 0.12) * sss;
  vec3 waterCol = vec3(0.0, 0.04, 0.12) + scatter * 0.8;

  vec3 col = mix(waterCol, reflColor, fresnel);
  col += vec3(1.0, 0.9, 0.7) * spec * 2.0;
  col += scatter * 0.3;

  col = mix(col, vec3(0.8, 0.85, 0.9), smoothstep(0.0, 0.5, vFoam) * 0.5);

  float dist = length(vWorldPos - uCamPos);
  float fog = 1.0 - exp(-0.00015 * dist * dist);
  vec3 fogCol = sky(normalize(vWorldPos - uCamPos));
  col = mix(col, fogCol, fog);

  gl_FragColor = vec4(col, 1.0);
}`;
