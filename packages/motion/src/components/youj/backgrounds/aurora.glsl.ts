export const AURORA_FRAGMENT = /* glsl */ `
uniform vec3 uBase;       // OKLab
uniform vec3 uColors[3];  // OKLab, back to front
uniform float uIntensity;
uniform float uLight;     // 0 on dark canvases (light adds), 1 on light canvases (light tints)
uniform float uHorizon;   // 0-1 from the bottom: where the lowest curtain edge sits
uniform vec3 uPointer;    // uv (y up), strength

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 uv = gl_FragCoord.xy / uResolution;
  float t = uTime * 0.07;
  float lean = (uPointer.x - 0.5) * uPointer.z;

  // Quiet the lower part of the frame so content there stays legible.
  float mask = smoothstep(uHorizon - 0.35, uHorizon + 0.1, uv.y);
  float k = clamp(uIntensity, 0.0, 1.5) * mask;

  vec3 base = oklabToLinear(uBase);
  vec3 glow = vec3(0.0);
  vec3 wash = base;

  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float depth = 1.0 - fi * 0.3;           // higher layers sit further back: dimmer and taller
    float x = uv.x * aspect * (0.55 + 0.2 * fi) + fi * 3.7 + lean * 0.08 * (fi + 1.0);

    // The curtain's lower edge: a long slow swell plus a finer, faster fold.
    float edge = uHorizon + 0.07 * fi
      + 0.11 * snoise(vec2(x * 0.45 - t * 0.35, fi * 4.1 + t * 0.12))
      + 0.035 * snoise(vec2(x * 1.6 + t * 0.6, fi * 9.3 - t * 0.3));
    float dy = uv.y - edge;

    // Bright, soft lower edge; rays hang upward and fade over the curtain height.
    float height = 0.13 + 0.07 * fi;
    float body = dy < 0.0 ? exp(-pow(dy / 0.03, 2.0)) : exp(-dy / height) * (0.5 + 0.5 * exp(-dy / 0.05));

    // Rays: vertical striations that shear slightly with height, drifting sideways.
    // Two octaves so the striations are irregular, never a comb.
    float rx = x * 11.0 + dy * 1.4 - t * (0.6 + 0.3 * fi);
    float rays = 0.5 + 0.35 * snoise(vec2(rx, fi * 13.0 + t * 0.4)) + 0.15 * snoise(vec2(rx * 2.7, fi * 3.0 - t * 0.7));
    rays = mix(0.3, 1.0, rays * rays);

    // Brightness pulses traveling along the ribbon.
    // Wide gaps between pulses make each layer read as ribbons, not a solid wall.
    float pulse = 0.08 + 0.92 * smoothstep(-0.5, 0.7, snoise(vec2(x * 0.6 - t * 0.9, fi * 5.3)));

    float a = body * rays * pulse * depth;
    glow += oklabToLinear(uColors[i]) * a;
    // Light canvases: wash toward a lifted, saturated version of the hue (tinting darker would go gray).
    vec3 lifted = oklabToLinear(vec3(clamp(uColors[i].x, 0.68, 0.8), uColors[i].yz * 1.25));
    wash = mix(wash, lifted, clamp(a * 1.1 * k, 0.0, 0.85));
  }

  vec3 dark = base + glow * 0.95 * k;
  vec3 lin = mix(dark, wash, uLight);

  fragColor = vec4(linearToSrgb(lin) + dither(gl_FragCoord.xy), 1.0);
}
`
