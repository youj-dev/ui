import { DEFAULT_LOOK, isYoujLook, looks, type YoujLook, type LookInfo } from '@youj/core/lib/youj/look'

/* The component style in a Create link: `look=bezel`. The theme owns
 * color, type and the radius scale; the style owns how components are
 * built, and travels beside the theme and the frame. Classic, the default, is
 * left out of the link. The CLI reads the same parameter. */

export const LOOK_PARAM = 'look'

/** The styles Create offers, the default (classic) first: `id`, `name` and a one-line `description` each. */
export const LOOK_OPTIONS: readonly LookInfo[] = looks

/** The style a link names; anything missing or unknown is the default, classic. */
export function readLook(params: URLSearchParams): YoujLook {
  const value = params.get(LOOK_PARAM)
  return isYoujLook(value) ? value : DEFAULT_LOOK
}

/** The style as a URL parameter: none for the default (classic), so the link stays short. */
export function writeLook(style: YoujLook, params = new URLSearchParams()): URLSearchParams {
  if (style === DEFAULT_LOOK) params.delete(LOOK_PARAM)
  else params.set(LOOK_PARAM, style)
  return params
}

/** The registry item that copies a style's recipes into an app: `youj-look-bezel`. Null for classic, which has none. */
export function lookItem(style: YoujLook): string | null {
  return style === 'classic' ? null : `youj-look-${style}`
}

/** Where that item puts its stylesheet, beside ui.css (under `src/` when the app has one): `styles/bezel.css`. */
export function lookStylesheet(style: YoujLook): string | null {
  return style === 'classic' ? null : `styles/${style}.css`
}
