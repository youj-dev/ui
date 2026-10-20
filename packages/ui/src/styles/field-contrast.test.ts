import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { resolveTheme, themes } from '@youj/core/lib/youj/theme'
import { PAGES, parseTokens, ratio, type Theme } from '../docs/token-math'

/* Fields must be findable and their focus visible (WCAG 1.4.11, 2.4.7).
 * The field border (line-control) clears 3:1 on every surface (ui-tokens.test.ts);
 * these hold the places that use it. */

const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const ui = strip(readFileSync(resolve(__dirname, 'ui.css'), 'utf8'))
const youjCss = readFileSync(resolve(__dirname, '../../../core/src/styles/youj.css'), 'utf8')
const bezel = strip(readFileSync(resolve(__dirname, 'bezel.css'), 'utf8'))

const block = (css: string, marker: string) => {
  const start = css.indexOf('{', css.indexOf(marker)) + 1
  return css.slice(start, css.indexOf('}', start))
}

test('an invalid field takes the focus ring when focused, not only its unchanged danger edge', () => {
  for (const utility of ['@utility focus-field {', '@utility focus-field-within {']) {
    const body = ui.slice(ui.indexOf(utility))
    const invalid = block(body, "[data-invalid]")
    expect(invalid, utility).toContain('outline: var(--ui--focus-width) solid var(--color-focus)')
    expect(invalid, utility).toContain('border-color: var(--color-danger)')
  }
})

test("a Bezel field at rest and on hover draws the theme's field edge, the full field border unless the theme's fields are soft", () => {
  expect(bezel).toMatch(/\)&\s*\{\s*border-color: var\(--ui--field-line\);\s*background-color: var\(--ui--field-fill\);/)
  expect(bezel).toMatch(/\):hover&\s*\{\s*border-color: var\(--ui--field-line\);\s*background-color: var\(--bz-field-hover\);/)
  expect(bezel).not.toMatch(/border-color: transparent;\s*background-color: var\(--(?:bz-|color-)(?:well|field|band)/)
  // Outlined (--yj-field-soft 0, every preset's) is line-control at full strength on the field fill.
  expect(ui).toMatch(/--ui--field-line: color-mix\(in oklab, var\(--color-line-control\) calc\(100% - 100% \* var\(--yj-field-soft\)\), transparent\);/)
  expect(ui).toMatch(/--ui--field-fill: color-mix\(in oklab, var\(--color-band\) calc\(100% \* var\(--yj-field-soft\)\), var\(--color-field\)\);/)
  for (const preset of themes) expect([preset.id, resolveTheme(preset).fields]).toEqual([preset.id, 'outlined'])
})

test("a Bezel field's edge holds 3:1 against its fill and every page surface, light and dark, in every preset", () => {
  const helpers = bezel.match(/:where\(:root, \[data-yj-look='bezel'\][^{]*\{([^}]*)\}/)![1]!
  const vars: Record<string, string> = {}
  for (const [, name, value] of helpers.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[name!] = value!.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim()
  const failing: string[] = []
  for (const preset of themes) {
    const base = parseTokens(`${readFileSync(resolve(__dirname, 'ui.css'), 'utf8')}\n${youjCss}`, preset)
    const tokens = { ...base, bridge: { ...base.bridge, ...vars } }
    for (const mode of ['light', 'dark'] as Theme[])
      for (const page of PAGES)
        for (const against of ['var(--color-field)', 'var(--bz-field-hover)']) {
          const r = ratio(tokens, mode, 'var(--color-line-control)', against, page)
          if (r < 3) failing.push(`${preset.id} ${mode} ${page} ${against} ${r.toFixed(2)}`)
        }
  }
  expect(failing).toEqual([])
})
