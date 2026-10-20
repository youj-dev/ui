import { create } from 'storybook/theming/create'
import { lockupSvg, svgDataUri } from '../packages/core/src/docs/brand/logo'
import { basalt, derivePalette, formatOklch, graphite, parseColor, toHex } from '../packages/core/src/lib/youj/theme'

/* Storybook chrome in youj colors. Hex mirrors of the OKLCH tokens in
 * src/styles/youj.css (Storybook's theming needs sRGB strings). */
export const palette = {
  dark: {
    canvas: '#0b0c0e',
    surface: '#121315',
    raised: '#1a1c1f',
    line: '#26282c',
    lineStrong: '#3e4045',
    fg: '#f2f3f5',
    fgMuted: '#a5a7ae',
    fgSubtle: '#72747b',
    accent: '#668bfe',
    accentContrast: '#0a0d16',
  },
  light: {
    canvas: '#f5f5f6',
    surface: '#ffffff',
    raised: '#eeeef0',
    line: '#e0e1e4',
    lineStrong: '#bfc1c6',
    fg: '#14161c',
    fgMuted: '#505259',
    fgSubtle: '#616369',
    accent: '#3554fc',
    accentContrast: '#fdfdfd',
  },
}

/** The logo's tittle, its one colour: Basalt's amber in dark, Graphite's blue in light, as the docs site wears them. */
const tittle = (mode: 'dark' | 'light') => toHex(parseColor(formatOklch(derivePalette(mode === 'dark' ? basalt : graphite, mode).accent))!)

const fontBase = "'Inter Variable', Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
const fontCode = "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"

export function youjTheme(mode: 'dark' | 'light') {
  const c = palette[mode]
  return create({
    base: mode,
    brandTitle: 'youj',
    brandUrl: './',
    brandTarget: '_self',
    brandImage: svgDataUri(lockupSvg({ ink: c.fg, accent: tittle(mode) })),

    colorPrimary: c.accent,
    colorSecondary: c.accent,

    appBg: c.canvas,
    appContentBg: c.canvas,
    appPreviewBg: c.canvas,
    appHoverBg: c.raised,
    appBorderColor: c.line,
    appBorderRadius: 8,

    fontBase,
    fontCode,

    textColor: c.fg,
    textInverseColor: c.canvas,
    textMutedColor: c.fgMuted,

    barBg: c.canvas,
    barTextColor: c.fgMuted,
    barHoverColor: c.fg,
    barSelectedColor: c.accent,

    buttonBg: c.raised,
    buttonBorder: c.line,
    booleanBg: c.raised,
    booleanSelectedBg: c.surface,

    inputBg: c.surface,
    inputBorder: c.line,
    inputTextColor: c.fg,
    inputBorderRadius: 6,
  })
}
