import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from 'tailwindcss'

/* The scrollbar treatment is CSS alone, so the test compiles ui.css after
 * youj.css through Tailwind, as an app's one CSS entry does, and reads
 * what comes out. The thumb colors' contrast is held by ui-tokens.test.ts. */

const here = dirname(fileURLToPath(import.meta.url))
const twDir = dirname(createRequire(import.meta.url).resolve('tailwindcss/package.json'))
const entry = "@import '../../../core/src/styles/youj.css';\n@import './ui.css';\n"

let css = ''
beforeAll(async () => {
  const compiler = await compile(entry, {
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
  css = compiler.build(['yj-scrollbar'])
})

/** Every `{ … }` body whose selector (the text before it) matches, nested rules included. */
function blocks(selector: RegExp) {
  const out: string[] = []
  for (const match of css.matchAll(new RegExp(`(^|[;{}])\\s*${selector.source}\\s*\\{`, 'g'))) {
    let depth = 0
    const open = match.index + match[0].length - 1
    for (let i = open; i < css.length; i++) {
      if (css[i] === '{') depth++
      else if (css[i] === '}' && --depth === 0) {
        out.push(css.slice(open, i + 1))
        break
      }
    }
  }
  return out
}

const squash = (s: string) => s.replace(/\s+/g, ' ')

test('every native bar takes the theme thumb on a transparent track, re-resolved in every scope', () => {
  const scopes = blocks(/:root,\s*\[data-theme\],\s*\[data-yj-theme\](?:,\s*\[data-yj-tone\])?/).map(squash)
  expect(scopes.some((b) => b.includes('scrollbar-color: var(--ui-scrollbar-thumb) transparent;'))).toBe(true)
  // The thumb colors are declared on the same scopes, so each scope computes its own.
  expect(scopes.some((b) => /--ui-scrollbar-thumb: .*--ui-scrollbar-thumb-hover: .*--ui-scrollbar-thumb-active: /.test(b))).toBe(true)
})

test("the page's own bar is thin", () => {
  expect(blocks(/:root/).map(squash)).toContainEqual(expect.stringMatching(/^\{ scrollbar-width: thin; \}$/))
})

test('yj-scrollbar is thin, quiet at rest, and firms up under the pointer or keyboard focus', () => {
  const [utility] = blocks(/\.yj-scrollbar/).map(squash).filter((b) => b.includes('scrollbar-width'))
  expect(utility).toBeDefined()
  expect(utility).toContain('scrollbar-width: thin;')
  expect(utility).toContain('scrollbar-color: var(--ui-scrollbar-thumb) transparent;')
  expect(utility).toMatch(/&:focus-visible, &:has\(:focus-visible\) \{ scrollbar-color: var\(--ui-scrollbar-thumb-hover\) transparent; \}/)
  // Hover only where there is a pointer that hovers: a tap mustn't leave it stuck on.
  expect(utility).toMatch(/@media \(hover: hover\) \{ &:hover \{ scrollbar-color: var\(--ui-scrollbar-thumb-hover\) transparent; \} \}/)
})

test('the thumb changes at once: easing an inherited property restyles the whole region every frame', () => {
  expect(css).not.toMatch(/transition[^;]*scrollbar-color/)
})

test("cmdk's list height doesn't inherit, so a change of results restyles the list alone, not every row", () => {
  expect(squash(css)).toContain("@property --cmdk-list-height { syntax: '*'; inherits: false; }")
})

test('the kit styles scrollbars with the standard properties only', () => {
  // ::-webkit-scrollbar would pin macOS's overlay bars in Safari and Chrome, and Chrome ignores it once the standard properties are set.
  expect(css).not.toMatch(/::-webkit-scrollbar/)
})
