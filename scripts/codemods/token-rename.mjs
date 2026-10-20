#!/usr/bin/env node
// The token migration's identical-value renames (token-audit/ARCHITECTURE.md
// 2.7, phase 6.2): every shadcn-bridge and private colour name becomes its
// role, with no visual change. The table is token-map.json; this file only
// applies it.
//
//   node scripts/codemods/token-rename.mjs --scope packages/ui/src/components,packages/ui/src/styles
//   node scripts/codemods/token-rename.mjs --scope apps/docs --dry-run
//
// --scope takes repo-relative folders (or files), comma separated. --dry-run
// writes nothing and reports counts per stem per folder, then the manual
// names it found but never touches. Idempotent: a second run finds nothing.
//
// What it rewrites, in every file git knows about (tracked, plus untracked
// files that aren't ignored):
//   - colour utilities in class strings (TS, TSX, JS, MDX code, CSS `@apply`):
//     <utility>-<old stem> becomes <utility>-<new stem> for bg, text, border
//     (and its sides), ring, ring-offset, inset-ring, outline, divide, fill,
//     stroke, from, via, to, decoration, placeholder, caret, shadow and
//     accent. Variants (`hover:`, `data-[x]:`), a leading or trailing `!` and
//     a `/N` alpha are kept as written; alpha is the tint sweep's (6.4).
//   - var(--old) and var(--color-old) references, in TS and CSS. Definitions
//     (`--old: …`) are left to the phase's own agent.
//   - in MDX, only code: fenced blocks and inline `code` spans.
// A stem it must not guess (raised, a leaked shadcn accent) is counted, not
// rewritten.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

const ROOT = join(import.meta.dirname, '..', '..')
const MAP = JSON.parse(readFileSync(join(import.meta.dirname, 'token-map.json'), 'utf8'))

/** `--color-<stem>` follows every class stem; the table lists the rest. */
const VARS = {
  ...Object.fromEntries(Object.entries(MAP.classes).map(([stem, role]) => [`--color-${stem}`, `--color-${role}`])),
  ...MAP.vars,
}

const COLOR_UTILITY = 'bg|text|border(?:-[xytrblse])?|ring-offset|inset-ring|ring|outline|divide|fill|stroke|from|via|to|decoration|placeholder|caret|shadow|accent'
const longestFirst = (names) => [...names].sort((a, b) => b.length - a.length || a.localeCompare(b)).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

// A class token starts after whitespace, a quote, a bracket, a variant's colon or a `!`, and ends before a
// `/alpha`, a closing character, a trailing `!` or the end. (shadcn-rewrite.mjs's boundary, for every stem.)
const LEAD = '(^|[\\s"\'`{(:!])'
const TAIL = '(?=$|[\\s"\'`/)}\\]!,;])'
const classRegex = (stems) => new RegExp(`${LEAD}(-?(?:${COLOR_UTILITY})-)(${longestFirst(stems).join('|')})(\\/(?:\\d+|\\[[^\\]\\s]*\\]))?${TAIL}`, 'gm')
const CLASS = classRegex(Object.keys(MAP.classes))
const MANUAL_CLASS = classRegex(Object.keys(MAP.manual.classes))
const varRegex = (names) => new RegExp(`var\\((${longestFirst(names).join('|')})(?=[,)\\s])`, 'g')
const VAR = varRegex(Object.keys(VARS))
const MANUAL_VAR = varRegex(Object.keys(MAP.manual.vars))

const bump = (counts, key) => counts.set(key, (counts.get(key) ?? 0) + 1)

/** Rewrites class tokens and records each stem (and whether it carried an alpha) in `counts`. */
function renameClasses(text, counts) {
  return text.replace(CLASS, (_, lead, utility, stem, alpha = '') => {
    bump(counts, stem)
    if (alpha) bump(counts, '/N kept')
    return `${lead}${utility}${MAP.classes[stem]}${alpha}`
  })
}

function renameVars(text, counts) {
  return text.replace(VAR, (_, name) => {
    bump(counts, `var(${name})`)
    return `var(${VARS[name]}`
  })
}

function countManual(text, manual) {
  for (const [, , , stem] of text.matchAll(MANUAL_CLASS)) bump(manual, stem)
  for (const [, name] of text.matchAll(MANUAL_VAR)) bump(manual, `var(${name})`)
}

/** `@apply` is the only place a CSS file writes class strings. */
const APPLY = /@apply[^;{}]*/g

/** Code in a Markdown line: its fenced lines, else its inline code spans. */
function mapMdxCode(text, fn) {
  let fence = null
  return text
    .split('\n')
    .map((line) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1]
      // A fence is closed by its own character, at least as long as the opening.
      if (marker && (!fence || (marker[0] === fence[0] && marker.length >= fence.length))) {
        fence = fence ? null : marker
        return line
      }
      return fence ? fn(line) : line.replace(/`([^`\n]+)`/g, (_span, code) => `\`${fn(code)}\``)
    })
    .join('\n')
}

/** Returns the rewritten text, the counts per stem and the manual names found. */
export function renameTokens(text, file) {
  const counts = new Map()
  const manual = new Map()
  const apply = (code) => (countManual(code, manual), renameVars(renameClasses(code, counts), counts))
  let out
  if (/\.mdx$/.test(file)) out = mapMdxCode(text, apply)
  else if (/\.css$/.test(file)) {
    countManual(text, manual)
    out = renameVars(text.replace(APPLY, (rule) => renameClasses(rule, counts)), counts)
  } else out = apply(text)
  return { text: out, counts, manual }
}

const SOURCE = /\.(?:tsx?|jsx?|mjs|css|mdx)$/
// packages/miniatures draws with its own palette (--muted, --card and --accent are its local variables, not roles);
// this codemod's own table and tests name the old tokens on purpose, and so does the shadcn compat sheet.
const SKIP = /(^|\/)(node_modules|dist|\.next|\.claude|public\/r|registry\/generated|packages\/miniatures\/src)\/|^scripts\/codemods\/token-|^packages\/ui\/src\/styles\/shadcn\.(css|test\.ts)$|^packages\/ui\/scripts\/shadcn-rewrite/

function listFiles(scopes) {
  return execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter((f) => f && SOURCE.test(f) && !SKIP.test(f) && scopes.some((s) => f === s || f.startsWith(`${s}/`)))
}

/** The scope folder a file belongs to, for the report. */
const folderOf = (file, scopes) => scopes.find((s) => file === s || file.startsWith(`${s}/`))

function table(title, byFolder) {
  const lines = []
  for (const [folder, counts] of byFolder) {
    if (!counts.size) continue
    const total = [...counts].filter(([k]) => k !== '/N kept').reduce((n, [, c]) => n + c, 0)
    lines.push(`${folder}  (${total})`)
    for (const [key, count] of [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) lines.push(`  ${String(count).padStart(6)}  ${key}`)
  }
  return lines.length ? `${title}\n${lines.join('\n')}\n` : ''
}

function main() {
  const { values } = parseArgs({ options: { scope: { type: 'string' }, 'dry-run': { type: 'boolean', default: false } } })
  const scopes = values.scope?.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean) ?? []
  if (!scopes.length) {
    console.error('usage: token-rename.mjs --scope <folder,folder…> [--dry-run]')
    process.exit(2)
  }
  const done = new Map(scopes.map((s) => [s, new Map()]))
  const manual = new Map(scopes.map((s) => [s, new Map()]))
  let changed = 0
  for (const file of listFiles(scopes)) {
    let before
    try {
      before = readFileSync(join(ROOT, file), 'utf8')
    } catch {
      continue // listed but deleted in the working tree
    }
    const result = renameTokens(before, file)
    const folder = folderOf(file, scopes)
    for (const [k, c] of result.counts) done.get(folder).set(k, (done.get(folder).get(k) ?? 0) + c)
    for (const [k, c] of result.manual) manual.get(folder).set(k, (manual.get(folder).get(k) ?? 0) + c)
    if (result.text === before) continue
    changed++
    if (!values['dry-run']) writeFileSync(join(ROOT, file), result.text)
  }
  const verb = values['dry-run'] ? 'would rewrite' : 'rewrote'
  console.log(`${table(`${verb}, per stem per folder`, done)}${table('left for a hand edit (counted, not touched)', manual)}${verb} ${changed} file(s)`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
