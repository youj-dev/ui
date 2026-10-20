/* The Atmosphere scenes: four painted, grainy grounds for a card to float on, each one fragment shader on the
 * shared prelude (noise, OKLab, dither). Every scene reads the same uniforms: five OKLab colors for the mode
 * (their roles are each scene's own, listed in atmosphere.tsx), whether the page is dark, and the grain. Light
 * falls from the top left; the middle, where a card sits, is the quietest part of each composition. */

const SHARED = /* glsl */ `
uniform vec3 uPalette[5]; // OKLab, the scene's colors for the mode
uniform float uDark;      // 1 on a dark page
uniform float uGrain;     // 0–1

// Film grain on lightness: a fresh pattern each frame while the clock runs, one still pattern when it doesn't.
float grainAt(vec2 fc) {
  return hash12(fc + fract(uTime * 3.7) * vec2(419.0, 173.0)) - 0.5;
}

// Centred, aspect-correct position (height 1), y up.
vec2 field(out vec2 uv) {
  uv = gl_FragCoord.xy / uResolution;
  return vec2((uv.x - 0.5) * uResolution.x / uResolution.y, uv.y - 0.5);
}

// How far a point is from the quiet middle: 0 there, 1 toward the edges.
float edge(vec2 p) {
  return smoothstep(0.12, 0.7, length(p * vec2(0.75, 1.1)));
}
`

/** Meadow: a meadow under sky, panned so it streaks. Palette: sky, haze, grass, deep, glint. */
export const ATMOSPHERE_MEADOW = /* glsl */ `${SHARED}
void main() {
  vec2 uv;
  vec2 p = field(uv);
  float t = uTime;

  // The pan: streaks run along d, rising to the right; q runs across them (+ toward the sky in the top left).
  vec2 d = vec2(0.848, 0.530);
  vec2 n = vec2(-d.y, d.x);
  float s = dot(p, d) - t * 0.011;
  float q = dot(p, n);

  // Long along the pan, fine across it: three octaves of streak.
  float a = snoise(vec2(s * 0.5, q * 6.5));
  float b = snoise(vec2(s * 1.2 + 4.1, q * 17.0 + 1.3));
  float c = snoise(vec2(s * 2.5 + 9.7, q * 43.0 + 7.9));
  float streak = 0.55 * a + 0.3 * b + 0.15 * c;
  float calm = mix(0.6, 1.0, edge(p));
  // Broad drifts of color along the pan: stretches of sunlit field and of shade.
  float drift = snoise(vec2(s * 0.22 + 7.0, q * 1.6));

  // The horizon: a band across the pan, frayed by long streaks of its own so grass and sky reach into each other.
  float fray = snoise(vec2(s * 0.8 + 13.0, q * 11.0)) * 0.6 + streak * 0.4;
  // Up in the top left, so the card in the middle sits in the field rather than across the edge.
  float horizon = 0.22 + 0.13 * snoise(vec2(s * 0.22 + 2.0, 0.7));
  float sky = smoothstep(horizon - 0.08, horizon + 0.2, q + 0.2 * fray);

  // Grass from deep to bright by the streak: the bright streaks pale toward sage, the brightest catch the light.
  float g = clamp(0.5 + 0.55 * streak * calm + 0.18 * drift, 0.0, 1.0);
  vec3 grass = mix(uPalette[3], uPalette[2], smoothstep(0.08, 0.55, g));
  grass = mix(grass, mix(uPalette[2], uPalette[1], 0.45), smoothstep(0.5, 0.82, g) * 0.7);
  grass = mix(grass, uPalette[4], smoothstep(0.78, 1.0, g) * 0.8);
  // Sky going to haze toward the horizon and in pale streaks.
  float h = clamp(0.25 + 0.45 * streak * calm - (q - horizon) * 0.8 + 0.15 * drift, 0.0, 1.0);
  vec3 air = mix(uPalette[0], uPalette[1], h);

  vec3 lab = mix(grass, air, sky);
  // Light from the top left.
  lab.x += 0.03 * (uv.y - uv.x);
  lab.x += grainAt(gl_FragCoord.xy) * uGrain * 0.05;
  emit(lab);
}
`

/** Sandstone: broad dune ridges lit from the top left, with a fine suede grain lit by the same light. Palette: light, mid, shadow, deep, rim. */
export const ATMOSPHERE_SANDSTONE = /* glsl */ `${SHARED}
// Height: a long ridge system rising gently to the right, a smaller one across it, a slow swell under both.
float dune(vec2 p, float t) {
  vec2 r = vec2(dot(p, vec2(0.94, 0.34)), dot(p, vec2(-0.34, 0.94)));
  float w = 0.42 * snoise(vec2(r.x * 0.55 + 3.0, r.y * 0.4 + t * 0.003));
  float x = r.y * 1.25 + w;
  // A dune's profile: a long windward slope, a short steep lee.
  float big = sin(6.2832 * x + 0.85 * sin(6.2832 * x));
  vec2 r2 = vec2(dot(p, vec2(0.8, -0.6)), dot(p, vec2(0.6, 0.8)));
  float small = sin(6.2832 * (r2.y * 2.3 + 0.35 * snoise(r2 * 1.1 + 11.0)));
  return 0.62 * big + 0.17 * small + 0.3 * snoise(p * 0.7 + 5.0);
}

void main() {
  vec2 uv;
  vec2 p = field(uv);
  float t = uTime;

  // Lit like a surface: the slope from the height's differences, the light from the top left.
  float e = 0.004;
  float h = dune(p, t);
  vec2 grad = vec2(dune(p + vec2(e, 0.0), t) - h, dune(p + vec2(0.0, e), t) - h) / e;
  vec3 nrm = normalize(vec3(-grad * 0.055, 1.0));
  vec3 light = normalize(vec3(-0.62, 0.55, 0.56));
  float lit = clamp(dot(nrm, light), 0.0, 1.0);
  // Paler toward the top left, deeper toward the bottom right, as the light falls across the whole field.
  float shade = clamp(lit * 0.8 + 0.34 * (uv.y - uv.x) + 0.1, 0.0, 1.0);
  // At night most of the field sits in shadow and only the crests catch the light.
  shade = mix(shade, pow(shade, 1.7), uDark);

  // The ramp: deep, shadow, mid, light; in the dark the light is a rim on the crests.
  vec3 lab = mix(uPalette[3], uPalette[2], smoothstep(0.0, 0.42, shade));
  lab = mix(lab, uPalette[1], smoothstep(0.32, 0.72, shade));
  lab = mix(lab, uPalette[0], smoothstep(0.62, 1.0, shade));
  lab = mix(lab, uPalette[4], smoothstep(0.86, 1.0, shade) * 0.25);
  // At night the slopes facing the light keep a sienna rim, so the dunes still read.
  lab = mix(lab, uPalette[4], smoothstep(0.6, 0.95, lit) * 0.6 * uDark);

  // The suede: a fine grain embossed by the same light (a sample against one shifted toward it), a little fibrous.
  vec2 px = gl_FragCoord.xy / max(uDpr, 1.0);
  vec2 f = px * vec2(0.36, 0.52);
  float emboss = snoise(f) - snoise(f + light.xy * 0.55);
  float speck = hash12(floor(px)) - 0.5;
  lab.x += (emboss * 0.03 + speck * 0.016) * (0.6 + 0.4 * edge(p)) * (1.0 - 0.35 * uDark);

  lab.x += grainAt(gl_FragCoord.xy) * uGrain * 0.03;
  emit(lab);
}
`

/** Cinnabar: a ground going from its base into an English-red glow, crossed by soft shadow bands, under heavy grain. Palette: base, low, mid, glow, band. */
export const ATMOSPHERE_CINNABAR = /* glsl */ `${SHARED}
void main() {
  vec2 uv;
  vec2 p = field(uv);
  float t = uTime;

  // The glow rises toward the inline end and a little toward the top, its edge drifting slowly.
  float g = uv.x * 0.92 + (uv.y - 0.5) * 0.22;
  g += 0.2 * snoise(p * vec2(0.8, 1.3) + vec2(t * 0.009, 3.0));
  g = smoothstep(0.02, 1.08, g);

  // Soft horizontal shadow bands, wide and slow.
  float band = snoise(vec2(p.x * 0.4 + 1.7, p.y * 2.1 - t * 0.01));
  band += 0.25 * snoise(vec2(p.x * 0.65 + 9.0, p.y * 3.4 + t * 0.006));
  float shadow = smoothstep(0.0, 1.0, band) * 0.6;
  float k = g * (1.0 - shadow * smoothstep(0.1, 0.6, g));

  vec3 lab = mix(uPalette[0], uPalette[1], smoothstep(0.0, 0.45, k));
  lab = mix(lab, uPalette[2], smoothstep(0.35, 0.78, k));
  lab = mix(lab, uPalette[3], smoothstep(0.72, 1.0, k));
  // Where a band crosses the glow it takes the band color, a deeper warm shade rather than gray.
  lab = mix(lab, uPalette[4], shadow * 0.35 * smoothstep(0.2, 0.7, g));

  lab.x += grainAt(gl_FragCoord.xy) * uGrain * mix(0.05, 0.075, uDark);
  emit(lab);
}
`

/** Umber: a dusk going down from a pale sky to umber, a glow in it, and a coarse stipple. Palette: sky, glow, middle, low, deepest. */
export const ATMOSPHERE_UMBER = /* glsl */ `${SHARED}
void main() {
  vec2 uv;
  vec2 p = field(uv);
  float t = uTime;
  float aspect = uResolution.x / uResolution.y;

  // Height on the page, warped a little so the bands of light aren't ruled.
  float v = uv.y + 0.07 * snoise(p * vec2(0.7, 1.5) + vec2(t * 0.005, 0.0));
  vec3 lab = mix(uPalette[4], uPalette[3], smoothstep(0.0, 0.34, v));
  lab = mix(lab, uPalette[2], smoothstep(0.26, 0.62, v));
  lab = mix(lab, uPalette[0], smoothstep(0.56, 0.98, v));

  // The glow: on a light page the low sun in the top left; on a dark one a band of light on the horizon.
  vec2 sun = vec2(-0.38 * aspect, 0.42) + 0.05 * vec2(sin(t * 0.05), cos(t * 0.04));
  float day = exp(-dot((p - sun) * vec2(0.9, 1.3), (p - sun) * vec2(0.9, 1.3)) * 3.2);
  float horizon = exp(-pow((v - 0.36) / 0.11, 2.0)) * (0.7 + 0.3 * snoise(vec2(p.x * 1.2 + t * 0.01, 4.0)));
  lab = mix(lab, uPalette[1], clamp(mix(day * 0.85, horizon * 0.62, uDark), 0.0, 1.0));

  // The stipple: coarse cells pushed toward light or dark, strongest in the mid-tones; still, like printed paper.
  vec2 cell = floor(gl_FragCoord.xy / max(1.0, uDpr * 1.2));
  float r = hash12(cell + 7.31) - 0.5;
  float stipple = sign(r) * pow(abs(r) * 2.0, 0.55) * 0.5;
  float mid = 1.0 - abs(lab.x - mix(0.62, 0.3, uDark)) * 1.6;
  lab.x += stipple * mix(0.05, 0.035, uDark) * clamp(mid, 0.35, 1.0) * (0.55 + 0.45 * uGrain * 2.0);

  lab.x += grainAt(gl_FragCoord.xy) * uGrain * 0.025;
  emit(lab);
}
`
