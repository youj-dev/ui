/* Codemods, as careful string edits. The files they touch are the framework
 * starters' root layout, entry and stylesheet: small, conventional and
 * formatted by the starter. Each edit anchors on one landmark (a tag, the
 * import block, `plugins: [`), leaves everything else byte-for-byte, is a
 * no-op when its result is already there, and returns null when the landmark
 * is missing, so the caller can print the manual step instead of guessing. An
 * AST printer (recast, magicast) would add megabytes to `npx` and reformat
 * code it doesn't own. */

import { THEMES } from './constants'
import { TAILWIND_IMPORT } from './versions'

// ── CSS ─────────────────────────────────────────────────────────────────────

const importLine = (quote: string, spec: string) => `@import ${quote}${spec}${quote};`
const importRe = (spec: string) => new RegExp(`^[ \\t]*@import\\s+(['"])${spec.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\1[^;]*;`, 'm')

export function hasCssImport(css: string, spec: string): boolean {
  return importRe(spec).test(css)
}

/**
 * Adds `@import` lines right after Tailwind's (adding Tailwind's first if it's
 * missing), in order, skipping the ones already there. Youj's tokens must
 * compile in the same Tailwind root, so they go in this file, never their own.
 */
export function addCssImports(css: string, specs: string[]): string {
  let out = css
  if (!TAILWIND_IMPORT.test(out)) out = `@import 'tailwindcss';\n${out.trim() ? `\n${out}` : ''}`
  const anchor = out.match(TAILWIND_IMPORT)!
  const quote = anchor[1]!
  // New lines join the end of the @import run that starts with Tailwind's.
  let at = anchor.index! + anchor[0].length
  for (let m; (m = out.slice(at).match(/^\n[ \t]*@import\s[^;]*;[^\n]*/)); ) at += m[0].length
  for (const spec of specs) {
    if (importRe(spec).test(out)) continue
    const line = `\n${importLine(quote, spec)}`
    out = out.slice(0, at) + line + out.slice(at)
    at += line.length
  }
  return out
}

const STARTER_ROOT = String.raw`:root\s*\{\s*--background:[^;{}]*;\s*--foreground:[^;{}]*;\s*\}`

/**
 * Removes create-next-app's `:root { --background; --foreground }` pair (and
 * its prefers-color-scheme twin). They're shadcn's names, which the compat
 * sheet maps onto Youj's roles per theme; set unlayered on :root they'd
 * override that, so bg-background stays white in every theme. A :root with anything else in
 * it is the app's own and stays.
 */
export function dropStarterTokens(css: string): string {
  return css
    .replace(new RegExp(String.raw`@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*${STARTER_ROOT}\s*\}\s*`, 'g'), '')
    .replace(new RegExp(String.raw`${STARTER_ROOT}\s*`, 'g'), '')
}

/**
 * Removes create-next-app's `font-family: Arial, Helvetica, sans-serif` from
 * its body rule. Set unlayered on body, it beats the theme's typeface, so the
 * page reads in Arial whatever the theme says. The rest of the rule stays.
 */
export function dropStarterFont(css: string): string {
  return css.replace(/(body\s*\{[^}]*?)[ \t]*font-family:\s*Arial,\s*Helvetica,\s*sans-serif;?[ \t]*\n?/g, '$1')
}

/**
 * Removes the rest of create-next-app's starter once its colours are gone
 * (dropStarterTokens): `@theme inline` mapping bg-background, bg-foreground
 * and the sans and mono faces onto its own variables, and `body { background;
 * color }` reading them. Left in, they pin the page to Geist and to colours
 * nothing defines, so the theme's typefaces and surfaces never show. Only
 * create-next-app's exact rules go, and only when no --background is set any
 * more; anything the app changed stays.
 */
export function dropStarterTheme(css: string): string {
  if (/--background\s*:/.test(css)) return css
  return css
    .replace(/@theme\s+inline\s*\{\s*--color-background:\s*var\(--background\);\s*--color-foreground:\s*var\(--foreground\);\s*--font-sans:\s*var\(--font-geist-sans\);\s*--font-mono:\s*var\(--font-geist-mono\);\s*\}\s*/g, '')
    .replace(/body\s*\{\s*background:\s*var\(--background\);\s*color:\s*var\(--foreground\);\s*\}\s*/g, '')
    .replace(/\n{2,}$/, '\n')
}

/**
 * Puts a remote stylesheet's `@import url(…)` at the top of the stylesheet
 * (imports must lead it, and this one isn't Tailwind's to resolve). No-op when
 * it's there.
 */
export function addUrlImport(css: string, line: string): string {
  if (css.includes(line)) return css
  return `${line}\n${css}`
}

/** Whether the stylesheet still reads a shadcn colour variable (create-next-app's `body { background: var(--background) }`), which only the compat sheet defines. */
export const readsShadcnVars = (css: string) => /var\(\s*--(?:background|foreground|card|popover|primary|secondary|muted|accent|destructive|border|input|ring)(?:-foreground)?\s*[,)]/.test(css)

const SHADCN_CLASS = /(?<![\w-])(?:bg|text|border|ring|outline|divide|fill|stroke|from|via|to|placeholder|caret|decoration)-(?:background|foreground|card|card-foreground|popover|popover-foreground|primary|primary-foreground|secondary|secondary-foreground|muted|muted-foreground|destructive|destructive-foreground|border|input|ring|highlight|highlight-foreground)(?![\w-])/g

/** shadcn's colour classes in a source file (`bg-background`, `text-muted-foreground`), once each. Youj's own are roles (`bg-canvas`, `text-fg-muted`). */
export function shadcnClassesIn(source: string): string[] {
  return [...new Set(source.match(SHADCN_CLASS) ?? [])]
}

/** shadcn's colour names the stylesheet sets itself; they override the compat sheet's mapping of them. */
export function shadcnColorsIn(css: string): string[] {
  const names = css.matchAll(/(?:^|[\s;{])(--(?:background|foreground|primary|secondary|card|popover|muted|border|input|ring|destructive))\s*:/g)
  return [...new Set([...names].map((m) => m[1]!))]
}

/** A top-level block: `selector { body }`, with the offsets of its start (the selector) and end (past `}`). */
interface CssBlock {
  selector: string
  start: number
  open: number
  end: number
}

/** The stylesheet's top-level blocks (`:root {…}`, `@theme inline {…}`, `@media … {…}`), minding comments and strings. */
function topLevelBlocks(css: string): CssBlock[] {
  const blocks: CssBlock[] = []
  let depth = 0
  let from = 0
  let open = -1
  for (let i = 0; i < css.length; i++) {
    const c = css[i]!
    if (c === '/' && css[i + 1] === '*') {
      const close = css.indexOf('*/', i + 2)
      i = close < 0 ? css.length : close + 1
    } else if (c === '"' || c === "'") {
      const close = css.indexOf(c, i + 1)
      i = close < 0 ? css.length : close
    } else if (c === '{') {
      if (depth === 0) open = i
      depth++
    } else if (c === '}') {
      depth--
      if (depth === 0) {
        const lead = css.slice(from, open)
        const offset = lead.length - lead.replace(/^(?:\s|\/\*[\s\S]*?\*\/)*/, '').length
        blocks.push({ selector: lead.replace(/\/\*[\s\S]*?\*\//g, '').trim(), start: from + offset, open, end: i + 1 })
        from = i + 1
      }
    } else if (c === ';' && depth === 0) from = i + 1
  }
  return blocks
}

/** shadcn's variables: the colours Youj maps (and `accent`, which Youj renames `hover`), the charts', the sidebar's and `--radius`. */
const SHADCN_VAR = /^--(?:background|foreground|card|card-foreground|popover|popover-foreground|primary|primary-foreground|secondary|secondary-foreground|muted|muted-foreground|accent|accent-foreground|destructive|destructive-foreground|border|input|ring|radius|chart-[1-5]|sidebar(?:-[a-z-]+)?)$/
/** `@theme` lines that point Tailwind's colours at shadcn's `--accent` (undefined once its :root goes: every `bg-accent` turns transparent). */
const ACCENT_THEME = /^--color-(?:sidebar-)?accent(?:-foreground)?$/
const DECLARATION = /^[ \t]*(--[\w-]+)\s*:([^;{}]*);[ \t]*(?:\/\*[^\n]*?\*\/)?[ \t]*\n?/gm
const DARK_VARIANT = /^[ \t]*@custom-variant\s+dark\b[^;{]*;[ \t]*\n?/gm

/** Whether a stylesheet is shadcn's (its `.dark` class block, its dark variant, or its accent mapping). */
export const isShadcnStylesheet = (css: string) => /@custom-variant\s+dark\s*\(\s*&:is\(\.dark\s*\*\)\s*\)/.test(css) || /(^|\})\s*\.dark\s*\{/.test(css) || /--color-accent\s*:\s*var\(--accent\)/.test(css)

export interface Leftover {
  /** What it is, for a message: `@custom-variant dark`, `the :root block`… */
  what: string
  /** The variables it sets or maps, where it's a block. */
  names: string[]
}

/**
 * What a shadcn app's stylesheet keeps that breaks Youj, and the stylesheet
 * without it:
 * - `@custom-variant dark (&:is(.dark *))`: Tailwind keeps the last `dark`
 *   variant, so Youj's (data-theme) loses, and every `dark:` class matches nothing.
 * - `@theme inline` lines mapping `--color-accent` to shadcn's `--accent`:
 *   Youj's accent (Basalt's amber) becomes an undefined variable. In a shadcn
 *   stylesheet, its other `--color-X: var(--X)` lines and `--radius-*` steps go
 *   too: Youj's stylesheet maps the same names, and sizes the radii itself.
 * - shadcn's `:root` and `.dark` variable blocks: set unlayered, they override
 *   Youj's palette in every theme (a variable of the app's own in them stays).
 * Any `@custom-variant dark` and accent mapping go wherever they are; the rest
 * only from a stylesheet shadcn made (isShadcnStylesheet). Blocks left empty go.
 */
export function dropShadcnLeftovers(css: string): { css: string; removed: Leftover[] } {
  const shadcn = isShadcnStylesheet(css)
  let variant = false
  let out = css.replace(DARK_VARIANT, () => {
    variant = true
    return ''
  })
  // Blocks are edited from the last, so the offsets of those before stay right.
  const blocks: Leftover[] = []
  for (const block of topLevelBlocks(out).reverse()) {
    const theme = /^@theme\b/.test(block.selector)
    const vars = shadcn && /^(?::root|\.dark)$/.test(block.selector)
    if (!theme && !vars) continue
    const body = out.slice(block.open + 1, block.end - 1)
    const names: string[] = []
    const kept = body.replace(DECLARATION, (line, name: string, value: string) => {
      const drop = theme
        ? ACCENT_THEME.test(name) || (shadcn && ((/^--color-/.test(name) && value.trim() === `var(--${name.slice(8)})` && SHADCN_VAR.test(`--${name.slice(8)}`)) || (/^--radius-/.test(name) && /var\(--radius\)/.test(value))))
        : SHADCN_VAR.test(name)
      if (drop) names.push(name)
      return drop ? '' : line
    })
    if (!names.length) continue
    blocks.push({ what: theme ? `the ${block.selector} block's shadcn mappings` : `shadcn's ${block.selector} block`, names })
    const empty = !kept.replace(/\/\*[\s\S]*?\*\//g, '').trim()
    out = empty ? out.slice(0, block.start) + out.slice(block.end).replace(/^[ \t]*\n/, '') : out.slice(0, block.open + 1) + kept + out.slice(block.end - 1)
  }
  const removed = [...(variant ? [{ what: '@custom-variant dark', names: [] }] : []), ...blocks.reverse()]
  return { css: removed.length ? out.replace(/\n{3,}/g, '\n\n') : css, removed }
}

/**
 * create-vite's starter stylesheets (src/index.css and src/App.css): page
 * styles for its demo (a centred, bordered #root, 56px h1s, its own colours)
 * that restyle every component and block. Recognised by their landmarks, in
 * the current template and the one before it, so a stylesheet of the app's own
 * never matches.
 */
export function isViteStarterCss(css: string): boolean {
  const current = ['--text-h', '#root', '.counter'].every((s) => css.includes(s)) || ['.hero', '#center', '#next-steps'].every((s) => css.includes(s))
  const previous = ['#646cff', 'place-items: center', 'min-width: 320px'].every((s) => css.includes(s)) || ['.logo', 'logo-spin', '.read-the-docs'].every((s) => css.includes(s))
  return current || previous
}

// ── JS/TS modules ───────────────────────────────────────────────────────────

interface Style {
  quote: string
  semi: string
  indent: string
}

export function styleOf(source: string): Style {
  const imp = source.match(/^import\s.*?(['"])[^'"]+\1(;?)\s*$/m)
  const indent = source.match(/^( +|\t)\S/m)?.[1]
  return { quote: imp?.[1] ?? "'", semi: imp?.[2] ?? '', indent: indent === '\t' ? '\t' : indent && indent.length === 4 ? '    ' : '  ' }
}

/** Where the import block ends (the offset after its last line), skipping directives. */
function importsEnd(source: string): number {
  const lines = source.split('\n')
  let offset = 0
  let end = -1
  let inImport = false
  let directivesEnd = 0
  for (const line of lines) {
    const next = offset + line.length + 1
    if (inImport) {
      if (/from\s+['"][^'"]+['"]/.test(line)) {
        inImport = false
        end = next
      }
    } else if (/^import\s/.test(line)) {
      if (/(from\s+)?['"][^'"]+['"];?\s*$/.test(line)) end = next
      else inImport = true
    } else if (/^\s*['"]use (client|server)['"];?\s*$/.test(line)) directivesEnd = next
    offset = next
  }
  return end >= 0 ? end : directivesEnd
}

/** Adds the named imports from `from`, merging into an existing import of it. */
export function addNamedImports(source: string, from: string, names: string[]): string {
  const { quote, semi } = styleOf(source)
  const escaped = from.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  const existing = source.match(new RegExp(`^import\\s*\\{([^}]*)\\}\\s*from\\s*(['"])${escaped}\\2`, 'm'))
  if (existing) {
    const have = existing[1]!.split(',').map((n) => n.trim()).filter(Boolean)
    const missing = names.filter((n) => !have.includes(n))
    if (!missing.length) return source
    const merged = `import { ${[...have, ...missing].join(', ')} } from ${existing[2]}${from}${existing[2]}`
    return source.slice(0, existing.index!) + merged + source.slice(existing.index! + existing[0].length)
  }
  const line = `import { ${names.join(', ')} } from ${quote}${from}${quote}${semi}\n`
  const at = importsEnd(source)
  return source.slice(0, at) + line + source.slice(at)
}

/** Drops `name` from the named import that has it, and the whole import when it was the only name. */
export function removeNamedImport(source: string, name: string): string {
  return source.replace(/^import\s*\{([^}]*)\}\s*from\s*(['"])([^'"]+)\2(;?)[ \t]*\n?/gm, (whole, names: string, quote: string, from: string, semi: string) => {
    const all = names.split(',').map((n) => n.trim()).filter(Boolean)
    const kept = all.filter((n) => n !== name)
    if (kept.length === all.length) return whole
    return kept.length ? `import { ${kept.join(', ')} } from ${quote}${from}${quote}${semi}\n` : ''
  })
}

/** Drops the `import '<spec>'` lines (side-effect imports) of the given packages. */
export function removeSideEffectImports(source: string, specs: string[]): string {
  return specs.reduce((out, spec) => out.replace(new RegExp(`^import\\s*['"]${spec.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}['"];?[ \\t]*\\n`, 'm'), ''), source)
}

/** Adds `import '<spec>'` at the end of the import block (in an .astro file, its frontmatter's). No-op when it's there. */
export function addSideEffectImport(source: string, spec: string, astro = false): string {
  if (new RegExp(`import\\s*['"]${spec.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}['"]`).test(source)) return source
  const { quote, semi } = styleOf(source)
  const line = `import ${quote}${spec}${quote}${semi}`
  if (astro) return source.startsWith('---') ? source.replace(/^---[^\n]*\n/, (m) => `${m}${line}\n`) : `---\n${line}\n---\n\n${source}`
  const at = importsEnd(source)
  return `${source.slice(0, at)}${line}\n${source.slice(at)}`
}

/** Adds a statement after the import block, with a blank line before it. */
export function addAfterImports(source: string, statement: string): string {
  if (source.includes(statement)) return source
  const at = importsEnd(source)
  return `${source.slice(0, at)}\n${statement}\n${source.slice(at)}`
}

/** The offset just past the `>` that closes the tag opening at `start`, minding {…} and quotes. */
function tagEnd(source: string, start: number): number {
  let depth = 0
  let quote: string | null = null
  for (let i = start; i < source.length; i++) {
    const c = source[i]!
    if (quote) {
      if (c === quote) quote = null
    } else if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '{') depth++
    else if (c === '}') depth--
    else if (c === '>' && depth === 0) return i + 1
  }
  return -1
}

/** Adds `attrs` to the first `<tag …>` unless `present` already matches it. Null when there's no such tag. */
export function addTagAttributes(source: string, tag: string, attrs: string, present: RegExp): string | null {
  const open = source.search(new RegExp(`<${tag}(?=[\\s>])`))
  if (open < 0) return null
  const end = tagEnd(source, open)
  if (end < 0) return null
  const opening = source.slice(open, end)
  if (present.test(opening)) return source
  if (opening.includes('\n')) {
    // One attribute per line: the new one goes on its own, indented like the last.
    const closing = opening.match(/\s*\/?>$/)![0]
    const attributes = opening.slice(0, -closing.length)
    const indent = attributes.slice(attributes.lastIndexOf('\n') + 1).match(/^[ \t]*/)![0]
    return source.slice(0, open) + `${attributes}\n${indent}${attrs}${closing}` + source.slice(end)
  }
  const selfClosing = opening.endsWith('/>')
  const insertAt = selfClosing ? end - 2 : end - 1
  const before = source.slice(open, insertAt).replace(/\s+$/, '')
  return source.slice(0, open) + `${before} ${attrs}${selfClosing ? ' /' : ''}>` + source.slice(end)
}

/**
 * Adds `expr` (a class string's expression, e.g. next/font's `fontVariables`)
 * to <html>'s className: a new attribute, or the start of the string or
 * template it already has. Null without an <html>, or when its className is
 * some other expression, which the caller leaves to a manual step.
 */
export function addHtmlClass(source: string, expr: string): string | null {
  const open = source.search(/<html(?=[\s>])/)
  if (open < 0) return null
  const end = tagEnd(source, open)
  if (end < 0) return null
  const opening = source.slice(open, end)
  if (opening.includes(`\${${expr}}`) || opening.includes(`{${expr}}`)) return source
  const template = opening.match(/className=\{`/)
  const string = opening.match(/className=(["'])([^"']*)\1/)
  let next: string
  if (template) next = opening.replace('className={`', `className={\`\${${expr}} `)
  else if (string) next = opening.replace(string[0], `className={\`\${${expr}} ${string[2]}\`}`)
  else if (/\bclassName=/.test(opening)) return null
  else return addTagAttributes(source, 'html', `className={${expr}}`, /\bclassName=/)
  return source.slice(0, open) + next + source.slice(end)
}

const lineIndent = (source: string, at: number) => source.slice(source.lastIndexOf('\n', at - 1) + 1, at).match(/^[ \t]*/)![0]

/** Wraps everything inside `<tag>…</tag>` in `open`/`close`, reindenting multi-line content. Null without the tag. */
export function wrapTagContents(source: string, tag: string, open: string, close: string): string | null {
  const start = source.search(new RegExp(`<${tag}(?=[\\s>])`))
  if (start < 0) return null
  const innerStart = tagEnd(source, start)
  const innerEnd = source.indexOf(`</${tag}>`, innerStart)
  if (innerStart < 0 || innerEnd < 0) return null
  const inner = source.slice(innerStart, innerEnd)
  const { indent } = styleOf(source)
  if (!inner.includes('\n')) {
    const base = lineIndent(source, start)
    return source.slice(0, innerStart) + `\n${base}${indent}${open}${inner.trim()}${close}\n${base}` + source.slice(innerEnd)
  }
  const base = lineIndent(source, innerEnd)
  const body = inner
    .replace(/^\s*\n/, '')
    .replace(/\s+$/, '')
    .split('\n')
    .map((line) => (line.trim() ? indent + line : line))
    .join('\n')
  return source.slice(0, innerStart) + `\n${base}${indent}${open}\n${body}\n${base}${indent}${close}\n${base}` + source.slice(innerEnd)
}

/**
 * Puts `element` first in the document's head (`head` is the tag: `head`, or
 * next/document's `Head`), adding the head straight after <html> when there is
 * none (create-next-app's layout). Unchanged when `present` already matches;
 * null without an <html>.
 */
export function addToHead(source: string, element: string, present: RegExp, head = 'head'): string | null {
  if (present.test(source)) return source
  const { indent } = styleOf(source)
  const at = source.search(new RegExp(`<${head}(?=[\\s>])`))
  if (at >= 0) {
    const end = tagEnd(source, at)
    if (end < 0) return null
    if (source.slice(at, end).endsWith('/>')) return source.slice(0, at) + `<${head}>${element}</${head}>` + source.slice(end)
    return source.slice(0, end) + `\n${lineIndent(source, at)}${indent}${element}` + source.slice(end)
  }
  const html = source.search(/<[Hh]tml(?=[\s>])/)
  if (html < 0) return null
  const end = tagEnd(source, html)
  if (end < 0) return null
  const base = lineIndent(source, html) + indent
  return source.slice(0, end) + `\n${base}<${head}>\n${base}${indent}${element}\n${base}</${head}>` + source.slice(end)
}

/** Wraps the line holding `element` (e.g. `<App />`) in `open`/`close`. Null when it's missing. */
export function wrapElement(source: string, element: RegExp, open: string, close: string): string | null {
  const m = source.match(element)
  if (!m) return null
  const at = m.index!
  const lineStart = source.lastIndexOf('\n', at - 1) + 1
  const onOwnLine = source.slice(lineStart, at).trim() === '' && /^\s*(\n|$)/.test(source.slice(at + m[0].length))
  if (!onOwnLine) return source.slice(0, at) + open + m[0] + close + source.slice(at + m[0].length)
  const base = lineIndent(source, at)
  const { indent } = styleOf(source)
  return source.slice(0, lineStart) + `${base}${open}\n${base}${indent}${m[0]}\n${base}${close}` + source.slice(at + m[0].length)
}

// ── The theme ───────────────────────────────────────────────────────────────

/** An import statement: what it binds (1) and its module (3). */
const IMPORT = /^import\s([^'";]*?)\s*from\s*(['"])([^'"]+)\2;?[ \t]*\n?/gm
const PROVIDER_THEME = /(<YoujProvider\b[^>]*?\btheme=\{\s*)([\w$]+)(\s*\})/
/** init's theme for a preset with another motion personality. */
const INIT_THEME = /\nconst theme = defineTheme\(\{ \.\.\.(\w+), (?:motion|motionPersonality): '\w+' \}\);?\n/
/** `theme` as a name: not a JSX attribute, a property or part of a longer name. */
const THEME_NAME = /(?<![\w$.-])theme(?![\w$-]|=[^=])/

const isPreset = (name: string) => (THEMES as readonly string[]).includes(name)

/** The module an import binding `name` comes from. */
function importOf(source: string, name: string): string | null {
  for (const m of source.matchAll(IMPORT)) if (new RegExp(`\\b${name}\\b`).test(m[1]!)) return m[3]!
  return null
}

/** Removes `name` from the named import that binds it, unless the rest of the file uses it; an import left empty goes. */
function dropImport(source: string, name: string): string {
  for (const m of source.matchAll(IMPORT)) {
    const names = m[1]!.match(/^\{([^}]*)\}$/)?.[1]?.split(',').map((n) => n.trim()).filter(Boolean)
    if (!names?.includes(name)) continue
    const start = m.index!
    const end = start + m[0].length
    if (new RegExp(`\\b${name}\\b`).test(source.slice(0, start) + source.slice(end))) return source
    const kept = names.filter((n) => n !== name)
    return source.slice(0, start) + (kept.length ? m[0].replace(/\{[^}]*\}/, `{ ${kept.join(', ')} }`) : '') + source.slice(end)
  }
  return source
}

/**
 * Points `<YoujProvider theme={…}>` and `themeProps(…)` at `theme`,
 * imported from `from`, where they name a preset or init's own custom theme,
 * and drops the imports that leaves unused. A no-op once they use a `theme`
 * imported from a lib/theme file; null when they name any other theme.
 */
export function pointAtTheme(source: string, from: string): string | null {
  const names = new Set([source.match(PROVIDER_THEME)?.[2], ...[...source.matchAll(/\bthemeProps\(\s*([\w$]+)\s*\)/g)].map((m) => m[1])].filter((n) => n !== undefined))
  if (names.size !== 1) return null
  const [name] = [...names] as [string]
  const imported = importOf(source, 'theme')
  const ours = imported !== null && /(^|\/)lib\/theme$/.test(imported)
  if (imported !== null && !ours) return null
  if (name === 'theme' && ours) return source
  const init = name === 'theme' ? source.match(INIT_THEME) : null
  if (!isPreset(init ? init[1]! : name)) return null
  const out = init
    ? source.replace(INIT_THEME, '')
    : source.replace(PROVIDER_THEME, '$1theme$3').replace(new RegExp(`\\bthemeProps\\(\\s*${name}\\s*\\)`, 'g'), 'themeProps(theme)')
  // Any other `theme` (a declaration, a parameter, a hook's result) would clash with the import or shadow it.
  if (THEME_NAME.test(out.replace(IMPORT, '').replace(PROVIDER_THEME, '').replace(/\bthemeProps\(\s*theme\s*\)/g, ''))) return null
  const unused = init ? [init[1]!, 'defineTheme'] : [name]
  return unused.reduce((s, n) => dropImport(s, n), ours ? out : addNamedImports(out, from, ['theme']))
}

// ── Tailwind setup ──────────────────────────────────────────────────────────

/** Adds `@tailwindcss/vite` to a Vite (or React Router) config. Null when there's no `plugins: [`. */
export function addVitePlugin(config: string): string | null {
  if (/@tailwindcss\/vite/.test(config)) return config
  const plugins = config.match(/plugins\s*:\s*\[/)
  if (!plugins) return null
  const at = plugins.index! + plugins[0].length
  const withPlugin = `${config.slice(0, at)}tailwindcss(), ${config.slice(at)}`.replace(/tailwindcss\(\), \]/, 'tailwindcss()]')
  return addDefaultImport(withPlugin, 'tailwindcss', '@tailwindcss/vite')
}

/** Adds `vite: { plugins: [tailwindcss()] }` to an Astro config. Null when it already has a `vite` key or no defineConfig. */
export function addAstroTailwind(config: string): string | null {
  if (/@tailwindcss\/vite/.test(config)) return config
  if (/\bvite\s*:/.test(config)) return null
  const define = config.match(/defineConfig\(\s*\{/)
  if (!define) return null
  const at = define.index! + define[0].length
  const { indent } = styleOf(config)
  const rest = config.slice(at)
  const empty = /^\s*\}\s*\)/.test(rest)
  const entry = `\n${indent}vite: { plugins: [tailwindcss()] },${empty ? '\n' : ''}`
  return addDefaultImport(config.slice(0, at) + entry + (empty ? rest.replace(/^\s*/, '') : rest), 'tailwindcss', '@tailwindcss/vite')
}

function addDefaultImport(source: string, name: string, from: string): string {
  const { quote, semi } = styleOf(source)
  const at = importsEnd(source)
  return `${source.slice(0, at)}import ${name} from ${quote}${from}${quote}${semi}\n${source.slice(at)}`
}

export const POSTCSS_CONFIG = `const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
`
