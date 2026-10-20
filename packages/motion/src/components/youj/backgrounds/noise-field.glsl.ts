export const NOISE_FIELD_FRAGMENT = /* glsl */ `
uniform vec3 uBase;    // OKLab
uniform vec3 uInk;     // OKLab, contour lines
uniform vec3 uAccent;  // OKLab, summit tint
uniform float uIntensity;
uniform float uDensity;  // contour intervals across the height range
uniform vec3 uPointer;   // device px (y up), strength
uniform float uOctaves;  // 3, or 2 on the low motion-budget tier

float fbm(vec3 p) {
  // Three octaves with a steep falloff: broad landforms, little noise. More reads as static.
  float s = 0.0;
  float a = 0.6;
  for (int i = 0; i < 3; i++) {
    if (float(i) >= uOctaves) break;
    s += a * snoise(p);
    p = p * 1.9 + vec3(17.1, 3.7, 0.0);
    a *= 0.38;
  }
  return s;
}

// Distance (device px) from the nearest iso-line of v, via screen-space derivatives.
float isoline(float v, float widthPx) {
  float d = abs(fract(v - 0.5) - 0.5) / max(fwidth(v), 1e-4);
  return 1.0 - smoothstep(widthPx * 0.5 - 0.5, widthPx * 0.5 + 0.5, d);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float unit = uResolution.y;
  vec2 p = (frag - 0.5 * uResolution) / unit * 0.75;
  float t = uTime * 0.03;

  // Domain warp (Quilez): terrain whose ridges flow instead of translating.
  vec2 q = vec2(fbm(vec3(p, t)), fbm(vec3(p + vec2(5.2, 1.3), t)));
  vec2 r = vec2(
    fbm(vec3(p + 0.9 * q + vec2(1.7, 9.2), t * 1.4)),
    fbm(vec3(p + 0.9 * q + vec2(8.3, 2.8), t * 1.4)));
  float h = 0.5 + 0.6 * fbm(vec3(p + 0.8 * r, t * 0.8));

  // Pointer raises a smooth survey mound: contours bunch up around the cursor.
  vec2 dp = (frag - uPointer.xy) / unit;
  float mound = exp(-dot(dp, dp) * 22.0) * uPointer.z;
  h += 0.16 * mound;

  float v = h * uDensity;
  float index = floor(v + 0.5);
  bool major = mod(index, 5.0) < 0.5;
  float line = isoline(v, (major ? 1.6 : 1.0) * uDpr);

  // Summits (upper band of the height range) carry the accent; the rest is ink.
  float summit = smoothstep(0.62, 0.86, h);
  float lineAlpha = (major ? 0.42 : 0.2) * uIntensity * (1.0 + summit * 0.7);
  vec3 lineCol = mix(uInk, uAccent, summit * 0.85);

  // Vignette keeps the edges quiet so the field frames content rather than competing.
  vec2 uv = frag / uResolution;
  float vig = smoothstep(0.0, 0.35, uv.x) * smoothstep(1.0, 0.65, uv.x) * smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);
  vig = mix(0.35, 1.0, vig);

  // Fill: a whisper of elevation shading plus a soft accent glow on summits.
  vec3 lab = uBase;
  lab = mix(lab, uAccent, summit * 0.07 * uIntensity * vig);
  lab.x += (h - 0.5) * 0.02 * uIntensity;

  lab = mix(lab, lineCol, clamp(line * lineAlpha * vig + line * mound * 0.35, 0.0, 1.0));

  // Survey marks: tiny crosses on a fixed grid, the only rigid element in the field.
  float cell = 96.0 * uDpr;
  vec2 g = abs(mod(frag + 0.5 * cell, cell) - 0.5 * cell);
  float arm = 4.0 * uDpr;
  float tick = (step(g.x, 0.5 * uDpr) * step(g.y, arm) + step(g.y, 0.5 * uDpr) * step(g.x, arm));
  lab = mix(lab, uInk, clamp(tick, 0.0, 1.0) * 0.18 * uIntensity * vig);

  emit(lab);
}
`
