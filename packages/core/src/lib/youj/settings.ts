/* The values behind YoujProvider's settings: plain data, in a module with no
 * React in it, so a server component can read them (`COLOR_MODES`, `SCALINGS`)
 * the way it reads `themeProps`. The provider and the mode hooks are client
 * modules; their types and these lists live here. */

export const COLOR_MODES = ['system', 'light', 'dark'] as const
/** YoujProvider's `mode`: a fixed scheme, or `system` to follow the operating system. */
export type ColorMode = (typeof COLOR_MODES)[number]
/** The scheme on screen: what a mode resolves to. */
export type ColorScheme = 'light' | 'dark'

/** The mode of a page whose app sets none: dark, which is what the palette draws with no `data-theme`. */
export const DEFAULT_MODE: ColorMode = 'dark'

/** The UI scale steps (youj.css section 5). 100% is the size components are drawn at. */
export const SCALINGS = ['75%', '80%', '85%', '90%', '95%', '100%', '110%', '120%'] as const
export type YoujScaling = (typeof SCALINGS)[number]

/** The layout densities (ui.css): how much room panels, rows and fields give their content. Roomy is the default. */
export const DENSITIES = ['roomy', 'compact'] as const
export type YoujDensity = (typeof DENSITIES)[number]
