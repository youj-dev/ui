import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { graphite, themes, type ThemeInput } from '@youj/core/lib/youj/theme'
import { CARD_SECTION_INK } from '@youj/core/internal'
import { BOUNDARY_PAIRS, describeValue, forMode, PAGES, parseTokens, ratio, resolvePaint, TEXT_PAIRS, type Theme } from '../docs/token-math'

/* Holds every text-on-surface pair the ui token bridge introduces to WCAG AA
 * (4.5:1), and the control boundaries the components draw with to 3:1
 * (WCAG 1.4.11), in both modes of every theme preset. The bridge is read from
 * ui.css and the palette from the theme derivation (the JS mirror of
 * youj.css), so changing a mapping or a preset re-runs the arithmetic.
 * Translucent fills are composited over every page surface they can sit on.
 * The Tokens page shows the same numbers. */

const uiCss = `${readFileSync(resolve(__dirname, './ui.css'), 'utf8')}\n${readFileSync(resolve(__dirname, '../../../core/src/styles/youj.css'), 'utf8')}`

describe.each(themes.map((t) => [t.name, t] as const))('%s', (_, preset) => {
  const tokens = parseTokens(uiCss, preset)

  describe.each(['light', 'dark'] as Theme[])('%s', (theme) => {
    const failing = (text: string, fill: string, min: number) =>
      PAGES.map((page) => [page, Number(ratio(tokens, theme, text, fill, page).toFixed(2))] as const).filter(([, r]) => r < min)

    test.each(TEXT_PAIRS)('%s on %s passes AA on every page surface', (text, fill) => {
      expect(failing(text, fill, 4.5)).toEqual([])
    })

    test.each(BOUNDARY_PAIRS)('%s reaches 3:1', (_, mark, against) => {
      expect(failing(mark, against, 3)).toEqual([])
    })

    test('a scrollbar thumb is quiet at rest (1.4:1 to 2:1) on every plane, and firms up on hover (3:1, a boundary pair), then press', () => {
      for (const surface of ['var(--color-canvas)', 'var(--color-surface)', 'var(--color-overlay)', 'var(--yj-raised)']) {
        const thumb = (state: string) => ratio(tokens, theme, `var(--ui-scrollbar-thumb${state})`, surface, 'canvas')
        const [rest, hover, active] = [thumb(''), thumb('-hover'), thumb('-active')]
        expect([surface, rest >= 1.4 && rest < 2]).toEqual([surface, true])
        expect(hover).toBeGreaterThan(rest)
        expect(active).toBeGreaterThan(hover)
      }
    })
  })
})

test('overlays sit on the white plane in light: the cards on a gray page, the page itself on a white one', () => {
  const lab = (tokens: ReturnType<typeof parseTokens>, mode: Theme, expr: string) => resolvePaint(tokens, mode, expr).lab.map((v) => v.toFixed(3))
  const gray = parseTokens(uiCss, graphite)
  const white = parseTokens(uiCss, { ...graphite, neutral: { ...graphite.neutral, page: 'white' } })
  expect(lab(gray, 'light', 'var(--color-overlay)')).toEqual(lab(gray, 'light', 'var(--color-surface)'))
  expect(lab(white, 'light', 'var(--color-overlay)')).toEqual(lab(white, 'light', 'var(--color-canvas)'))
  for (const tokens of [gray, white]) expect(resolvePaint(tokens, 'light', 'var(--color-overlay)').lab[0]).toBeCloseTo(1, 3)
  // Dark keeps its lit step either way.
  expect(lab(white, 'dark', 'var(--color-overlay)')).toEqual(lab(gray, 'dark', 'var(--yj-raised)'))
})

test('a primary action is the accent by default, and ink (fg on the page colour) when the theme says actions: ink', () => {
  const lab = (tokens: ReturnType<typeof parseTokens>, mode: Theme, expr: string) => resolvePaint(tokens, mode, expr).lab.map((v) => v.toFixed(3))
  for (const mode of ['light', 'dark'] as Theme[]) {
    const accent = parseTokens(uiCss, graphite)
    expect(lab(accent, mode, 'var(--color-action)')).toEqual(lab(accent, mode, 'var(--color-accent)'))
    expect(lab(accent, mode, 'var(--color-on-action)')).toEqual(lab(accent, mode, 'var(--color-on-accent)'))
    const ink = parseTokens(uiCss, { ...graphite, actions: 'ink' })
    expect(lab(ink, mode, 'var(--color-action)')).toEqual(lab(ink, mode, 'var(--color-fg)'))
    expect(lab(ink, mode, 'var(--color-on-action)')).toEqual(lab(ink, mode, 'var(--color-canvas)'))
    // The "on" states keep the accent.
    expect(lab(ink, mode, 'var(--color-accent)')).toEqual(lab(accent, mode, 'var(--color-accent)'))
  }
  expect(describeValue(parseTokens(uiCss).bridge['color-action']!)).toBe('accent, or fg when actions are ink')
})

test("charts draw the theme's own palette where it sets one, and one drawn from its accent where it doesn't, at 3:1 on every surface", () => {
  const lab = (tokens: ReturnType<typeof parseTokens>, mode: Theme, expr: string) => resolvePaint(tokens, mode, expr).lab.map((v) => v.toFixed(3))
  const plain: ThemeInput = { id: 'plain', accent: '#e5484d' }
  for (const theme of [...themes, plain]) {
    const tokens = parseTokens(uiCss, theme)
    for (const mode of ['light', 'dark'] as Theme[]) {
      for (let i = 1; i <= 5; i++) {
        expect([theme.id, mode, i, lab(tokens, mode, `var(--color-chart-${i})`)]).toEqual([theme.id, mode, i, lab(tokens, mode, `var(--yj-chart-${i}-color)`)])
        for (const page of PAGES) expect(ratio(tokens, mode, `var(--color-chart-${i})`, `var(--color-${page})`, page)).toBeGreaterThanOrEqual(3)
      }
      // Without a palette, the first series is the accent itself.
      if (theme === plain) expect(lab(tokens, mode, 'var(--color-chart-1)')).toEqual(lab(tokens, mode, 'var(--color-accent)'))
    }
  }
  expect(describeValue(parseTokens(uiCss).bridge['color-chart-2']!)).toBe("the theme's chart-2, or one drawn from its accent (older browsers: accent 72% + canvas)")
})

test('a card shades toward raised at its foot by the surface gradient, and the sheen is drawn on ink actions only', () => {
  const presets: readonly ThemeInput[] = themes
  const foot = (theme: ThemeInput, mode: Theme) => {
    const tokens = parseTokens(uiCss, theme)
    const stop = tokens.bridge['ui--surface-gradient']!.match(/(color-mix\(in oklab, var\(--yj-raised\) .+\), transparent\))\s*\)$/)![1]!
    return { paint: resolvePaint(tokens, mode, stop), raised: resolvePaint(tokens, mode, 'var(--yj-raised)') }
  }
  for (const mode of ['light', 'dark'] as Theme[]) {
    // Flat presets draw a fully transparent gradient: nothing changes.
    for (const preset of presets.filter((t) => !t.surfaces?.gradient)) expect([preset.id, foot(preset, mode).paint.alpha]).toEqual([preset.id, 0])
    // At its most, the foot is raised in dark, a surface every pair is checked on; light shades half as far,
    // since its raised step sits well below the white card and would turn the foot gray.
    const share = mode === 'dark' ? 1 : 0.5
    const full = foot({ ...graphite, surfaces: { gradient: 1 } }, mode)
    expect(full.paint.alpha).toBeCloseTo(share)
    expect(full.paint.lab).toEqual(full.raised.lab)
    const bezel = foot({ ...graphite, surfaces: { gradient: 0.6 } }, mode)
    expect(bezel.paint.alpha).toBeCloseTo(0.6 * share)
  }
  // The sheen scales by the action ink: accent and danger fills stay flat.
  expect(parseTokens(uiCss).bridge['ui--fill-sheen']).toMatch(/calc\(14% \* var\(--yj-surface-gradient\) \* var\(--yj-action-ink\)\)/)
  expect(parseTokens(uiCss).bridge['ui--fill-sheen']).toMatch(/calc\(10% \* var\(--yj-surface-gradient\) \* var\(--yj-action-ink\)\)/)
})

test('the resolver reads real values (guards against a silently empty or wrong-block parse)', () => {
  const tokens = parseTokens(uiCss, graphite)
  expect(Object.keys(tokens.bridge).length).toBeGreaterThan(30)
  expect(forMode(tokens.bridge['color-overlay']!, 'light')).toBe('var(--yj-paper)')
  expect(forMode(tokens.bridge['color-overlay']!, 'dark')).toBe('var(--yj-raised)')
  expect(describeValue(tokens.bridge['color-line-control']!)).toBe('line-strong 30% + fg-subtle, toward fg by the stroke ink')
  expect(ratio(tokens, 'dark', 'var(--color-on-accent)', 'var(--color-danger)', 'canvas')).not.toBeCloseTo(
    ratio(tokens, 'light', 'var(--color-on-accent)', 'var(--color-danger)', 'canvas'),
    1,
  )
  expect(resolvePaint(tokens, 'light', 'var(--color-hover)').alpha).toBeCloseTo(0.06)
  expect(ratio(tokens, 'light', 'var(--color-fg)', 'var(--color-canvas)', 'canvas')).toBeGreaterThan(15)
})

test("Bezel's selected key is the white plane in light on a ring that holds 3:1 against the track, the lit step in dark, and every text role passes AA on it in every preset", () => {
  const helpers = readFileSync(resolve(__dirname, './bezel.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .match(/:where\(:root, \[data-yj-look='bezel'\][^{]*\{([^}]*)\}/)![1]!
  const bezel: Record<string, string> = {}
  for (const [, name, value] of helpers.matchAll(/--([\w-]+):\s*([^;]+);/g))
    bezel[name!] = value!.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim()
  const lab = (tokens: ReturnType<typeof parseTokens>, mode: Theme, expr: string) => resolvePaint(tokens, mode, expr).lab.map((v) => v.toFixed(3))
  for (const preset of themes) {
    // On an app's gray page and on a document's white one (neutral.page).
    for (const page of ['gray', 'white'] as const) {
      const base = parseTokens(uiCss, { ...preset, neutral: { ...preset.neutral, page } })
      const tokens = { ...base, bridge: { ...base.bridge, ...bezel } }
      expect(lab(tokens, 'light', 'var(--color-key)')).toEqual(lab(tokens, 'light', 'var(--yj-paper)'))
      for (const mode of ['light', 'dark'] as Theme[]) {
        expect(lab(tokens, mode, 'var(--color-fg)')).toEqual(lab(tokens, mode, 'var(--color-fg)'))
        for (const text of ['fg', 'fg-muted', 'fg-subtle'])
          expect([preset.id, page, mode, text, ratio(tokens, mode, `var(--color-${text})`, 'var(--color-key)', 'surface') >= 4.5]).toEqual([preset.id, page, mode, text, true])
      }
      expect([preset.id, page, ratio(tokens, 'light', 'var(--color-line-control)', 'var(--color-well)', 'canvas') >= 3]).toEqual([preset.id, page, true])
      expect(lab(tokens, 'dark', 'var(--color-key)')).toEqual(lab(tokens, 'dark', 'var(--yj-raised)'))
      expect(resolvePaint(tokens, 'dark', 'var(--bz-key-ring)').alpha).toBe(0)
    }
  }
})

test("Classic's selected key is the white plane in light on an edge that holds 3:1 against its track on every page surface, gray page or white", () => {
  const lab = (tokens: ReturnType<typeof parseTokens>, mode: Theme, expr: string) => resolvePaint(tokens, mode, expr).lab.map((v) => v.toFixed(3))
  for (const preset of themes) {
    for (const page of ['gray', 'white'] as const) {
      const tokens = parseTokens(uiCss, { ...preset, neutral: { ...preset.neutral, page } })
      expect(lab(tokens, 'light', 'var(--color-overlay)')).toEqual(lab(tokens, 'light', 'var(--yj-paper)'))
      for (const surface of PAGES)
        expect([preset.id, page, surface, ratio(tokens, 'light', 'var(--ui--key-edge)', 'var(--color-well)', surface) >= 3]).toEqual([preset.id, page, surface, true])
      // Dark keeps the raised key on the filled control's edge.
      expect(lab(tokens, 'dark', 'var(--ui--key-edge)')).toEqual(lab(tokens, 'dark', 'var(--ui--fill-edge)'))
    }
  }
})

test("a card's deepest section is the ink the role matrix checks text on: four of Bezel's --bz-section-step", () => {
  const bezel = readFileSync(resolve(__dirname, './bezel.css'), 'utf8')
  const [, base, drop] = /--bz-section-step: calc\(([\d.]+)% - ([\d.]+)% \* \(1 - var\(--yj-dark\)\)\)/.exec(bezel)!.map(Number) as [number, number, number]
  expect({ light: +(4 * (base - drop) / 100).toFixed(4), dark: +(4 * base / 100).toFixed(4) }).toEqual(CARD_SECTION_INK)
})
