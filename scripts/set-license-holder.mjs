// Sets who holds the copyright: the "Copyright (c) <year> <holder>" line of the root LICENSE and every package's,
// and `author.name` in every package's package.json (added when missing). A package with a package.json but no LICENSE
// gets a copy of the root one, except those in UNDECIDED. The brand font is under the OFL, not MIT: its OFL.txt (and the copy
// served beside the font) keep their own text and only the holder on the first line changes. Run it once with the legal name, then review the diff.
//
//   node scripts/set-license-holder.mjs "<Legal Name>"
//   node scripts/set-license-holder.mjs "<Legal Name>" --check   change nothing; exit 1 unless every file names it
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = join(import.meta.dirname, '..')
const args = process.argv.slice(2)
const check = args.includes('--check')
const holder = args.find((arg) => !arg.startsWith('--'))?.trim()
if (!holder || /["\n]/.test(holder)) {
  console.error('usage: node scripts/set-license-holder.mjs "<Legal Name>" [--check]')
  process.exit(2)
}

// Packages whose licence the owner hasn't decided: no LICENSE is created for them (figma still gets an author).
// brand-font has no manifest and is under the OFL (OFL_FILES), so it needs no MIT LICENSE.
const UNDECIDED = new Set(['brand-font'])
const OFL_FILES = ['packages/brand-font/OFL.txt', 'apps/docs/public/fonts/OFL-youj-display.txt'].map((f) => join(root, f))

const packages = readdirSync(join(root, 'packages')).map((dir) => join(root, 'packages', dir))
const withManifest = packages.filter((dir) => existsSync(join(dir, 'package.json')))
const manifests = withManifest.map((dir) => join(dir, 'package.json'))

const missingLicense = withManifest.filter((dir) => !existsSync(join(dir, 'LICENSE')) && !UNDECIDED.has(dir.split('/').pop()))
if (missingLicense.length) {
  if (check) {
    for (const dir of missingLicense) console.error(`  ${relative(root, join(dir, 'LICENSE'))} is missing`)
    process.exit(1)
  }
  for (const dir of missingLicense) writeFileSync(join(dir, 'LICENSE'), readFileSync(join(root, 'LICENSE'), 'utf8'))
}
const licenses = [root, ...packages].map((dir) => join(dir, 'LICENSE')).filter(existsSync)

const COPYRIGHT = /^(Copyright \(c\) \d{4}(?:-\d{4})? ).+$/m
// First line of an OFL.txt: `Copyright (c) 2026 <holder>, with Reserved Font Name "Youj Display".`
const OFL_COPYRIGHT = /^(Copyright \(c\) \d{4}(?:-\d{4})? ).+(, with Reserved Font Name .+)$/m
const AUTHOR = /("author":\s*\{\s*"name":\s*)"[^"]*"/

let wrong = 0
let changed = 0
for (const [file, pattern] of [...licenses.map((f) => [f, COPYRIGHT]), ...OFL_FILES.map((f) => [f, OFL_COPYRIGHT]), ...manifests.map((f) => [f, AUTHOR])]) {
  let text = readFileSync(file, 'utf8')
  if (pattern === AUTHOR && !pattern.test(text) && /^ {2}"license":/m.test(text)) {
    // Packages without an author yet get one, placed before "license".
    const block = `  "author": {\n    "name": ${JSON.stringify(holder)},\n    "url": "https://www.youj.dev"\n  },\n`
    if (check) {
      console.error(`  ${relative(root, file)} has no author`)
      wrong++
      continue
    }
    text = text.replace(/^ {2}"license":/m, `${block}  "license":`)
    JSON.parse(text)
    writeFileSync(file, text)
    changed++
    continue
  }
  if (!pattern.test(text)) {
    console.error(`set-license-holder: no copyright line or author name found in ${relative(root, file)}`)
    process.exit(1)
  }
  const next = text.replace(pattern, pattern === COPYRIGHT ? `$1${holder}` : pattern === OFL_COPYRIGHT ? `$1${holder}$2` : `$1${JSON.stringify(holder)}`)
  if (next === text) continue
  if (check) {
    console.error(`  ${relative(root, file)} doesn't name ${holder}`)
    wrong++
    continue
  }
  if (file.endsWith('.json')) JSON.parse(next)
  writeFileSync(file, next)
  changed++
}

if (check) {
  if (wrong) process.exit(1)
  console.log(`set-license-holder: ${licenses.length} LICENSE files, ${OFL_FILES.length} OFL files and ${manifests.length} package authors name ${holder}`)
} else {
  console.log(`set-license-holder: ${changed} files now name ${holder} (${licenses.length} LICENSE files, ${manifests.length} package authors); review with git diff`)
}
