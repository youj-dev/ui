// Token discipline: component source may not hard-code colors, durations or
// easing curves. Everything routes through src/lib/youj or the CSS tokens.
// Shader source (GLSL in *.glsl.ts) and SVG path data are exempt.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

// The package it runs in: motion, and icons and illustrations, which run it too.
const ROOT = join(process.cwd(), 'src/components')
const RULES = [
  { name: 'raw color', re: /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab)\(/ },
  { name: 'raw duration', re: /\b\d+(?:\.\d+)?m?s\b(?=['"`;,) ])|duration:\s*\d/ },
  { name: 'raw cubic-bezier', re: /cubic-bezier\(|ease:\s*\[/ },
  { name: 'stock Tailwind palette', re: /\b(?:bg|text|border|fill|stroke|ring|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/ },
]

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(tsx?|css)$/.test(name) && !/\.(stories|test)\.tsx?$/.test(name) && !/\.glsl\.ts$/.test(name)) files.push(p)
  }
}
walk(ROOT)

// Components render Motion's `m`, never `motion`: `motion` carries Motion's
// whole feature bundle into every app that imports the component, while `m`
// animates under the features MotionFeatures (lib/youj/features.tsx) loads
// lazily.
const FULL_MOTION = /import\s*(?:type\s*)?\{[^}]*(?<![\w$.])motion(?![\w$])[^}]*\}\s*from\s*'motion\/react'/

let failures = 0
for (const file of files) {
  const code = readFileSync(file, 'utf8')
  if (FULL_MOTION.test(code)) {
    failures++
    console.error(`${relative(process.cwd(), file)}  full motion import: use \`import { m } from 'motion/react'\`, <m.*> elements, and wrap the component in MotionFeatures`)
  }
  code.split('\n').forEach((line, i) => {
    if (line.includes('youj-allow')) return
    for (const rule of RULES) {
      if (rule.re.test(line)) {
        failures++
        console.error(`${relative(process.cwd(), file)}:${i + 1}  ${rule.name}: ${line.trim()}`)
      }
    }
  })
}
if (failures) {
  console.error(`\n${failures} token violation(s). Use tokens, or mark a justified line with // youj-allow: <reason>`)
  process.exit(1)
}
console.log(`token discipline: ${files.length} files clean`)
