import { composeTheme, isPerMode, palettes, styles, type ControlSize, type PaletteId, type RadiusScale, type StyleId, type ThemeColor, type ThemeInput } from '@youj/core'

/* The playground's recipe (a palette and a style, plus the few choices a
 * visitor tunes) and what it makes: the ThemeInput the preview wears and the
 * snippet Copy hands over. The accents on offer are the palettes' own, so
 * they're tuned for both modes; a custom one is derived like any theme color. */

export type Mode = 'light' | 'dark'

export interface Recipe {
  palette: PaletteId
  style: StyleId
  /** A palette whose accent to borrow, or 'custom' for `custom`. */
  accent: PaletteId | 'custom'
  custom: string
  radius: RadiusScale
  controlSize: ControlSize
  mode: Mode
}

export const paletteOf = (id: PaletteId) => palettes.find((p) => p.id === id) ?? palettes[0]
export const styleOf = (id: StyleId) => styles.find((s) => s.id === id) ?? styles[0]

/** A palette and style as the recipe starts from them: the palette's accent, the style's corners and control size. */
export function fromPair(palette: PaletteId, style: StyleId, keep: Pick<Recipe, 'mode' | 'custom'>): Recipe {
  const s = styleOf(style)
  return { ...keep, palette, style: s.id, accent: palette, radius: s.radius ?? 'lg', controlSize: s.controlSize ?? 'default' }
}

const accentOf = (r: Recipe): ThemeColor => (r.accent === 'custom' ? r.custom : paletteOf(r.accent).accent ?? r.custom)

/** One mode's side of a color, for a swatch. */
export const sideOf = (color: ThemeColor | undefined, mode: Mode) => (isPerMode(color) ? color[mode] : (color ?? ''))

export function themeOf(r: Recipe): ThemeInput {
  return { ...composeTheme(paletteOf(r.palette), styleOf(r.style)), accent: accentOf(r), radius: r.radius, controlSize: r.controlSize }
}

/** What Copy puts on the clipboard: the recipe as code. */
export function snippetOf(r: Recipe): string {
  const own = fromPair(r.palette, r.style, r)
  const changed = [
    r.accent !== own.accent && `accent: ${JSON.stringify(accentOf(r))}`,
    r.radius !== own.radius && `radius: '${r.radius}'`,
    r.controlSize !== own.controlSize && `controlSize: '${r.controlSize}'`,
  ].filter(Boolean)
  const palette = `${r.palette}Palette`
  const style = `${r.style}Style`
  const theme = changed.length ? ` theme={{ ${changed.join(', ')} }}` : ''
  return `import { ${palette}, ${style} } from '@youj/core'\n\n<YoujProvider palette={${palette}} style={${style}}${theme}>`
}

export const RADII: { value: RadiusScale; name: string }[] = [
  { value: 'none', name: 'None' },
  { value: 'sm', name: 'Small' },
  { value: 'md', name: 'Medium' },
  { value: 'lg', name: 'Large' },
  { value: 'xl', name: 'Larger' },
  { value: 'full', name: 'Full' },
]

export const CONTROL_SIZES: { value: ControlSize; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'default', label: 'Default' },
  { value: 'comfortable', label: 'Roomy' },
]

export const COPY = {
  eyebrow: 'Theming',
  title: 'Make it yours, live',
  subtitle: 'Pick a palette and a style, then tune the accent, corners and control size. The page is built from the same components you install, so what you see is what you ship.',
  controls: 'Theme controls',
  palette: 'Palette',
  style: 'Style',
  accent: 'Accent',
  custom: 'Custom accent',
  radius: 'Corners',
  controlSize: 'Control size',
  mode: 'Mode',
  light: 'Light',
  dark: 'Dark',
  reset: 'Reset',
  copy: 'Copy theme',
  copied: 'Copied',
  preview: 'Preview',
  applied: (r: Recipe) => `${paletteOf(r.palette).name}, ${styleOf(r.style).name}, ${r.mode}`,
}

/** The mini landing page inside the preview. */
export const SITE = {
  name: 'Lumen',
  address: 'lumen.app',
  links: ['Product', 'Pricing', 'Docs'],
  signIn: 'Sign in',
  start: 'Start free',
  badge: 'New',
  badgeText: 'Scheduled reports',
  headline: 'Reports your team actually reads',
  lede: 'Lumen turns your product data into a short weekly digest, with the three numbers that moved and why.',
  email: 'Work email',
  emailPlaceholder: 'you@company.com',
  cta: 'Get started',
  note: 'Free for 14 days. No card needed.',
  digest: 'Weekly digest',
  digestNote: 'Sent Mondays at 9:00',
  range: 'Range',
  ranges: ['Week', 'Month'],
  metrics: [
    { label: 'Activation', value: '64%', share: 64 },
    { label: 'Retention', value: '81%', share: 81 },
    { label: 'Expansion', value: '23%', share: 23 },
  ],
  emailMe: 'Email me the digest',
  features: [
    { title: 'Plain answers', text: 'Every chart comes with a sentence that says what changed.' },
    { title: 'Shared by default', text: 'Digests land in Slack and email, so nobody has to log in.' },
    { title: 'Private by design', text: 'Your data stays in your warehouse. We only read it.' },
  ],
}
