#!/usr/bin/env node
// The public-surface renames (product-audit GAPS B2): one prefix for Youj's own
// attributes, `data-yj-`, and a private prefix for internal CSS variables,
// `--ui--`.
//
//   node scripts/codemods/surface-rename.mjs [--dry-run]
//
// What it rewrites, in every text file git knows about:
//   - `data-youj-<name>` becomes `data-yj-<name>`, and its dataset form
//     (`dataset.youjFont`) becomes `yjFont`.
//   - `--ui-<name>` becomes `--ui--<name>` for every name below that is not
//     PUBLIC_UI_VARS. The public ones are documented for users to read or set
//     (the scrollbar thumb colors, the shadow scale, the shimmer color) and
//     keep their names.
// The token migration owns four more `--ui-` names (token-map.json: paper,
// mark-quiet, shadow-color, control-edge); they are left alone here.
// Idempotent: a second run finds nothing.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

const ROOT = join(import.meta.dirname, '..', '..')

/** Documented for users: the docs or the roles page name them. They stay `--ui-*`. */
export const PUBLIC_UI_VARS = [
  'scrollbar-thumb',
  'scrollbar-thumb-hover',
  'scrollbar-thumb-active',
  'shadow-xs',
  'shadow-sm',
  'shadow-md',
  'shadow-lg',
  'shimmer',
]

/** Internal: every other `--ui-` variable the source defines or reads. */
export const PRIVATE_UI_VARS = [
  'calendar-dir',
  'compact',
  'edge-highlight',
  'fill-edge',
  'fill-sheen',
  'focus-halo',
  'focus-offset',
  'focus-width',
  'key-edge',
  'panel-foot-y',
  'panel-head-y',
  'panel-radius-max',
  'panel-title',
  'panel-title-leading',
  'panel-x',
  'panel-y',
  'press-depth',
  'press-shift',
  'press-soft',
  'row',
  'shadow-ink',
  'shadow-sm-soft',
  'shadow-step',
  'shadow-xs-soft',
  'surface-gradient',
  'well',
]

const names = [...PRIVATE_UI_VARS].sort((a, b) => b.length - a.length)
const PRIVATE_VAR = new RegExp(`--ui-(${names.join('|')})(?![a-z0-9-])`, 'g')

export function renameSurface(text) {
  const counts = { attributes: 0, variables: 0 }
  const out = text
    .replace(/data-youj-/g, () => (counts.attributes++, 'data-yj-'))
    .replace(/\bdataset\.youj(?=[A-Z])/g, () => (counts.attributes++, 'dataset.yj'))
    .replace(PRIVATE_VAR, (_, name) => (counts.variables++, `--ui--${name}`))
  return { text: out, counts }
}

const SOURCE = /\.(?:tsx?|jsx?|mjs|css|mdx?|json|svg|html)$/
// Generated or historical text: the API snapshots and registry are rebuilt, changelogs keep what shipped, the token
// codemod's table names the old tokens on purpose, and this file's tests name the old spellings.
const SKIP = /(^|\/)(node_modules|dist|\.next|\.claude|public\/r|registry\/generated|api)\/|CHANGELOG|^scripts\/codemods\/(token-|surface-rename)|^scripts\/check-surface.test|pnpm-lock/

function main() {
  const { values } = parseArgs({ options: { 'dry-run': { type: 'boolean', default: false } } })
  const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter((f) => f && SOURCE.test(f) && !SKIP.test(f))
  const total = { attributes: 0, variables: 0, files: 0 }
  for (const file of files) {
    let before
    try {
      before = readFileSync(join(ROOT, file), 'utf8')
    } catch {
      continue
    }
    const { text, counts } = renameSurface(before)
    if (text === before) continue
    total.files++
    total.attributes += counts.attributes
    total.variables += counts.variables
    if (!values['dry-run']) writeFileSync(join(ROOT, file), text)
  }
  console.log(`${values['dry-run'] ? 'would rewrite' : 'rewrote'} ${total.attributes} attribute(s), ${total.variables} variable(s) in ${total.files} file(s)`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
