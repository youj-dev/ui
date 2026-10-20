#!/usr/bin/env node
// What `npx @youj/cli add` copies into an app (every block with its parts, and the illustration kit)
// lints clean under create-next-app's ESLint config: eslint-config-next's core-web-vitals and
// typescript sets, React Compiler's rules among them. A new Next app runs `npm run lint` over
// whatever was copied in, so any error or warning here is one a beginner meets. Fix the code;
// where a rule is wrong about correct code, a per-line `eslint-disable-next-line <rule> -- <why>`.
//
// Disables are held small: each is one line (`-next-line` or `-line`, never file- or block-wide) with a
// reason after ` -- `, and copy-in-disables.json counts them per rule. It only shrinks: a rule over its
// count fails, and so does one under it until the count is written down (`--write-baseline`).
//
//   node scripts/check-copy-in-lint.mjs                    lint them all
//   node scripts/check-copy-in-lint.mjs --write-baseline   lint them all and write the disable counts
//   node scripts/check-copy-in-lint.mjs <file>…            lint these (paths from the repo root)
import { readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'

const ROOT = join(import.meta.dirname, '..')
const BASELINE = join(import.meta.dirname, 'copy-in-disables.json')
const DISABLE = /eslint-(disable|enable)(-next-line|-line)?\b(.*)/
const json = (path) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'))

/**
 * The source files `add` copies in: each block's files, the hooks and helpers the blocks reach (the package ships
 * some of them, and not all as typed modules, so all are linted), and the kit items the CLI copies even in an app
 * on the packages.
 */
export function copyInFiles() {
  const ui = json('packages/ui/registry/ui.json')
  const byName = new Map(ui.map((item) => [item.name, item]))
  const blocks = []
  const queue = ui.filter((item) => item.type === 'registry:block').map((item) => item.name)
  const seen = new Set()
  while (queue.length) {
    const item = byName.get(queue.pop())
    if (!item || seen.has(item.name)) continue
    seen.add(item.name)
    if (['registry:block', 'registry:hook', 'registry:lib'].includes(item.type)) blocks.push(item)
    queue.push(...(item.registryDependencies ?? []).filter((dep) => !dep.includes('/')))
  }
  const kitNames = new Set(readFileSync(join(ROOT, 'packages/cli/src/constants.ts'), 'utf8').match(/KIT_COPY_IN = new Set\(\[([^\]]*)\]/)[1].match(/[\w-]+/g))
  const illustrations = ['illustrations', 'graphics'].flatMap((name) => json(`packages/illustrations/registry/${name}.json`))
  const kit = illustrations.filter((item) => kitNames.has(item.name))
  if (kit.length !== kitNames.size) throw new Error(`KIT_COPY_IN names ${kitNames.size} items, the illustrations registry has ${kit.length} of them`)
  const files = [...blocks.map((item) => ['packages/ui', item]), ...kit.map((item) => ['packages/illustrations', item])].flatMap(([dir, item]) => item.files.map((f) => join(dir, f.path)))
  return [...new Set(files)].filter((f) => /\.[jt]sx?$/.test(f)).sort()
}

/** Each lint disable in `text`: its rules, or a problem when it isn't one line with a reason. */
export function disablesIn(text, file) {
  const rules = []
  const problems = []
  text.split('\n').forEach((line, i) => {
    const m = line.match(DISABLE)
    if (!m) return
    const at = `${file}:${i + 1}`
    if (m[1] === 'enable' || !m[2]) return void problems.push(`${at}  eslint-${m[1]}${m[2] ?? ''} covers more than one line: disable one line (-next-line) instead`)
    const [names, reason] = m[3].replace(/\s*\*\/\s*\}?\s*$/, '').split(/\s--\s/)
    if (!reason || reason.trim().split(/\s+/).length < 2) problems.push(`${at}  a disable needs its reason after \` -- \``)
    for (const name of names.split(',').map((n) => n.trim()).filter(Boolean)) rules.push(name)
    if (!names.trim()) problems.push(`${at}  a disable names no rule: name the one it's for`)
  })
  return { rules, problems }
}

/** Disable counts per rule over the baseline: each rule over or under its count. */
export function baselineProblems(counts, baseline) {
  const problems = []
  for (const [rule, n] of Object.entries(counts)) if (n > (baseline[rule] ?? 0)) problems.push(`${rule}: ${n} disables in copy-in code, ${baseline[rule] ?? 0} allowed. Fix the code instead; a disable is for a rule that's wrong about correct code`)
  for (const [rule, n] of Object.entries(baseline)) if ((counts[rule] ?? 0) < n) problems.push(`${rule}: ${counts[rule] ?? 0} disables, fewer than the ${n} in copy-in-disables.json; lower it (--write-baseline)`)
  return problems
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()

async function main() {
  const write = process.argv.includes('--write-baseline')
  const named = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const files = named.length ? named : copyInFiles()
  const counts = {}
  const disableProblems = []
  for (const file of files) {
    const { rules, problems } = disablesIn(readFileSync(join(ROOT, file), 'utf8'), file)
    disableProblems.push(...problems)
    for (const rule of rules) counts[rule] = (counts[rule] ?? 0) + 1
  }
  const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)))
  if (write && !named.length) writeFileSync(BASELINE, `${JSON.stringify(sorted, null, 2)}\n`)
  else if (!named.length) disableProblems.push(...baselineProblems(counts, JSON.parse(readFileSync(BASELINE, 'utf8'))))
  const eslint = new ESLint({
    cwd: ROOT,
    overrideConfigFile: join(import.meta.dirname, 'copy-in-eslint.config.mjs'),
    concurrency: 'auto',
  })
  const results = await eslint.lintFiles(files)
  const problems = results.flatMap((r) => r.messages.map((m) => `${relative(ROOT, r.filePath)}:${m.line}:${m.column}  ${m.severity === 2 ? 'error' : 'warning'}  ${m.ruleId ?? 'parse'}: ${m.message.split('\n')[0]}`))
  problems.push(...disableProblems)
  if (problems.length) {
    console.error(`${problems.join('\n')}\n\n${problems.length} problem(s) in code \`youj add\` copies into an app: a new Next app's \`npm run lint\` reports them. Fix the code, or disable one line with \`-- <why>\` where the rule is wrong about it.`)
    process.exit(1)
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  console.log(`copy-in lint: ${files.length} files clean under create-next-app's ESLint config (${total} one-line disables, each with its reason)`)
}
