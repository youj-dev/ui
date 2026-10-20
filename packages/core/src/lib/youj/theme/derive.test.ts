import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { motionPersonalities, type MotionPersonality } from '../tokens'
import { contrast, formatOklch, inGamut, linearToOklab, linearToOklch, oklchToLinear, oklchToOklab, parseColor, type Oklch } from './color'
import { DEFAULTS, resolveTheme, themeVars, type ThemeInput } from './contract'
import { AUTO_CHART, DARK_CHART, DARK_INK, deriveChart, derivePalette, deriveRoles, deriveTheme, formatPaint, INK_DEFAULTS, inkCeiling, LIFT, MIN_CONTRAST, NEUTRAL_STEPS, PALETTE_TOKENS, ROLES, STEPS, toneMode, TONES, WASH_DIM, type Mode } from './derive'
import { basalt, themes } from './themes'

/* A fixture with a neutral of its own: the Graphite preset as it was hand-tuned before the palettes and styles split
 * (cool 270 grays, no lift, one ultramarine). The derivation's tests read it; youj.css's @theme registrations document it. */
const graphite = {
  id: 'graphite',
  neutral: { hue: 270, chroma: 0.012, wash: 0, lift: 0, page: 'gray' as const },
  accent: 'oklch(0.54 0.25 268)',
  success: { light: 'oklch(0.504 0.114 158)', dark: 'oklch(0.72 0.15 158)' },
  warning: { light: 'oklch(0.527 0.124 58)', dark: 'oklch(0.79 0.14 72)' },
  danger: { light: 'oklch(0.542 0.197 25)', dark: 'oklch(0.68 0.18 24)' },
  radius: 'lg' as const,
  controlSize: 'default' as const,
  chart: {
    light: ['oklch(0.54 0.22 266)', 'oklch(0.62 0.19 12)', 'oklch(0.46 0.19 302)', 'oklch(0.62 0.135 68)', 'oklch(0.58 0.095 200)'],
    dark: ['oklch(0.68 0.16 266)', 'oklch(0.74 0.16 12)', 'oklch(0.6 0.18 302)', 'oklch(0.83 0.14 78)', 'oklch(0.78 0.12 195)'],
  },
} satisfies ThemeInput

/* derive.ts is the JS mirror of the derivation in youj.css. These tests
 * hold it to Graphite's hand-tuned palette, keep its tables in step with the
 * CSS, and sweep the input space for the guarantees the docs promise. */

const css = readFileSync(resolve(__dirname, '../../../styles/youj.css'), 'utf8')

const GATED = '@supports (color: oklch(from red l c h)) and (scale: pow(2, 2))'

/** The declarations of the first rule whose selector (whitespace-normalized) is `selector`, optionally after `after`. */
function rule(selector: string, after = ''): Record<string, string> {
  const flat = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ')
  const from = after ? flat.indexOf(after) : 0
  if (from < 0) throw new Error(`no ${after}`)
  const start = flat.indexOf(`${selector} {`, from)
  if (start < 0) throw new Error(`no rule ${selector}`)
  const body = flat.slice(start + selector.length + 2, flat.indexOf('}', start))
  const out: Record<string, string> = {}
  for (const [, name, value] of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) out[name!] = value!.trim()
  return out
}

/** Every rule whose selector (whitespace-normalized) is `selector`, merged: the mode tables' constants sit in a `:root` rule of their own. */
function rules(selector: string): Record<string, string> {
  const flat = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ')
  const out: Record<string, string> = {}
  for (let at = flat.indexOf(`${selector} {`); at >= 0; at = flat.indexOf(`${selector} {`, at + 1)) {
    const body = flat.slice(at + selector.length + 2, flat.indexOf('}', at))
    for (const [, name, value] of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) out[name!] = value!.trim()
  }
  return out
}

/** The selector of the derivation: the root, each mode region, each theme scope and each tone scope. */
const SCOPES = ':root, [data-theme], [data-yj-theme], [data-yj-tone]'

/** `0.125`, `calc(1 / 8)` → a number. */
const num = (v: string) => {
  const calc = v.match(/^calc\(([\d.]+) \/ ([\d.]+)\)$/)
  return calc ? Number(calc[1]) / Number(calc[2]) : Number(v)
}

/** Color-vision deficiencies, simulated with Machado, Oliveira & Fernandes (2009) at full severity, in linear light. */
const SIMULATE = {
  normal: null,
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
} as const
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** A color as an eye with the deficiency `m` sees it, in OKLab. */
const seen = (c: Oklch, m: (typeof SIMULATE)[keyof typeof SIMULATE]) => {
  const rgb = oklchToLinear(c).map(clamp01)
  return linearToOklab((m ? m.map((row) => clamp01(row[0] * rgb[0]! + row[1] * rgb[1]! + row[2] * rgb[2]!)) : rgb) as [number, number, number])
}
/** How far apart two colors look to the eye `m`, in OKLab. */
const apart = (a: Oklch, b: Oklch, m: (typeof SIMULATE)[keyof typeof SIMULATE]) => {
  const [x, y] = [seen(a, m), seen(b, m)]
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
}

describe('Graphite', () => {
  // The pre-theme palette, value for value, with two deliberate changes:
  // fg-subtle (0.6 / 0.56 before), lifted to 4.5:1 for text (Option A), and
  // the light app ladder: white cards on a soft gray page, raised wells a
  // step below the page, hairline lines. The accent reads at 4.5:1 on raised
  // as given.
  const expected = {
    light: {
      canvas: 'oklch(0.965 0.0015 270)',
      surface: 'oklch(1 0 0)',
      raised: 'oklch(0.95 0.003 270)',
      line: 'oklch(0.885 0.004 270)',
      'line-strong': 'oklch(0.72 0.007 270)',
      fg: 'oklch(0.2 0.012 270)',
      'fg-muted': 'oklch(0.44 0.012 270)',
      'fg-subtle': 'oklch(0.5 0.01 270)',
      accent: 'oklch(0.54 0.25 268)',
      'accent-contrast': 'oklch(0.995 0 0)',
      success: 'oklch(0.504 0.114 158)',
      warning: 'oklch(0.527 0.124 58)',
      danger: 'oklch(0.542 0.197 25)',
      input: 'oklch(0.566 0.0091 270)',
    },
    dark: {
      canvas: 'oklch(0.155 0.005 270)',
      surface: 'oklch(0.185 0.006 270)',
      raised: 'oklch(0.225 0.007 270)',
      line: 'oklch(0.275 0.008 270)',
      'line-strong': 'oklch(0.37 0.01 270)',
      fg: 'oklch(0.965 0.003 270)',
      'fg-muted': 'oklch(0.73 0.01 270)',
      'fg-subtle': 'oklch(0.625 0.01 270)',
      accent: 'oklch(0.665 0.175 268)',
      'accent-contrast': 'oklch(0.16 0.02 270)',
      success: 'oklch(0.72 0.15 158)',
      warning: 'oklch(0.79 0.14 72)',
      danger: 'oklch(0.68 0.18 24)',
      input: 'oklch(0.5485 0.01 270)',
    },
  }

  test('the preset reproduces the hand-tuned palette in both modes', () => {
    expect(deriveTheme(graphite)).toEqual(expected)
  })

  test('an empty theme, and no theme, derive Basalt, what a page with no theme wears', () => {
    expect(deriveTheme({})).toEqual(deriveTheme(basalt))
    expect(deriveTheme(null)).toEqual(deriveTheme(basalt))
    expect(deriveTheme({ id: 'acme' })).toEqual(deriveTheme(basalt))
  })

  test('the @theme registrations document Graphite light', () => {
    const theme = rule('@theme')
    // input is the line-control role's base, and raised the private step under overlay, well and key: neither is registered.
    for (const [token, value] of Object.entries(expected.light)) {
      if (token !== 'input' && token !== 'raised') expect([token, theme[`color-${token}`]]).toEqual([token, value])
    }
    expect(theme['color-raised']).toBeUndefined()
  })
})

describe('the CSS and JS derivations agree', () => {
  test('the mode tables hold each step for light and dark, and the scopes pick the mode’s by --yj-dark', () => {
    const table = rules(':root')
    expect(num(table['yj-wash-dim-light']!)).toBe(WASH_DIM.light)
    expect(num(table['yj-wash-dim-dark']!)).toBe(WASH_DIM.dark)
    expect(num(table['yj-surface-w-light']!)).toBe(STEPS.light.surface.w)
    expect(num(table['yj-surface-w-dark']!)).toBe(STEPS.dark.surface.w)
    for (const mode of ['light', 'dark'] as const) {
      for (const step of NEUTRAL_STEPS) {
        expect([mode, step, num(table[`yj-${step}-l-${mode}`]!), num(table[`yj-${step}-c-${mode}`]!)]).toEqual([mode, step, STEPS[mode][step].l, STEPS[mode][step].c])
        // A step the CSS doesn't lift has no -lift entry: the JS must not lift it either. Light lifts nothing.
        expect([mode, step, num(table[`yj-${step}-lift-${mode}`] ?? '0')]).toEqual([mode, step, LIFT[mode][step]])
      }
    }
    // The mode itself: a page with no data-theme is dark.
    expect(num(rules(":root, [data-theme='dark']")['yj-dark']!)).toBe(1)
    expect(num(rules("[data-theme='light']")['yj-dark']!)).toBe(0)
    // Each scope picks by light * (1 - dark) + dark * dark, exact at 0 and 1; a lift is the dark one times --yj-dark.
    const scope = rule(SCOPES)
    for (const step of NEUTRAL_STEPS) {
      expect(scope[`yj-${step}-l`]).toBe(`calc(var(--yj-${step}-l-light) * (1 - var(--yj-dark)) + var(--yj-${step}-l-dark) * var(--yj-dark))`)
      expect(scope[`yj-${step}-c`]).toBe(`calc(var(--yj-${step}-c-light) * (1 - var(--yj-dark)) + var(--yj-${step}-c-dark) * var(--yj-dark))`)
      if (LIFT.dark[step] > 0) expect(scope[`yj-${step}-lift`]).toBe(`calc(var(--yj-${step}-lift-dark) * var(--yj-dark))`)
    }
    expect(scope['yj-wash-dim']).toBe('calc(var(--yj-wash-dim-light) * (1 - var(--yj-dark)) + var(--yj-wash-dim-dark) * var(--yj-dark))')
    expect(scope['yj-surface-w']).toBe('calc(var(--yj-surface-w-light) * (1 - var(--yj-dark)) + var(--yj-surface-w-dark) * var(--yj-dark))')
  })

  /** A step's lightness formula: the hairline's for line, the plane's (before a white page swaps them) for canvas and surface. */
  const lightness = (derivation: Record<string, string>, step: (typeof NEUTRAL_STEPS)[number]) =>
    step === 'line'
      ? derivation['yj-hairline-l']!
      : step === 'canvas' || step === 'surface'
        ? derivation[`yj-${step}-plane-l`]!
        : step === 'raised'
          ? derivation['yj-raised']!
          : derivation[`color-${step}`]!

  test('the lift raises exactly the steps the JS lifts, by the neutral lift', () => {
    const derivation = rule(SCOPES)
    for (const step of NEUTRAL_STEPS) {
      const formula = lightness(derivation, step)
      const lifts = formula.includes(`var(--yj-${step}-lift) * var(--yj-neutral-lift)`)
      expect([step, lifts]).toEqual([step, LIFT.dark[step] > 0])
    }
    // Light mode has no lift, and a lift of 0 is today's palette in both modes.
    for (const mode of ['light', 'dark'] as const) expect(derivePalette({ ...graphite, neutral: { ...graphite.neutral, lift: 0 } }, mode)).toEqual(derivePalette(graphite, mode))
    expect(derivePalette({ ...graphite, neutral: { ...graphite.neutral, lift: 1 } }, 'light')).toEqual(derivePalette(graphite, 'light'))
    const lifted = derivePalette({ neutral: { hue: 270, chroma: 0.012, lift: 1 } }, 'dark')
    const flat = derivePalette(graphite, 'dark')
    // A full lift doubles the step from page to card.
    expect(lifted.surface[0] - lifted.canvas[0]).toBeCloseTo(2 * (flat.surface[0] - flat.canvas[0]), 9)
  })

  test('wash dims exactly the steps the JS dims, and pulls surface toward --yj-surface-w', () => {
    const derivation = rule(SCOPES)
    for (const step of NEUTRAL_STEPS) {
      // line is the hairline (the dimmed step) drawn toward fg by the stroke ink.
      const dims = lightness(derivation, step).includes('var(--yj-wash-dim)')
      expect([step, dims]).toEqual([step, STEPS.light[step].dim])
    }
    expect(derivation['yj-surface-plane-c']).toContain('var(--yj-surface-w)')
  })

  test('light mode lays an app out: white cards on a soft gray page, wells a step below it', () => {
    const { canvas, surface, raised } = derivePalette(graphite, 'light')
    expect(surface).toEqual([1, 0, 270])
    expect(canvas[0]).toBeLessThan(surface[0])
    expect(raised[0]).toBeLessThan(canvas[0])
  })

  test('a white page swaps the page and card planes in light mode only, in CSS as in JS', () => {
    const white = { ...graphite, neutral: { ...graphite.neutral, page: 'white' as const } }
    const gray = derivePalette(graphite, 'light')
    const page = derivePalette(white, 'light')
    expect([page.canvas, page.surface]).toEqual([gray.surface, gray.canvas])
    // Nothing else moves, and dark mode is untouched.
    for (const token of PALETTE_TOKENS.filter((t) => t !== 'canvas' && t !== 'surface')) expect([token, page[token]]).toEqual([token, gray[token]])
    expect(derivePalette(white, 'dark')).toEqual(derivePalette(graphite, 'dark'))
    const derivation = rule(SCOPES)
    expect(derivation['yj-page-swap']).toBe('calc(var(--yj-neutral-page) * (1 - var(--yj-dark)))')
    expect(derivation['color-canvas']).toContain('(var(--yj-surface-plane-l) - var(--yj-canvas-plane-l)) * var(--yj-page-swap)')
    expect(derivation['color-surface']).toContain('(var(--yj-canvas-plane-l) - var(--yj-surface-plane-l)) * var(--yj-page-swap)')
  })

  test('the stroke ink draws line toward fg along its hue, as the JS does', () => {
    const derivation = rule(SCOPES)
    expect(derivation['color-line']).toBe(
      'oklch( calc(var(--yj-hairline-l) + (var(--yj-fg-l) - var(--yj-hairline-l)) * var(--yj-stroke-ink)) calc(var(--yj-hairline-c) + (var(--yj-ink-c) - var(--yj-hairline-c)) * var(--yj-stroke-ink)) var(--yj-neutral-hue) )',
    )
    for (const mode of ['light', 'dark'] as const) {
      const plain = derivePalette(graphite, mode)
      const inked = derivePalette({ ...graphite, stroke: { ink: 1 } }, mode)
      inked.line.forEach((v, i) => expect(v).toBeCloseTo(plain.fg[i]!, 9))
      const half = derivePalette({ ...graphite, stroke: { ink: 0.5 } }, mode)
      expect(half.line[0]).toBeCloseTo((plain.line[0] + plain.fg[0]) / 2, 9)
      // The field border leans the same way, so it only gains contrast.
      expect(Math.abs(inked.input[0] - plain.fg[0])).toBeLessThan(1e-9)
    }
  })

  test('browsers that cannot derive keep Basalt’s ink pairs, and a theme’s hand-tuned ones', () => {
    const base = rule(SCOPES)
    for (const ink of ['accent', 'success', 'warning', 'danger'] as const) {
      const [l, c, h] = INK_DEFAULTS.light[ink]
      const [dl, dc, dh] = INK_DEFAULTS.dark[ink]
      expect(base[`color-${ink}`]).toBe(
        `color-mix( in oklab, var(--yj-${ink}-light, oklch(${l} ${c} ${h})) calc(100% - 100% * var(--yj-dark)), var(--yj-${ink}-dark, oklch(${dl} ${dc} ${dh})) )`,
      )
    }
    expect(base['yj-accent-l']).toBeUndefined()
  })

  test('a single colour wins over a pair set beside it; a pair wins over the default, in every browser', () => {
    const derivation = rule(SCOPES, GATED)
    for (const ink of ['accent', 'success', 'warning', 'danger'] as const) {
      // -own-l is the derived light ink only when the single colour is set (it reads --yj-<ink> with no fallback).
      expect(derivation[`yj-${ink}-own-l`]).toBe(`color-mix(in oklab, var(--yj-${ink}-l) 100%, var(--yj-${ink}) 0%)`)
      expect(derivation[`color-${ink}`]).toMatch(new RegExp(`^color-mix\\( in oklab, var\\(--yj-${ink}-own-l, var\\(--yj-${ink}-light, var\\(--yj-${ink}-l\\)\\)\\) `))
      expect(derivation[`color-${ink}`]).toContain(`var(--yj-${ink}-d, var(--yj-${ink}-dark, `)
    }
    // Older browsers can't derive, so there the pair (or the default) is all there is.
    const fallback = rule(SCOPES)
    expect(fallback['color-accent']).toContain('var(--yj-accent-light, oklch(0.54 0.25 268))')
    // A per-mode chart palette needs no derivation either: declared outside the gate, invalid (the ramp) until both sides are set.
    const base = rule(SCOPES)
    for (let i = 1; i <= 5; i++) {
      expect(base[`yj-chart-${i}-color`]).toBe(`color-mix(in oklab, var(--yj-chart-${i}-light) calc(100% - 100% * var(--yj-dark)), var(--yj-chart-${i}-dark))`)
    }
  })

  test('ink rules use the same floor, chroma cap, ceiling and defaults', () => {
    const derivation = rule(SCOPES, GATED)
    for (const ink of ['accent', 'success', 'warning', 'danger'] as const) {
      const [l, c, h] = INK_DEFAULTS.light[ink]
      const [dl, dc, dh] = INK_DEFAULTS.dark[ink]
      expect(derivation[`yj-${ink}-l`]).toContain(`var(--yj-${ink}, oklch(${l} ${c} ${h}))`)
      expect(derivation[`yj-${ink}-d`]).toBe(
        `oklch(from var(--yj-${ink}) max(l, ${DARK_INK.floor}) min(c, ${DARK_INK.maxChroma}, calc(c * (1 - max(l, ${DARK_INK.floor})) / max(1 - l, 0.001))) h)`,
      )
      expect(derivation[`color-${ink}`]).toContain(`var(--yj-${ink}-d, var(--yj-${ink}-dark, oklch(${dl} ${dc} ${dh})))`)
    }
    expect(derivation['yj-ink-y']).toMatch(/pow\(var\(--yj-raised-l\) - var\(--yj-wash-dim\) \* var\(--yj-neutral-wash\), 3\) - 0\.8 \*/)
    expect(derivation['yj-ink-y']).toMatch(/\/ 4\.5 - 0\.0502\s*\)$/)
  })

  test('chart rules hold 3:1 with the same floor and chroma cap, and exist only where the browser can derive', () => {
    const derivation = rule(SCOPES, GATED)
    for (let i = 1; i <= 5; i++) {
      expect(derivation[`yj-chart-${i}-l`]).toMatch(new RegExp(`^color\\( from var\\(--yj-chart-${i}\\) srgb-linear calc\\(r \\* min\\(1, var\\(--yj-chart-y\\)`))
      expect(derivation[`yj-chart-${i}-d`]).toBe(
        `oklch(from var(--yj-chart-${i}) max(l, ${DARK_CHART.floor}) min(c, ${DARK_CHART.maxChroma}, calc(c * (1 - max(l, ${DARK_CHART.floor})) / max(1 - l, 0.001))) h)`,
      )
      // The theme's own single color, derived, wins; then a series tuned per mode; unset, the one drawn from the accent.
      expect(derivation[`yj-chart-${i}-color`]).toBe(
        `color-mix( in oklab, var(--yj-chart-${i}-l, var(--yj-chart-${i}-light, var(--yj-chart-${i}-auto))) calc(100% - 100% * var(--yj-dark)), var(--yj-chart-${i}-d, var(--yj-chart-${i}-dark, var(--yj-chart-${i}-auto))) )`,
      )
    }
    expect(derivation['yj-chart-y']).toBe(derivation['yj-ink-y']!.replace('/ 4.5 - 0.0502', '/ 3 - 0.0502'))
    // Browsers that can't derive only read a palette tuned per mode: a single one, or none, leaves them ui.css's ramp.
    expect(rule(SCOPES)['yj-chart-1-l']).toBeUndefined()
    expect(rule(SCOPES)['yj-chart-2-auto']).toBeUndefined()
  })

  test('the palette drawn from the accent uses the same hues, seed, luminances and gamut step as AUTO_CHART', () => {
    const derivation = rule(SCOPES, GATED)
    // Series 1 is the accent itself.
    expect(derivation['yj-chart-1-auto']).toBe('var(--color-accent)')
    const { seed, y, pull } = AUTO_CHART
    const num = (v: number) => String(Number(v.toFixed(6)))
    // `a ± |c| * x`, leaving out a term whose coefficient is 0, as the stylesheet spells it.
    const term = (c: number, x: string) => (c === 0 ? '' : ` ${c > 0 ? '+' : '-'} ${num(Math.abs(c))} * ${x}`)
    const Y = '(0.2126 * r + 0.7152 * g + 0.0722 * b)'
    const [toYellow, toBlue] = ['max(0, 2 * alpha - 1)', 'max(0, 1 - 2 * alpha)']
    AUTO_CHART.hues.forEach((hue, i) => {
      const n = i + 2
      // The seed: the accent's hue turned by the offset, at the seed lightness and each mode's chroma; its alpha says how near it is to the yellow and the blue.
      const near = (centre: number) => `pow(max(0, cos((h + ${hue} - ${centre}) * 1deg)), ${pull.power})`
      expect(derivation[`yj-chart-${n}-seed`]).toBe(
        `oklch( from var(--color-accent) ${seed.l} calc(${seed.c.light} - ${num(seed.c.light - seed.c.dark)} * var(--yj-dark)) calc(h + ${hue}) / calc(0.5 + 0.5 * ${near(pull.yellow.hue)} - 0.5 * ${near(pull.blue.hue)}) )`,
      )
      // Scaled to its luminance: a share of the ceiling in light mode, drawn toward it near yellow; in dark, drawn toward 0.5 near yellow and 0.22 near blue.
      const light = `(${num(y.light[i]!)}${term(pull.yellow.to.light - y.light[i]!, toYellow)})`
      const dark = `(${num(y.dark[i]!)}${term(pull.yellow.to.dark - y.dark[i]!, toYellow)}${term(pull.blue.to.dark - y.dark[i]!, toBlue)})`
      const target = `((1 - var(--yj-dark)) * var(--yj-chart-y) * ${light} + var(--yj-dark) * ${dark})`
      const scale = (c: string) => `calc(${c} * ${target} / max(${Y}, 0.000001))`
      expect(derivation[`yj-chart-${n}-s`]).toBe(`color( from var(--yj-chart-${n}-seed) srgb-linear ${scale('r')} ${scale('g')} ${scale('b')} / 1 )`)
      // Then toward the gray of that luminance, only as far as sRGB needs.
      const t = `min(1, ${Y} / max(${Y} - min(r, g, b), 0.000001), (1 - ${Y}) / max(max(r, g, b) - ${Y}, 0.000001))`
      const channel = (c: string) => `calc(${Y} + (${c} - ${Y}) * ${t})`
      expect(derivation[`yj-chart-${n}-auto`]).toBe(`color( from var(--yj-chart-${n}-s) srgb-linear ${channel('r')} ${channel('g')} ${channel('b')} )`)
    })
  })

  test('the contract defaults on :root are Basalt, the theme a page wears with none set', () => {
    const contract = rule(':root')
    for (const [name, value] of Object.entries(themeVars(basalt))) {
      const key = name.slice(2)
      if (value === 'initial') expect([key, contract[key]]).toEqual([key, undefined])
      else expect([key, contract[key]]).toEqual([key, value])
    }
  })

  test('a complete theme falls back to Basalt for what it leaves out', () => {
    expect(resolveTheme({ id: 'mine' })).toMatchObject(DEFAULTS)
    expect(DEFAULTS.neutral).toMatchObject(basalt.neutral)
  })

  test("INK_DEFAULTS are Basalt's accent and status pairs", () => {
    for (const ink of ['accent', 'success', 'warning', 'danger'] as const) {
      const pair = basalt[ink] as { light: string; dark: string }
      const [l, c, h] = INK_DEFAULTS.light[ink]
      const [dl, dc, dh] = INK_DEFAULTS.dark[ink]
      expect(pair).toEqual({ light: `oklch(${l} ${c} ${h})`, dark: `oklch(${dl} ${dc} ${dh})` })
    }
  })

  test.each(['precise', 'calm', 'lively'] as MotionPersonality[])('the %s personality has the same durations and curves', (name) => {
    const block = rule(name === 'precise' ? ":root, [data-yj-motion='precise']" : `[data-yj-motion='${name}']`)
    const tokens = motionPersonalities[name]
    for (const [token, ms] of Object.entries(tokens.durations)) expect([token, block[`yj-ms-${token}`]]).toEqual([token, `${ms}ms`])
    for (const token of ['standard', 'enter', 'exit', 'emphasized'] as const) {
      expect([token, block[`ease-${token}`]]).toEqual([token, `cubic-bezier(${tokens.easings[token].join(', ')})`])
    }
  })
})

describe('roles', () => {
  const modes: Mode[] = ['light', 'dark']
  const near = (a: readonly number[], b: readonly number[], digits = 9) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, digits))

  test('the @theme registrations document Graphite light for every role', () => {
    const theme = rule('@theme')
    const roles = deriveRoles(graphite, 'light')
    for (const role of ROLES) expect([role, theme[`color-${role}`]]).toEqual([role, formatPaint(roles[role])])
  })

  test('every role is declared as --color-<role> on every scope and tone', () => {
    const declared = new Set([...Object.keys(rule(SCOPES)), ...Object.keys(rule(SCOPES, '--yj-glass: 85%;')), ...Object.keys(rule(SCOPES, GATED))])
    for (const role of ROLES) expect([role, declared.has(`color-${role}`)]).toEqual([role, true])
  })

  test('the roles that are tints of an ink are the closed set: ink at 10% + 4% in dark, 35%; neutral at 5, 6 and 9%', () => {
    const block = rule(SCOPES, '--yj-glass: 85%;')
    for (const ink of ['accent', 'success', 'warning', 'danger', 'info']) {
      expect(block[`color-${ink}-text`]).toBe(`color-mix(in oklab, var(--color-${ink}) 80%, var(--color-fg))`)
      expect(block[`color-${ink}-subtle`]).toBe(`color-mix(in oklab, var(--color-${ink}) calc(10% + 4% * var(--yj-dark)), transparent)`)
      expect(block[`color-${ink}-line`]).toBe(`color-mix(in oklab, var(--color-${ink}) 35%, transparent)`)
    }
    expect(block['color-hover']).toBe('color-mix(in oklab, var(--color-fg) 6%, transparent)')
    expect(block['color-selected']).toBe('color-mix(in oklab, var(--color-fg) 9%, transparent)')
    expect(block['color-band']).toBe('color-mix(in oklab, var(--color-fg) 5%, transparent)')
    for (const dark of [0, 1]) {
      const r = deriveRoles(graphite, dark ? 'dark' : 'light')
      expect([dark, r['accent-subtle'].alpha, r.selected.alpha, r.hover.alpha, r.band.alpha, r['accent-line'].alpha]).toEqual([dark, 0.1 + 0.04 * dark, 0.09, 0.06, 0.05, 0.35])
    }
  })

  test('a role is the token it replaces: the same palette entry, or the same mix of palette entries', () => {
    for (const theme of themes) {
      for (const mode of modes) {
        const p = derivePalette(theme, mode)
        const r = deriveRoles(theme, mode)
        for (const [role, step] of [['canvas', 'canvas'], ['surface', 'surface'], ['line', 'line'], ['line-strong', 'line-strong'], ['fg', 'fg'], ['fg-muted', 'fg-muted'], ['fg-subtle', 'fg-subtle'], ['on-accent', 'accent-contrast'], ['line-control', 'input'], ['accent', 'accent'], ['focus', 'accent'], ['danger', 'danger'], ['success', 'success'], ['warning', 'warning'], ['chrome', 'canvas']] as const) {
          expect([theme.id, mode, role, r[role].color]).toEqual([theme.id, mode, role, p[step]])
          expect(r[role].alpha).toBe(1)
        }
        // A tint is its colour at an alpha.
        near(r.hover.color, p.fg)
        near(r['danger-subtle'].color, p.danger)
        // Light's white plane: overlays, fields, keys and the control are the card's white in light on a gray page.
        if (mode === 'light') for (const role of ['overlay', 'field', 'key', 'control', 'chrome-float'] as const) near(r[role].color.slice(0, 2), derivePalette({ ...theme, neutral: { ...theme.neutral, page: 'gray' } }, 'light').surface.slice(0, 2))
      }
    }
  })

  test('info is the accent until a theme sets it, then an ink of its own', () => {
    for (const mode of modes) {
      expect(deriveRoles(graphite, mode).info).toEqual(deriveRoles(graphite, mode).accent)
      const teal = deriveRoles({ ...graphite, info: '#0e9aa7' }, mode)
      expect(teal.info.color).not.toEqual(teal.accent.color)
    }
    // Derived like the others: darkened for light surfaces, lifted for dark ones, so its text passes.
    const lighter = deriveRoles({ ...graphite, info: '#7dd3fc' }, 'light')
    expect(lighter.info.color[0]).toBeLessThan(0.7)
    expect(deriveRoles({ ...graphite, info: { light: '#0369a1', dark: '#7dd3fc' } }, 'dark').info.color).toEqual(oklchOf('#7dd3fc'))
  })

  /** A color in OKLCH, as the derivation reads it. */
  function oklchOf(value: string): Oklch {
    return linearToOklch(parseColor(value)!)
  }

  test('tone: floating chrome is the page’s mode unless the theme holds it to one; bars and overlays follow the page or it; the inverse is the page’s opposite', () => {
    const at = (tone: ThemeInput['tone'], scope: (typeof TONES)[number] | undefined, page: Mode) => toneMode({ ...graphite, tone }, scope, page)
    for (const page of modes) {
      for (const scope of [undefined, ...TONES] as const) {
        // Defaults: every tone but the inverse is the page's own.
        expect([page, scope, at(undefined, scope, page)]).toEqual([page, scope, scope === 'inverse' ? (page === 'dark' ? 'light' : 'dark') : page])
      }
      expect(at({ chrome: 'dark' }, 'chrome', page)).toBe('dark')
      expect(at({ chrome: 'light' }, 'chrome', page)).toBe('light')
      expect(at({ chrome: 'dark' }, 'overlay', page)).toBe(page)
      expect(at({ chrome: 'dark', overlays: 'chrome' }, 'overlay', page)).toBe('dark')
      expect(at({ chrome: 'light', overlays: 'chrome' }, 'overlay', page)).toBe('light')
      expect(at({ chrome: 'dark' }, 'float', page)).toBe('dark')
      // Bars that follow the content keep the page's mode; floating chrome and chrome-following overlays still take the chrome's.
      expect(at({ chrome: 'dark', bars: 'content' }, 'chrome', page)).toBe(page)
      expect(at({ chrome: 'dark', bars: 'content' }, 'float', page)).toBe('dark')
      expect(at({ chrome: 'dark', bars: 'content' }, 'header', page)).toBe(page)
      // A top bar alone: the header takes the chrome's mode, the sidebar the page's.
      expect(at({ chrome: 'dark', bars: 'top' }, 'header', page)).toBe('dark')
      expect(at({ chrome: 'dark', bars: 'top' }, 'chrome', page)).toBe(page)
      expect(at({ chrome: 'dark' }, 'header', page)).toBe('dark')
      expect(at({ chrome: 'dark', bars: 'content', overlays: 'chrome' }, 'overlay', page)).toBe('dark')
      // Ink overlays keep the page's mode.
      expect(at({ chrome: 'dark', overlays: 'ink' }, 'overlay', page)).toBe(page)
      // Tones are absolute: the inverse is the page's opposite however chrome is held.
      expect(at({ chrome: 'dark' }, 'inverse', page)).toBe(page === 'dark' ? 'light' : 'dark')
    }
    const scope = rules(':root, [data-theme], [data-yj-theme]')
    expect(scope['yj-float-m']).toBe('calc(var(--yj-dark) * (1 - var(--yj-tone-chrome-fixed)) + var(--yj-tone-chrome-dark) * var(--yj-tone-chrome-fixed))')
    expect(scope['yj-header-m']).toBe('calc(var(--yj-dark) * (1 - var(--yj-tone-header-chrome)) + var(--yj-float-m) * var(--yj-tone-header-chrome))')
    expect(scope['yj-chrome-m']).toBe('calc(var(--yj-dark) * (1 - var(--yj-tone-bars-chrome)) + var(--yj-float-m) * var(--yj-tone-bars-chrome))')
    expect(scope['yj-overlay-m']).toBe('calc(var(--yj-dark) * (1 - var(--yj-tone-overlay-chrome)) + var(--yj-float-m) * var(--yj-tone-overlay-chrome))')
    expect(scope['yj-inverse-m']).toBe('calc(1 - var(--yj-dark))')
    for (const tone of TONES) expect(rules(`[data-yj-tone='${tone}']`)['yj-dark']).toBe(`var(--yj-${tone}-m)`)
  })

  test('a tone scope derives every role again in its mode: a dark chrome on a light page is the dark theme’s', () => {
    const two = { ...graphite, tone: { chrome: 'dark', overlays: 'content' } } as const
    for (const role of ROLES) {
      expect([role, deriveRoles(two, 'light', 'chrome')[role]]).toEqual([role, deriveRoles(two, 'dark')[role]])
      // The page and the overlays are untouched.
      expect([role, deriveRoles(two, 'light')[role]]).toEqual([role, deriveRoles(graphite, 'light')[role]])
      expect([role, deriveRoles(two, 'light', 'overlay')[role]]).toEqual([role, deriveRoles(graphite, 'light')[role]])
    }
    // Overlays that follow the chrome are dark too; the inverse of a light page is dark whatever the chrome.
    const follow = { ...two, tone: { chrome: 'dark', overlays: 'chrome' } } as const
    expect(deriveRoles(follow, 'light', 'overlay').overlay).toEqual(deriveRoles(follow, 'dark').overlay)
    expect(deriveRoles(graphite, 'light', 'inverse').surface).toEqual(deriveRoles(graphite, 'dark').surface)
    // Held to a mode, chrome in dark is a no-op; 'light' gives the mirror image.
    expect(deriveRoles(two, 'dark', 'chrome')).toEqual(deriveRoles(two, 'dark'))
    expect(deriveRoles({ ...graphite, tone: { chrome: 'light' } }, 'dark', 'chrome').canvas).toEqual(deriveRoles(graphite, 'light').canvas)
  })

  test('with the default tone every scope but the inverse derives what the page does', () => {
    for (const theme of themes) {
      for (const mode of modes) {
        for (const tone of ['chrome', 'overlay'] as const) expect(deriveRoles(theme, mode, tone)).toEqual(deriveRoles(theme, mode))
      }
    }
  })

  test('the scrim is the shadow ink at each mode’s scrim alpha, set on the root; light and shade are constants', () => {
    const root = rules(':root')
    expect(root['yj-scrim-light']).toBe('0.24')
    expect(root['yj-scrim-dark']).toBe('0.62')
    expect(root['yj-light']).toBe('oklch(1 0 0)')
    expect(root['yj-shade']).toBe('oklch(0 0 0)')
    expect(rule(SCOPES, '--yj-glass: 85%;')['color-scrim']).toBe(
      'color-mix( in oklab, var(--color-shadow) calc(100% * (var(--yj-scrim-light) * (1 - var(--yj-dark)) + var(--yj-scrim-dark) * var(--yj-dark))), transparent )',
    )
    expect(deriveRoles(graphite, 'dark').scrim).toEqual({ color: [0, 0, 270], alpha: 0.62 })
    expect(deriveRoles(graphite, 'light').scrim).toEqual({ color: deriveRoles(graphite, 'light').shadow.color, alpha: 0.24 })
  })
})

/* The guarantees. Option A: fg-subtle clears 4.5:1 as text and the field
 * border 3:1, on every surface, for any valid neutral. Accent and status
 * colors are moved until they pass, whatever the input. */
describe('guarantees', () => {
  const surfaces = ['canvas', 'surface', 'raised'] as const
  const modes: Mode[] = ['light', 'dark']
  const rgb = (c: Oklch) => oklchToLinear(c)

  const neutrals: { hue: number; chroma: number; wash: number; lift: number }[] = []
  for (let hue = 0; hue < 360; hue += 15)
    for (const chroma of [0, 0.012, 0.025, 0.04]) for (const wash of [0, 0.5, 1]) for (const lift of [0, 0.5, 1]) neutrals.push({ hue, chroma, wash, lift })

  test.each(modes)('%s: text and field borders clear AA for any valid neutral', (mode) => {
    const failures: string[] = []
    for (const neutral of neutrals) {
      const p = derivePalette({ neutral }, mode)
      for (const s of surfaces) {
        for (const text of ['fg', 'fg-muted', 'fg-subtle'] as const) {
          const r = contrast(rgb(p[text]), rgb(p[s]))
          if (r < 4.5) failures.push(`${JSON.stringify(neutral)} ${text} on ${s}: ${r.toFixed(2)}`)
        }
        const b = contrast(rgb(p.input), rgb(p[s]))
        if (b < 3) failures.push(`${JSON.stringify(neutral)} input on ${s}: ${b.toFixed(2)}`)
      }
    }
    expect(failures).toEqual([])
  })

  // Colors across hue, lightness and chroma (kept inside sRGB), on a plain and a washed neutral.
  const inks: string[] = []
  for (let h = 0; h < 360; h += 20) for (const l of [0.25, 0.45, 0.6, 0.75, 0.9]) for (const c of [0.04, 0.1, 0.18, 0.3]) {
    if (inGamut(oklchToLinear([l, c, h]))) inks.push(`oklch(${l} ${c} ${h})`)
  }
  // The darkest a dark-mode ink gets: on the floor at the chroma cap, the corner a lifted surface tests.
  for (let h = 0; h < 360; h += 10) if (inGamut(oklchToLinear([DARK_INK.floor, DARK_INK.maxChroma, h]))) inks.push(`oklch(${DARK_INK.floor} ${DARK_INK.maxChroma} ${h})`)

  test.each(modes)('%s: any accent is moved until it reads at 4.5:1 and carries text at 4.5:1', (mode) => {
    const failures: string[] = []
    for (const neutral of [DEFAULTS.neutral, { hue: 80, chroma: 0.04, wash: 1 }, { hue: 285, chroma: 0.04, wash: 1, lift: 1 }]) {
      for (const accent of inks) {
        const p = derivePalette({ neutral, accent }, mode)
        for (const s of surfaces) {
          const r = contrast(rgb(p.accent), rgb(p[s]))
          if (r < 4.5) failures.push(`${accent} on ${s}: ${r.toFixed(2)}`)
        }
        const on = contrast(rgb(p['accent-contrast']), rgb(p.accent))
        if (on < 4.5) failures.push(`text on ${accent}: ${on.toFixed(2)}`)
      }
    }
    expect(inks.length).toBeGreaterThan(150)
    expect(failures).toEqual([])
  })

  test('light mode leaves a colour alone when it already passes', () => {
    const [l, c, h] = derivePalette({ accent: 'oklch(0.45 0.12 150)' }, 'light').accent
    expect([l, c, h].map((v) => Number(v.toFixed(3)))).toEqual([0.45, 0.12, 150])
  })

  test('light mode darkens a bright colour in linear light, keeping its hue exactly', () => {
    const [l, , h] = derivePalette({ accent: '#ffd400' }, 'light').accent
    expect(l).toBeLessThan(0.6)
    expect(h).toBeCloseTo(linearToOklch(parseColor('#ffd400')!)[2], 6)
  })

  test('dark mode lifts dark colours to the floor and caps chroma', () => {
    const [l, c] = derivePalette({ accent: 'oklch(0.4 0.25 268)' }, 'dark').accent
    expect(l).toBe(DARK_INK.floor)
    expect(c).toBeLessThanOrEqual(DARK_INK.maxChroma)
    const [l2, c2] = derivePalette({ accent: 'oklch(0.8 0.1 150)' }, 'dark').accent
    expect(l2).toBeCloseTo(0.8, 6)
    expect(c2).toBeCloseTo(0.1, 6)
  })

  test.each(themes.map((t) => [t.name, t] as const))('%s derives every color inside sRGB', (_, theme) => {
    for (const mode of modes) {
      const p = derivePalette(theme, mode)
      for (const [token, value] of Object.entries(p)) expect([mode, token, inGamut(oklchToLinear(value), 0.002)]).toEqual([mode, token, true])
      ;deriveChart(theme, mode).forEach((value, i) => expect([mode, `chart-${i + 1}`, inGamut(oklchToLinear(value!), 0.002)]).toEqual([mode, `chart-${i + 1}`, true]))
    }
  })

  // Chart colors: the ink sweep plus the most chroma sRGB holds, and the dark floor at the chart cap for every hue.
  const marks = [...inks]
  for (let h = 0; h < 360; h += 20) for (const l of [0.5, 0.6, 0.7, 0.8, 0.9]) for (const c of [0.22, 0.26]) if (inGamut(oklchToLinear([l, c, h]))) marks.push(`oklch(${l} ${c} ${h})`)
  for (let h = 0; h < 360; h += 10) marks.push(`oklch(${DARK_CHART.floor} ${DARK_CHART.maxChroma} ${h})`)

  test.each(modes)('%s: any chart color is moved until it reads at 3:1 on every surface', (mode) => {
    const failures: string[] = []
    for (const neutral of [DEFAULTS.neutral, { hue: 80, chroma: 0.04, wash: 1 }, { hue: 285, chroma: 0.04, wash: 1, lift: 1 }]) {
      const p = derivePalette({ neutral }, mode)
      for (const colour of marks) {
        const [mark] = deriveChart({ neutral, chart: [colour, colour, colour, colour, colour] }, mode)
        for (const s of surfaces) {
          const r = contrast(rgb(mark!), rgb(p[s]))
          if (r < 3) failures.push(`${colour} on ${s} (${JSON.stringify(neutral)}): ${r.toFixed(2)}`)
        }
      }
    }
    expect(marks.length).toBeGreaterThan(200)
    expect(failures).toEqual([])
  })

  test('dark mode keeps a neon palette as given, where the text inks would trim it', () => {
    const neon = ['oklch(0.9 0.2 129)', 'oklch(0.67 0.21 354)', 'oklch(0.61 0.22 293)', 'oklch(0.8 0.165 73)', 'oklch(0.8 0.13 210)'] as const
    const dark = deriveChart({ chart: neon }, 'dark')
    neon.forEach((value, i) => {
      const given = linearToOklch(parseColor(value)!)
      dark[i]!.forEach((v, k) => expect(v).toBeCloseTo(given[k]!, 6))
    })
    // The inks' cap (0.175) would dull the lime, the pink and the violet.
    expect(neon.filter((v) => linearToOklch(parseColor(v)!)[1] > DARK_INK.maxChroma)).toHaveLength(3)
    // Light mode darkens the bright ones (lime, amber, cyan) toward 3:1, keeping their hue.
    const light = deriveChart({ chart: neon }, 'light')
    expect(light[0]![0]).toBeLessThan(0.7)
    expect(light[0]![2]).toBeCloseTo(linearToOklch(parseColor(neon[0])!)[2], 6)
  })

  /* A theme without a palette draws one from its accent: five distinct hues,
   * neighbors apart for color-blind readers too, every series at 3:1 and
   * inside sRGB. */
  test.each(modes)('%s: without a palette, any accent draws five distinct series from itself', (mode) => {
    const gap = (a: number, b: number) => Math.min(Math.abs(a - b) % 360, 360 - (Math.abs(a - b) % 360))
    const failures: string[] = []
    for (const neutral of [DEFAULTS.neutral, { hue: 80, chroma: 0.04, wash: 1 }, { hue: 285, chroma: 0.04, wash: 1, lift: 1 }]) {
      const p = derivePalette({ neutral }, mode)
      for (const accent of inks) {
        const chart = deriveChart({ neutral, accent }, mode) as Oklch[]
        const at = `${accent} (${JSON.stringify(neutral)})`
        // Series 1 is the accent itself; 2 to 5 turn from it around the wheel.
        if (JSON.stringify(chart[0]) !== JSON.stringify(derivePalette({ neutral, accent }, mode).accent)) failures.push(`${at}: series 1 isn't the accent`)
        chart.forEach((c, i) => {
          for (const s of surfaces) if (contrast(rgb(c), rgb(p[s])) < MIN_CONTRAST.mark) failures.push(`${at}: series ${i + 1} on ${s}`)
          if (!inGamut(rgb(c), 0.002)) failures.push(`${at}: series ${i + 1} leaves sRGB`)
          if (i > 0 && c[1] < 0.06) failures.push(`${at}: series ${i + 1} is nearly gray`)
        })
        const hued = chart.filter((c, i) => i > 0 || c[1] > 0.03)
        for (let i = 0; i < hued.length; i++) for (let j = i + 1; j < hued.length; j++) if (gap(hued[i]![2], hued[j]![2]) < 60) failures.push(`${at}: two series within 60° of hue`)
        for (let i = 0; i < 5; i++)
          for (let j = i + 1; j < 5; j++) {
            const [a, b] = [oklchToOklab(chart[i]!), oklchToOklab(chart[j]!)]
            if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 0.07) failures.push(`${at}: series ${i + 1} and ${j + 1} too close`)
          }
        // Series 2 to 5 are the derivation's own: side by side they stay apart with deuteranopia and protanopia, and clearly apart without.
        for (let i = 1; i < 4; i++)
          for (const [eye, m] of Object.entries(SIMULATE))
            if (apart(chart[i]!, chart[i + 1]!, m) < (m ? 0.05 : 0.2)) failures.push(`${at}: series ${i + 1} and ${i + 2} too close (${eye})`)
      }
    }
    expect(failures).toEqual([])
  })

  test('the palette drawn from the accent is deterministic: it follows the accent, the neutral and the mode, nothing else', () => {
    const theme = { accent: '#e5484d', neutral: { hue: 40, chroma: 0.02, wash: 0.5 } }
    for (const mode of modes) {
      expect(deriveChart(theme, mode)).toEqual(deriveChart(theme, mode))
      expect(deriveChart({ ...theme, radius: 'full', controlSize: 'compact', stroke: { width: 2, ink: 1 }, success: '#10b981' }, mode)).toEqual(deriveChart(theme, mode))
      // In light mode each series is placed under the 3:1 ceiling: series 2 on it.
      if (mode === 'light') {
        const ceiling = inkCeiling(theme.neutral.chroma, theme.neutral.wash, MIN_CONTRAST.mark)
        const [r, g, b] = rgb(deriveChart(theme, mode)[1]!)
        expect(0.2126 * r + 0.7152 * g + 0.0722 * b).toBeCloseTo(ceiling * AUTO_CHART.y.light[0], 6)
      }
    }
    // Graphite's own accent draws blue, then orange, teal, pink and lime: each within a few degrees of its turn
    // of the wheel (the step into sRGB moves a hue a little).
    const { chart: _, ...plain } = graphite
    const hues = deriveChart(plain, 'light').map((c) => c![2])
    ;[0, ...AUTO_CHART.hues].forEach((turn, i) => expect(Math.abs(((hues[i]! - 268 - turn + 900) % 360) - 180)).toBeLessThan(5))
  })

  test('a palette changes no other colour, and an unreadable series derives nothing', () => {
    for (const mode of modes) expect(derivePalette({ ...graphite, chart: basalt.chart }, mode)).toEqual(derivePalette(graphite, mode))
    expect(deriveChart({ chart: ['nope', 'red', 'red', 'red', 'red'] }, 'dark')[0]).toBeNull()
  })
})

/* Every preset designs its own chart palette, per mode. checkTheme holds each
 * series to 3:1 (check.test.ts); here, neighbors must stay apart for the
 * common color-vision deficiencies too, simulated with Machado, Oliveira &
 * Fernandes (2009) at full severity in linear light. */
describe('preset chart palettes', () => {
  test.each(themes.map((t) => [t.name, t] as const))('%s tunes five series per mode, and neighbors stay apart for every eye', (_, theme) => {
    expect(theme.chart).toMatchObject({ light: { length: 5 }, dark: { length: 5 } })
    for (const mode of ['light', 'dark'] as const) {
      const chart = deriveChart(theme, mode) as Oklch[]
      for (const [eye, m] of Object.entries(SIMULATE)) {
        const min = eye === 'normal' ? 0.15 : 0.1
        for (let i = 0; i < 4; i++) expect([mode, eye, i + 1, apart(chart[i]!, chart[i + 1]!, m) >= min]).toEqual([mode, eye, i + 1, true])
      }
    }
  })
})

/* A color given per mode, { light, dark }, is used exactly as given: the
 * derivation that darkens for white and lifts for black is skipped, in both
 * modes, and checkTheme holds it to AA instead (check.test.ts). */
describe('colors tuned per mode', () => {
  const lch = (value: string) => linearToOklch(parseColor(value)!)
  const expectOklch = (actual: Oklch, value: string) => actual.forEach((v, i) => expect(v).toBeCloseTo(lch(value)[i]!, 6))

  test('each side is used as given, even where the derivation would move it', () => {
    // A bright amber would be darkened for white; a dim red lifted for black. Given per mode, neither moves.
    const theme = { accent: { light: 'oklch(0.8 0.165 73)', dark: 'oklch(0.55 0.2 25)' } }
    expectOklch(derivePalette(theme, 'light').accent, 'oklch(0.8 0.165 73)')
    expectOklch(derivePalette(theme, 'dark').accent, 'oklch(0.55 0.2 25)')
    expect(derivePalette({ accent: 'oklch(0.8 0.165 73)' }, 'light').accent[0]).toBeLessThan(0.6)
    expect(derivePalette({ accent: 'oklch(0.55 0.2 25)' }, 'dark').accent[0]).toBe(DARK_INK.floor)
  })

  test('a single colour still derives both modes, and mixes freely with pairs', () => {
    const single = { success: '#10b981' }
    const mixed = { accent: { light: '#1f3fff', dark: '#8fa2ff' }, success: '#10b981' }
    for (const mode of ['light', 'dark'] as const) {
      expect(derivePalette(mixed, mode).success).toEqual(derivePalette(single, mode).success)
      expectOklch(derivePalette(mixed, mode).accent, mixed.accent[mode])
    }
    // Every other color of a theme with pairs is what it would be without them.
    const plain = derivePalette(single, 'light')
    const paired = derivePalette(mixed, 'light')
    for (const token of NEUTRAL_STEPS) expect(paired[token]).toEqual(plain[token])
  })

  test('an unreadable side falls back to the derivation, as CSS falls back to the default', () => {
    expect(derivePalette({ accent: { light: 'nope', dark: 'nope' } }, 'light').accent).toEqual(derivePalette({}, 'light').accent)
    expect(derivePalette({ accent: { light: 'nope', dark: 'nope' } }, 'dark').accent).toEqual(INK_DEFAULTS.dark.accent)
  })

  test('a chart palette per mode gives each mode its own five, as given', () => {
    const chart = {
      light: ['#2f9e0a', '#e11f80', '#7c38ee', '#d96e00', '#0f91b2'],
      dark: ['#b4f755', '#f04e9e', '#8d5df8', '#fdaa1c', '#2fd4ec'],
    } as const
    for (const mode of ['light', 'dark'] as const) deriveChart({ chart }, mode).forEach((value, i) => expectOklch(value!, chart[mode][i]!))
    // Light as given, not darkened: the pale lime would have been.
    expect(deriveChart({ chart: { light: ['#b4f755', 'red', 'red', 'red', 'red'], dark: chart.dark } }, 'light')[0]).toEqual(lch('#b4f755'))
    expect(deriveChart({ chart: { light: ['nope', 'red', 'red', 'red', 'red'], dark: chart.dark } }, 'light')[0]).toBeNull()
  })

  test('Basalt’s dark mode is exactly what its single colours derived to before the split', () => {
    const before = {
      ...basalt,
      accent: 'oklch(0.8 0.165 73)',
      success: 'oklch(0.85 0.165 160)',
      warning: 'oklch(0.74 0.17 50)',
      danger: 'oklch(0.66 0.21 18)',
      chart: ['oklch(0.9 0.2 129)', 'oklch(0.67 0.21 354)', 'oklch(0.61 0.22 293)', 'oklch(0.8 0.165 73)', 'oklch(0.8 0.13 210)'],
    } as const
    // Compared as the CSS they render to.
    expect(deriveTheme(basalt).dark).toEqual(deriveTheme(before).dark)
    expect(deriveChart(basalt, 'dark').map((c) => formatOklch(c!))).toEqual(deriveChart(before, 'dark').map((c) => formatOklch(c!)))
  })
})
