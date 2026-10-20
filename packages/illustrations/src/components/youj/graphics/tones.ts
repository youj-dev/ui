import type { CSSProperties } from 'react'

/* Face shading from the theme's tokens. Light comes from above, a little to
 * the left: the top face is the lightest, the +y face (left) a step down and
 * the +x face (right) the darkest, in both schemes. `--yj-dark` (0 in light,
 * 1 in dark) picks each mix, so one formula serves both and a nested light
 * scope in a dark page shades itself correctly.
 *
 * The colors are CSS custom properties on the shape's group (--kg-top,
 * --kg-left, --kg-right, --kg-edge, --kg-lit), so a theme change repaints
 * without React, and a caller can override any of them with `style`. */

export type IsoTone = 'neutral' | 'raised' | 'sunken' | 'accent' | 'success' | 'warning' | 'danger'

/**
 * A scene's colours when it has `colors`: 1 is the scene's main colour, 2 the
 * one that tells a second kind of thing apart, 3 a rare third. A shape with a
 * hue keeps its neutral `tone` until the scene turns colour on.
 */
export type IsoHue = 1 | 2 | 3

/** Solid faces, a wireframe (hairline edges, hidden edges dashed), or a ghost (a dashed outline: a place something will go). */
export type IsoVariant = 'solid' | 'wire' | 'ghost'

/** fg mixed into the surface: `light`% in the light scheme, `dark`% in the dark one. */
const lift = (light: number, dark: number) =>
  `color-mix(in oklab, var(--color-fg) calc(${light}% + ${dark - light}% * var(--yj-dark)), var(--color-surface))`

/** Toward the scheme's shadow: the ink in light, the canvas in dark. */
const SHADE = 'color-mix(in oklab, var(--color-fg) calc(100% - 100% * var(--yj-dark)), var(--color-canvas))'
/** Toward the scheme's light: the surface in light, the ink in dark. */
const LIGHT = 'color-mix(in oklab, var(--color-surface) calc(100% - 100% * var(--yj-dark)), var(--color-fg))'

const hairline = (alpha: number) => `color-mix(in oklab, var(--color-fg) ${alpha}%, transparent)`

const NEUTRALS = {
  neutral: { top: lift(2, 17), left: lift(7, 10), right: lift(13, 5), edge: hairline(20), lit: hairline(34) },
  raised: { top: lift(0, 27), left: lift(5, 17), right: lift(10, 10), edge: hairline(22), lit: hairline(44) },
  sunken: { top: lift(5, 6), left: lift(10, 4), right: lift(16, 2), edge: hairline(16), lit: hairline(24) },
} as const

const INKS: Record<Exclude<IsoTone, keyof typeof NEUTRALS>, string> = {
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
}

/* The hues, derived from the accent so they follow every theme: the
 * subject's own lightness and a faint chroma, then the hue opposite the
 * accent (a second kind of thing) and a quarter turn (a rare third). A scene's
 * `colors` (--kg-c1…) replaces them. Each is softened toward the surface, so
 * colour sits under the accent, which stays at full strength. */
const HUE_ROLES = [
  'oklch(from var(--color-accent) calc(.62 + .1 * var(--yj-dark)) .06 h)', // youj-allow: the theme pair, derived from the accent
  'oklch(from var(--color-accent) .74 .065 calc(h + 180))', // youj-allow: the theme pair, derived from the accent
  'oklch(from var(--color-accent) .70 .05 calc(h + 90))', // youj-allow: the theme pair, derived from the accent
] as const
const HUE_STRENGTH = { light: 50, dark: 54 }
const hueOf = (n: number) =>
  `color-mix(in oklab, var(--kg-c${n}, ${HUE_ROLES[n - 1]}) calc(${HUE_STRENGTH.light}% + ${HUE_STRENGTH.dark - HUE_STRENGTH.light}% * var(--yj-dark)), var(--color-surface))`

/** Three faces from one color: lifted on top, as given on the left, shaded on the right. */
function fromColor(color: string) {
  return {
    top: `color-mix(in oklab, ${color}, ${LIGHT} calc(14% + 8% * var(--yj-dark)))`,
    left: color,
    right: `color-mix(in oklab, ${color}, ${SHADE} calc(18% + 14% * var(--yj-dark)))`,
    edge: `color-mix(in oklab, ${color}, ${SHADE} 38%)`,
    lit: `color-mix(in oklab, ${color}, ${LIGHT} 45%)`,
  }
}

/** A wireframe's lines in a color: the edges strong, the faces a breath of it. */
function wireOf(color: string | undefined) {
  const ink = color ?? 'var(--color-fg)'
  const strong = color ? 92 : 46
  return {
    top: `color-mix(in oklab, ${ink} ${color ? 12 : 4}%, transparent)`,
    left: `color-mix(in oklab, ${ink} ${color ? 7 : 2}%, transparent)`,
    right: `color-mix(in oklab, ${ink} ${color ? 4 : 1}%, transparent)`,
    edge: `color-mix(in oklab, ${ink} ${strong}%, transparent)`,
    lit: `color-mix(in oklab, ${ink} ${strong}%, transparent)`,
  }
}

/**
 * The face colors for a shape, as custom properties. `color` (any CSS
 * color, token references included, such as `var(--color-chart-2)`) wins
 * over `tone`.
 */
export function faceVars(tone: IsoTone = 'neutral', variant: IsoVariant = 'solid', color?: string): CSSProperties {
  const ink = color ?? (tone in INKS ? INKS[tone as keyof typeof INKS] : undefined)
  const faces = variant === 'solid' ? (ink ? fromColor(ink) : NEUTRALS[tone as keyof typeof NEUTRALS]) : wireOf(ink)
  const ghost = variant === 'ghost'
  return {
    '--kg-top': ghost ? 'transparent' : faces.top,
    '--kg-left': ghost ? 'transparent' : faces.left,
    '--kg-right': ghost ? 'transparent' : faces.right,
    '--kg-edge': ghost ? `color-mix(in oklab, ${ink ?? 'var(--color-fg)'} ${ink ? 70 : 34}%, transparent)` : faces.edge,
    '--kg-lit': faces.lit,
  } as CSSProperties
}

/** Dashes for hidden edges and ghosts, in user units (the scene's scale keeps them near 3 px on 3). */
export const DASH = 'calc(3px * var(--kg-px, 1)) calc(3px * var(--kg-px, 1))'

/** An inked shape's color (a tone's ink, or its `color`), set on its group. */
const INK = 'var(--kg-ink)'
const declare = (faces: Record<'top' | 'left' | 'right' | 'edge' | 'lit', string>) =>
  `--kg-top:${faces.top};--kg-left:${faces.left};--kg-right:${faces.right};--kg-edge:${faces.edge};--kg-lit:${faces.lit}`
const ghostOf = (ink?: string) => ({
  top: 'transparent',
  left: 'transparent',
  right: 'transparent',
  edge: `color-mix(in oklab, ${ink ?? 'var(--color-fg)'} ${ink ? 70 : 34}%, transparent)`,
  lit: wireOf(ink).lit,
})

/**
 * The kit's one stylesheet: every face color and hairline as a class, so a
 * shape carries a few class names instead of long style strings. IsoScene
 * renders it once per page (React hoists and dedupes it); the formulas are
 * faceVars' own.
 */
export const KIT_CSS = [
  `.kg-line,.kg-edge,.kg-lit,.kg-hidden{vector-effect:non-scaling-stroke;stroke-width:1;stroke-linejoin:round;stroke-linecap:round}`,
  `.kg-edge,.kg-hidden{stroke:var(--kg-edge)}`,
  `.kg-lit{fill:none;stroke:var(--kg-lit)}`,
  `.kg-dash,.kg-hidden{stroke-dasharray:${DASH}}`,
  `.kg-hidden{fill:none;opacity:0.55}`,
  `.kg-top{fill:var(--kg-top)}.kg-left{fill:var(--kg-left)}.kg-right{fill:var(--kg-right)}`,
  // A plinth's engraved grid, and a floor's dots (a constant size on screen at any scale).
  `.kg-groove{stroke:color-mix(in oklab, var(--color-fg) 9%, transparent)}`,
  `.kg-dot{transform:scale(var(--kg-px, 1));transform-box:fill-box;transform-origin:center}`,
  // A floating shape's bob: a sine by two eased keys, run on --kg-lag so each shape is out of step; paused offscreen.
  `.kg-bob{animation:kg-bob var(--kg-half) cubic-bezier(.37,0,.63,1) var(--kg-lag) infinite alternate both}`, // youj-allow: a sine by two keys, not a motion curve
  `@keyframes kg-bob{from{transform:translateY(calc(var(--kg-bob) * -1))}to{transform:translateY(var(--kg-bob))}}`,
  `[data-idle] .kg-bob{animation-play-state:paused}`,
  ...Object.entries(NEUTRALS).map(([tone, faces]) => `.kg-solid.kg-${tone}{${declare(faces)}}`),
  ...Object.entries(INKS).map(([tone, ink]) => `.kg-${tone}{--kg-ink:${ink}}`),
  `.kg-solid.kg-ink{${declare(fromColor(INK))}}`,
  `.kg-wire{${declare(wireOf(undefined))}}`,
  `.kg-wire.kg-ink{${declare(wireOf(INK))}}`,
  `.kg-ghost{${declare(ghostOf())}}`,
  `.kg-ghost.kg-ink{${declare(ghostOf(INK))}}`,
  // Hues: only a scene with colors on (data-yj-colors) takes them, after the neutrals so they win; any other keeps a hued shape's neutral tone.
  `[data-yj-colors]{${HUE_ROLES.map((_, i) => `--kg-hue-${i + 1}:${hueOf(i + 1)}`).join(';')}}`,
  // The tone still shades a hue: raised a step toward the light, sunken a step toward the shade.
  ...HUE_ROLES.map((_, i) => `.kg-h${i + 1}{--kg-hue:var(--kg-hue-${i + 1})}`),
  `[data-yj-colors] .kg-hue{--kg-ink:var(--kg-hue)}`,
  `[data-yj-colors] .kg-hue.kg-raised{--kg-ink:color-mix(in oklab, var(--kg-hue), ${LIGHT} 22%)}`,
  `[data-yj-colors] .kg-hue.kg-sunken{--kg-ink:color-mix(in oklab, var(--kg-hue), ${SHADE} 16%)}`,
  `[data-yj-colors] .kg-solid.kg-hue{${declare(fromColor(INK))}}`,
  `[data-yj-colors] .kg-wire.kg-hue{${declare(wireOf(INK))}}`,
  `[data-yj-colors] .kg-ghost.kg-hue{${declare(ghostOf(INK))}}`,
].join('\n')

/**
 * A shape's face colors as classes from KIT_CSS (and, for a `color`, the one
 * custom property it names). Spread onto the shape's group; `color` wins over
 * `tone`, and a `hue` colours a neutral tone (which a scene without `colors` keeps).
 * The same colors as faceVars.
 */
export function faceClass(tone: IsoTone = 'neutral', variant: IsoVariant = 'solid', color?: string, hue?: IsoHue): { className: string; style?: CSSProperties } {
  if (color !== undefined) return { className: `kg-${variant} kg-ink`, style: { '--kg-ink': color } as CSSProperties }
  if (tone in INKS) return { className: `kg-${variant} kg-ink kg-${tone}` }
  return { className: hue ? `kg-${variant} kg-${tone} kg-hue kg-h${hue}` : `kg-${variant} kg-${tone}` }
}

/** The shared look of every hairline: 1 CSS px at any scale, round joins. As a class: `kg-line`. */
export const HAIRLINE: CSSProperties = {
  vectorEffect: 'non-scaling-stroke',
  strokeWidth: 1,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
}


