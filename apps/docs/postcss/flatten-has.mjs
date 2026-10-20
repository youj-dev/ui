// Tailwind writes `group-has-*` as `.u:is(:where(.group\/x):has(...) *)` and a `has-*:*:` child variant as
// `:is(.u:has(...) > *)[attr]`: a :has() inside an :is() that stands for "the ancestor". Chrome can't keep the
// invalidation for that shape local; with one such rule in the sheet, inserting any node makes it restyle the whole
// subtree around the insertion (a page of kit components: ~1,400 elements, ~28 ms, every time). The same selector
// written as a plain descendant, `:where(.group\/x):has(...) .u`, matches the same elements with the same specificity
// and invalidates only around the :has() subject. This plugin rewrites the first shape into the second once Tailwind
// has compiled; a selector it doesn't recognise is left as it is. (Turbopack copies a plugin out on its own, so
// the file imports nothing from this folder.)

/** The index just past the bracket that closes the one opened at `at`, skipping escapes and quoted strings. */
function close(s, at) {
  let depth = 0
  let quote = ''
  for (let i = at; i < s.length; i++) {
    const c = s[i]
    if (c === '\\') i++
    else if (quote) {
      if (c === quote) quote = ''
    } else if (c === '"' || c === "'") quote = c
    else if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') {
      if (--depth === 0) return i + 1
    }
  }
  return -1
}

/** Whether `s` has a combinator outside its brackets: it is then more than one compound selector. */
function hasCombinator(s) {
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '\\') i++
    else if (c === '(' || c === '[') {
      const end = close(s, i)
      if (end < 0) return true
      i = end - 1
    } else if (c === ' ' || c === '>' || c === '+' || c === '~') return true
  }
  return false
}

/** The index of the first `:is(` outside every bracket of `s`, or -1. */
function topLevelIs(s) {
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\') i++
    else if (s[i] === '(' || s[i] === '[') {
      const end = close(s, i)
      if (end < 0) return -1
      i = end - 1
    } else if (s.startsWith(':is(', i)) return i
  }
  return -1
}

/** `selector` with a `:is(<ancestor with :has()> <combinator> *)` on a single compound turned into the plain ancestor form, else unchanged. */
export function flattenHas(selector) {
  if (!selector.includes(':has(')) return selector
  const at = topLevelIs(selector)
  if (at < 0) return selector
  const end = close(selector, at + 3)
  const inner = selector.slice(at + 4, end - 1)
  const subject = selector.slice(0, at) + selector.slice(end)
  const m = /^(?<ancestor>.+?)\s*(?<combinator>[>+~]?)\s*\*$/.exec(inner)
  if (!subject || hasCombinator(subject) || !m || !m.groups.ancestor.includes(':has(')) return selector
  const { ancestor, combinator } = m.groups
  return `${ancestor} ${combinator ? `${combinator} ` : ''}${subject}`
}

export default function flattenHasPlugin() {
  return {
    postcssPlugin: 'youj-flatten-has',
    Once(root) {
      root.walkRules((rule) => {
        if (!rule.selector.includes(':has(')) return
        const flat = rule.selectors.map(flattenHas).join(', ')
        if (flat !== rule.selector) rule.selector = flat
      })
    },
  }
}
flattenHasPlugin.postcss = true
