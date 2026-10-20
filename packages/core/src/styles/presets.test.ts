import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from 'tailwindcss'

/* The presets are a CSS contract, so the test compiles them through Tailwind
 * exactly as an app would (youj.css imports them) and reads the output. */

const here = dirname(fileURLToPath(import.meta.url))
const twDir = dirname(createRequire(import.meta.url).resolve('tailwindcss/package.json'))

const PRESETS = [
  'yj-fade',
  'yj-pop',
  'yj-tooltip',
  'yj-dialog',
  'yj-backdrop',
  'yj-sheet-top',
  'yj-sheet-right',
  'yj-sheet-bottom',
  'yj-sheet-left',
  'yj-sheet-start',
  'yj-sheet-end',
  'yj-toast',
  'yj-toast-top',
  'yj-toast-content',
  'yj-collapse',
]
const DURATIONS = ['instant', 'fast', 'base', 'slow', 'deliberate'].map((d) => `yj-duration-${d}`)

async function build(candidates: string[]) {
  const compiler = await compile(readFileSync(resolve(here, 'youj.css'), 'utf8'), {
    base: here,
    async loadStylesheet(id, base) {
      const path =
        id === 'tailwindcss'
          ? resolve(twDir, 'index.css')
          : id.startsWith('tailwindcss/')
            ? resolve(twDir, id.slice('tailwindcss/'.length))
            : resolve(base, id)
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
    },
  })
  return compiler.build(candidates)
}

/** The body of `.name { … }`, nested rules included. */
function block(css: string, name: string) {
  const start = css.indexOf(`.${name} {`)
  if (start < 0) return null
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) return css.slice(start, i + 1)
  }
  return null
}

let css = ''
beforeAll(async () => {
  css = await build([...PRESETS, ...DURATIONS])
})

test.each([...PRESETS, ...DURATIONS])('%s compiles', (name) => {
  expect(block(css, name)).not.toBeNull()
})

test.each([...PRESETS, ...DURATIONS])('every duration in %s is a token scaled by --yj-motion, or zero', (name) => {
  const body = block(css, name)!
  const timings = [...body.matchAll(/(?:^|[\s;{])(transition(?:-duration)?|--yj-[a-z-]+):\s*([^;]+);/g)]
    .filter(([, prop, value]) => prop!.startsWith('transition') || /--yj-duration-/.test(value!))
    .map(([, , value]) => value!)
  expect(timings.length).toBeGreaterThan(0)
  for (const value of timings) {
    if (/^\s*0s\s*$/.test(value)) continue
    for (const duration of value.match(/--yj-duration-[a-z]+/g) ?? []) {
      expect(value).toContain(`var(${duration}) *`)
    }
    const resolvesThroughMotion = value.includes('var(--yj-motion, 1)') || /var\(--yj-[a-z]+-(in|t)\)/.test(value)
    expect(resolvesThroughMotion, `${name}: ${value}`).toBe(true)
    expect(value, `${name}: raw time in ${value}`).not.toMatch(/\b\d+(\.\d+)?m?s\b/)
  }
})

test.each(['yj-fade', 'yj-pop', 'yj-tooltip'])('%s skips its transition when Base UI asks for [data-instant]', (name) => {
  expect(block(css, name)).toMatch(/&\[data-instant\]\s*{\s*transition-duration: 0s;/)
})

test.each(['yj-backdrop', 'yj-sheet-right', 'yj-toast'])('%s tracks the finger exactly while swiping', (name) => {
  expect(block(css, name)).toMatch(/&\[data-swiping\]\s*{\s*transition-duration: 0s;/)
})

test('the motion factor defaults to the OS preference, and providers override it', () => {
  expect(css).toMatch(/:root\s*{[^}]*--yj-os-motion: 1;[^}]*--yj-motion: var\(--yj-os-motion\);/)
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*{\s*:root\s*{\s*--yj-os-motion: 0;/)
})

test('logical sheets flip under RTL', () => {
  expect(block(css, 'yj-sheet-start')).toMatch(/&:dir\(rtl\)\s*{\s*--yj-sheet-hidden: translateX\(calc\(100% \+ var\(--yj-sheet-gap, 0px\)\)\);/)
  expect(block(css, 'yj-sheet-end')).toMatch(/&:dir\(rtl\)\s*{\s*--yj-sheet-hidden: translateX\(calc\(-100% - var\(--yj-sheet-gap, 0px\)\)\);/)
})

test('presets animate transform and leave translate / scale to layout utilities', () => {
  for (const name of PRESETS) {
    expect(block(css, name), name).not.toMatch(/(?:^|[\s;{])(translate|scale):/)
  }
})

test.each(['yj-pop', 'yj-tooltip', 'yj-dialog'])('%s lands its transform on the CSS spring and keeps its opacity a short tween', (name) => {
  const body = block(css, name)!
  expect(body).toMatch(/transform calc\(var\(--yj-duration-spring\) \* var\(--yj-motion, 1\)\) var\(--ease-spring\)/)
  expect(body).toMatch(/opacity var\(--yj-[a-z]+-in\) var\(--ease-enter\)/)
  // The exit stays a short decelerating tween for both.
  expect(body).toMatch(/&\[data-ending-style\]\s*{[^}]*transition-timing-function: var\(--ease-standard\);/)
})
