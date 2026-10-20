// Token discipline for @youj/react source (src/components, src/blocks, src/lib). Colours,
// durations, easing and loops come from youj.css / ui.css tokens; imports
// stay relative; the removed shadcn-era names (token-audit §6.6's vocabulary
// lint: scripts/codemods/token-map.json) never come back. src/styles holds the
// token definitions themselves and is exempt, as are stories and tests.
// Mark a justified exception on its own line with `// youj-allow: <reason>`.
// Sizes that don't follow the UI scale are a ratchet (scaling-sizes.mjs):
// each file may have at most its count in scaling-baseline.json; after
// removing some, `node scripts/check-tokens.mjs --update-scaling-baseline`
// lowers the baseline (it never raises one).
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fixedSizeAllowed, scalingViolations } from './scaling-sizes.mjs'
import { ownVariant } from './codemods/own-variant.mjs'

const MAP = JSON.parse(readFileSync(new URL('../../../scripts/codemods/token-map.json', import.meta.url), 'utf8'))
const COLOR_UTILITY = 'bg|text|border(?:-[xytrblse])?|ring-offset|inset-ring|ring|outline|divide|fill|stroke|from|via|to|decoration|placeholder|caret|shadow'
const alternation = (names) => [...names].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
// --yj-dialog-dim stays as an override hook for the scrim.
const REMOVED_VARS = Object.keys({ ...MAP.vars, ...Object.fromEntries(Object.keys(MAP.classes).map((stem) => [`--color-${stem}`, 1])) }).filter((name) => name !== '--yj-dialog-dim')

const SRC = new URL('../src', import.meta.url).pathname
const ROOTS = ['components', 'blocks', 'lib'].map((d) => join(SRC, d))
const RULES = [
  { name: 'raw color', re: /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/ },
  { name: 'raw duration', re: /\b\d+(?:\.\d+)?m?s\b(?=['"`;,) ])|duration:\s*\d|\b(?:duration|delay)-(?:\d|\[\d)/ },
  // Tailwind's duration-(--yj-duration-*) isn't multiplied by --yj-motion, so it ignores reduced motion; yj-duration-* is (presets.css).
  { name: 'unscaled duration token (use yj-duration-fast, -base…)', re: /\bduration-\(--yj-duration-|transition-duration:var\(--yj-duration-/ },
  { name: 'raw easing', re: /cubic-bezier\(|ease:\s*\[|\bease-(?:in|out|in-out)\b|\bease-\[/ },
  { name: 'stock animation (raw timing)', re: /\banimate-(?:spin|pulse|ping|bounce)\b/ },
  { name: 'transition-all (animate named properties)', re: /\btransition-all\b/ },
  {
    name: 'stock Tailwind palette',
    re: /\b(?:bg|text|border|fill|stroke|ring|from|to|via|outline|divide|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?\b/,
  },
  { name: 'shadcn accent (use hover, or fg for its foreground)', re: /\baccent-foreground\b|var\(--accent\)/ },
  {
    name: 'removed colour name (use the role; see scripts/codemods/token-map.json)',
    re: new RegExp(
      `(?:^|[\\s"'\`{(:!])-?(?:${COLOR_UTILITY})-(?:${alternation(Object.keys(MAP.classes))})(?=$|[\\s"'\`/)}\\]!,;])|var\\((?:${alternation(REMOVED_VARS)})(?=[,)\\s])`,
    ),
  },
  { name: 'removed colour name built in a template (use var(--color-chart-N) and -text)', re: /var\(--chart-\$\{|var\(--color-\$\{[^}]*\}-ink\)|var\(--\$\{[a-z]*[tT]one\}\)/ },
  { name: '@/ import (use a relative path)', re: /from\s+['"]@\/|import\(\s*['"]@\// },
  // raised is no role (token-audit §6.3): a part is a key, a well, a hover or an overlay.
  {
    name: 'removed role raised (use key, well, hover or overlay)',
    re: new RegExp(`(?:^|[\\s"'\`{(:!])-?(?:${COLOR_UTILITY})-raised(?=$|[\\s"'\`/)}\\]!,;])|var\\(--color-raised\\)`),
    only: ['components', 'lib', 'blocks'],
  },
  // A role follows the mode (and a tone) by itself; dark: matches any dark ancestor, so it mis-paints a light scope in a dark page.
  { name: 'colour forked on dark:/light: (use the role)', re: new RegExp(`(?:^|[\\s"'\`{(])\\S*\\b(?:dark|light):\\S*?\\b(?:${COLOR_UTILITY})-`), only: ['components', 'lib', 'blocks'] },
]

// Third-party brand assets whose colours are fixed by their owner, exempt
// from the raw colour rule only (every other rule still applies). Each entry
// cites the guideline that fixes its colours; add one only for such a file.
const RAW_COLOR_ALLOWED = new Set([
  // Sign in with Google: the four-colour G and Google's light/dark/neutral
  // button colours may not be altered (developers.google.com/identity/branding-guidelines).
  'blocks/auth/shell/google-mark.tsx',
])

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(tsx?|css)$/.test(name) && !/\.(stories|test)\.tsx?$/.test(name)) files.push(p)
  }
}
for (const root of ROOTS) if (existsSync(root)) walk(root)

// Components render Motion's `m`, never `motion`: `motion` carries Motion's
// whole feature bundle into every app that imports the component, while `m`
// animates under the features MotionFeatures loads lazily. Blocks
// are app code and may use either.
const FULL_MOTION = /import\s*(?:type\s*)?\{[^}]*(?<![\w$.])motion(?![\w$])[^}]*\}\s*from\s*'motion\/react'/

const BASELINE_FILE = new URL('./scaling-baseline.json', import.meta.url).pathname
const baseline = existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) : {}
/** Per file (relative to src), the scaling violations found. */
const scaling = new Map()

let failures = 0
for (const file of files) {
  const code = readFileSync(file, 'utf8')
  if (file.startsWith(join(SRC, 'components')) && FULL_MOTION.test(code)) {
    failures++
    console.error(`${relative(process.cwd(), file)}  full motion import: use \`import { m } from 'motion/react'\`, <m.*> elements, and wrap the component in MotionFeatures`)
  }
  const rawColorAllowed = RAW_COLOR_ALLOWED.has(relative(SRC, file))
  const lines = code.split('\n')
  if (/\.tsx?$/.test(file)) {
    const found = lines.flatMap((line, i) => (fixedSizeAllowed(line, lines[i - 1]) ? [] : scalingViolations(line).map((v) => ({ ...v, line: i + 1 }))))
    if (found.length) scaling.set(relative(SRC, file), found)
  }
  lines
    .forEach((line, i) => {
      if (line.includes('youj-allow')) return
      for (const rule of RULES) {
        if (rule.name === 'raw color' && rawColorAllowed) continue
        if (rule.only && !rule.only.some((dir) => file.startsWith(join(SRC, dir)))) continue
        if (rule.re.test(line)) {
          failures++
          console.error(`${relative(process.cwd(), file)}:${i + 1}  ${rule.name}: ${line.trim()}`)
        }
      }
    })
}
let scalingTotal = 0
const lowered = {}
for (const [rel, found] of scaling) {
  scalingTotal += found.length
  const allowed = baseline[rel] ?? 0
  // Without a baseline file, the update seeds one from today's counts.
  lowered[rel] = existsSync(BASELINE_FILE) ? Math.min(found.length, allowed) : found.length
  if (found.length > allowed) {
    failures++
    console.error(`src/${rel}  ${found.length} size(s) that don't follow the UI scale, ${allowed} allowed (scaling-baseline.json):`)
    for (const { rule, token, line } of found) console.error(`  :${line}  ${rule}: ${token}`)
  }
}
const baselineTotal = Object.values(baseline).reduce((sum, n) => sum + n, 0)
if (process.argv.includes('--update-scaling-baseline')) {
  const next = Object.fromEntries(Object.entries(lowered).filter(([, n]) => n > 0).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(BASELINE_FILE, `${JSON.stringify(next, null, 2)}\n`)
  console.log(`scaling baseline: ${Object.values(next).reduce((sum, n) => sum + n, 0)} (was ${baselineTotal})`)
} else if (scalingTotal < baselineTotal) {
  console.log(`scaling sizes: ${scalingTotal}, under the baseline's ${baselineTotal}: lower it with --update-scaling-baseline`)
}

// own: puts a default in the lowest layer so a className beats it, but `own:…!` is important and beats the
// className again. Each file may have at most its count in own-important-baseline.json; it only goes down.
const OWN_IMPORTANT = /\bown:[^\s'"`]*!(?=[\s'"`])/g
const OWN_BASELINE_FILE = new URL('./own-important-baseline.json', import.meta.url).pathname
const ownBaseline = existsSync(OWN_BASELINE_FILE) ? JSON.parse(readFileSync(OWN_BASELINE_FILE, 'utf8')) : {}
const ownImportant = {}
for (const file of files) {
  if (!/\.tsx?$/.test(file)) continue
  const count = readFileSync(file, 'utf8').split('\n').filter((line) => !line.includes('youj-allow')).join('\n').match(OWN_IMPORTANT)?.length ?? 0
  if (count) ownImportant[relative(SRC, file)] = count
}
for (const [rel, count] of Object.entries(ownImportant)) {
  const allowed = ownBaseline[rel] ?? 0
  if (count > allowed) {
    failures++
    console.error(`src/${rel}  ${count} own:…! default(s), ${allowed} allowed (own-important-baseline.json): drop the !, a className can't beat it`)
  }
}
if (process.argv.includes('--update-own-baseline')) {
  writeFileSync(OWN_BASELINE_FILE, `${JSON.stringify(Object.fromEntries(Object.entries(ownImportant).sort(([x], [y]) => x.localeCompare(y))), null, 2)}\n`)
}

// A component's classes that a style recipe also sets carry own: (ui.css), so a className beats the recipe.
const ownScope = files.filter((f) => f.startsWith(join(SRC, 'components')) && /\.tsx?$/.test(f) && !/\.fixtures\.tsx?$/.test(f))
const missingOwn = await ownVariant({ files: ownScope, check: true, tests: false })
if (missingOwn.length) {
  failures += missingOwn.length
  console.error(`own: prefixes missing (run node scripts/codemods/own-variant.mjs):\n${missingOwn.map((f) => `  ${f}`).join('\n')}`)
}

if (failures) {
  console.error(`\n${failures} token violation(s). Use tokens, or mark a justified line with // youj-allow: <reason>`)
  process.exit(1)
}
console.log(`token discipline: ${files.length} files clean`)
