import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

/* The layout density (ui.css): data-yj-density="compact" tightens every panel
 * inside it. Unset or "roomy", the tokens must give exactly the sizes panels
 * had before density existed, so nothing outside a compact scope moves; and
 * they must live on the root and density scopes only, so a theme scope nested
 * in a compact region inherits compact instead of resetting it. */

const ui = readFileSync(resolve(__dirname, 'ui.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const bezel = readFileSync(resolve(__dirname, 'bezel.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

/** Every `selector { … }` block in ui.css that declares `name`, with the declared value. */
function declarations(name: string) {
  const out: { selector: string; value: string }[] = []
  const re = /([^{};]+)\{([^{}]*)\}/g
  for (const [, selector, body] of ui.matchAll(re)) {
    const value = body!.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1]
    if (value) out.push({ selector: selector!.trim().replace(/\s+/g, ' '), value: value.trim() })
  }
  return out
}

/** A token's size in px at a density (0 roomy, 1 compact) and 100% scale: `calc((Arem - Brem * var(--ui--compact)) * var(--yj-scale, 1))`. */
function px(name: string, compact: 0 | 1) {
  const value = declarations(name)[0]?.value ?? ''
  const m = value.match(/^calc\(\(([\d.]+)rem - ([\d.]+)rem \* var\(--ui--compact\)\) \* var\(--yj-scale, 1\)\)$/)
  if (!m) throw new Error(`${name} is not a calc of the density times the scale: ${value}`)
  return Math.round((Number(m[1]) - Number(m[2]) * compact) * 16 * 10) / 10
}

const TOKENS = {
  '--ui--panel-x': [24, 16],
  '--ui--panel-y': [24, 12],
  '--ui--panel-head-y': [21, 12],
  '--ui--panel-foot-y': [16.8, 8],
  '--ui--panel-title': [18, 14],
  '--ui--panel-title-leading': [28, 20],
  '--ui--row': [48, 36],
  '--ui--panel-radius-max': [24, 12],
} as const

describe('layout density tokens', () => {
  test.each(Object.entries(TOKENS))('%s is the roomy size unset and the compact one in a compact scope', (name, [roomy, compact]) => {
    expect(px(name, 0)).toBe(roomy)
    expect(px(name, 1)).toBe(compact)
  })

  test('the switch is 0 on the root and every density scope, 1 in a compact one', () => {
    expect(declarations('--ui--compact')).toEqual([
      { selector: ':root, [data-yj-density]', value: '0' },
      { selector: "[data-yj-density='compact']", value: '1' },
    ])
  })

  test('tokens are declared on the root and density scopes only, never on a theme scope', () => {
    for (const name of ['--ui--compact', ...Object.keys(TOKENS)]) {
      for (const { selector } of declarations(name)) expect(selector).not.toMatch(/data-theme|data-yj-theme/)
    }
  })

  test('Bezel cards take their sides, bands, title and corners from the density', () => {
    expect(bezel).toMatch(/--card-spacing: var\(--ui--panel-x,/)
    expect(bezel).toMatch(/--card-band: var\(--ui--panel-y,/)
    expect(bezel).toMatch(/font-size: var\(--ui--panel-title,/)
    expect(bezel).toMatch(/line-height: var\(--ui--panel-title-leading,/)
    // Each section's corner follows the card's own, which the density caps.
    expect(bezel).toMatch(/border-start-start-radius: calc\(var\(--card-radius, var\(--radius-surface\)\) - var\(--yj-stroke-width/)
  })
})

/* Components read the density as a step off their roomy size, on the spacing
 * unit: `calc(var(--spacing)*(N_-_k*var(--ui--compact,0)))`. With the switch
 * at 0 (the root, or a roomy scope) that is exactly N units, the size the
 * component had before density existed. */
describe('components on the layout density', () => {
  const dir = resolve(__dirname, '../components/ui')
  const files = (d: string): string[] =>
    readdirSync(d).flatMap((name) => {
      const p = join(d, name)
      return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(name) && !/\.(test|stories)\.tsx?$/.test(name) ? [p] : []
    })
  const uses = files(dir).flatMap((file) => [...readFileSync(file, 'utf8').matchAll(/[\w:-]*\[calc\(var\(--spacing\)\*\([^\]]*var\(--ui--compact,0\)\)\)\]/g)].map((m) => ({ file, use: m[0] })))

  test('the overlays, tables, fields, alerts, empty states and tabs take it', () => {
    const slugs = new Set(uses.map(({ file }) => file.replace(/^.*\/components\/ui\//, '').replace(/(\.variants)?\.tsx?$/, '')))
    for (const slug of ['dialog', 'sheet', 'drawer', 'popover', 'alert', 'empty', 'tabs', 'field', 'table']) expect(slugs).toContain(slug)
  })

  test("the sidebar's rows take the small control's height at compact, except on touch", () => {
    const sidebar = readFileSync(join(dir, 'sidebar.tsx'), 'utf8')
    // own: files the height under a style's recipes (ui.css), so a className still wins.
    expect(sidebar.replaceAll('own:', '')).toContain(
      "default: 'h-[calc(var(--spacing-control-sm)_*_var(--ui--compact,0)_*_(1_-_var(--yj-touch,0))_+_var(--spacing-control)_*_(1_-_var(--ui--compact,0)_*_(1_-_var(--yj-touch,0))))] text-ui'",
    )
  })

  test.each([0, 1])('every use is N units less a step at compact %i, never below a unit', (compact) => {
    expect(uses.length).toBeGreaterThan(10)
    for (const { use } of uses) {
      const m = use.match(/\(([\d.]+)_-_(?:([\d.]+)\*)?var\(--ui--compact,0\)\)/)
      expect(m, use).not.toBeNull()
      const size = Number(m![1]) - Number(m![2] ?? 1) * compact
      expect(size, use).toBeGreaterThanOrEqual(compact ? 1 : Number(m![1]))
    }
  })

  test('Bezel overlays and tables step down the same way', () => {
    for (const pattern of [
      /\[data-slot='table-head'\]& \{\s*height: calc\(var\(--spacing\) \* \(8 - var\(--ui--compact, 0\)\)\)/,
      /padding-block: calc\(var\(--spacing\) \* \(2 - 0\.5 \* var\(--ui--compact, 0\)\)\)/,
      /padding: calc\(var\(--spacing\) \* \(4\.5 - var\(--ui--compact, 0\)\)\)/,
      /font-size: var\(--ui--panel-title, calc\(1\.125rem \* var\(--yj-scale, 1\)\)\)/,
    ])
      expect(bezel).toMatch(pattern)
  })
})
