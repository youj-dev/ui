/* VoiceOrb's shaders: one attribute-less full-screen triangle, and a fragment
 * that draws a clean, lit sphere with a calm inner flow of accent tints, a
 * soft halo, and the rings that carry the sound, in premultiplied alpha. */

export const ORB_VERTEX = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`

export const ORB_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 uResolution; // device px
uniform float uFlow;      // the inner flow's phase: time × the state's flow rate
uniform vec3 uInk[4];     // linear RGB: the accent's light tint, the accent, its deep shade, one supporting ink
uniform float uLight;     // 1 on a light page, 0 on a dark one
uniform vec4 uShape;      // x radius (canvas units, -1..1), y inner swirl, z halo, w muted
uniform vec4 uRings[4];   // per ring: radius, alpha, width
uniform float uLevel;     // 0–1
out vec4 fragColor;

// --- noise (simplex: Ashima Arts / Stefan Gustavson, MIT) ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  vec3 ns = 0.142857142857 * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Interleaved gradient noise, for a ±1 LSB dither against banding in the glow.
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 p = (gl_FragCoord.xy / uResolution) * 2.0 - 1.0;
  float px = 2.0 / uResolution.x;
  float r = length(p);
  float R = uShape.x;
  float body = smoothstep(R + px, R - px, r);

  // Inside: a sphere lit from the top left, its accent running from a light tint to a deep
  // shade, with a slow, broad flow through it. While thinking, the flow twists by depth.
  vec2 q = p / R;
  float q2 = min(dot(q, q), 1.0);
  float z = sqrt(1.0 - q2);
  vec3 n = vec3(q, z);
  vec2 sq = rot(uFlow * 0.35 + uShape.y * (1.0 - q2) * 2.2) * q;
  vec3 s = vec3(sq, z) * 0.6;
  float f1 = snoise(s + vec3(0.0, 0.0, uFlow * 0.2));
  float f2 = snoise(s * 1.4 + vec3(4.1, 2.3, -uFlow * 0.16));
  float g = clamp(0.5 + dot(q, vec2(-0.5, 0.6)) * 0.42 + f1 * 0.2, 0.0, 1.0);
  vec3 col = mix(uInk[2], uInk[1], smoothstep(0.05, 0.6, g));
  col = mix(col, uInk[0], smoothstep(0.55, 1.0, g));
  col = mix(col, uInk[3], smoothstep(0.25, 0.85, f2) * 0.3);
  col = mix(col, uInk[0], uShape.y * 0.35 * smoothstep(0.1, 0.7, snoise(vec3(sq * 1.3, uFlow * 0.25))));

  vec3 L = normalize(vec3(-0.45, 0.6, 0.75));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float fres = pow(1.0 - z, 3.0);
  float spec = pow(clamp(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0, 1.0), 36.0);
  vec3 lit = col * (0.68 + 0.38 * diff) + uInk[0] * fres * (0.55 - 0.25 * uLight) + vec3(spec) * 0.22 + uInk[0] * (1.0 - q2) * uLevel * 0.22;
  float gray = dot(lit, vec3(0.2126, 0.7152, 0.0722));
  lit = mix(lit, vec3(gray), uShape.w * 0.7) * (1.0 - uShape.w * 0.15);

  // Outside: a soft halo, and the rings that carry the sound.
  float outside = max(r - R, 0.0);
  float halo = exp(-outside * 12.0) * uShape.z * (0.3 + 0.45 * uLevel) * (1.0 - 0.45 * uLight);
  float ring = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 k = uRings[i];
    float d = (r - k.x) / max(k.z, 1e-3);
    ring += k.y * exp(-d * d);
  }
  float a = (halo + ring * (0.55 - 0.15 * uLight)) * (1.0 - body) * smoothstep(1.0, 0.86, r);
  a = max(a + (ign(gl_FragCoord.xy) - 0.5) / 255.0 * step(0.002, a), 0.0);
  vec3 tone = toSrgb(mix(uInk[1], uInk[0], 0.45 - 0.35 * uLight));
  fragColor = vec4(toSrgb(lit) * body + tone * a, body + a);
}
`
