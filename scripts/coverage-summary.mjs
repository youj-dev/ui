// Prints each package's coverage (from `pnpm test:coverage`) as a Markdown table;
// in CI it is appended to the job summary.
//
//   node scripts/coverage-summary.mjs
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const packagesDir = join(import.meta.dirname, '..', 'packages')
const METRICS = ['statements', 'branches', 'functions', 'lines']

const rows = readdirSync(packagesDir).flatMap((name) => {
  const file = join(packagesDir, name, 'coverage', 'coverage-summary.json')
  if (!existsSync(file)) return []
  const { total } = JSON.parse(readFileSync(file, 'utf8'))
  return [`| ${name} | ${METRICS.map((metric) => `${total[metric].pct}%`).join(' | ')} |`]
})

console.log(['| Package | Statements | Branches | Functions | Lines |', '|---|---|---|---|---|', ...rows].join('\n'))
