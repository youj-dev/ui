// Blocks are copied into apps, so a default that ignores the app ships with
// them for good (packages/ui/CLAUDE.md, Blocks). This fails on the three ways a
// block used to fail open:
//   - a forced theme: `theme ?? preset`, a `theme = preset` default, or a stock
//     preset imported from @youj/core. A block inherits the app's theme; its
//     story passes the showcase look.
//   - a hard-coded 'en-US': a block formats in `useLocale(locale)`, so the
//     provider's locale reaches it and en-US is only the provider's fallback.
//   - an unwired success path: a bare `wait(…)` that stands in for an action. A
//     demo fallback goes through the block's `demo('Block: onVerb', ms)`, which
//     warns once in development.
// A line that is a genuine exception carries `lint-blocks-allow: <why>` in a
// comment on that line or the line above it.
//
// Two more fail copied code for every language but English: a hand-rolled byte
// formatter (`${n.toFixed(1)} MB`; use toLocaleString(locale, { style: 'unit', … }))
// and an English plural (`n === 1 ? 'file' : 'files'`; route the word through
// copy, or Intl.PluralRules). Plurals from before the rule are counted per file
// in plurals.baseline.json, which only shrinks (`--write-baseline`).
//
// A demo file the docs site serves (`/blocks/products/mug.webp`) 404s in an app the
// block is copied into: it goes by its https://www.youj.dev URL.
//
// It also holds blocks to the rule create-next-app's own lint
// fails copied code on (eslint-config-next's react-hooks/set-state-in-effect):
// no setState called synchronously in an effect's body.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, sep } from 'node:path'
import ts from 'typescript'

const BLOCKS = join(import.meta.dirname, '../src/blocks')
const SHIPPED = (f) => /\.tsx?$/.test(f) && !/\.(stories|test|fixtures)\.tsx?$/.test(f)
const PRESETS = ['basalt', 'brutal', 'graphite', 'iris', 'linen', 'terminal']
// The docs site's public folders (not /r, the registry, which an app never fetches from a block).
const PUBLIC = readdirSync(join(import.meta.dirname, '../../../apps/docs/public'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== 'r')
  .map((d) => d.name)
const SERVED = new RegExp(`['"\`]/(${PUBLIC.join('|')})/`)

const RULES = [
  {
    test: (code) => /\btheme\s*\?\?/.test(code) || /\btheme\s*=\s*[A-Za-z_$][\w$]*\s*[,)}]/.test(code) || /\?\?\s*['"](basalt|brutal|graphite|iris|linen|terminal)['"]/.test(code),
    why: "forces a theme; inherit the app's (ThemeScope theme={theme}) and set the showcase look in the story",
  },
  {
    test: (code) => /['"`]en-US['"`]/.test(code),
    why: "hard-codes 'en-US'; format in useLocale(locale) so the app's locale reaches it",
  },
  {
    test: (code) => /\bwait\(/.test(code) && !/^\s*(return wait\(ms\)|(export )?const wait = )/.test(code),
    why: "fakes success with a bare wait(); fall back through demo('Block: onVerb', ms), which warns when the handler isn't wired",
  },
  {
    test: (code) => SERVED.test(code),
    why: "points at a file the docs site serves by a root-relative path, which 404s in the app; use its https://www.youj.dev URL",
  },
  {
    test: (code) => /\$\{[^}]*(toFixed|Math\.round)\([^}]*\} ?(B|KB|MB|GB)\b/.test(code),
    why: "hand-rolls a byte size; format it with toLocaleString(locale, { style: 'unit', unit: 'megabyte', … }) so it follows the app's locale",
  },
]

/** The code of a line, without its comments and with string contents kept (the rules read some literals). */
const codeOf = (line, state) => {
  let out = ''
  for (let i = 0; i < line.length; i++) {
    if (state.block) {
      if (line.startsWith('*/', i)) (state.block = false), i++
      continue
    }
    if (line.startsWith('/*', i)) (state.block = true), i++
    else if (line.startsWith('//', i)) break
    else out += line[i]
  }
  return out
}

const problems = []
const files = readdirSync(BLOCKS, { recursive: true })
  .map((f) => f.split(sep).join('/'))
  .filter(SHIPPED)
  .sort()

for (const file of files) {
  const lines = readFileSync(join(BLOCKS, file), 'utf8').split('\n')
  const state = { block: false }
  const presetImport = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*'@youj/core'`, 's').exec(lines.join('\n'))
  const imported = presetImport?.[1].split(',').map((s) => s.trim()).filter((s) => PRESETS.includes(s)) ?? []
  if (imported.length && !/lint-blocks-allow/.test(presetImport[0])) {
    problems.push(`src/blocks/${file}: imports the ${imported.join(', ')} preset; a block inherits the app's theme (pass a look from its story)`)
  }
  lines.forEach((line, i) => {
    const code = codeOf(line, state)
    if (/lint-blocks-allow/.test(line) || /lint-blocks-allow/.test(lines[i - 1] ?? '')) return
    if (/target=(['"]|\{['"`])_blank/.test(code) && !lines.slice(Math.max(0, i - 6), i + 7).some((l) => /rel=.*(noreferrer|noopener)/.test(l)))
      problems.push(`src/blocks/${file}:${i + 1}: a target="_blank" link without rel="noreferrer"; add it so the new tab can't reach window.opener`)
    for (const rule of RULES) if (rule.test(code)) problems.push(`src/blocks/${file}:${i + 1}: ${rule.why}`)
  })
}

// English plurals: counted per file against plurals.baseline.json, which only shrinks.
const PLURALS = join(import.meta.dirname, 'plurals.baseline.json')
const plurals = {}
for (const file of files) {
  const lines = readFileSync(join(BLOCKS, file), 'utf8').split('\n')
  const state = { block: false }
  const n = lines.filter((line, i) => /=== 1 \?/.test(codeOf(line, state)) && !/lint-blocks-allow/.test(line) && !/lint-blocks-allow/.test(lines[i - 1] ?? '')).length
  if (n) plurals[`blocks/${file}`] = n
}
if (process.argv.includes('--write-baseline')) writeFileSync(PLURALS, `${JSON.stringify(plurals, null, 2)}\n`)
const pluralBaseline = JSON.parse(readFileSync(PLURALS, 'utf8'))
for (const path of new Set([...Object.keys(plurals), ...Object.keys(pluralBaseline)])) {
  const now = plurals[path] ?? 0
  const was = pluralBaseline[path] ?? 0
  if (now > was) problems.push(`src/${path}: ${now - was} new English plural(s) (\`n === 1 ? …\`); take the word from copy, or pick it with Intl.PluralRules`)
  if (now < was) problems.push(`src/${path}: ${was - now} fewer English plural(s) than scripts/plurals.baseline.json lists; lower its count there (--write-baseline)`)
}

// setState in an effect's body (not in a callback it schedules): what react-hooks/set-state-in-effect reports.
const SRC = join(import.meta.dirname, '../src')
const sites = new Set()
for (const dir of ['blocks']) {
  for (const f of readdirSync(join(SRC, dir), { recursive: true }).map((f) => f.split(sep).join('/')).filter(SHIPPED).sort()) {
    const path = `${dir}/${f}`
    const sf = ts.createSourceFile(path, readFileSync(join(SRC, path), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const visit = (node) => {
      const effect = ts.isCallExpression(node) && ts.isIdentifier(node.expression) && /^use(Layout)?Effect$/.test(node.expression.text) ? node.arguments[0] : undefined
      if (effect && (ts.isArrowFunction(effect) || ts.isFunctionExpression(effect))) {
        const walk = (n) => {
          if (n !== effect && ts.isFunctionLike(n)) return
          if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && /^set[A-Z]/.test(n.expression.text) && !/^set(Timeout|Interval)$/.test(n.expression.text)) sites.add(`${path} ${n.expression.text}`)
          ts.forEachChild(n, walk)
        }
        walk(effect)
      }
      ts.forEachChild(node, visit)
    }
    visit(sf)
  }
}
for (const site of sites) problems.push(`src/${site.replace(' ', ': ')} is called in an effect's body; set it while rendering, in an event or in the effect's callback (react-hooks/set-state-in-effect)`)

if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join('\n'))
  console.error(`\n${problems.length} block problem(s). See packages/ui/CLAUDE.md, Blocks.`)
  process.exit(1)
}
console.log(`blocks: ${files.length} block files inherit the app's theme and locale, and wire their actions; no setState in an effect's body`)
