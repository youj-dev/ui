/* The code theme is CSS variables, not colors: every token resolves to a
 * youj token at runtime (see styles/code.css), so one highlight pass serves
 * both themes and follows `data-theme` like everything else. Restrained on
 * purpose: keywords carry the accent, strings and numbers get the quiet status
 * hues, and structure (punctuation, comments) recedes. */

import type { HighlightHastOptions } from 'fumadocs-core/highlight'

const token = (name: string) => `var(--code-${name})`

export const youjCodeTheme = {
  name: 'youj',
  type: 'dark' as const,
  colors: {
    'editor.background': token('bg'),
    'editor.foreground': token('fg'),
  },
  tokenColors: [
    { settings: { foreground: token('fg'), background: token('bg') } },
    { scope: ['comment', 'punctuation.definition.comment', 'string.comment'], settings: { foreground: token('comment') } },
    {
      scope: [
        'keyword',
        'storage',
        'storage.type',
        'storage.modifier',
        'keyword.control',
        'keyword.operator.new',
        'keyword.operator.expression',
        'keyword.operator.typeof',
        'variable.language.this',
      ],
      settings: { foreground: token('keyword') },
    },
    {
      scope: ['string', 'string.quoted', 'string.template', 'punctuation.definition.string', 'string.regexp'],
      settings: { foreground: token('string') },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character', 'constant.other', 'support.constant'],
      settings: { foreground: token('number') },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call entity.name.function'],
      settings: { foreground: token('function') },
    },
    {
      scope: ['entity.name.tag', 'support.class.component', 'entity.name.type', 'entity.name.class', 'support.type', 'support.class'],
      settings: { foreground: token('type') },
    },
    {
      scope: ['entity.other.attribute-name', 'meta.object-literal.key', 'support.type.property-name', 'variable.other.property'],
      settings: { foreground: token('property') },
    },
    {
      scope: [
        'punctuation',
        'meta.brace',
        'keyword.operator',
        'punctuation.definition.tag',
        'punctuation.separator',
        'punctuation.terminator',
      ],
      settings: { foreground: token('punctuation') },
    },
    { scope: ['variable', 'variable.parameter', 'variable.other.readwrite', 'meta.definition.variable'], settings: { foreground: token('fg') } },
    { scope: ['markup.inserted'], settings: { foreground: token('string') } },
    { scope: ['markup.deleted'], settings: { foreground: token('danger') } },
  ],
}

type CodeTransformer = NonNullable<HighlightHastOptions['transformers']>[number]
type Line = Parameters<NonNullable<CodeTransformer['line']>>[0]
type Span = Extract<Line['children'][number], { type: 'element' }>

/** Each token color as a class (styles/theme.css), so a token costs `class="ck"` in the page, not an inline style. Default-colored text gets none. */
export const TOKEN_CLASS: Record<string, string> = {
  keyword: 'ck',
  string: 'cs',
  number: 'cn',
  function: 'cf',
  type: 'ct',
  property: 'cp',
  comment: 'cc',
  punctuation: 'cu',
  danger: 'cd',
}

/**
 * Shiki writes every token's color inline. This swaps it for a class, leaves
 * default-colored text bare, and joins neighbors of one color, so a line is
 * a handful of spans rather than one per token. The text is untouched.
 */
export const codeClasses: CodeTransformer = {
  name: 'youj:code-classes',
  pre(node) {
    delete node.properties.style
  },
  line(node) {
    const out: Line['children'] = []
    for (const child of node.children) {
      let next = child
      if (child.type === 'element' && typeof child.properties.style === 'string') {
        const cls = TOKEN_CLASS[/var\(--code-([a-z]+)\)/.exec(child.properties.style)?.[1] ?? '']
        delete child.properties.style
        if (cls) child.properties.class = [child.properties.class, cls].filter(Boolean).join(' ')
        if (Object.keys(child.properties).length === 0 && child.children.length === 1 && child.children[0]!.type === 'text') next = child.children[0]!
      }
      const last = out.at(-1)
      if (last?.type === 'text' && next.type === 'text') {
        last.value += next.value
        continue
      }
      if (last?.type === 'element' && next.type === 'element' && sameColour(last, next)) {
        const [a, b] = [last.children[0], next.children[0]]
        if (a?.type === 'text' && b?.type === 'text') {
          a.value += b.value
          continue
        }
      }
      out.push(next)
    }
    node.children = out
  },
}

/** Two spans that are one color and nothing else. */
function sameColour(a: Span, b: Span) {
  const only = (s: Span) => s.children.length === 1 && Object.keys(s.properties).length === 1 && typeof s.properties.class === 'string'
  return a.tagName === b.tagName && only(a) && only(b) && a.properties.class === b.properties.class
}

/** How every highlight on the site is made: the one theme, its colors as classes. */
export const codeHighlight = {
  // These build-time snippets must finish: Shiki's 500 ms per-line cutoff silently drops tokens on a busy machine.
  tokenizeTimeLimit: 0,
  themes: { light: youjCodeTheme },
  defaultColor: false as const,
  transformers: [codeClasses],
}
