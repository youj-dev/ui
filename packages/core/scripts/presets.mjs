// The motion presets (src/styles/presets.css) as registry data:
//   - presetClassPattern() matches a class that is one of its utilities
//     (yj-pop, yj-sheet-right, yj-duration-fast…), so a registry item that uses one
//     can depend on youj-presets. Whole class tokens only: the variable in
//     `duration-(--yj-duration-fast)` isn't the yj-duration-fast class.
//   - cssToObject() turns a stylesheet into a shadcn registry-item `css`
//     object, which `shadcn add` writes into the app's own stylesheet.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PRESETS = join(import.meta.dirname, '../src/styles/presets.css')

/** The @utility names in presets.css. */
export function presetUtilities(css = readFileSync(PRESETS, 'utf8')) {
  return [...css.matchAll(/@utility\s+([\w-]+)/g)].map((m) => m[1])
}

export function presetClassPattern(css) {
  const names = presetUtilities(css).sort((a, b) => b.length - a.length)
  return new RegExp(`(?<=^|[\\s'"\`:!])(?:${names.join('|')})(?=$|[\\s'"\`}])`, 'm')
}

/**
 * Whether source code uses a preset class. Comments and JSX `key` values are
 * left out: `key="yj-collapse"` names an element, it doesn't style one.
 */
export function usesPresetClass(source, pattern = presetClassPattern()) {
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/\bkey=\{?(["'`])[^"'`]*\1\}?/g, '')
  return pattern.test(code)
}

/**
 * Nested CSS → shadcn's `css` object: a block becomes { prelude: { … } }, a
 * declaration { property: value }, a statement like `@apply x;` { '@apply x': {} }.
 * Whitespace collapses to single spaces. Throws on a repeated key in one
 * block, which the object couldn't keep apart.
 */
export function cssToObject(source) {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '')
  // Strings (odd parts of the split) keep their spaces.
  const tidy = (text) =>
    text
      .trim()
      .split(/('[^']*'|"[^"]*")/)
      .map((part, n) => (n % 2 ? part : part.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')')))
      .join('')
  let i = 0
  function block() {
    const out = {}
    const put = (key, value) => {
      if (key in out) throw new Error(`"${key}" appears twice in one block`)
      out[key] = value
    }
    let start = i
    let depth = 0
    let quote = ''
    for (; i < css.length; i++) {
      const c = css[i]
      if (quote) {
        if (c === quote) quote = ''
      } else if (c === '"' || c === "'") quote = c
      else if (c === '(') depth++
      else if (c === ')') depth--
      else if (depth === 0 && c === '{') {
        const prelude = tidy(css.slice(start, i))
        i++
        put(prelude, block())
        start = i + 1
      } else if (depth === 0 && (c === ';' || c === '}')) {
        const text = tidy(css.slice(start, i))
        if (text) {
          if (text.startsWith('@')) put(text, {})
          else {
            const colon = text.indexOf(':')
            put(text.slice(0, colon).trim(), text.slice(colon + 1).trim())
          }
        }
        if (c === '}') return out
        start = i + 1
      }
    }
    return out
  }
  return block()
}
