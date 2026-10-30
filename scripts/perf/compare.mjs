// Compares a `pnpm perf` result against the recorded budget and flags
// regressions over 20%. Report-only by default: it always exits 0 unless
// --strict is passed, so CI can surface numbers before they gate anything.
//
//   pnpm perf:compare [results.json] [--baseline file] [--threshold 0.2] [--strict]
//   pnpm perf:compare [results.json] --update     record results as this machine's budget
//
// Budgets are kept per environment (OS, arch, CPU model): a CI runner is only
// compared with a CI baseline, never with a laptop's.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readTextIfExists } from '../read-text.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const flag = (name) => argv.includes(`--${name}`)
const option = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : fallback
}
const positional = argv.filter((a, i) => !a.startsWith('--') && !argv[i - 1]?.match(/^--(baseline|threshold)$/))
const resultsPath = resolve(positional[0] ?? join(here, 'results/latest.json'))
const baselinePath = resolve(option('baseline', join(here, 'baseline.json')))
const threshold = Number(option('threshold', 0.2))

/* Lower is better for all but fps. `floor` is the smallest absolute change
 * worth flagging, so a 1 ms wobble on a 4 ms number isn't a "25% regression". */
export const METRICS = {
  fps: { better: 'higher', floor: 3, unit: '' },
  // Frame times are quantised to display frames (16.7, 33.3, 50…): a one-frame step isn't a trend.
  p95: { better: 'lower', floor: 17, unit: 'ms' },
  hitches: { better: 'lower', floor: 3, unit: '' },
  tbt: { better: 'lower', floor: 30, unit: 'ms' },
  inp: { better: 'lower', floor: 16, unit: 'ms' },
}

const current = JSON.parse(readFileSync(resultsPath, 'utf8'))
const env = current.meta.environment
const budgetsText = readTextIfExists(baselinePath)
const budgets = budgetsText === null ? {} : JSON.parse(budgetsText)

if (flag('update')) {
  budgets[env] = {
    recorded: current.meta.date,
    quality: current.meta.quality,
    runs: current.meta.runs,
    load: current.meta.load,
    results: strip(current.results),
  }
  writeFileSync(baselinePath, `${JSON.stringify(budgets, null, 2)}\n`)
  console.log(`recorded the budget for ${env} in ${baselinePath}`)
  process.exit(0)
}

const budget = budgets[env]
if (!budget) {
  console.log(`No budget recorded for "${env}". Known: ${Object.keys(budgets).join(', ') || 'none'}.`)
  console.log('Record one on this machine with: pnpm perf:compare --update')
  process.exit(0)
}

const regressions = []
const improvements = []
for (const [profile, scenarios] of Object.entries(current.results)) {
  for (const [name, now] of Object.entries(scenarios)) {
    const was = budget.results[profile]?.[name]
    if (!now || !was) continue
    for (const [metric, { better, floor }] of Object.entries(METRICS)) {
      const a = was[metric]
      const b = now[metric]
      if (a == null || b == null) continue
      const worse = better === 'lower' ? b - a : a - b
      const ratio = a === 0 ? (worse > 0 ? Infinity : 0) : worse / a
      const row = { profile, name, metric, was: a, now: b, change: a === 0 ? Infinity : (b - a) / a }
      if (worse > floor && ratio > threshold) regressions.push(row)
      else if (-worse > floor && -ratio > threshold) improvements.push(row)
    }
  }
}

const pct = (r) => (r === Infinity ? 'new' : `${r > 0 ? '+' : ''}${Math.round(r * 100)}%`)
const line = (r) =>
  `  ${r.profile.padEnd(11)} ${r.name.padEnd(24)} ${r.metric.padEnd(8)} ${String(r.was).padStart(7)} → ${String(r.now).padEnd(7)} ${pct(r.change)}`

console.log(`Budget: ${env}, recorded ${budget.recorded} (load ${budget.load?.before?.[0] ?? '?'}); now load ${current.meta.load.before[0]}`)
if (improvements.length) console.log(`\nImproved beyond ${threshold * 100}%:\n${improvements.map(line).join('\n')}`)
if (regressions.length) {
  console.log(`\nRegressed beyond ${threshold * 100}%:\n${regressions.map(line).join('\n')}`)
  if (Math.abs(current.meta.load.before[0] - (budget.load?.before?.[0] ?? 0)) > current.meta.load.cpus / 2)
    console.log('\nNote: machine load differs a lot from when the budget was recorded; re-run before trusting these.')
} else console.log(`\nNo regressions beyond ${threshold * 100}%.`)

process.exit(flag('strict') && regressions.length ? 1 : 0)

function strip(results) {
  const out = {}
  for (const [profile, scenarios] of Object.entries(results)) {
    out[profile] = {}
    for (const [name, m] of Object.entries(scenarios)) {
      if (!m) continue
      const { runs, ...medians } = m
      out[profile][name] = medians
    }
  }
  return out
}
