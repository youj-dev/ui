import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { SCALINGS } from '@youj/core'

/* UI scaling (youj.css section 5, ui.css, bezel.css): data-yj-scaling on
 * any element sizes every length token inside it by one factor, --yj-scale.
 * Outside a scaling scope, and at 100%, every token must be exactly the size
 * it was before scaling existed, so nothing moves unless an app asks; inside
 * one, each must be that size times the factor, and be recomputed on every
 * scope that sets one of its inputs, so scopes nest. */

const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const youj = strip(readFileSync(resolve(__dirname, '../../../core/src/styles/youj.css'), 'utf8'))
const ui = strip(readFileSync(resolve(__dirname, 'ui.css'), 'utf8'))

const FACTORS = SCALINGS.map((step) => Number(step.slice(0, -1)) / 100)

/** Every flat `selector { … }` rule, with its custom property declarations. */
function rules(css: string) {
  return [...css.matchAll(/([^{};]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    selector: selector!.trim().replace(/\s+/g, ' '),
    decls: Object.fromEntries([...body!.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name!, value!.trim().replace(/\s+/g, ' ')])),
  }))
}

/** The rules of a stylesheet that declare `name`. */
const declaring = (css: string, name: string) => rules(css).filter((rule) => name in rule.decls)

/** Evaluates a CSS length expression to px. Custom properties come from `vars` (lengths in px), else their fallback. */
function px(expression: string, vars: Record<string, number>): number {
  const js = expression
    .replace(/var\((--[\w-]+)(?:,\s*([\d.]+)(rem)?)?\)/g, (_, name: string, fallback?: string, rem?: string) => {
      const value = vars[name] ?? (fallback === undefined ? undefined : Number(fallback) * (rem ? 16 : 1))
      if (value === undefined) throw new Error(`${name} is unset in ${expression}`)
      return `(${value})`
    })
    .replace(/(-?[\d.]+)rem/g, (_, n: string) => `(${Number(n) * 16})`)
    .replace(/(-?[\d.]+)px/g, '($1)')
    .replace(/\bcalc\(/g, '(')
    .replace(/\b(min|max)\(/g, 'Math.$1(')
  if (/[^\d.\s()+\-*/,]/.test(js.replace(/Math\.(min|max)/g, ''))) throw new Error(`can't evaluate ${expression}`)
  return Math.round((new Function(`return ${js}`)() as number) * 1000) / 1000
}

/* The tokens as ui.css declared them before scaling: the 100% contract. */
const BEFORE: Record<string, string> = {
  '--radius-xs': 'calc(var(--yj-radius) / 2)',
  '--radius-sm': 'min(calc(var(--yj-radius) * 2 / 3), 0.375rem)',
  '--radius-md': 'var(--yj-radius)',
  '--radius-lg': 'min(calc(var(--yj-radius) * 4 / 3), 1.25rem)',
  '--radius-xl': 'min(calc(var(--yj-radius) * 2), 1.5rem)',
  '--radius-2xl': 'min(calc(var(--yj-radius) * 8 / 3), 1.75rem)',
  '--spacing-control-xs': 'calc(max(1.5rem, 1.5rem + var(--yj-density) * 0.25rem) + var(--yj-touch) * 0.5rem)',
  '--spacing-control-sm': 'calc(max(1.5rem, 1.75rem + var(--yj-density) * 0.25rem) + var(--yj-touch) * 0.5rem)',
  '--spacing-control': 'calc(max(2rem + var(--yj-density) * 0.25rem + var(--yj-touch) * 0.5rem, var(--yj-touch) * 2.75rem))',
  '--spacing-control-lg': 'calc(2.5rem + var(--yj-density) * 0.25rem + var(--yj-touch) * 0.5rem)',
  '--ui--panel-x': 'calc(1.5rem - 0.5rem * var(--ui--compact))',
  '--ui--panel-y': 'calc(1.5rem - 0.75rem * var(--ui--compact))',
  '--ui--panel-head-y': 'calc(1.3125rem - 0.5625rem * var(--ui--compact))',
  '--ui--panel-foot-y': 'calc(1.05rem - 0.55rem * var(--ui--compact))',
  '--ui--panel-title': 'calc(1.125rem - 0.25rem * var(--ui--compact))',
  '--ui--panel-title-leading': 'calc(1.75rem - 0.5rem * var(--ui--compact))',
  '--ui--row': 'calc(3rem - 0.75rem * var(--ui--compact))',
  '--ui--panel-radius-max': 'calc(1.5rem - 0.75rem * var(--ui--compact))',
}
const CONTROLS = ['--spacing-control-xs', '--spacing-control-sm', '--spacing-control', '--spacing-control-lg']

/* Every theme input a size reads: radius from none to full, each density, mouse and touch, roomy and compact. */
const INPUTS = [0, 2, 4, 6, 8, 12, 16].flatMap((radius) =>
  [-1, 0, 1].flatMap((density) =>
    [0, 1].flatMap((touch) => [0, 1].map((compact) => ({ '--yj-radius': radius, '--yj-density': density, '--yj-touch': touch, '--ui--compact': compact }))),
  ),
)

/* Tailwind 4's own sizes, which youj.css scales in a scaling scope. */
const TAILWIND: Record<string, string> = {
  '--spacing': '0.25rem',
  ...Object.fromEntries(
    Object.entries({ xs: 0.75, sm: 0.875, base: 1, lg: 1.125, xl: 1.25, '2xl': 1.5, '3xl': 1.875, '4xl': 2.25, '5xl': 3, '6xl': 3.75, '7xl': 4.5, '8xl': 6, '9xl': 8 }).map(
      ([step, rem]) => [`--text-${step}`, `${rem}rem`],
    ),
  ),
  ...Object.fromEntries(
    Object.entries({ '3xs': 16, '2xs': 18, xs: 20, sm: 24, md: 28, lg: 32, xl: 36, '2xl': 42, '3xl': 48, '4xl': 56, '5xl': 64, '6xl': 72, '7xl': 80 }).map(
      ([step, rem]) => [`--container-${step}`, `${rem}rem`],
    ),
  ),
}

describe('UI scaling', () => {
  test('each step sets its factor, and below 100% a coarse pointer keeps 1, so touch targets and text keep their size', () => {
    for (const step of SCALINGS) {
      const n = step.slice(0, -1)
      expect(declaring(youj, '--yj-scale').find((rule) => rule.selector === `[data-yj-scaling='${n}']`)?.decls['--yj-scale']).toBe(String(Number(n) / 100))
    }
    const below = ["[data-yj-scaling='75']", "[data-yj-scaling='80']", "[data-yj-scaling='85']", "[data-yj-scaling='90']", "[data-yj-scaling='95']"]
    // A coarse pointer, unless the subtree is forced to pointer.
    const coarse = youj.match(/@media \(pointer: coarse\) \{\s*:is\(([^)]*)\):not\(\s*\[data-yj-device='pointer'\],\s*\[data-yj-device='pointer'\] \*\s*\)\s*\{\s*--yj-scale: 1;/)
    expect(coarse?.[1]?.split(',').map((s) => s.trim())).toEqual(below)
    // And a subtree forced to touch, on any pointer.
    const forced = youj.match(/\n\s*:is\(([^)]*)\):is\(\s*\[data-yj-device='touch'\],\s*\[data-yj-device='touch'\] \*\s*\)\s*\{\s*--yj-scale: 1;/)
    expect(forced?.[1]?.split(',').map((s) => s.trim())).toEqual(below)
  })

  test("unset, or at 100%, every size is exactly what it was before scaling, for every theme input", () => {
    for (const [name, before] of Object.entries(BEFORE)) {
      const [rule] = declaring(ui, name)
      for (const inputs of INPUTS) expect([name, px(rule!.decls[name]!, inputs)]).toEqual([name, px(before, inputs)])
      for (const inputs of INPUTS) expect([name, px(rule!.decls[name]!, { ...inputs, '--yj-scale': 1 })]).toEqual([name, px(before, inputs)])
    }
  })

  test('in a scaling scope each is its 100% size times the factor, no control goes below the 24px target minimum, and a scale below 100% never shrinks a touch control', () => {
    for (const [name, before] of Object.entries(BEFORE)) {
      const [rule] = declaring(ui, name)
      for (const scale of FACTORS) {
        for (const inputs of INPUTS) {
          const factor = CONTROLS.includes(name) ? Math.max(scale, inputs['--yj-touch']) : scale
          const expected = px(before, inputs) * factor
          const floor = CONTROLS.includes(name) ? Math.max(24, expected) : expected
          const actual = px(rule!.decls[name]!, { ...inputs, '--yj-scale': scale })
          expect([name, scale, actual, Math.abs(actual - floor) < 0.01]).toEqual([name, scale, actual, true])
        }
      }
    }
  })

  test('on touch the default control is at least 44px at every density and scale (exactly 44px at the default), and a pointer keeps its sizes', () => {
    const [rule] = declaring(ui, '--spacing-control')
    const size = rule!.decls['--spacing-control']!
    for (const density of [-1, 0, 1, 2]) {
      for (const scale of [1, ...FACTORS]) {
        const touch = px(size, { '--yj-density': density, '--yj-touch': 1, '--yj-scale': scale })
        expect([density, scale, touch >= 44]).toEqual([density, scale, true])
        // The pointer: 32px plus 4px a density step, unscaled.
        expect(px(size, { '--yj-density': density, '--yj-touch': 0, '--yj-scale': 1 })).toBe(Math.max(24, 32 + density * 4))
      }
    }
    expect(px(size, { '--yj-density': 0, '--yj-touch': 1, '--yj-scale': 1 })).toBe(44)
    expect(px(size, { '--yj-density': 2, '--yj-touch': 1, '--yj-scale': 1 })).toBe(48)
    // xs and sm keep the 8px step and reach 44px with the touch:yj-hit target.
    expect(ui).toMatch(/@utility yj-hit \{[\s\S]*?2\.75rem/)
  })

  test('the sizes are recomputed on every scope that sets one of their inputs, a scaling scope included, and never only on the root', () => {
    for (const name of Object.keys(BEFORE)) {
      const selectors = declaring(ui, name).flatMap((rule) => rule.selector.split(',').map((s) => s.trim()))
      expect([name, selectors]).toEqual([name, expect.arrayContaining([':root', '[data-yj-scaling]'])])
    }
    // Radius and controls also read the theme contract, so every theme scope recomputes them too, and the
    // touch step, so every device scope does: one declaration decides a control's size everywhere.
    expect(declaring(ui, '--radius-md')[0]!.selector).toBe(':root, [data-theme], [data-yj-theme], [data-yj-scaling], [data-yj-device]')
    for (const name of CONTROLS) expect([name, declaring(ui, name).map((rule) => rule.selector)]).toEqual([name, [':root, [data-theme], [data-yj-theme], [data-yj-scaling], [data-yj-device]']])
    expect(declaring(ui, '--yj-touch').map((rule) => [rule.selector, rule.decls['--yj-touch']])).toEqual([
      [':root', '0'],
      [':root', '1'],
      ["[data-yj-device='touch']", '1'],
      ["[data-yj-device='pointer']", '0'],
    ])
  })

  test('a control corner is a pill in a pill theme, else --yj-radius in proportion to its control height at every density, touch step and scale', () => {
    // Each family at each height: the theme's control corner, and the button, field and choice corners that follow it.
    const heights = [
      ['-xs', '--spacing-control-xs'],
      ['-sm', '--spacing-control-sm'],
      ['', '--spacing-control'],
      ['-lg', '--spacing-control-lg'],
    ] as const
    const families = [
      ['control', ['-xs', '-sm', '', '-lg']],
      ['button', ['-xs', '-sm', '', '-lg']],
      ['field', ['-xs', '-sm', '', '-lg']],
      ['choice', ['-xs', '-sm', '', '-lg']],
    ] as const
    for (const [family, steps] of families) {
      for (const [step, control] of heights) {
        if (!(steps as readonly string[]).includes(step)) continue
        const corner = `--radius-${family}${step}`
        const [rule] = declaring(ui, corner)
        expect([corner, rule!.selector]).toEqual([corner, ':root, [data-theme], [data-yj-theme], [data-yj-scaling], [data-yj-device]'])
        const height = declaring(ui, control)[0]!.decls[control]!
        // The rule's own helpers (the height factors, the family's pill switch), expanded in place.
        const expand = (expr: string, shape?: number): string =>
          expr
            .replace(/var\((--ui--[\w-]+)\)/g, (_, name: string) => `(${expand(rule!.decls[name]!, shape)})`)
            .replace(/var\(--yj-shape-[\w-]+, (var\(--yj-pill, 1\))\)/g, (_, pill: string) => (shape === undefined ? pill : String(shape)))
        for (const scale of [1, ...FACTORS]) {
          for (const inputs of INPUTS) {
            const at = { ...inputs, '--yj-scale': scale }
            // A pill theme: the control radius times a hundred, so a square one stays square.
            expect([corner, px(expand(rule!.decls[corner]!), { ...at, '--yj-pill': 1 })]).toEqual([corner, inputs['--yj-radius'] * 100])
            // A rounded one: the 32px control's radius, scaled with this control's height.
            const proportional = (inputs['--yj-radius'] * px(height, at)) / 32
            expect([corner, scale, Math.abs(px(expand(rule!.decls[corner]!), { ...at, '--yj-pill': 0 }) - proportional) < 0.01]).toEqual([corner, scale, true])
            // A family split off from the theme's controls by its own switch, either way.
            if (family !== 'control') {
              expect([corner, Math.abs(px(expand(rule!.decls[corner]!, 0), { ...at, '--yj-pill': 1 }) - proportional) < 0.01]).toEqual([corner, true])
              expect([corner, px(expand(rule!.decls[corner]!, 1), { ...at, '--yj-pill': 0 })]).toEqual([corner, inputs['--yj-radius'] * 100])
            }
          }
        }
      }
    }
  })

  test("Tailwind's spacing, type and container sizes, and the UI type, are the app's own sizes times the factor, no text under 11px, declared only in a scaling scope", () => {
    const [scope, ...elsewhere] = rules(youj).filter((rule) => '--spacing' in rule.decls)
    expect(scope!.selector).toBe('[data-yj-scaling]')
    expect(elsewhere).toEqual([])
    // The app's own value (its @theme, else Tailwind's default), inlined at build time: an app that sets --spacing keeps it, scaled.
    const FLOORED = ['--text-xs', '--text-sm']
    for (const name of Object.keys(TAILWIND)) {
      const scaled = `calc(--theme(${name} inline) * var(--yj-scale))`
      expect([name, scope!.decls[name]]).toEqual([name, FLOORED.includes(name) ? `max(var(--yj-text-min), ${scaled})` : scaled])
    }
    const textMin = declaring(youj, '--yj-text-min')
    expect(textMin.map((rule) => [rule.selector, rule.decls['--yj-text-min']])).toEqual([[':root', '0.6875rem']])
    for (const name of FLOORED)
      for (const scale of FACTORS) {
        const at = px(scope!.decls[name]!.replace(`--theme(${name} inline)`, TAILWIND[name]!), { '--yj-text-min': 11, '--yj-scale': scale })
        expect([name, scale, at]).toEqual([name, scale, Math.round(Math.max(11, px(TAILWIND[name]!, {}) * scale) * 1000) / 1000])
      }

    const theme = Object.fromEntries([...ui.match(/@theme \{([\s\S]*?)\n\}/)![1]!.matchAll(/(--text-ui[\w-]*):\s*([^;]+);/g)].map(([, name, value]) => [name!, value!]))
    expect(Object.keys(theme)).toHaveLength(8)
    for (const [name, size] of Object.entries(theme)) {
      const scaled = declaring(ui, name).filter((rule) => !rule.selector.includes('data-yj-calibration'))
      expect([name, scaled.map((rule) => rule.selector)]).toEqual([name, ['[data-yj-scaling]']])
      if (name.endsWith('--line-height')) {
        expect([name, scaled[0]!.decls[name]]).toEqual([name, `calc(${size} * var(--yj-scale))`])
        continue
      }
      expect([name, scaled[0]!.decls[name]]).toEqual([name, `max(var(--yj-text-min, 0.6875rem), calc(${size} * var(--yj-scale)))`])
      // At init's 90% (and at 75%) a caption holds at 11px; at 100% and above it's its own size times the factor.
      for (const scale of FACTORS) expect([name, scale, px(scaled[0]!.decls[name]!, { '--yj-scale': scale })]).toEqual([name, scale, Math.round(Math.max(11, px(size, {}) * scale) * 1000) / 1000])
    }
  })

  test('the calibration prototype is off unless data-yj-calibration="next": each step then splits into a geometry and a type factor, and the display type sits between them', () => {
    const calibrated = [...rules(youj), ...rules(ui)].filter((rule) => rule.selector.includes('data-yj-calibration'))
    // Every calibrated rule needs the switch: none applies to a page without it.
    for (const rule of calibrated) expect(rule.selector, rule.selector).toMatch(/\[data-yj-calibration='next'\]/)
    const root = calibrated.find((rule) => rule.selector === "[data-yj-calibration='next']")!
    const geometry = Number(root.decls['--yj-calibration'])
    const type = Number(root.decls['--yj-type-calibration'])
    expect(geometry).toBeLessThan(type)
    expect(type).toBeLessThanOrEqual(1)
    for (const step of SCALINGS) {
      const n = step.slice(0, -1)
      const rule = calibrated.find((r) => r.selector.includes(`[data-yj-scaling='${n}']`))!
      const factor = Number(n) / 100
      expect(px(rule.decls['--yj-scale']!, { '--yj-calibration': geometry }), step).toBeCloseTo(factor * geometry)
      expect(px(rule.decls['--yj-type-scale']!, { '--yj-type-calibration': type }), step).toBeCloseTo(factor * type)
    }
    // At 100%: the UI type is 13px times the type factor (12px at 0.92), and never below 12px.
    const uiType = calibrated.find((rule) => '--text-ui' in rule.decls)!
    expect(px(uiType.decls['--text-ui']!, { '--yj-type-scale': type })).toBeGreaterThanOrEqual(12)
    // The display ramp climbs from the type's factor to the geometry's without inverting.
    const text = calibrated.find((rule) => '--text-lg' in rule.decls)!
    const vars = { '--yj-type-scale': type, '--yj-scale': geometry }
    const ramp = ['--text-base', '--text-lg', '--text-xl', '--text-2xl'].map((name) => px(text.decls[name]!, vars))
    ramp.push(30 * geometry)
    for (let i = 1; i < ramp.length; i++) expect(ramp[i]!, String(i)).toBeGreaterThan(ramp[i - 1]!)
  })

  test('in a scaling scope an icon drawn at a fixed size takes it from the spacing unit; outside one, its own attribute holds', () => {
    const icons = [...ui.matchAll(/:where\(\[data-yj-scaling\] svg\.youj-icon\[width='(\d+)'\]\) \{\s*width: calc\(var\(--spacing\) \* ([\d.]+)\);\s*height: calc\(var\(--spacing\) \* ([\d.]+)\);/g)]
    expect(icons.map(([, w]) => Number(w))).toEqual([10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24])
    for (const [, width, w, h] of icons) expect([Number(w) * 4, Number(h) * 4]).toEqual([Number(width), Number(width)])
    // Every icon rule sits inside a scaling scope.
    expect(ui.match(/svg\.youj-icon\[width/g)).toHaveLength(ui.match(/\[data-yj-scaling\] svg\.youj-icon\[width/g)!.length)
  })
})
