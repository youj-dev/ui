#!/usr/bin/env node
// Guardrails for the public surface (product-audit GAPS B1 and B2):
//
//   - Attributes: Youj's own `data-` attributes start with `data-yj-`; the
//     standard ones (Base UI, shadcn, next-themes: STANDARD below, tabulated in
//     docs guides/styling-hooks) keep their names. Any other `data-<name>` in a
//     package's source is unknown and fails, unless surface-baseline.json lists
//     it. The baseline only shrinks: a file over its count fails, and so does
//     one under it until the count is written down (`--write-baseline`).
//   - The barrels: packages/ui/src/index.ts and the entries beside it export no
//     `*Class` constant (the class strings behind a component are internal).
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

/** Attribute names that keep their own spelling: Base UI states, shadcn parts, next-themes. */
export const STANDARD = new Set([
  'slot', 'state', 'variant', 'size', 'tone', 'status', 'loading', 'theme', 'testid', 'orientation', 'side', 'align',
  'open', 'closed', 'checked', 'unchecked', 'indeterminate', 'disabled', 'readonly', 'required', 'invalid', 'valid', 'dirty', 'touched', 'filled', 'focused',
  'highlighted', 'selected', 'pressed', 'active', 'inactive', 'current', 'expanded', 'hovered', 'placeholder', 'multiple',
  'starting-style', 'ending-style', 'popup-open', 'panel-open', 'nested-dialog-open', 'nested-dialogs', 'swipe-direction', 'swiping', 'dragging', 'instant', 'anchor-hidden',   'value', 'index', 'id', 'type', 'name', 'part', 'direction', 'placement', 'rtl', 'dir',
])

const prefixed = (name) => name.startsWith('yj-')

/** The unknown attribute names in `text`, one entry per use. */
export function unknownAttributes(text) {
  const found = []
  for (const m of text.matchAll(/(?<![\w-])data-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/g)) {
    if (!prefixed(m[1]) && !STANDARD.has(m[1])) found.push(m[1])
  }
  return found
}

/** The `*Class` names a barrel's `export` lines list. */
export function classExports(text) {
  return text
    .split('\n')
    .filter((line) => line.startsWith('export'))
    .flatMap((line) => [...line.matchAll(/\b(\w+Class)\b/g)].map((m) => m[1]))
}

/**
 * The CSS variable names in `text` that contain an underscore. Tailwind turns `_` into a space inside an arbitrary
 * value, so `var(--a_b)` compiles to `var(-- b)`, invalid CSS that no unit test or typecheck sees.
 */
export function underscoreVariables(text) {
  return [...text.matchAll(/(?<![\w-])--[A-Za-z0-9_-]*_[A-Za-z0-9_-]*/g)].map((m) => m[0])
}

const SOURCE = /\.(?:tsx?|css)$/
const SKIP = /(^|\/)(node_modules|dist|\.next|public|fixtures|__fixtures__|test)\/|\.(test|stories|ssr-cases)\.tsx?$|\.test\.css$|\.generated\.tsx?$/
// Generated files (`*.generated.ts`) are data from taxonomy.json, whose ids (`data-and-lists`) aren't attributes.

// The Figma plugin is private and draws the kit: its strings name the kit's parts (file paths, class lists), not a surface.
const PRIVATE = /^packages\/figma\//

function sourceFiles(root) {
  return execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z', 'packages'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter((f) => /^packages\/[^/]+\/src\//.test(f) && SOURCE.test(f) && !SKIP.test(f) && !PRIVATE.test(f))
}

function main() {
  const root = join(import.meta.dirname, '..')
  const baselineFile = join(root, 'surface-baseline.json')
  const found = new Map()
  for (const file of sourceFiles(root)) {
    let text
    try {
      text = readFileSync(join(root, file), 'utf8')
    } catch {
      continue
    }
    const names = unknownAttributes(text)
    if (names.length) found.set(file, names)
  }
  if (process.argv.includes('--write-baseline')) {
    writeFileSync(baselineFile, `${JSON.stringify(Object.fromEntries([...found].map(([f, n]) => [f, n.length]).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`)
  }
  const baseline = JSON.parse(readFileSync(baselineFile, 'utf8'))
  const problems = []
  for (const [file, names] of found) {
    const allowed = baseline[file] ?? 0
    if (names.length > allowed) problems.push(`${file}: ${names.length - allowed} data- attribute(s) beyond the baseline (${[...new Set(names)].join(', ')}): use data-yj-<name>, or a standard name from docs guides/styling-hooks`)
  }
  for (const [file, count] of Object.entries(baseline)) {
    if ((found.get(file)?.length ?? 0) < count) problems.push(`${file} has fewer than the ${count} listed in surface-baseline.json; lower it (node scripts/check-surface.mjs --write-baseline)`)
  }
  for (const entry of ['index', 'chart', 'form', 'date', 'carousel', 'command', 'data-table', 'workspace-switcher']) {
    const leaked = classExports(readFileSync(join(root, `packages/ui/src/${entry}.ts`), 'utf8'))
    if (leaked.length) problems.push(`packages/ui/src/${entry}.ts exports class constants (${leaked.join(', ')}): list them as internal in packages/ui/public-api.json`)
  }
  const TEXT = /\.(?:tsx?|jsx?|mjs|css|mdx?|html)$/
  for (const file of execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z', 'packages', 'apps'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 }).split('\0')) {
    if (!file || !TEXT.test(file) || /(^|\/)(node_modules|dist|\.next|public|registry\/generated)\//.test(file)) continue
    let text
    try {
      text = readFileSync(join(root, file), 'utf8')
    } catch {
      continue
    }
    const names = underscoreVariables(text)
    if (names.length) problems.push(`${file}: CSS variable name(s) with an underscore (${[...new Set(names)].join(', ')}): Tailwind reads _ as a space inside arbitrary values; use a hyphen`)
  }
  if (problems.length) {
    console.error(problems.join('\n'))
    process.exit(1)
  }
  console.log(`surface: no unknown data- prefixes, no *Class in the barrel, no underscore in a CSS variable name (${Object.values(baseline).reduce((a, b) => a + b, 0)} older attribute uses listed)`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
