#!/usr/bin/env node
// What biome can't say on its own (part of `pnpm lint`, after `biome lint`):
//
// 1. react-hooks/exhaustive-deps (biome: useExhaustiveDependencies) stays a warning, because some
//    hooks name their dependencies by hand. deps.baseline.json lists the warnings that predate the
//    rule, per file. It only shrinks: a file over its count fails, and so does one under it until
//    the count is written down (`--write-baseline`). Any other warning fails outright.
// 2. A suppression says why. `biome-ignore` needs its reason to parse; an `eslint-disable` (kept
//    only where copied code would trip a consumer's eslint) must carry ` -- <why>`.
//
// Do not change a hook's dependency array to silence the baseline: fix the hook, then lower it.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = join(import.meta.dirname, '..')
const BASELINE = join(import.meta.dirname, 'deps.baseline.json')
const DEPS = 'lint/correctness/useExhaustiveDependencies'
const SOURCE = /\.[cm]?[jt]sx?$/

export function warningCounts(diagnostics) {
  const deps = new Map()
  const other = []
  for (const d of diagnostics) {
    if (d.severity !== 'warning') continue
    const path = d.location?.path
    if (d.category === DEPS) deps.set(path, (deps.get(path) ?? 0) + 1)
    else other.push(`${path}:${d.location?.start?.line ?? 0}  ${d.category}: ${d.message}`)
  }
  return { deps, other }
}

export function depsProblems(found, baseline) {
  const problems = []
  for (const [file, count] of found) {
    const allowed = baseline[file] ?? 0
    if (count > allowed)
      problems.push(`${file}  ${count - allowed} new useExhaustiveDependencies warning(s): fix the hook, or give it a biome-ignore with the reason`)
  }
  for (const [file, count] of Object.entries(baseline)) {
    if ((found.get(file) ?? 0) < count)
      problems.push(`${file} has fewer than the ${count} listed in deps.baseline.json; lower it (pnpm lint --write-baseline)`)
  }
  return problems
}

export function eslintDisableProblems(file, text) {
  const problems = []
  text.split('\n').forEach((line, i) => {
    if (/eslint-disable/.test(line) && !/eslint-disable[^\n]*\s--\s+\S/.test(line))
      problems.push(`${file}:${i + 1}  eslint-disable without a reason: add "-- <why>", or remove it`)
  })
  return problems
}

function main() {
  const out = execFileSync('pnpm', ['exec', 'biome', 'lint', '.', '--max-diagnostics=100000', '--reporter=json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1 << 28,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  const { deps, other } = warningCounts(JSON.parse(out).diagnostics)
  if (process.argv.includes('--write-baseline')) {
    writeFileSync(BASELINE, `${JSON.stringify(Object.fromEntries([...deps].sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`)
  }
  const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'))
  const problems = [...other, ...depsProblems(deps, baseline)]
  const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter((f) => f && SOURCE.test(f) && f !== 'scripts/check-lint.mjs' && f !== 'scripts/check-lint.test.mjs')
  for (const file of files) {
    try {
      problems.push(...eslintDisableProblems(file, readFileSync(join(ROOT, file), 'utf8')))
    } catch {}
  }
  if (problems.length) {
    console.error(problems.join('\n'))
    process.exit(1)
  }
  console.log(
    `lint: no new hook-dependency warnings (${[...Object.values(baseline)].reduce((a, b) => a + b, 0)} older ones listed), every eslint-disable says why`,
  )
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
