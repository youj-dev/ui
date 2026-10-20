
/* The UI's size in a Create link: the layout density and the scale the root
 * YoujProvider sets (`density`, `scaling`), as `layout=roomy&scale=100`.
 * `layout` because the layout density is a different thing from the theme's
 * `controlSize` (its control height, `controlSize=` in a link). The standard size, roomy at 100%, is the default
 * and is left out of the link. The CLI reads the same parameters. */

export const LAYOUT_PARAM = 'layout'
export const SCALE_PARAM = 'scale'

/** The layout density and UI scale a provider sets. */
export interface SizeConfig {
  density: YoujDensity
  scaling: YoujScaling
}

/** The standard size, the provider's own default: roomy at 100% (what `youj init` leaves, and Create's default). */
export const DEFAULT_SIZE: SizeConfig = { density: 'roomy', scaling: '100%' }

/** The same size, named for where a preview wants it: marketing, auth and content pages. */
export const ROOMY_SIZE: SizeConfig = DEFAULT_SIZE

/** The dense option for pro tools: compact panels at 90%. */
export const COMPACT_SIZE: SizeConfig = { density: 'compact', scaling: '90%' }

/** The densities, the default first, each with a one-line note. */
export const DENSITY_OPTIONS: readonly { value: YoujDensity; label: string; note: string }[] = [
  { value: 'roomy', label: 'Standard', note: 'The default: room in panels, rows and fields' },
  { value: 'compact', label: 'Compact', note: 'For dense pro tools: 16px panel sides, 36px rows' },
]

/* The provider's lists and types (its DENSITIES and SCALINGS), written out so the CLI, which reads this file, doesn't compile the provider. A test holds them equal. */
export const DENSITIES = ['roomy', 'compact'] as const
export const SCALINGS = ['75%', '80%', '85%', '90%', '95%', '100%', '110%', '120%'] as const
export type YoujDensity = (typeof DENSITIES)[number]
export type YoujScaling = (typeof SCALINGS)[number]

export const isDensity = (value: unknown): value is YoujDensity => DENSITIES.includes(value as YoujDensity)
export const isScaling = (value: unknown): value is YoujScaling => SCALINGS.includes(value as YoujScaling)

export const sameSize = (a: SizeConfig, b: SizeConfig) => a.density === b.density && a.scaling === b.scaling

/** A size in a few words: `Compact · 90%`. */
export const sizeLabel = (size: SizeConfig) => `${DENSITY_OPTIONS.find((o) => o.value === size.density)!.label} · ${size.scaling}`

/** The size a link names; anything missing or unknown keeps the default (roomy, 100%). */
export function readSize(params: URLSearchParams): SizeConfig {
  const density = params.get(LAYOUT_PARAM)
  const scale = params.get(SCALE_PARAM)
  const scaling = scale === null ? null : `${scale}%`
  return { density: isDensity(density) ? density : DEFAULT_SIZE.density, scaling: isScaling(scaling) ? scaling : DEFAULT_SIZE.scaling }
}

/** The size as URL parameters: only what differs from the default, so the link stays short. */
export function writeSize(size: SizeConfig, params = new URLSearchParams()): URLSearchParams {
  if (size.density === DEFAULT_SIZE.density) params.delete(LAYOUT_PARAM)
  else params.set(LAYOUT_PARAM, size.density)
  if (size.scaling === DEFAULT_SIZE.scaling) params.delete(SCALE_PARAM)
  else params.set(SCALE_PARAM, size.scaling.slice(0, -1))
  return params
}
