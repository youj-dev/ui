import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { checkTheme } from './check'
import { DEFAULTS, resolveTheme, themeProps, themeVars } from './contract'
import { composeTheme, layerSheet, layerTheme, paletteVars, pickPalette, pickStyle, styleVars, type StyleInput } from './layers'
import { bezelStyle, brutalStyle, classicStyle, cleanStyle, styleById, styles, terminalStyle } from './styles'
import { basalt, cinnabarPalette, graphite, meadow, meadowPalette, palettes, themes, youjPalette } from './themes'
import { deriveRoles } from './derive'

/* `UPDATE_THEME_SHEETS=1 pnpm -F @youj/core test layers` rewrites the stylesheets from the TS. */
const UPDATE = process.env.UPDATE_THEME_SHEETS === '1'

const HEADER = {
  palette: `/* The palettes: colour only (neutral, accent, status inks, chart). Put
 * data-yj-palette="<id>" next to data-yj-theme (which marks the scope where the
 * roles re-derive) on <html> or any element, with a style beside it:
 * <html data-yj-theme data-yj-palette="meadow" data-yj-style="bezel" data-yj-look="bezel">. */
`,
  style: `/* The styles: form only (corners, control size, type, lines, depth, titles,
 * labels, action fill, surface shading). Put data-yj-style="<id>" next to
 * data-yj-theme, with the look it names (data-yj-look) and its motion
 * (data-yj-motion). Any palette pairs with any style. */
`,
}

function sheet(file: string, expected: string) {
  const path = resolve(__dirname, file)
  if (UPDATE) writeFileSync(path, expected)
  expect(readFileSync(path, 'utf8')).toBe(expected)
}

describe('palette × style', () => {
  test('a palette sets colour only and a style form only', () => {
    for (const p of palettes) for (const name of Object.keys(paletteVars(p))) expect(name).toMatch(/^--yj-(neutral|accent|success|warning|danger|info|chart)/)
    for (const s of styles) for (const name of Object.keys(styleVars(s))) expect(name).not.toMatch(/^--yj-(neutral|accent|success|warning|danger|info|chart|tone)/)
  })

  test('palettes keep the whites and grays neutral: no wash', () => {
    for (const p of palettes) expect([p.id, p.neutral?.wash]).toEqual([p.id, 0])
  })

  test('whites stay white: in light mode every palette in every style draws its cards, menus and fields white', () => {
    for (const p of palettes)
      for (const s of styles) {
        const roles = deriveRoles(composeTheme(p, s), 'light')
        for (const role of ['surface', 'overlay', 'field'] as const) expect([p.id, s.id, role, roles[role].color[0] > 0.995]).toEqual([p.id, s.id, role, true])
      }
  })

  test('every palette in every style passes AA in both modes', () => {
    for (const p of palettes)
      for (const s of styles) {
        const errors = checkTheme(composeTheme(p, s)).filter((i) => i.level === 'error')
        expect(errors, `${p.id} × ${s.id}`).toEqual([])
      }
  })

  test('a composed theme carries both ids and the style’s look, and writes them as attributes', () => {
    const t = composeTheme(meadowPalette, brutalStyle)
    expect([t.id, t.palette, t.style, t.look]).toEqual(['meadow-brutal', 'meadow', 'brutal', 'classic'])
    const props = themeProps(t)
    expect([props['data-yj-palette'], props['data-yj-style']]).toEqual(['meadow', 'brutal'])
  })

  test('the styles hold the values approved on the sheet', () => {
    const vars = (s: StyleInput) => themeVars(composeTheme(youjPalette, s))
    expect(vars(cleanStyle)['--yj-radius']).toBe('0.625rem')
    expect([vars(bezelStyle)['--yj-action-ink'], vars(bezelStyle)['--yj-pill'], vars(bezelStyle)['--yj-surface-gradient']]).toEqual(['0', '1', '0.6'])
    expect(vars(classicStyle)['--yj-font-sans']).toContain('IBM Plex Sans')
    expect([vars(brutalStyle)['--yj-stroke-width'], vars(brutalStyle)['--yj-shadow-hard'], vars(brutalStyle)['--yj-heading-weight']]).toEqual(['2px', '1', '800'])
    expect([vars(terminalStyle)['--yj-density'], vars(terminalStyle)['--yj-shadow-soft'], vars(terminalStyle)['--yj-label-font']]).toEqual(['-1', '0', "'JetBrains Mono Variable', ui-monospace, monospace"])
    expect(styles.map((s) => [s.id, s.look])).toEqual([['clean', 'classic'], ['bezel', 'bezel'], ['classic', 'classic'], ['brutal', 'classic'], ['terminal', 'bezel']])
    for (const s of styles) expect(s.actions).toBe('accent')
  })

  test('a preset is a named pair: Basalt is Youj × Clean, and the contract defaults are Basalt', () => {
    expect([basalt.palette, basalt.style, graphite.palette, graphite.style, meadow.style]).toEqual(['youj', 'clean', 'youj', 'clean', 'clean'])
    expect(palettes.map((p) => p.id)).toEqual(['youj', 'meadow', 'sandstone', 'cinnabar', 'umber', 'seaglass', 'heather'])
    const fromDefaults = resolveTheme({})
    for (const key of ['radius', 'controlSize', 'actions', 'controls', 'shadow'] as const) expect(fromDefaults[key]).toBe(cleanStyle[key])
    expect(DEFAULTS.surfaces).toEqual(cleanStyle.surfaces)
  })

  test('swapping one layer keeps the other, and the tone', () => {
    const outer = { ...meadow, tone: { chrome: 'dark' as const } }
    const restyled = layerTheme(outer, undefined, brutalStyle)!
    expect([restyled.accent, restyled.radius, restyled.look, restyled.tone?.chrome]).toEqual([meadow.accent, 'none', 'classic', 'dark'])
    const repainted = layerTheme(graphite, cinnabarPalette, undefined)!
    expect([repainted.accent, repainted.radius, repainted.style]).toEqual([cinnabarPalette.accent, 'xl', 'clean'])
    expect(pickPalette(meadow).accent).toEqual(meadowPalette.accent)
    expect(pickStyle(meadow).labels).toEqual(cleanStyle.labels)
    expect(styleById('nope')).toBe(cleanStyle)
  })

  test('theme/palettes.css and theme/styles.css say exactly what the TS says', () => {
    sheet('palettes.css', HEADER.palette + '\n' + layerSheet('palette', palettes))
    sheet('styles.css', HEADER.style + '\n' + layerSheet('style', styles))
  })

  test.runIf(UPDATE)('rewrites the preset stylesheets', () => {
    for (const t of themes) {
      const lines = Object.entries(themeVars(t)).map(([name, value]) => `  ${name}: ${value};`)
      const css = `/* ${t.name}: ${t.description}
 *
 * A youj theme is only its contract: these variables. Every token, in light
 * and dark, is derived from them. Apply the file with data-yj-theme="${t.id}" on
 * <html> or any element (scopes nest), or copy the block onto :root.
 * Motion is an attribute: data-yj-motion="${t.motionPersonality}" next to data-yj-theme;
 * the look too: data-yj-look="${t.look}". */
[data-yj-theme='${t.id}'] {
${lines.join('\n')}
}
`
      writeFileSync(resolve(__dirname, `themes/${t.id}.css`), css)
    }
  })
})
