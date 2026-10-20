// Source rewrites applied to every file `shadcn add` produces, so a fresh
// shadcn component lands in youj's shape: shadcn's names become youj's roles,
// from the one table the token migration uses (scripts/codemods/token-map.json),
// and `@/` imports become relative ones. Applied once to shadcn's output, not
// to files already in youj's vocabulary: youj's `accent` is the brand colour,
// shadcn's is a hover surface, so a second pass would rename the brand colour.
import { posix } from 'node:path'
import { renameTokens } from '../../../scripts/codemods/token-rename.mjs'

/* shadcn's `accent` is a subtle hover surface; youj's `accent` is the
 * electric ultramarine. The shadcn meaning becomes `hover` (and its
 * foreground `fg`) before the table runs, since the table maps shadcn's
 * `primary` onto youj's `accent`. Only whole class tokens are touched
 * (`bg-accent`, `data-highlighted:bg-accent/50`,
 * `text-sidebar-accent-foreground`…), so a youj `text-accent-contrast` can
 * never match. */
const COLOR_UTILITY =
  'bg|text|border(?:-[xytrblse])?|ring|ring-offset|inset-ring|outline|fill|stroke|from|via|to|decoration|divide|placeholder|caret|shadow|accent'
const ACCENT_CLASS = new RegExp(
  `(^|[\\s"'\`{(:])(-?(?:${COLOR_UTILITY})-)(?:sidebar-)?accent(-foreground)?(?=$|[\\s"'\`/)}\\]!])`,
  'gm',
)
const ACCENT_VAR = /var\(--(?:color-)?(?:sidebar-)?accent(-foreground)?\)/g

export function renameShadcnAccent(source) {
  return source
    .replace(ACCENT_CLASS, (_, lead, utility, fg) => `${lead}${utility}${fg ? 'fg' : 'hover'}`)
    .replace(ACCENT_VAR, (_, fg) => `var(--color-${fg ? 'fg' : 'hover'})`)
}

/** `path` is the file's location relative to the package `src/`, e.g. `components/ui/field.tsx`. */
export function relativeSpecifier(path, target) {
  const rel = posix.relative(posix.dirname(path), target)
  return rel.startsWith('.') ? rel : `./${rel}`
}

const IMPORT_SPECIFIER = /(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)(["'])([^"']+)\2/g

/** `@/x` → a relative path, and shadcn's `cn` package → the package's own `lib/utils`. */
export function relativizeImports(source, path) {
  return source.replace(IMPORT_SPECIFIER, (match, keyword, quote, specifier) => {
    let target = null
    if (specifier.startsWith('@/')) target = specifier.slice(2)
    else if (specifier === 'cn') target = 'lib/utils'
    if (target === null) return match
    return `${keyword}${quote}${relativeSpecifier(path, target)}${quote}`
  })
}

export function rewriteShadcnSource(source, path) {
  if (!/\.(tsx?|jsx?|mjs)$/.test(path)) return source
  return renameTokens(renameShadcnAccent(relativizeImports(source, path)), path).text
}
