import { readdirSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from 'tailwindcss'

/* The density-aware classes (`p-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))]`)
 * as an app's own Tailwind build makes them: ui.css compiled after youj.css with
 * only those classes as candidates, the way an app's build sees them in the
 * built components. Every variable a class reads must be declared in that
 * output (a theme variable Tailwind left out makes the whole value invalid),
 * its calc() must be valid CSS arithmetic (a length times a length is not),
 * and it must come to the size it promises at each density, scale and device.
 * That is the arithmetic on paper; density-browser.test.tsx lays a sidebar out
 * in real engines, where Chromium 141 once got a valid expression wrong. */

const here = dirname(fileURLToPath(import.meta.url))
const twDir = dirname(createRequire(import.meta.url).resolve('tailwindcss/package.json'))
const entry = "@import 'tailwindcss';\n@import '../../../core/src/styles/youj.css';\n@import './ui.css';\n"

const files = (dir: string): string[] => readdirSync(dir).flatMap((name) => (statSync(join(dir, name)).isDirectory() ? files(join(dir, name)) : name.endsWith('.tsx') && !name.includes('.test.') && !name.includes('.stories.') ? [join(dir, name)] : []))
const sources = [...files(resolve(here, '../components')), ...files(resolve(here, '../blocks'))]
const candidates = [...new Set(sources.flatMap((f) => readFileSync(f, 'utf8').match(/[^\s'"`]*\[[^\s'"`]*ui--compact[^\s'"`]*/g) ?? []))]

let css = ''
beforeAll(async () => {
  const compiler = await compile(entry, {
    base: here,
    async loadStylesheet(id, base) {
      const path = id === 'tailwindcss' ? resolve(twDir, 'index.css') : resolve(base, id)
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
    },
  })
  css = compiler.build(candidates)
})

/** Declarations on `:root` in rules that only cascade layers enclose (not media queries), in order. */
function rootDeclarations(): Record<string, string> {
  const out: Record<string, string> = {}
  const stack: string[] = []
  for (const m of css.matchAll(/([^{};]*)\{|\}|([^{};]+);/g)) {
    if (m[1] !== undefined) stack.push(m[1].trim())
    else if (m[0] === '}') stack.pop()
    else {
      const selector = stack.at(-1) ?? ''
      const enclosing = stack.slice(0, -1)
      if (!enclosing.every((s) => s.startsWith('@layer')) || !selector.split(',').some((s) => s.trim() === ':root')) continue
      const decl = m[2]!.trim().match(/^(--[\w-]+)\s*:\s*([\s\S]+)$/)
      if (decl) out[decl[1]!] = decl[2]!.trim()
    }
  }
  return out
}

type Value = { n: number; length: boolean }

/** Evaluates a CSS length or number expression the way calc() types it, in px. Throws on an undeclared variable or invalid arithmetic. */
function evaluate(value: string, vars: Record<string, string>, depth = 0): Value {
  if (depth > 20) throw new Error(`variables nest too deep in ${value}`)
  const tokens = value.match(/-?\d*\.?\d+(?:rem|px|%)?|[\w-]+\(|--[\w-]+|[(),*/+-]/g) ?? []
  let i = 0
  const peek = () => tokens[i]
  const take = (want?: string) => {
    const t = tokens[i++]
    if (want !== undefined && t !== want) throw new Error(`expected ${want}, got ${t} in ${value}`)
    return t!
  }
  const add = (a: Value, b: Value, sign: 1 | -1): Value => {
    if (a.length !== b.length) throw new Error(`adds a number to a length in ${value}`)
    return { n: a.n + sign * b.n, length: a.length }
  }
  const expr = (): Value => {
    let v = term()
    for (;;) {
      const op = peek()
      if (op !== '+' && op !== '-') return v
      take()
      v = add(v, term(), op === '+' ? 1 : -1)
    }
  }
  const term = (): Value => {
    let v = factor()
    for (;;) {
      const op = peek()
      if (op !== '*' && op !== '/') return v
      take()
      const w = factor()
      if (op === '*') {
        if (v.length && w.length) throw new Error(`multiplies two lengths in ${value}`)
        v = { n: v.n * w.n, length: v.length || w.length }
      } else {
        if (w.length) throw new Error(`divides by a length in ${value}`)
        v = { n: v.n / w.n, length: v.length }
      }
    }
  }
  const args = (): Value[] => {
    const list = [expr()]
    while (peek() === ',') take(), list.push(expr())
    take(')')
    return list
  }
  const factor = (): Value => {
    const t = take()
    if (t === '(' || t === 'calc(') {
      const v = expr()
      take(')')
      return v
    }
    if (t === '-') {
      const v = factor()
      return { ...v, n: -v.n }
    }
    if (t === 'max(' || t === 'min(') {
      const list = args()
      if (list.some((v) => v.length !== list[0]!.length)) throw new Error(`mixes types in ${t} in ${value}`)
      return { n: Math[t === 'max(' ? 'max' : 'min'](...list.map((v) => v.n)), length: list[0]!.length }
    }
    if (t === 'env(') {
      while (take() !== ')');
      return { n: 0, length: true }
    }
    if (t === 'var(') {
      const name = take()
      let fallback: string | undefined
      if (peek() === ',') {
        take()
        const start = i
        let open = 0
        while (open > 0 || peek() !== ')') {
          const s = take()
          if (s.endsWith('(')) open++
          if (s === ')') open--
        }
        fallback = tokens.slice(start, i).join(' ')
      }
      take(')')
      const declared = vars[name] ?? fallback
      if (declared === undefined) throw new Error(`${name} isn't declared in the compiled CSS (${value})`)
      return evaluate(declared, vars, depth + 1)
    }
    const m = t.match(/^(-?\d*\.?\d+)(rem|px|%)?$/)
    if (!m) throw new Error(`can't read ${t} in ${value}`)
    const n = Number(m[1])
    return m[2] === 'rem' ? { n: n * 16, length: true } : m[2] === 'px' ? { n, length: true } : { n, length: false }
  }
  const v = expr()
  if (i < tokens.length) throw new Error(`left over: ${tokens.slice(i).join(' ')} in ${value}`)
  return v
}

/** Every property value a density-aware class compiles to, from the utilities layer. */
function densityValues(): { prop: string; value: string }[] {
  const utilities = css.slice(css.indexOf('@layer utilities {'))
  return [...utilities.matchAll(/(--[\w-]+|[a-z-]+)\s*:\s*([^;{}]*--ui--compact[^;{}]*);/g)].map((m) => ({ prop: m[1]!, value: m[2]!.trim() }))
}

const SCENARIOS: { name: string; vars: Record<string, string> }[] = [
  { name: 'roomy 100%', vars: {} },
  { name: 'compact 100%', vars: { '--ui--compact': '1' } },
  { name: 'compact 90%', vars: { '--ui--compact': '1', '--yj-scale': '0.9' } },
  { name: 'compact on touch', vars: { '--ui--compact': '1', '--yj-touch': '1' } },
]

test('the components and blocks have density-aware classes, and each compiles', () => {
  expect(candidates.length).toBeGreaterThan(20)
  expect(densityValues().length).toBeGreaterThanOrEqual(new Set(candidates.map((c) => c.replace(/^.*?:(?=[a-z-]*\[|\[)/, ''))).size - 2)
})

test.each(SCENARIOS)('every density-aware class reads only declared variables and valid arithmetic: $name', ({ vars }) => {
  const root = { ...rootDeclarations(), ...vars }
  for (const { prop, value } of densityValues()) {
    const v = evaluate(value, root)
    if (!prop.startsWith('margin')) expect(v.n, `${prop}: ${value}`).toBeGreaterThanOrEqual(0)
  }
})

test("a sidebar row is the control's height roomy, the small control's compact, and the control's on touch", () => {
  const value = densityValues().find((d) => d.prop === 'height' && d.value.includes('--spacing-control-sm'))!.value
  const px = (extra: Record<string, string>, of = value) => evaluate(of, { ...rootDeclarations(), ...extra }).n
  for (const scale of ['1', '0.9']) {
    expect(px({ '--yj-scale': scale })).toBe(px({ '--yj-scale': scale }, 'var(--spacing-control)'))
    expect(px({ '--yj-scale': scale, '--ui--compact': '1' })).toBe(px({ '--yj-scale': scale }, 'var(--spacing-control-sm)'))
    expect(px({ '--yj-scale': scale, '--ui--compact': '1', '--yj-touch': '1' })).toBe(px({ '--yj-scale': scale, '--yj-touch': '1' }, 'var(--spacing-control)'))
  }
  expect(px({ '--ui--compact': '1' })).toBeGreaterThanOrEqual(24)
})
