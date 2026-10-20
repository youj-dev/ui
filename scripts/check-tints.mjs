#!/usr/bin/env node
// No `/N` on a role (token-audit/ARCHITECTURE.md 6.6): `bg-accent/10`,
// `border-fg/30`, `text-fg/70` can't be themed, differ from plane to plane and
// don't follow a tone. Use the role that is that tint (`accent-subtle`,
// `line-strong`, `fg-muted`…); see "Tints" in ARCHITECTURE.md section 3.
//
// Not flagged: `/0`, gradient stops (`from-`, `via-`, `to-`) and shadow colors
// (the role still moves with the theme), and a line carrying `youj-allow`
// (own line or the one before; inside a class string the token
// `youj-allow-<why>`, e.g. glass over art, a tint of text-on-solid).
//
// tint-baseline.json lists the violations that predate the rule, per file. It
// only shrinks: a file over its count fails, and so does one under it until
// the count is written down (`--write-baseline`). Empty since phase 6.4.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { listFiles, sweepTints } from './codemods/token-tints.mjs'

const ROOT = join(import.meta.dirname, '..')
const BASELINE = join(ROOT, 'tint-baseline.json')

const found = new Map()
for (const file of listFiles(['packages', 'apps'])) {
  let text
  try {
    text = readFileSync(join(ROOT, file), 'utf8')
  } catch {
    continue
  }
  const { left } = sweepTints(text, file, { scan: true })
  if (left.length) found.set(file, left)
}

if (process.argv.includes('--write-baseline')) {
  writeFileSync(BASELINE, `${JSON.stringify(Object.fromEntries([...found].map(([f, l]) => [f, l.length]).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`)
}
const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'))
const problems = []
for (const [file, sites] of found) {
  const allowed = baseline[file] ?? 0
  if (sites.length > allowed) {
    for (const { line, token } of sites.slice(allowed)) problems.push(`${file}:${line}  ${token}: use the role that is that tint (accent-subtle, line-strong, fg-muted…), or youj-allow with a reason`)
  }
}
for (const [file, count] of Object.entries(baseline)) {
  if ((found.get(file)?.length ?? 0) < count) problems.push(`${file} has fewer than the ${count} listed in tint-baseline.json; lower it (pnpm check:tints --write-baseline)`)
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`tints: no \`/N\` on a role (${Object.values(baseline).reduce((a, b) => a + b, 0)} older ones listed)`)
