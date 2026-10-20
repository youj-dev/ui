#!/usr/bin/env node
// No new raw sleeps in tests (AUDIT-2 3.9): `new Promise((r) => setTimeout(r, N))`,
// `await sleep(N)`, `wait(N)`, `delay(N)` and `page.waitForTimeout(N)` make a test
// depend on the clock. Wait for the condition instead (`waitFor`, `expect.poll`,
// `findBy*`, fake timers). A line carrying `youj-allow: sleep <why>` (own line or
// the one before) is not counted.
//
// sleeps.baseline.json lists the sleeps that predate the rule, per test file. It
// only shrinks: a file over its count fails, and so does one under it until the
// count is written down (`--write-baseline`).
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = join(import.meta.dirname, '..')
const BASELINE = join(import.meta.dirname, 'sleeps.baseline.json')
const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/
const SLEEP = [/new Promise\(\s*\(?\s*\w+\s*\)?\s*=>\s*(?:\{\s*)?setTimeout\(\s*\w+/, /\b(?:sleep|wait|delay)\(\s*[\w.]+\s*\)/, /\bwaitForTimeout\(/]

export function sleepLines(text) {
  const lines = text.split('\n')
  const found = []
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '')
    if (!SLEEP.some((re) => re.test(code))) return
    if (/youj-allow: sleep/.test(line) || /youj-allow: sleep/.test(lines[i - 1] ?? '')) return
    found.push(i + 1)
  })
  return found
}

export function sleepProblems(found, baseline) {
  const problems = []
  for (const [file, lines] of found) {
    const allowed = baseline[file] ?? 0
    if (lines.length > allowed) problems.push(`${file}:${lines.slice(allowed).join(',')}  ${lines.length - allowed} new raw sleep(s): wait for the condition (waitFor, expect.poll, findBy*, fake timers), or youj-allow: sleep with a reason`)
  }
  for (const [file, count] of Object.entries(baseline)) {
    if ((found.get(file)?.length ?? 0) < count) problems.push(`${file} has fewer than the ${count} listed in sleeps.baseline.json; lower it (pnpm check:sleeps --write-baseline)`)
  }
  return problems
}

function main() {
  const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0')
    .filter((f) => f && TEST_FILE.test(f) && f !== 'scripts/check-sleeps.test.mjs')
  const found = new Map()
  for (const file of files) {
    let text
    try {
      text = readFileSync(join(ROOT, file), 'utf8')
    } catch {
      continue
    }
    const lines = sleepLines(text)
    if (lines.length) found.set(file, lines)
  }
  if (process.argv.includes('--write-baseline')) {
    writeFileSync(BASELINE, `${JSON.stringify(Object.fromEntries([...found].map(([f, l]) => [f, l.length]).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`)
  }
  const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'))
  const problems = sleepProblems(found, baseline)
  if (problems.length) {
    console.error(problems.join('\n'))
    process.exit(1)
  }
  console.log(`sleeps: no new raw sleeps in tests (${Object.values(baseline).reduce((a, b) => a + b, 0)} older ones listed)`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
