/* VoiceOrb's drawing: WebGL2 when the browser has it, a Canvas2D sphere when it
 * doesn't, and nothing (the CSS disc shows) when neither is there. Colors are
 * the theme's, read through a probe element in the orb's own cascade: the
 * accent, a light tint and a deep shade made from it, and chart-2 as the one
 * supporting ink. */

import { ORB_FRAGMENT, ORB_VERTEX } from './voice-orb.glsl'

type Rgb = [number, number, number]

/** The orb's inks (sRGB, 0–1): the accent's light tint, the accent, its deep shade, the supporting ink; and whether the page is light. */
export interface OrbInks {
  inks: [Rgb, Rgb, Rgb, Rgb]
  light: number
}

/** A sound ring: where it is (canvas units, 0 center to 1 edge), how strong and how wide. */
export interface OrbRing {
  radius: number
  alpha: number
  width: number
}

/** One frame's picture, every value already smoothed. */
export interface OrbFrame {
  /** The inner flow's phase. */
  flow: number
  /** The orb's radius in canvas units, its scale included. */
  radius: number
  /** The thinking swirl, 0–1. */
  inner: number
  halo: number
  muted: number
  level: number
  rings: OrbRing[]
}

export interface OrbRenderer {
  kind: 'webgl' | 'canvas'
  draw(frame: OrbFrame, inks: OrbInks): void
  dispose(): void
}

const TOKENS = ['var(--color-accent)', 'var(--color-chart-2)', 'var(--color-canvas)']
const GREY: Rgb = [0.5, 0.5, 0.5]

/** Reads the inks where `host` sits, so a ThemeScope or a tone around it applies. */
export function readInks(host: Element): OrbInks {
  const probe = document.createElement('span')
  probe.style.display = 'none'
  host.appendChild(probe)
  const [accent = GREY, support = GREY, canvas = GREY] = TOKENS.map((token) => {
    probe.style.color = ''
    probe.style.color = token
    return toRgb(getComputedStyle(probe).color)
  })
  probe.remove()
  const light = toLab(canvas)[0] > 0.6 ? 1 : 0
  const [l, a, b] = toLab(accent)
  const chroma = Math.hypot(a, b)
  const hue = Math.atan2(b, a)
  const shade = (dl: number, dc: number, dh: number) => fromLab([Math.min(0.97, Math.max(0.2, l + dl)), Math.cos(hue + dh) * chroma * dc, Math.sin(hue + dh) * chroma * dc])
  // The supporting ink leans halfway to the accent, so a far chart color stays a hint.
  const s = toLab(support)
  const lean = fromLab([(s[0] + l) / 2, (s[1] + a) / 2, (s[2] + b) / 2])
  // On a light page the accent is deep (it has to pass as text there), so the tint reaches further up.
  return { inks: [shade(light ? 0.3 : 0.2, 0.55, 0.12), light ? shade(0.08, 0.95, 0) : accent, shade(light ? -0.12 : -0.24, 1, -0.2), lean], light }
}

const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const gamma = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.max(c, 0) ** (1 / 2.4) - 0.055)

function toLab([r, g, b]: Rgb): Rgb {
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)]
  const L = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const M = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const S = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S, 1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S, 0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S]
}

function fromLab([l, a, b]: Rgb): Rgb {
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clamp = (v: number) => Math.min(1, Math.max(0, gamma(v)))
  return [clamp(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S), clamp(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S), clamp(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S)]
}

let scratch: CanvasRenderingContext2D | null | undefined

// Computed colors come back in rgb, srgb, OKLCH or Lab notation depending on the browser;
// a 1×1 canvas turns any of them into sRGB bytes.
function toRgb(color: string): Rgb {
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(color)
  if (rgb) return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255]
  const srgb = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(color)
  if (srgb) return [Number(srgb[1]), Number(srgb[2]), Number(srgb[3])]
  if (scratch === undefined) scratch = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!scratch || !color) return GREY
  scratch.clearRect(0, 0, 1, 1)
  scratch.fillStyle = color
  scratch.fillRect(0, 0, 1, 1)
  const [r = 128, g = 128, b = 128] = scratch.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}

/** WebGL2, else Canvas2D, else null. */
export function createOrbRenderer(canvas: HTMLCanvasElement, onRestored: () => void): OrbRenderer | null {
  return createWebGL(canvas, onRestored) ?? createCanvas2D(canvas)
}

function createWebGL(canvas: HTMLCanvasElement, onRestored: () => void): OrbRenderer | null {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false })
  if (!gl) return null
  let program: WebGLProgram | null = null
  let vao: WebGLVertexArrayObject | null = null
  let lost = false
  const loc = new Map<string, WebGLUniformLocation | null>()

  const build = () => {
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) throw new Error('youj/voice-orb: could not create a shader')
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(`youj/voice-orb: ${gl.getShaderInfoLog(shader)}`)
      return shader
    }
    const next = gl.createProgram()
    const vs = compile(gl.VERTEX_SHADER, ORB_VERTEX)
    const fs = compile(gl.FRAGMENT_SHADER, ORB_FRAGMENT)
    gl.attachShader(next, vs)
    gl.attachShader(next, fs)
    gl.linkProgram(next)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(next, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(`youj/voice-orb: ${gl.getProgramInfoLog(next)}`)
    program = next
    vao = gl.createVertexArray()
    loc.clear()
  }
  try {
    build()
  } catch (error) {
    console.error(error)
    return null
  }

  const onLost = (event: Event) => {
    event.preventDefault()
    lost = true
  }
  const onRestore = () => {
    try {
      build()
      lost = false
      onRestored()
    } catch (error) {
      console.error(error)
    }
  }
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestore)

  const u = (name: string) => {
    if (!loc.has(name) && program) loc.set(name, gl.getUniformLocation(program, name))
    return loc.get(name) ?? null
  }
  const inkData = new Float32Array(12)
  const ringData = new Float32Array(16)
  let inkSource: OrbInks | null = null

  return {
    kind: 'webgl',
    draw(f, inks) {
      if (lost || !program) return
      if (inkSource !== inks) {
        inks.inks.forEach((ink, i) => inkData.set(ink.map(linear), i * 3))
        inkSource = inks
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      // biome-ignore lint/correctness/useHookAtTopLevel: WebGL2RenderingContext.useProgram, not a React hook
      gl.useProgram(program)
      gl.bindVertexArray(vao)
      gl.uniform2f(u('uResolution'), canvas.width, canvas.height)
      gl.uniform1f(u('uFlow'), f.flow)
      gl.uniform3fv(u('uInk'), inkData)
      gl.uniform1f(u('uLight'), inks.light)
      gl.uniform4f(u('uShape'), f.radius, f.inner, f.halo, f.muted)
      ringData.fill(0)
      f.rings.slice(0, 4).forEach((ring, i) => ringData.set([ring.radius, ring.alpha, ring.width], i * 4))
      gl.uniform4fv(u('uRings'), ringData)
      gl.uniform1f(u('uLevel'), f.level)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestore)
      if (!lost) {
        gl.deleteVertexArray(vao)
        gl.deleteProgram(program)
      }
      // No loseContext(): React may set the orb up again on this same canvas (Strict Mode, an effect re-run), and a
      // canvas whose context was lost hands back that lost context, drawn as a broken white box. The browser frees
      // the context with the canvas.
    },
  }
}

const css = ([r, g, b]: Rgb, alpha = 1) => `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)} / ${alpha})` // youj-allow: theme inks resolved at runtime

/** The same sphere drawn with gradients: the accent from tint to shade, a highlight, the halo and the rings. */
function createCanvas2D(canvas: HTMLCanvasElement): OrbRenderer | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  return {
    kind: 'canvas',
    draw(f, { inks, light }) {
      const { width: w, height: h } = canvas
      const cx = w / 2
      const cy = h / 2
      const unit = w / 2
      const R = unit * f.radius
      ctx.clearRect(0, 0, w, h)

      const halo = ctx.createRadialGradient(cx, cy, R, cx, cy, R + unit * 0.25)
      halo.addColorStop(0, css(inks[1], f.halo * (0.3 + 0.4 * f.level) * (1 - 0.45 * light)))
      halo.addColorStop(1, css(inks[1], 0))
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, w, h)
      for (const ring of f.rings) {
        if (ring.alpha <= 0.01) continue
        ctx.beginPath()
        ctx.arc(cx, cy, unit * ring.radius, 0, Math.PI * 2)
        ctx.lineWidth = unit * ring.width * 1.6
        ctx.strokeStyle = css(inks[0], ring.alpha * 0.5)
        ctx.stroke()
      }

      const body = ctx.createLinearGradient(cx - R * 0.7, cy - R * 0.8, cx + R * 0.7, cy + R * 0.8)
      body.addColorStop(0, css(inks[0]))
      body.addColorStop(0.45, css(inks[1]))
      body.addColorStop(1, css(inks[2]))
      ctx.globalAlpha = 1 - f.muted * 0.35
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = body
      ctx.fill()
      const a = f.flow * 0.6
      const bx = cx + Math.cos(a) * R * 0.35
      const by = cy + Math.sin(a) * R * 0.35
      const blob = ctx.createRadialGradient(bx, by, 0, bx, by, R * 0.8)
      blob.addColorStop(0, css(inks[3], 0.35))
      blob.addColorStop(1, css(inks[3], 0))
      ctx.fillStyle = blob
      ctx.fill()
      const shine = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, 0, cx - R * 0.35, cy - R * 0.4, R * 0.8)
      shine.addColorStop(0, css([1, 1, 1], 0.3 + 0.2 * f.level))
      shine.addColorStop(1, css([1, 1, 1], 0))
      ctx.fillStyle = shine
      ctx.fill()
      ctx.globalAlpha = 1
    },
    dispose() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    },
  }
}
