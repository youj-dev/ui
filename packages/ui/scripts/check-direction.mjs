// Direction discipline for component and block sources: no physical
// left/right utilities, and directional icons mirror under RTL (see
// direction.mjs). Stories and tests are exempt.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { physicalAllowed, physicalViolations, unmirroredIcons } from './direction.mjs'

const SRC = new URL('../src', import.meta.url).pathname
const ROOTS = ['components', 'blocks'].map((d) => join(SRC, d))

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.tsx?$/.test(name) && !/\.(stories|test)\.tsx?$/.test(name)) files.push(p)
  }
}
for (const root of ROOTS) if (existsSync(root)) walk(root)

let failures = 0
for (const file of files) {
  const source = readFileSync(file, 'utf8')
  const lines = source.split('\n')
  lines.forEach((line, i) => {
    if (physicalAllowed(line, lines[i - 1])) return
    for (const { token, use } of physicalViolations(line)) {
      failures++
      console.error(`src/${relative(SRC, file)}:${i + 1}  ${token} → ${use}`)
    }
  })
  for (const { line, icon } of unmirroredIcons(source)) {
    failures++
    console.error(`src/${relative(SRC, file)}:${line}  ${icon} points along the reading direction → rtl:-scale-x-100`)
  }
}

if (failures) {
  console.error(
    `\n${failures} direction issue(s): use the logical utility or an rtl: variant, mirror directional icons, or mark a line that must stay physical with // youj-allow: physical side <reason> (an icon: // youj-allow: unmirrored icon <reason>)`,
  )
  process.exit(1)
}
console.log(`direction: ${files.length} files use logical sides and mirror their directional icons`)
