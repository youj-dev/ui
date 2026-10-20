// Size limits that keep blocks readable as installed code
// (packages/ui/CLAUDE.md, Blocks):
//   - a block, src/blocks/<group>/<name>.tsx, stays under 400 lines; a bigger one
//     splits into parts in src/blocks/<group>/<name>/, each under 300.
// data.ts / data.tsx (fixtures and types) may run longer. Stories and tests don't count.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const SRC = join(import.meta.dirname, '../src')
const PART = 300
const BLOCK = 400

const SHIPPED = (f) => /\.tsx?$/.test(f) && !/\.(stories|test|fixtures|ssr-cases)\.tsx?$/.test(f)
const isData = (f) => /(^|\/)data\.tsx?$/.test(f)
const dirs = (dir) => (existsSync(dir) ? readdirSync(dir).filter((d) => statSync(join(dir, d)).isDirectory()).sort() : [])
const deep = (dir) => readdirSync(dir, { recursive: true }).map((f) => f.split(sep).join('/')).filter(SHIPPED).sort()
const lines = (file) => readFileSync(file, 'utf8').replace(/\n$/, '').split('\n').length

const problems = []
let checked = 0
const limit = (file, max, what) => {
  checked++
  const n = lines(file)
  if (n > max) problems.push(`${relative(process.cwd(), file)}: ${n} lines; ${what} stays under ${max}`)
}

for (const group of dirs(join(SRC, 'blocks'))) {
  const dir = join(SRC, 'blocks', group)
  for (const f of readdirSync(dir).filter(SHIPPED)) limit(join(dir, f), BLOCK, 'a block (split parts into a sibling folder)')
  for (const name of dirs(dir)) {
    if (!existsSync(join(dir, `${name}.tsx`))) problems.push(`${relative(process.cwd(), join(dir, name))}/: a block's parts folder needs its entry, ${name}.tsx, beside it`)
    for (const f of deep(join(dir, name))) if (!isData(f)) limit(join(dir, name, f), PART, 'a block part')
  }
}

if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join('\n'))
  console.error(`\n${problems.length} structure problem(s). See packages/ui/CLAUDE.md, Blocks.`)
  process.exit(1)
}
console.log(`structure: ${checked} block files within their limits`)
