export const MESH_GRADIENT_FRAGMENT = /* glsl */ `
uniform vec3 uBase;       // OKLab
uniform vec3 uColors[4];  // OKLab
uniform float uIntensity;
uniform float uGrain;
uniform float uLight;     // 0 dark canvas, 1 light canvas
uniform vec3 uPointer;    // uv (y up), strength

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
  float t = uTime * 0.045;

  // Two octaves of slow warp: the field folds like heavy silk rather than wobbling.
  vec2 warp = vec2(snoise(vec3(p * 0.8, t)), snoise(vec3(p * 0.8 + 11.3, t + 3.7)));
  warp += 0.35 * vec2(snoise(vec3(p * 1.9 + 4.1, t * 1.6)), snoise(vec3(p * 1.9 + 21.7, t * 1.6)));
  p += warp * 0.19;

  // Pointer: the field leans gently toward the cursor.
  vec2 pp = vec2((uPointer.x - 0.5) * aspect, uPointer.y - 0.5);
  vec2 dp = p - pp;
  p -= dp * 0.28 * uPointer.z * exp(-dot(dp, dp) * 3.0);

  // Four color masses drifting on incommensurate Lissajous paths, so the
  // composition never visibly repeats.
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  float cover = 0.0;
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 c = vec2(
      sin(t * (0.83 + 0.19 * fi) + fi * 1.7) * 0.36 * aspect,
      cos(t * (0.61 + 0.23 * fi) + fi * 2.6) * 0.3);
    vec2 d = p - c;
    float w = exp(-dot(d, d) * (3.6 + 0.9 * fi));
    // Squared weights keep each hue distinct where it dominates instead of averaging to gray-violet.
    acc += uColors[i] * w * w;
    wsum += w * w;
    cover += w;
  }
  vec3 ink = acc / max(wsum, 1e-4);
  // On light canvases the same hues become airy washes: lighter, less chroma.
  ink = vec3(mix(ink.x, max(ink.x, 0.8), uLight * 0.7), ink.yz * mix(1.0, 0.72, uLight));
  cover = smoothstep(0.08, 1.15, cover) * clamp(uIntensity, 0.0, 1.5) * 0.92;

  vec3 lab = mix(uBase, ink, clamp(cover, 0.0, 1.0));

  // Sheen: a faint lightness ripple across the folds.
  lab.x += 0.025 * snoise(vec3(p * 1.4 + warp, t * 1.3)) * cover;

  // Film grain on lightness only, so it reads as texture, not color noise.
  float g = hash12(gl_FragCoord.xy + fract(uTime * 3.7) * vec2(419.0, 173.0)) - 0.5;
  lab.x += g * uGrain * 0.045;

  emit(lab);
}
`
