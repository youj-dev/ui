export const MAX_RIPPLES = 8

export const DOT_MATRIX_FRAGMENT = /* glsl */ `
#define MAX_RIPPLES ${MAX_RIPPLES}
uniform vec3 uBase;     // OKLab
uniform vec3 uDot;      // OKLab, resting dots
uniform vec3 uAccent;   // OKLab, excited dots
uniform float uIntensity;
uniform float uSpacing;       // device px, integer
uniform float uRippleSpeed;   // device px per clock second
uniform vec3 uPointer;        // device px (y up), strength
uniform vec4 uRipples[MAX_RIPPLES]; // origin xy (device px, y up), start time, amplitude (0 = unused)

void main() {
  vec2 frag = gl_FragCoord.xy;
  // Center the lattice so margins are symmetric.
  vec2 offset = 0.5 * mod(uResolution, uSpacing);
  vec2 cell = floor((frag - offset) / uSpacing);
  vec2 center = offset + (cell + 0.5) * uSpacing;
  float d = length(frag - center);

  // Everything is evaluated at the dot center, so each dot is one crisp disc.
  float unit = uSpacing;

  // Idle: a slow, low-frequency swell so the matrix breathes even untouched.
  float idle = smoothstep(0.35, 1.0, 0.5 + 0.5 * snoise(vec3(center / (unit * 16.0), uTime * 0.12)));
  float v = idle * 0.16;

  // Pointer: a tight lens of raised dots.
  vec2 dp = (center - uPointer.xy) / (unit * 5.5);
  v += exp(-dot(dp, dp)) * 0.85 * uPointer.z;

  // Ripples: expanding rings with a thin leading edge that widens and fades as it travels.
  for (int i = 0; i < MAX_RIPPLES; i++) {
    vec4 r = uRipples[i];
    float age = uTime - r.z;
    if (r.w <= 0.0 || age < 0.0) continue;
    float ring = age * uRippleSpeed;
    float dist = length(center - r.xy);
    float width = unit * (1.1 + age * 1.6);
    float x = (dist - ring) / width;
    // Asymmetric profile: sharp front, softer wake.
    float wave = exp(-x * x * (x > 0.0 ? 2.5 : 1.3));
    v += wave * r.w * exp(-age * 0.9);
  }

  v = clamp(v, 0.0, 1.0);
  float e = smoothstep(0.0, 1.0, v);

  float radius = unit * mix(0.065, 0.28, e);
  float disc = clamp(radius - d + 0.5, 0.0, 1.0);

  // Resting dots fade toward the edges; excited dots show anywhere.
  vec2 uv = frag / uResolution;
  vec2 q = (uv - 0.5) * vec2(1.0, 1.25);
  float vignette = 1.0 - smoothstep(0.25, 0.62, length(q));
  float restAlpha = mix(0.1, 0.28, vignette);

  float alpha = mix(restAlpha, 1.0, smoothstep(0.05, 0.6, v)) * clamp(uIntensity, 0.0, 1.5);
  vec3 ink = mix(uDot, uAccent, smoothstep(0.15, 0.75, v));

  vec3 lab = uBase;
  // A faint accent bloom under the pointer lens.
  lab = mix(lab, uAccent, exp(-dot(dp, dp) * 0.5) * 0.06 * uPointer.z * uIntensity);
  lab = mix(lab, ink, clamp(disc * alpha, 0.0, 1.0));
  emit(lab);
}
`
