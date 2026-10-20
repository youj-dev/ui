// Writes `own:` on the classes a component shares with a style recipe, so a
// className beats the recipe while the recipe still beats the component (ui.css:
// own < style < every other utility). Idempotent: run it again after editing a
// component or a recipe.
//
//   node scripts/codemods/own-variant.mjs                rewrite every component (and its tests' class assertions)
//   node scripts/codemods/own-variant.mjs <files…>       rewrite these component files only
//   node scripts/codemods/own-variant.mjs --check        list what a run would change, exit 1 if anything
//
// Which classes: for each component file, the recipes whose subject (the element
// they style) names a hook the file renders (a data-slot, a group or yj-* marker
// class, another data-* attribute) or one rendered by a component file it
// imports, which is where its className strings land. A class is prefixed when
// a property it sets is one of those recipes' properties (by family: px-3 and
// padding-inline, rounded-md and border-start-start-radius). Classes no recipe
// sets stay plain, so the markup grows only where it must.
//
// Where: string literals in class positions only: className-like JSX attributes,
// cn/cva/clsx/twMerge arguments, variable initialisers and returns, recursively
// through conditionals, arrays and object values (cva's variants). A string is
// touched only when every token in it is a Tailwind class or a marker.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const COMPONENTS = join(PKG, 'src/components')
const MOTION = [resolve(PKG, '../core/src'), resolve(PKG, '../motion/src')]
const STYLES = ['bezel.css']
export const VARIANT = 'own'

const MARKER = /^(?:group|peer)(?:\/[\w-]+)?$|^yj-[\w-]+$/
// Screen-reader-only text must always hide, and tests and styles find it by name.
const KEEP = new Set(['sr-only', 'not-sr-only'])
const CLASS_CALLS = new Set(['cn', 'cva', 'clsx', 'cx', 'twMerge', 'twJoin'])
const CLASS_ATTR = /^(?:className|class|\w+ClassName|classNames)$/

// ---------- Tailwind ----------

let designSystem
async function tailwind() {
  if (designSystem) return designSystem
  const { __unstable__loadDesignSystem } = require('tailwindcss')
  const twDir = dirname(require.resolve('tailwindcss/package.json'))
  const entry = "@import 'tailwindcss';\n@import '../../../core/src/styles/youj.css';\n@import './ui.css';\n"
  designSystem = await __unstable__loadDesignSystem(entry, {
    base: join(PKG, 'src/styles'),
    async loadStylesheet(id, base) {
      const path = id === 'tailwindcss' ? join(twDir, 'index.css') : resolve(base, id)
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
    },
  })
  return designSystem
}

const cssCache = new Map()
/**
 * What a class does, or null when it isn't a Tailwind class: the property
 * families it sets, its selector's specificity, the states it waits for
 * (hover, disabled, aria-invalid…), and whether it styles a descendant.
 */
function classInfo(ds, token) {
  if (cssCache.has(token)) return cssCache.get(token)
  const [css] = ds.candidatesToCss([token])
  let info = null
  if (css) {
    const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    const selector = blocks[0][1].trim()
    const props = new Set(blocks.flatMap(([, , body]) => [...body.matchAll(/(?:^|;)\s*(-{0,2}[a-z][\w-]*)\s*:/g)].map((m) => m[1])).filter((p) => !p.startsWith('--tw-')).flatMap(families))
    const own = /^\.((?:\\.|[\w-])+)/.exec(selector)
    const rest = own ? selector.slice(own[0].length) : selector
    info = { props, spec: specificity(selector), states: statesOf(rest), descendant: !own || /[\s>+~]/.test(dropParens(rest)) }
  }
  cssCache.set(token, info)
  return info
}
const classProps = (ds, token) => classInfo(ds, token)?.props ?? null

// ---------- selectors ----------

const STATE_PSEUDO = new Set(['hover', 'focus', 'focus-visible', 'focus-within', 'active', 'disabled', 'enabled', 'checked', 'indeterminate', 'invalid', 'placeholder-shown', 'read-only', 'open', 'popover-open', 'target'])
const STATE_ATTR = /^(aria-[\w-]+|data-(state|active|disabled|checked|unchecked|selected|highlighted|pressed|invalid|open|closed|starting-style|ending-style|popup-open|panel-open|loading|dragging|expanded|current|readonly|placeholder|hovered|focused)|readonly|disabled|open)$/

/** The states a selector waits for: pseudo-classes and attributes that change while the element lives. */
function statesOf(selector) {
  const states = new Set()
  for (const [, name] of selector.matchAll(/(?<!:):([\w-]+)/g)) if (STATE_PSEUDO.has(name)) states.add(`:${name}`)
  for (const [, attr] of selector.matchAll(/\[([\w-]+)/g)) if (STATE_ATTR.test(attr)) states.add(`[${attr}]`)
  return states
}

/** The selector with every parenthesised argument removed. */
function dropParens(text) {
  let out = ''
  let depth = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\') {
      if (!depth) out += text.slice(i, i + 2)
      i++
    } else if (text[i] === '(') depth++
    else if (text[i] === ')') depth--
    else if (!depth) out += text[i]
  }
  return out
}

/** A selector's specificity, [ids, classes, elements]; :where() counts nothing, :is()/:not()/:has() their weightiest argument. */
export function specificity(selector) {
  const s = [0, 0, 0]
  const add = (t) => t.forEach((v, k) => (s[k] += v))
  const max = (list) => list.map(specificity).reduce((a, b) => (cmp(a, b) >= 0 ? a : b), [0, 0, 0])
  const ident = (i) => {
    while (i < selector.length && (/[\w-]/.test(selector[i]) || selector[i] === '\\')) i += selector[i] === '\\' ? 2 : 1
    return i
  }
  const args = (i) => {
    let depth = 0
    let j = i
    for (; j < selector.length; j++) {
      if (selector[j] === '\\') j++
      else if (selector[j] === '(') depth++
      else if (selector[j] === ')' && --depth === 0) break
    }
    return [selector.slice(i + 1, j), j + 1]
  }
  let i = 0
  while (i < selector.length) {
    const c = selector[i]
    if (c === '\\') i += 2
    else if (c === '#') (s[0]++, (i = ident(i + 1)))
    else if (c === '.') (s[1]++, (i = ident(i + 1)))
    else if (c === '[') {
      s[1]++
      while (i < selector.length && selector[i] !== ']') i += selector[i] === '\\' ? 2 : 1
      i++
    } else if (c === ':' && selector[i + 1] === ':') {
      s[2]++
      i = ident(i + 2)
      if (selector[i] === '(') i = args(i)[1]
    } else if (c === ':') {
      const end = ident(i + 1)
      const name = selector.slice(i + 1, end)
      i = end
      if (selector[i] === '(') {
        const [inner, next] = args(i)
        i = next
        if (name === 'where') continue
        if (['is', 'not', 'has', 'matches'].includes(name)) add(max(splitTop(inner, /,/)))
        else s[1]++
      } else s[1]++
    } else if (/[a-zA-Z]/.test(c)) (s[2]++, (i = ident(i)))
    else i++
  }
  return s
}
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

// ---------- property families ----------

/** A property's families: a shorthand covers its longhands, so `p-4` meets `padding-inline`. */
export function families(prop) {
  if (prop.startsWith('--')) return [prop]
  if (/^padding/.test(prop)) return ['padding']
  if (/^margin/.test(prop)) return ['margin']
  if (/^border(-[a-z]+)*-radius$/.test(prop)) return ['radius']
  if (prop === 'border' || /^border-(top|right|bottom|left|inline|block)(-(start|end))?$/.test(prop)) return ['border-width', 'border-style', 'border-color']
  if (/^border(-[a-z]+)*-(width|style|color)$/.test(prop)) return [`border-${prop.split('-').at(-1)}`]
  if (/^background/.test(prop)) return ['background']
  if (/^(gap|row-gap|column-gap)$/.test(prop)) return ['gap']
  if (prop === 'font') return ['font-family', 'font-size', 'font-weight', 'line-height', 'font-style']
  if (/^(inset|top|right|bottom|left)(-|$)/.test(prop)) return ['inset']
  if (/^(min-|max-)?(width|inline-size)$/.test(prop)) return ['width']
  if (/^(min-|max-)?(height|block-size)$/.test(prop)) return ['height']
  if (/^outline/.test(prop)) return ['outline']
  if (/^(transform|translate|scale|rotate)$/.test(prop)) return ['transform']
  if (/^text-decoration/.test(prop)) return ['text-decoration']
  if (/^overflow/.test(prop)) return ['overflow']
  if (/^grid-(column|row|area)/.test(prop)) return ['grid-placement']
  if (/^grid-template/.test(prop) || prop === 'grid') return ['grid-template']
  if (/^flex(-grow|-shrink|-basis)?$/.test(prop)) return ['flex']
  if (/^(place|align|justify)-(items|content|self)$/.test(prop)) return [prop.split('-')[0] === 'place' ? 'align' : prop.split('-')[0], ...(prop.startsWith('place') ? ['justify'] : [])].map((axis) => `${axis}-${prop.split('-')[1]}`)
  if (/^transition/.test(prop)) return ['transition']
  if (/^animation/.test(prop)) return ['animation']
  if (/^list-style/.test(prop)) return ['list-style']
  return [prop]
}

// ---------- recipes ----------

/** Nested blocks of a stylesheet: { prelude, body (own declarations), children }. */
function parseBlocks(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '')
  let i = 0
  const parse = () => {
    const out = []
    let text = ''
    while (i < css.length) {
      const c = css[i++]
      if (c === '{') {
        const prelude = text.slice(text.lastIndexOf(';') + 1).trim()
        text = ''
        const block = { prelude, ...parseInner() }
        out.push(block)
      } else if (c === '}') {
        i--
        return out
      } else text += c
    }
    return out
  }
  const parseInner = () => {
    let body = ''
    const children = []
    let text = ''
    while (i < css.length) {
      const c = css[i++]
      if (c === '{') {
        const cut = text.lastIndexOf(';') + 1
        body += text.slice(0, cut)
        const prelude = text.slice(cut).trim()
        text = ''
        children.push({ prelude, ...parseInner() })
      } else if (c === '}') {
        body += text
        return { body, children }
      } else text += c
    }
    return { body: body + text, children }
  }
  return parse()
}

/** Splits on top-level commas (outside parentheses and brackets). */
function splitTop(text, sep) {
  const parts = []
  let depth = 0
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (depth === 0 && sep.test(c)) {
      parts.push(text.slice(start, i))
      start = i + 1
    }
  }
  parts.push(text.slice(start))
  return parts.map((p) => p.trim()).filter(Boolean)
}

/** Drops :not(…) and :has(…) arguments: they name what the subject is not, or holds. */
function dropNegations(compound) {
  let out = ''
  for (let i = 0; i < compound.length; i++) {
    const m = /^:(not|has|where)\(/.exec(compound.slice(i))
    if (m && m[1] !== 'where') {
      let depth = 0
      let j = i + m[0].length - 1
      for (; j < compound.length; j++) {
        if (compound[j] === '(') depth++
        else if (compound[j] === ')' && --depth === 0) break
      }
      i = j
      continue
    }
    out += compound[i]
  }
  return out
}

/** The hooks a compound names: data-slot values (exact, ^= or $=), other attributes, classes. */
function hooks(compound) {
  const keys = []
  const text = dropNegations(compound)
  for (const [, attr, op, value] of text.matchAll(/\[([\w-]+)(?:([$^*]?=)['"]?([^'"\]]*)['"]?)?\]/g)) {
    if (attr === 'data-slot') keys.push(op === '$=' ? `slot$${value}` : op === '^=' ? `slot^${value}` : `slot:${value}`)
    else if (!/^(data-(variant|size|state|orientation|side|align|active|disabled|selected|checked|open|highlighted|pressed|invalid|lift)|aria-[\w-]+|dir|role|type|id|class|style)$/.test(attr)) keys.push(value ? `attr:${attr}=${value}` : `attr:${attr}`)
  }
  for (const [, cls] of text.matchAll(/\.((?:\\.|[\w-])+)/g)) keys.push(`class:${cls.replace(/\\/g, '')}`)
  return keys
}

/** Each recipe rule's subject hooks and properties. */
export function recipes(css) {
  const out = []
  const walk = (blocks) => {
    for (const block of blocks) {
      if (block.prelude.startsWith('@')) {
        walk(block.children)
        continue
      }
      const props = new Set([...block.body.matchAll(/(?:^|;)\s*(-{0,2}[a-z][\w-]*)\s*:/g)].map((m) => m[1]).flatMap(families))
      if (props.size) {
        for (const selector of splitTop(block.prelude, /,/)) {
          const compounds = splitTop(selector.replace(/\s*([>+~])\s*/g, ' $1 '), /\s/).filter((c) => !/^[>+~]$/.test(c))
          // The subject; a bare element (a span in a card's action) is content the hook above it renders.
          let keys = []
          let k = compounds.length - 1
          for (; k >= 0 && keys.length === 0; k--) keys = hooks(compounds[k].replace(/&/g, ''))
          if (keys.length) {
            const plain = selector.replace(/&/g, '')
            const subject = dropNegations(compounds.at(-1).replace(/&/g, ''))
            const bare = k < compounds.length - 2
            // Bare content: the element names it reaches (any, when it names none), whatever component renders them.
            const tags = bare ? [...subject.replace(/\[[^\]]*\]/g, '').matchAll(/(?:^|[(,\s])([a-z][a-z0-9]*)(?=$|[,)\s:.[])/g)].map((m) => m[1]) : []
            out.push({ keys, props, bare, tags: bare && !tags.length ? ['*'] : tags, spec: specificity(plain), states: statesOf(subject) })
          }
        }
      }
      walk(block.children)
    }
  }
  walk(parseBlocks(css))
  return out
}

// ---------- component files ----------

/** The hooks a file renders. */
function fileHooks(source, keys) {
  const found = new Set()
  // A data-slot attribute, or Base UI's useRender state ({ slot: 'badge' }), which it writes as one.
  const slots = new Set([...source.matchAll(/(?:data-slot['"]?\s*[:=]\s*\{?\s*|\bslot:\s*)['"`]([\w-]+)['"`]/g)].map((m) => m[1]))
  const words = new Set(source.match(/[\w/-]+/g))
  for (const key of keys) {
    const [, kind, rest] = /^(slot:|slot\$|slot\^|attr:|class:)(.*)$/.exec(key)
    if (kind === 'slot:' && slots.has(rest)) found.add(key)
    else if (kind === 'slot$' && [...slots].some((s) => s.endsWith(rest))) found.add(key)
    else if (kind === 'slot^' && [...slots].some((s) => s.startsWith(rest))) found.add(key)
    else if (kind === 'class:' && words.has(rest)) found.add(key)
    else if (kind === 'attr:') {
      const [attr, value] = rest.split('=')
      if (value ? new RegExp(`${attr}['"]?\\s*[:=]\\s*\\{?\\s*['"\`]${value}['"\`]`).test(source) : source.includes(attr)) found.add(key)
    }
  }
  return found
}

function listSources(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return listSources(path)
    return /\.tsx?$/.test(name) && !/\.(test|stories|fixtures)\.tsx?$/.test(name) ? [path] : []
  })
}

function localImports(path, source) {
  return [...source.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)].flatMap(([, spec]) => {
    const base = resolve(dirname(path), spec)
    return [`${base}.tsx`, `${base}.ts`, join(base, 'index.tsx'), join(base, 'index.ts')].filter((p) => p.startsWith(COMPONENTS) && existsFile(p))
  })
}
const existsFile = (p) => {
  try {
    return statSync(p).isFile()
  } catch {
    return false
  }
}

// ---------- rewriting ----------

const strip = (token) => (token.startsWith(`${VARIANT}:`) ? token.slice(VARIANT.length + 1) : token)

const subset = (a, b) => [...a].every((x) => b.has(x))
/**
 * Whether a recipe used to beat the class: they set a property in common and
 * the recipe weighs at least as much (it came later in the layer). A class that
 * used to win (a disabled: fill over a resting recipe) stays plain, so it still
 * does; one that styles a descendant is held only to recipes on content.
 */
function beaten(info, rules) {
  const overlap = (r) => [...r.props].some((p) => info.props.has(p))
  // A class that styles a descendant meets only the recipes on this element's content (`desc`); it also beats the
  // descendant's own classes, so it stays plain otherwise.
  if (info.descendant) return (rules.desc ?? []).some((r) => overlap(r) && cmp(r.spec, info.spec) >= 0)
  const beats = (r) => cmp(r.spec, info.spec) >= 0
  // In the class's own state (at rest, or the hover it waits for), the recipes there decide; a class that won
  // there stays plain even if a recipe for a narrower state (hover over its rest) beat it, since the rest is
  // what shows. With no recipe in its own state, one in a narrower state that beat it puts it under.
  const atRest = rules.filter((r) => overlap(r) && subset(r.states, info.states))
  if (atRest.length) return atRest.some(beats)
  return rules.some((r) => overlap(r) && subset(info.states, r.states) && beats(r))
}
const withDesc = (rules, desc) => Object.assign([...new Set(rules)], { desc: [...new Set(desc)] })

/** Rewrites one class string; null when it isn't one. */
function rewriteClasses(ds, text, rules, prefixed) {
  const tokens = text.split(/(\s+)/)
  let classes = 0
  for (const t of tokens) {
    if (!t.trim()) continue
    if (classProps(ds, strip(t))) classes++
    else if (!MARKER.test(strip(t))) return null
  }
  if (!classes) return null
  return tokens
    .map((t) => {
      if (!t.trim() || t.startsWith(`${VARIANT}:`) || KEEP.has(t)) return t
      const info = classInfo(ds, t)
      if (!info || !beaten(info, rules)) return t
      prefixed.add(t)
      return `${VARIANT}:${t}`
    })
    .join('')
}

/**
 * The edits for one source: class strings in class positions. `contestedFor`
 * gives the properties at stake for an element's hooks (null: the file's).
 * A className on an element that names its own hooks (a data-slot, a marker
 * class, a component imported from a sibling file) is held to that element's
 * recipes; any other class string to every recipe the file's hooks meet.
 */
/** A class string used as data, not rendered (a probe for what a className sets), opts out on its line or the one above. */
function ignored(sf, source, node) {
  const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line
  return source.split('\n').slice(Math.max(0, line - 1), line + 1).some((l) => l.includes('own-variant: ignore'))
}

function classEdits(ds, file, source, hooksOf, contestedFor, bareFor, prefixed, onExternal = () => {}) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = []
  // A literal can be reached twice (a cn() inside a className): the first, most specific, visit decides.
  const decided = new Set()
  const literal = (node, contested) => {
    if (decided.has(node.pos)) return
    decided.add(node.pos)
    if (ignored(sf, source, node)) return
    const raw = node.getText(sf)
    const inner = raw.slice(1, ts.isTemplateHead(node) || ts.isTemplateMiddle(node) ? -2 : -1)
    const next = rewriteClasses(ds, inner, contested, prefixed)
    if (next !== null && next !== inner) edits.push([node.getStart(sf) + 1, node.getStart(sf) + 1 + inner.length, next])
    if (sink) for (const t of (next ?? inner).split(/\s+/)) if (t.startsWith(`${VARIANT}:`)) sink.add(strip(t))
  }
  let sink = null
  const visitClass = (node, contested) => {
    if (!node) return
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return literal(node, contested)
    if (ts.isTemplateExpression(node)) {
      literal(node.head, contested)
      for (const span of node.templateSpans) {
        visitClass(span.expression, contested)
        literal(span.literal, contested)
      }
      return
    }
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isJsxExpression(node)) return visitClass(node.expression, contested)
    if (ts.isConditionalExpression(node)) return (visitClass(node.whenTrue, contested), visitClass(node.whenFalse, contested))
    if (ts.isBinaryExpression(node) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind))
      return visitClass(node.right, contested)
    if (ts.isArrayLiteralExpression(node)) return node.elements.forEach((e) => visitClass(e, contested))
    if (ts.isObjectLiteralExpression(node)) return node.properties.forEach((p) => ts.isPropertyAssignment(p) && visitClass(p.initializer, contested))
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && CLASS_CALLS.has(node.expression.text)) return node.arguments.forEach((a) => visitClass(a, contested))
  }
  // An element's hooks: its own attributes and marker classes, else the component it is (imported from a sibling file).
  const elementContested = (attribute) => {
    const element = attribute.parent.parent
    const tag = element.tagName.getText(sf)
    const keys = hooksOf(element.getText(sf), tag)
    // A plain element with no hooks and no spread props is reached only by recipes on bare content; an unknown
    // component, or an element handed its hooks by spread props, may be any of the file's.
    const sealed = /^[a-z]/.test(tag) && !element.attributes.properties.some((p) => ts.isJsxSpreadAttribute(p) || p.name?.getText(sf) === 'data-slot')
    const found = keys.size ? contestedFor(keys) : sealed ? contestedFor(new Set()) : contestedFor(null)
    // Any element can be content another component's recipe reaches by its tag (a Badge's span in a card's action).
    return /^[a-z]/.test(tag) ? withDesc([...found, ...bareFor(tag)], found.desc ?? []) : found
  }
  // A variable used as an element's className takes that element's recipes.
  const usedOn = new Map()
  const collect = (node) => {
    if (ts.isJsxAttribute(node) && CLASS_ATTR.test(node.name.getText(sf)) && node.initializer) {
      const ids = []
      // forEachChild stops at the first truthy return, so the walk returns nothing.
      const walk = (n) => void (ts.isIdentifier(n) ? ids.push(n.text) : ts.forEachChild(n, walk))
      walk(node.initializer)
      const contested = elementContested(node)
      for (const id of ids) usedOn.set(id, usedOn.has(id) ? withDesc([...usedOn.get(id), ...contested], [...usedOn.get(id).desc, ...contested.desc]) : contested)
    }
    ts.forEachChild(node, collect)
  }
  collect(sf)
  const visit = (node) => {
    if (ts.isJsxAttribute(node) && CLASS_ATTR.test(node.name.getText(sf))) {
      sink = new Set()
      const contested = elementContested(node)
      visitClass(node.initializer, contested)
      onExternal(node.parent.parent.tagName.getText(sf), sink, contested)
      sink = null
    }
    else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && CLASS_CALLS.has(node.expression.text)) node.arguments.forEach((a) => visitClass(a, contestedFor(null)))
    else if (ts.isVariableDeclaration(node) && node.initializer) visitClass(node.initializer, (ts.isIdentifier(node.name) && usedOn.get(node.name.text)) || contestedFor(null))
    else if (ts.isPropertyAssignment(node) && CLASS_ATTR.test(node.name.getText(sf))) visitClass(node.initializer, contestedFor(null))
    else if (ts.isReturnStatement(node) && node.expression && (ts.isStringLiteral(node.expression) || ts.isTemplateExpression(node.expression))) visitClass(node.expression, contestedFor(null))
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return edits
}


/** Class strings inside cn() calls that merge a `className`: the classes it can be handed. */
function mergedEdits(ds, file, source, rules) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = []
  const prefixed = new Set()
  // A class string kept in a constant (cn(bareControlClass, …, className)) is reached through its name.
  const constants = new Map()
  const collect = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) constants.set(node.name.text, node.initializer)
    ts.forEachChild(node, collect)
  }
  collect(sf)
  const seen = new Set()
  const visitClass = (node) => {
    if (!node) return
    if (ts.isIdentifier(node) && constants.has(node.text) && !seen.has(node.text)) return (seen.add(node.text), visitClass(constants.get(node.text)))
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (ignored(sf, source, node)) return
      const inner = node.getText(sf).slice(1, -1)
      const next = rewriteClasses(ds, inner, rules, prefixed)
      if (next !== null && next !== inner) edits.push([node.getStart(sf) + 1, node.getStart(sf) + 1 + inner.length, next])
      return
    }
    if (ts.isParenthesizedExpression(node)) return visitClass(node.expression)
    if (ts.isConditionalExpression(node)) return (visitClass(node.whenTrue), visitClass(node.whenFalse))
    if (ts.isBinaryExpression(node)) return visitClass(node.right)
    if (ts.isArrayLiteralExpression(node)) return node.elements.forEach(visitClass)
    if (ts.isObjectLiteralExpression(node)) return node.properties.forEach((p) => ts.isPropertyAssignment(p) && visitClass(p.initializer))
  }
  const visit = (node) => {
    // A cn() that merges a className, and a cva() definition, which a component's cn() merges with one.
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && CLASS_CALLS.has(node.expression.text) && (node.expression.text === 'cva' || node.arguments.some((a) => ts.isIdentifier(a) && a.text === 'className')))
      node.arguments.forEach(visitClass)
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return edits
}

const apply = (source, edits) => [...edits].sort((a, b) => b[0] - a[0]).reduce((out, [s, e, text]) => out.slice(0, s) + text + out.slice(e), source)

/** A test's class assertions (toHaveClass('…'), className …toContain('…')) for the classes its component now writes with own:. */
function rewriteTest(source, prefixed) {
  const consumer = new Set([...source.matchAll(/className=(?:"([^"]*)"|\{['"`]([^'"`]*)['"`]\})/g)].flatMap((m) => (m[1] ?? m[2]).split(/\s+/)))
  const fix = (args) => args.replace(/(['"`])([^'"`]*)\1/g, (_all, q, text) => q + text.split(/(\s+)/).map((t) => (prefixed.has(t) && !consumer.has(t) ? `${VARIANT}:${t}` : t)).join('') + q)
  // The arguments are string literals, which may hold parentheses (active:translate-(--ui--press-shift)).
  const args = /((?:\s*(?:'[^']*'|"[^"]*"|`[^`]*`)\s*,?)+)/.source
  return source
    .replace(new RegExp(`(toHaveClass\\()${args}(\\))`, 'g'), (_, a, list, b) => a + fix(list) + b)
    .replace(new RegExp(`(class(?:Name|List)[^\\n;]*?\\.(?:toContain|not\\.toContain)\\()${args}(\\))`, 'g'), (_, a, list, b) => a + fix(list) + b)
}

// ---------- run ----------

export async function ownVariant({ files, check = false, tests = true } = {}) {
  const ds = await tailwind()
  const rules = STYLES.flatMap((name) => recipes(readFileSync(join(PKG, 'src/styles', name), 'utf8')))
  const allKeys = new Set(rules.flatMap((r) => r.keys))
  const sources = listSources(COMPONENTS)
  const text = new Map(sources.map((p) => [p, readFileSync(p, 'utf8')]))
  const own = new Map(sources.map((p) => [p, fileHooks(text.get(p), allKeys)]))
  const targets = files?.length ? files.map((f) => resolve(f)) : sources
  const changed = []
  const prefixedBy = new Map()
  const motionExports = new Map()
  for (const file of MOTION.flatMap(listSources))
    for (const [, name] of readFileSync(file, 'utf8').matchAll(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/g)) if (!motionExports.has(name)) motionExports.set(name, file)
  const handed = new Map()
  const propsOf = (keys, bareOnly = false) => rules.filter((r) => (!bareOnly || r.bare) && r.keys.some((k) => keys.has(k)))
  // Only recipes that name the tag: one on any child (> *) would hold every component to another's content rules.
  const bareFor = (tag) => rules.filter((r) => r.bare && r.tags.includes(tag))
  for (const path of targets) {
    const source = text.get(path) ?? readFileSync(path, 'utf8')
    const mine = new Set(own.get(path) ?? fileHooks(source, allKeys))
    // Sibling components this file renders, by the name it imports them under.
    const components = new Map()
    // Components it hands classes to, from a sibling file or @youj/motion: theirs must sit in the same layer to be merged with them.
    const external = new Map()
    for (const [, names, spec] of source.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const [dep] = localImports(path, `from '${spec}'`)
      if (!dep) continue
      for (const name of names.split(',').map((n) => n.trim().split(/\s+as\s+/).at(-1)).filter(Boolean)) {
        components.set(name, own.get(dep) ?? new Set())
        external.set(name, dep)
      }
    }
    // The tags it renders (JSX, or useRender's defaultTagName), which other components' bare-content recipes reach.
    const tags = new Set([...source.matchAll(/<([a-z][a-z0-9]*)[\s>/]|defaultTagName:\s*['"]([a-z][a-z0-9]*)['"]/g)].map((m) => m[1] ?? m[2]))
    const fileKeys = new Set([...mine, ...[...components.values()].flatMap((k) => [...k])])
    const fileContested = withDesc([...propsOf(fileKeys), ...[...tags].flatMap(bareFor)], propsOf(fileKeys, true))
    // Rules on bare content under a hook this file renders, or a component it puts content in (a span in a card's action), reach an element whatever its own hooks.
    const bare = propsOf(fileKeys, true)
    const contestedFor = (keys) => (keys ? withDesc([...propsOf(keys), ...bare], propsOf(keys, true)) : fileContested)
    const hooksOf = (elementText, tag) => {
      // The opening tag: its attributes and its own className.
      const keys = fileHooks(elementText, allKeys)
      for (const k of components.get(tag.split('.')[0]) ?? []) keys.add(k)
      return keys
    }
    for (const [, names] of source.matchAll(/import\s+\{([^}]*)\}\s+from\s+['"]@youj\/(?:core|motion)[^'"]*['"]/g))
      for (const name of names.split(',').map((n) => n.trim().split(/\s+as\s+/).at(-1)).filter(Boolean)) if (motionExports.has(name)) external.set(name, motionExports.get(name))
    const onExternal = (tag, tokens, contested) => {
      const file = external.get(tag)
      if (!file) return
      if (!handed.has(file)) handed.set(file, { families: new Set(), rules: new Set() })
      for (const t of tokens) for (const f of classProps(ds, t) ?? []) handed.get(file).families.add(f)
      // The recipes that reach the element it renders here (a tabs-indicator slot).
      for (const r of contested) handed.get(file).rules.add(r)
    }
    const prefixed = new Set()
    const next = apply(source, classEdits(ds, path, source, hooksOf, contestedFor, bareFor, prefixed, onExternal))
    // Classes this file already writes with own: count too, for its tests.
    for (const m of next.matchAll(new RegExp(`(?<![\\w-])${VARIANT}:([^\\s'"\`]+)`, 'g'))) prefixed.add(m[1])
    prefixedBy.set(path, prefixed)
    if (next !== source) {
      changed.push(relative(PKG, path))
      if (!check) writeFileSync(path, next)
    }
  }
  // A component merges what it's handed (cn(..., className)): the classes of its own that set a
  // property it's handed an own: class for go in the same layer, so the handed one wins as before (a
  // handed class always won, so any shared property is enough); and those a recipe on the element it
  // renders (its slot here, or a hook of its own like data-yj-indicator) used to beat go there too.
  // A component that passes its className on (SegmentedControlItem to ToggleGroupItem, by spread props) hands the
  // same classes to the sibling components it renders.
  const queue = [...handed.keys()]
  while (queue.length) {
    const file = queue.shift()
    if (!file.startsWith(COMPONENTS)) continue
    const { families } = handed.get(file)
    for (const dep of localImports(file, readFileSync(file, 'utf8'))) {
      if (!handed.has(dep)) handed.set(dep, { families: new Set(), rules: new Set() })
      const before = handed.get(dep).families.size
      for (const f of families) handed.get(dep).families.add(f)
      if (handed.get(dep).families.size > before) queue.push(dep)
    }
  }
  if (!files?.length || handed.size)
    for (const [file, { families, rules: reach }] of handed) {
      const source = readFileSync(file, 'utf8')
      const scope = [...reach, ...propsOf(fileHooks(source, allKeys)), { props: families, states: new Set(), spec: [Infinity, 0, 0] }]
      const next = apply(source, mergedEdits(ds, file, source, scope))
      if (next !== source) {
        changed.push(relative(PKG, file))
        if (!check) writeFileSync(file, next)
      }
    }
  if (tests && !check) {
    for (const test of readdirSync(COMPONENTS, { recursive: true }).map((p) => join(COMPONENTS, p)).filter((p) => /\.test\.tsx?$/.test(p))) {
      const source = readFileSync(test, 'utf8')
      // The component it renders, and the files that component imports (button.tsx's classes live in button.variants.tsx).
      const deps = localImports(test, source).flatMap((dep) => [dep, ...localImports(dep, text.get(dep) ?? '').filter((d) => d.endsWith('.variants.tsx'))])
      const prefixed = new Set(deps.flatMap((dep) => [...(prefixedBy.get(dep) ?? [])]))
      if (!prefixed.size) continue
      const next = rewriteTest(source, prefixed)
      if (next !== source) {
        writeFileSync(test, next)
        changed.push(relative(PKG, test))
      }
    }
  }
  return changed
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const check = args.includes('--check')
  const files = args.filter((a) => !a.startsWith('--'))
  const changed = await ownVariant({ files, check })
  if (check) {
    if (changed.length) {
      console.error(`own: prefixes missing in ${changed.length} file(s); run node scripts/codemods/own-variant.mjs:\n${changed.map((f) => `  ${f}`).join('\n')}`)
      process.exit(1)
    }
  } else console.log(changed.length ? `rewrote ${changed.length} file(s):\n${changed.map((f) => `  ${f}`).join('\n')}` : 'nothing to rewrite')
}
