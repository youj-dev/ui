import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ROLES } from '@youj/core/lib/youj/theme'

/* The compat sheet is the one place shadcn's names live. Each variable it
 * declares must point at a role that exists, and shadcn's `accent` must stay
 * unmapped: in youj `bg-accent` is the brand colour. */

const css = readFileSync(resolve(__dirname, 'shadcn.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const declared = new Map([...css.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map(([, name, value]) => [name!, value!.trim()]))

test('reads the sheet', () => {
  expect(declared.size).toBeGreaterThan(30)
})

test('every shadcn variable resolves to a youj role or a radius', () => {
  const roles = new Set<string>(ROLES)
  for (const [name, value] of declared) {
    if (name.startsWith('--color-')) continue // @theme inline: a class name pointing at the variable above
    const target = value.match(/^var\(--(color|radius)-([\w-]+)\)$/)
    expect([name, value, Boolean(target)]).toEqual([name, value, true])
    if (target![1] === 'color') expect([name, roles.has(target![2]!)]).toEqual([name, true])
  }
})

test('every @theme inline class points at a variable the sheet declares', () => {
  for (const [name, value] of declared) {
    if (!name.startsWith('--color-')) continue
    const target = value.match(/^var\((--[\w-]+)\)$/)![1]!
    expect([name, declared.has(target)]).toEqual([name, true])
  }
})

test("shadcn's accent is left alone", () => {
  for (const name of ['--accent', '--accent-foreground', '--color-accent', '--color-accent-foreground']) expect(declared.has(name)).toBe(false)
})
