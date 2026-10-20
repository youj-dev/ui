import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { LOOKS } from '@youj/core/lib/youj/look'

/* A component style must resolve against the theme scope it sits in. The
 * names in an `@theme inline` block (--shadow-sm: var(--ui-shadow-sm)…)
 * are bridges for Tailwind's utilities, which inline them; read through a raw
 * var() they are emitted once on :root, resolve there, and every nested scope
 * inherits the page's value: a light scope in a dark page gets dark cards
 * under dark text. A style reads the per-scope names instead. */

const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

/** Custom properties declared in the `@theme inline { … }` blocks of a stylesheet. */
function inlineBridges(css: string): string[] {
  const names: string[] = []
  for (const [, body] of strip(css).matchAll(/@theme\s+inline\s*\{([^}]*)\}/g))
    for (const [, name] of body!.matchAll(/(--[\w-]+)\s*:/g)) names.push(name!)
  return names
}

const bridges = new Set([
  ...inlineBridges(readFileSync(resolve(__dirname, 'ui.css'), 'utf8')),
  ...inlineBridges(readFileSync(resolve(__dirname, '../../../core/src/styles/youj.css'), 'utf8')),
])

test('finds the bridges it guards against', () => {
  for (const name of ['--shadow-xs', '--shadow-sm-soft', '--default-border-width'])
    expect(bridges.has(name), name).toBe(true)
})

describe.each(LOOKS.filter((style) => style !== 'classic'))('%s', (style) => {
  test('reads no @theme inline bridge through var(), so nested light/dark scopes resolve their own values', () => {
    const css = strip(readFileSync(resolve(__dirname, `${style}.css`), 'utf8'))
    const read = [...css.matchAll(/var\(\s*(--[\w-]+)/g)].map(([, name]) => name!)
    expect([...new Set(read.filter((name) => bridges.has(name)))]).toEqual([])
  })
})

test("Bezel's --bz-* helpers are built from roles and theme inputs only", () => {
  const css = strip(readFileSync(resolve(__dirname, 'bezel.css'), 'utf8'))
  const read = [...css.matchAll(/--bz-[\w-]+\s*:([^;]*);/g)].flatMap(([, value]) => [...value!.matchAll(/var\(\s*(--[\w-]+)/g)].map(([, name]) => name!))
  expect(read.length).toBeGreaterThan(0)
  expect([...new Set(read.filter((name) => !/^--(color|yj|bz|radius|ui)-/.test(name)))]).toEqual([])
})
