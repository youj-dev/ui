import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { cn } from '@youj/core/lib/youj/cn'
import { observeThemeChange } from '@youj/core/lib/youj/theme/observe'
import { lightness, packOklab } from './color'
import { resolveColors, useShaderBackground } from './gl'
import { ATMOSPHERE_CINNABAR, ATMOSPHERE_MEADOW, ATMOSPHERE_SANDSTONE, ATMOSPHERE_UMBER } from './atmosphere.glsl'

export type AtmosphereScene = 'meadow' | 'sandstone' | 'cinnabar' | 'umber'

export interface AtmosphereProps {
  /** The ground: `meadow` (a panned meadow under sky), `sandstone` (lit dunes with a suede grain), `cinnabar` (a dark ground glowing into English red) or `umber` (a grainy dusk). Each pairs with the theme preset of its name. Default `meadow`. */
  scene?: AtmosphereScene
  /** Five CSS colors in the scene's own order (meadow: sky, haze, grass, deep, glint; sandstone: light, mid, shadow, deep, rim; cinnabar: base, low, mid, glow, band; umber: sky, glow, middle, low, deepest), in place of its palette for both modes. Tokens follow the mode. */
  colors?: readonly string[]
  /** Drift speed multiplier. Default 1. */
  speed?: number
  /** Film grain, 0–1. Default: the scene's own (stronger on cinnabar, finer on sandstone, which has its own suede). */
  grain?: number
  className?: string
}

type Lch = readonly [l: number, c: number, h: number]
type Mode = 'light' | 'dark'

interface Scene {
  fragment: string
  grain: number
  /** The still frame's clock: a composition worth holding. */
  still: number
  /** The five colors (OKLCH), per mode: each designed for its page, the dark not a darkened light. */
  palette: Record<Mode, readonly [Lch, Lch, Lch, Lch, Lch]>
}

/* The palettes come from Sanzo Wada's A Dictionary of Color Combinations (the color data only), the same
 * combinations the presets of the same names are drawn from. */
const SCENES: Record<AtmosphereScene, Scene> = {
  // No. 294: Salvia Blue sky, Sulpher Yellow haze, Cossack Green grass, a deep field green, Cream Yellow glints. Dark: blue hour.
  meadow: {
    fragment: ATMOSPHERE_MEADOW,
    grain: 0.5,
    still: 18,
    palette: {
      light: [[0.8, 0.045, 246], [0.93, 0.045, 98], [0.58, 0.088, 136], [0.35, 0.065, 154], [0.87, 0.1, 80]],
      dark: [[0.34, 0.042, 256], [0.42, 0.03, 240], [0.32, 0.065, 148], [0.17, 0.03, 160], [0.56, 0.08, 76]],
    },
  },
  // No. 279: Ecru light, Vinaceous Cinnamon mid, Raw Sienna shadow, a rust deep, a pale rim. Dark: dunes under a Dark Tyrian Blue night, sienna on the crests.
  sandstone: {
    fragment: ATMOSPHERE_SANDSTONE,
    grain: 0.4,
    still: 30,
    palette: {
      light: [[0.91, 0.035, 80], [0.79, 0.07, 66], [0.61, 0.11, 54], [0.44, 0.1, 42], [0.95, 0.025, 86]],
      dark: [[0.5, 0.085, 58], [0.29, 0.035, 55], [0.2, 0.035, 245], [0.13, 0.03, 250], [0.6, 0.1, 60]],
    },
  },
  // No. 190: Black into English Red, with Ivory Buff by day. Dark: near-black, ember, copper, glow, a warm band shade.
  cinnabar: {
    fragment: ATMOSPHERE_CINNABAR,
    grain: 0.7,
    still: 24,
    palette: {
      light: [[0.94, 0.035, 86], [0.87, 0.065, 68], [0.74, 0.12, 48], [0.64, 0.155, 42], [0.6, 0.12, 40]],
      dark: [[0.13, 0.008, 45], [0.27, 0.075, 38], [0.54, 0.15, 42], [0.7, 0.14, 54], [0.2, 0.05, 36]],
    },
  },
  // No. 160: a Sulphine-pale sky, a Sulphine glow, ochre, Pale Raw Umber, deep umber. Dark: a Dark Medici Blue sky over umber, a brass horizon.
  umber: {
    fragment: ATMOSPHERE_UMBER,
    grain: 0.5,
    still: 36,
    palette: {
      light: [[0.92, 0.04, 102], [0.86, 0.1, 88], [0.68, 0.085, 72], [0.42, 0.065, 62], [0.28, 0.045, 60]],
      dark: [[0.33, 0.03, 214], [0.5, 0.095, 72], [0.24, 0.035, 70], [0.16, 0.025, 62], [0.11, 0.015, 60]],
    },
  },
}

const oklab = ([l, c, h]: Lch) => [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)] as const
const PACKED = Object.fromEntries(
  Object.entries(SCENES).map(([id, s]) => [id, { light: Float32Array.from(s.palette.light.flatMap(oklab)), dark: Float32Array.from(s.palette.dark.flatMap(oklab)) }]),
) as Record<AtmosphereScene, Record<Mode, Float32Array>>

const css = ([l, c, h]: Lch) => `oklch(${l} ${c} ${h})` // youj-allow: a scene color as CSS, for its still stand-in

/** A tile of fine grain (fractal noise), laid over a still with `overlay`. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")"

/**
 * A scene as a still CSS background for a mode: its layered gradients under a grain tile. What shows where WebGL2
 * isn't available, and a stand-in to paint before the shader's first frame.
 */
export function atmosphereStill(scene: AtmosphereScene, mode: Mode): CSSProperties {
  const [a, b, c, d, e] = SCENES[scene].palette[mode].map(css)
  const layers: Record<AtmosphereScene, string> = {
    meadow: `radial-gradient(70% 55% at 10% 6%, color-mix(in oklab, ${b} 55%, transparent), transparent 70%), linear-gradient(148deg, ${a} 0%, ${a} 18%, ${c} 46%, ${e} 56%, ${c} 66%, ${d} 100%)`,
    sandstone: `radial-gradient(90% 70% at 18% 12%, ${a}, transparent 70%), linear-gradient(160deg, ${b} 0%, ${b} 35%, ${c} 70%, ${d} 100%)`,
    cinnabar: `linear-gradient(180deg, transparent 30%, color-mix(in oklab, ${e} 45%, transparent) 46%, transparent 62%), linear-gradient(90deg, ${a} 0%, ${b} 38%, ${c} 74%, ${d} 100%)`,
    umber: `radial-gradient(60% 50% at 16% 14%, color-mix(in oklab, ${b} 80%, transparent), transparent 75%), linear-gradient(180deg, ${a} 0%, ${c} 52%, ${d} 82%, ${e} 100%)`,
  }
  return { backgroundColor: c, backgroundImage: `${GRAIN}, ${layers[scene]}`, backgroundBlendMode: 'overlay, normal, normal', backgroundSize: '180px 180px, cover, cover' }
}

/** Light or dark for the still: the canvas token's lightness where the host is, re-read when the theme changes. */
function useStillMode(hostRef: RefObject<HTMLElement | null>, active: boolean): Mode {
  const [mode, setMode] = useState<Mode>('light')
  useEffect(() => {
    const host = hostRef.current
    if (!active || !host) return
    const read = () => setMode(lightness(resolveColors(host, ['var(--color-canvas)'])[0]!) < 0.5 ? 'dark' : 'light')
    read()
    return observeThemeChange(host, read)
  }, [active, hostRef])
  return mode
}

/**
 * A painted, grainy ground for a card to float on: a panned meadow, lit dunes, a dark ground glowing into English
 * red, or a dusk. Each scene is drawn in its own palette for light and dark, following the page; the middle stays
 * quiet so the card is the hero. One fragment shader, at most 24 frames a second, paused off screen and in a hidden
 * tab, and one still frame under reduced motion.
 */
export function Atmosphere({ scene = 'meadow', colors, speed = 1, grain, className }: AtmosphereProps) {
  return <AtmosphereCanvas key={scene} scene={scene} colors={colors} speed={speed} grain={grain} className={className} />
}

function AtmosphereCanvas({ scene, colors, speed = 1, grain, className }: AtmosphereProps & { scene: AtmosphereScene }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const spec = SCENES[scene]
  const custom = Boolean(colors?.length)
  const amount = grain ?? spec.grain
  const cache = useRef<{ source: unknown; palette: Float32Array; dark: number }>({ source: null, palette: PACKED[scene].light, dark: 0 })

  const { failed } = useShaderBackground(hostRef, {
    fragment: spec.fragment,
    colors: ['var(--color-canvas)', ...(colors ?? [])],
    speed,
    interactive: false,
    maxDpr: 1.5,
    fps: 24,
    staticTime: spec.still,
    uniforms: (u, info) => {
      const c = cache.current
      if (c.source !== info.colors) {
        const [canvas = [1, 1, 1], ...own] = info.colors
        const dark = lightness(canvas) < 0.5
        c.dark = dark ? 1 : 0
        c.palette = custom ? packOklab(own, 5) : PACKED[scene][dark ? 'dark' : 'light']
        c.source = info.colors
      }
      u.vec3Array('uPalette', c.palette)
      u.float('uDark', c.dark)
      u.float('uGrain', info.reduced ? amount * 0.5 : amount)
    },
  })
  const mode = useStillMode(hostRef, failed)

  return (
    <div
      ref={hostRef}
      aria-hidden
      data-yj-scene={scene}
      data-yj-fallback={failed || undefined}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-canvas', className)}
      style={failed ? atmosphereStill(scene, mode) : undefined}
    />
  )
}
