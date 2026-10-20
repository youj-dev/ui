import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { DEFAULT_LOOK, LOOKS } from '@youj/core/lib/youj/look'

/* A component style may only ever change components inside its own scope:
 * Classic (no attribute, or data-yj-look="classic") must render exactly as
 * it always has. Each style's stylesheet is therefore one utilities layer
 * holding two blocks: helper custom properties on the scope, and a gate
 * whose nested rules all compound onto it with `&`, so no selector can
 * match outside the scope or inside a nested scope of another style. */

interface Block {
  prelude: string
  body: string
  children: Block[]
}

/** Blocks at one level of nesting: `prelude { body }`, comments removed. */
function blocks(css: string): Block[] {
  const out: Block[] = []
  let depth = 0
  let start = 0
  let open = 0
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (c === '{') {
      if (depth === 0) open = i
      depth++
    } else if (c === '}') {
      depth--
      if (depth === 0) {
        const prelude = css.slice(start, open).split(/;/).pop()!.trim()
        const body = css.slice(open + 1, i)
        out.push({ prelude, body, children: blocks(body) })
        start = i + 1
      }
    } else if (c === ';' && depth === 0) start = i + 1
  }
  return out
}

/** Splits a selector list on its top-level commas. */
function selectors(prelude: string): string[] {
  const parts: string[] = []
  let depth = 0
  let from = 0
  for (let i = 0; i < prelude.length; i++) {
    if (prelude[i] === '(') depth++
    else if (prelude[i] === ')') depth--
    else if (prelude[i] === ',' && depth === 0) {
      parts.push(prelude.slice(from, i).trim())
      from = i + 1
    }
  }
  parts.push(prelude.slice(from).trim())
  return parts
}

/** The subject: the last compound of a selector, after its last top-level combinator. */
function subject(selector: string): string {
  let depth = 0
  let from = 0
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i]!
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (depth === 0 && /[\s>+~]/.test(c)) from = i + 1
  }
  return selector.slice(from)
}

/** Every style rule under `block`, descending through conditional at-rules. */
function rules(block: Block): Block[] {
  return block.children.flatMap((child) => (child.prelude.startsWith('@') ? rules(child) : [child]))
}

const custom = LOOKS.filter((style) => style !== 'classic')

test('classic has no stylesheet, and every other style has one', () => {
  expect(existsSync(resolve(__dirname, 'classic.css'))).toBe(false)
  for (const style of custom) expect(existsSync(resolve(__dirname, `${style}.css`)), style).toBe(true)
})

describe.each(custom)('%s', (style) => {
  const css = readFileSync(resolve(__dirname, `${style}.css`), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const top = blocks(css)
  const scope = `[data-yj-look='${style}']`
  // The default style's recipes also apply where no style is written at all.
  const unstyled = style === DEFAULT_LOOK ? ', :not([data-yj-look], [data-yj-look] *)' : ''
  const gate = `:where(${scope} *${unstyled}):not(:where(${scope} [data-yj-look]:not(${scope}) *))`

  // The recipes sit in utilities.style: above a component's `own:` classes, below a className (ui.css).
  const layer = () => top[0]!.children[0]!

  test('is one layer, utilities.style', () => {
    expect(top.map((b) => b.prelude)).toEqual(['@layer utilities'])
    expect(top[0]!.children.map((b) => b.prelude)).toEqual(['@layer style'])
  })

  test('holds only helper properties on the scope, and the gate', () => {
    const [helpers, gated, ...rest] = layer().children
    expect(rest).toEqual([])
    expect(helpers!.prelude).toBe(`:where(:root, ${scope}, [data-theme], [data-yj-theme], [data-yj-tone], [data-yj-scaling])`)
    expect(helpers!.children).toEqual([])
    const declarations = helpers!.body.split(';').map((d) => d.trim()).filter(Boolean)
    for (const d of declarations) expect(d, 'a helper sets only custom properties').toMatch(/^--[\w-]+\s*:/)
    expect(gated!.prelude).toBe(gate)
  })

  test('every rule compounds onto the gate, so nothing matches outside the scope', () => {
    const gated = layer().children[1]!
    const all = rules(gated)
    expect(all.length).toBeGreaterThan(50)
    for (const rule of all) {
      for (const selector of selectors(rule.prelude)) {
        // The element styled is the one that passed the gate: `&` sits in the subject.
        expect(subject(selector), `${selector} is gated`).toContain('&')
        expect(rule.children, `${selector} nests no further rules`).toEqual([])
      }
    }
  })
})
