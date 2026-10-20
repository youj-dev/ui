import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spring } from 'motion/react'
import { motionPersonalities, springPhysics } from '../lib/youj/tokens'

const css = readFileSync(resolve(__dirname, 'youj.css'), 'utf8')

test("the mode sets color-scheme, so the browser's scrollbars and controls follow light and dark, scopes included", () => {
  expect(css).toMatch(/:root,\s*\[data-theme='dark'\]\s*\{\s*color-scheme: dark;\s*\}/)
  expect(css).toMatch(/\[data-theme='light'\]\s*\{\s*color-scheme: light;\s*\}/)
})

test('a page with no data-theme is dark, for the tokens and the dark: variant alike', () => {
  expect(css).toMatch(/:root,\s*\[data-theme='dark'\]\s*\{\s*--yj-dark: 1;/)
  expect(css).toMatch(/\n\s*\[data-theme='light'\]\s*\{\s*--yj-dark: 0;/)
  // Same specificity as :root, so the light table must come later to win on <html data-theme="light">.
  expect(css.indexOf('--yj-dark: 0;')).toBeGreaterThan(css.indexOf('--yj-dark: 1;'))
  expect(css.indexOf('color-scheme: light;')).toBeGreaterThan(css.indexOf('color-scheme: dark;'))
  const variant = css.match(/@custom-variant dark \(&:where\((.*)\)\);/)![1]!
  const darkAt = (html: string) => {
    document.documentElement.removeAttribute('data-theme')
    document.body.innerHTML = html
    return document.querySelector('#target')!.matches(`:where(${variant})`)
  }
  expect(darkAt('<div id="target"></div>')).toBe(true)
  expect(darkAt('<div data-theme="light"><p id="target"></p></div>')).toBe(false)
  expect(darkAt('<div data-theme="light"><div data-theme="dark"><p id="target"></p></div></div>')).toBe(true)
  document.documentElement.setAttribute('data-theme', 'light')
  document.body.innerHTML = '<p id="target"></p>'
  expect(document.querySelector('#target')!.matches(`:where(${variant})`)).toBe(false)
  document.documentElement.removeAttribute('data-theme')
})

/* A duration is --yj-ms-* × --yj-time-scale. Resolving it on every element made
 * each one compute five calc()s on every restyle; it resolves where an input
 * is set instead, and inherits. provider.test.tsx checks that every element
 * the provider gives a time scale matches. */
const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
const selectorsSetting = (name: string) => rules.filter(([, , body]) => body!.includes(`${name}:`)).flatMap(([, s]) => s!.split(',').map((x) => x.trim()))

test('durations resolve where an input is set, the root, a personality or a time scale, and inherit from there', () => {
  expect(selectorsSetting('--yj-duration-fast')).toEqual([':root', '[data-yj-motion]', '[data-yj-scope]'])
  expect(selectorsSetting('--yj-ms-fast').every((s) => s === ':root' || s.startsWith('[data-yj-motion'))).toBe(true)
  expect(selectorsSetting('--yj-time-scale')).toEqual([':root'])
})

/* --ease-spring is each personality's smooth spring, sampled from Motion's own
 * generator on the same physics useYouj hands it (springPhysics), over the
 * time it takes to settle within 0.1%. */
function springCurve(shape: { visualDuration: number; bounce: number }) {
  const generator = spring({ keyframes: [0, 1], ...springPhysics(shape), restDelta: 1e-9, restSpeed: 1e-9 })
  let last = 0
  for (let t = 0; t <= 3000; t++) if (Math.abs((generator.next(t).value as number) - 1) >= 0.001) last = t
  const ms = Math.ceil((last + 1) / 10) * 10
  const points = Array.from({ length: 33 }, (_, i) => (i === 32 ? 1 : Number((generator.next((i * ms) / 32).value as number).toFixed(4))))
  return { ms: `${ms}ms`, ease: `linear(${points.join(', ')})` }
}

test.each(Object.keys(motionPersonalities))('the %s spring curve and its duration match the JS smooth spring', (name) => {
  const expected = springCurve(motionPersonalities[name as keyof typeof motionPersonalities].springs.smooth)
  const body = rules.find(([, selector]) => selector!.includes(`[data-yj-motion='${name}']`))![2]!
  const read = (prop: string) => body.match(new RegExp(`${prop}:\\s*([^;]+);`))?.[1]?.trim()
  expect({ ms: read('--yj-ms-spring'), ease: read('--ease-spring') }, `youj.css [data-yj-motion='${name}'] wants:\n${JSON.stringify(expected, null, 2)}`).toEqual(expected)
  if (name === 'precise') expect(css).toContain(`--ease-spring: ${expected.ease};\n}`) // the @theme default, so ease-spring is a utility
})

test('the spring duration resolves with the others and follows the time scale', () => {
  expect(selectorsSetting('--yj-duration-spring')).toEqual([':root', '[data-yj-motion]', '[data-yj-scope]'])
  expect(css).toContain('--yj-duration-spring: calc(var(--yj-ms-spring) * var(--yj-time-scale));')
})
