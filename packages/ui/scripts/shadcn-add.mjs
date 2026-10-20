// `pnpm -F @youj/react ui:add <names…> [--overwrite]`
//
// Runs `shadcn add <names> -y` in a throwaway copy of this package, then
// copies the new files into src/ through `rewriteShadcnSource`. The sandbox
// is what keeps the CLI's side effects out of the workspace: it never runs a
// package manager here (base-nova items ask for the `cn` package, which this
// package replaces with src/lib/utils), and never edits src/styles/ui.css,
// whose token bridge is written by hand. Anything the CLI wanted to install
// or add to CSS is reported instead. lucide-react imports become Youj
// icons (scripts/shadcn-icons.mjs), and an icon without an equivalent fails
// the run before anything is written. Existing files are kept unless
// --overwrite is passed, so running it twice changes nothing.
import { spawnSync } from 'node:child_process'
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildLucideMap, youjIconNames, loadLucide, rewriteLucideImports } from './shadcn-icons.mjs'
import { rewriteShadcnSource } from './shadcn-rewrite.mjs'
import { ownVariant } from './codemods/own-variant.mjs'

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const overwrite = args.includes('--overwrite') || args.includes('-o')
const names = args.filter((a) => !a.startsWith('-'))
if (names.length === 0) {
  console.error('usage: pnpm -F @youj/react ui:add <component…> [--overwrite]')
  process.exit(1)
}

const pkg = JSON.parse(readFileSync(join(PKG, 'package.json'), 'utf8'))
const declared = { ...pkg.dependencies, ...pkg.peerDependencies, ...pkg.devDependencies }
const components = JSON.parse(readFileSync(join(PKG, 'components.json'), 'utf8'))

const sandbox = mkdtempSync(join(tmpdir(), 'youj-shadcn-'))
const SANDBOX_CSS = 'src/styles/sandbox.css'
const CSS_SEED = '@import "tailwindcss";\n'
const INSTALL_LOG = join(sandbox, 'install.log')

try {
  // A package.json that already "has" every declared dependency (plus `cn`),
  // so the CLI only reaches for a package manager when an item needs
  // something genuinely new.
  const write = (path, content) => {
    mkdirSync(dirname(join(sandbox, path)), { recursive: true })
    writeFileSync(join(sandbox, path), content)
  }
  write('package.json', JSON.stringify({ name: 'youj-shadcn-sandbox', private: true, type: 'module', dependencies: { ...declared, cn: '*' } }, null, 2))
  write('components.json', JSON.stringify({ ...components, tailwind: { ...components.tailwind, css: SANDBOX_CSS } }, null, 2))
  write('tsconfig.json', JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] } } }, null, 2))
  write('vite.config.ts', 'export default {}\n')
  write(SANDBOX_CSS, CSS_SEED)
  cpSync(join(PKG, 'src/lib'), join(sandbox, 'src/lib'), { recursive: true })

  // Package-manager shims: record the request, install nothing.
  const bin = join(sandbox, '.bin')
  mkdirSync(bin)
  for (const pm of ['npm', 'pnpm', 'yarn', 'bun']) {
    const shim = join(bin, pm)
    writeFileSync(shim, `#!/bin/sh\necho "$@" >> "${INSTALL_LOG}"\n`)
    chmodSync(shim, 0o755)
  }

  const before = snapshot(join(sandbox, 'src'))
  const shadcnPkg = findPackage('shadcn')
  const { bin: shadcnBinField } = JSON.parse(readFileSync(shadcnPkg, 'utf8'))
  const shadcnBin = join(dirname(shadcnPkg), typeof shadcnBinField === 'string' ? shadcnBinField : shadcnBinField.shadcn)

  // stdin is closed (the `< /dev/null` of `pnpm exec shadcn add … -y`), so a
  // prompt the CLI did not expect fails fast instead of hanging.
  const run = spawnSync(process.execPath, [shadcnBin, 'add', ...names, '-y', '--cwd', sandbox], {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, npm_config_user_agent: '' },
    timeout: 5 * 60_000,
  })
  if (run.status !== 0) throw new Error(`shadcn add exited with ${run.status ?? run.signal}`)

  const after = snapshot(join(sandbox, 'src'))
  const created = [...after.keys()].filter((p) => !before.has(p))
  // src/lib is seeded from this package (utils re-exports youj's cn); the
  // CLI's opinion of those files is never copied back.
  const touchedSeed = [...before.keys()].filter((p) => p !== SANDBOX_CSS.slice(4) && after.get(p) !== before.get(p))
  const written = []
  const kept = []
  // Rewrite everything before writing anything, so an icon without a Youj
  // equivalent stops the run with the workspace untouched.
  const lucideMap = buildLucideMap(loadLucide(), youjIconNames())
  const outputs = []
  for (const path of created.sort()) {
    const target = join(PKG, 'src', path)
    if (existsSync(target) && !overwrite) {
      kept.push(path)
      continue
    }
    const source = rewriteShadcnSource(readFileSync(join(sandbox, 'src', path), 'utf8'), path)
    outputs.push([path, target, /\.(tsx?|jsx?|mjs)$/.test(path) ? rewriteLucideImports(source, lucideMap, `src/${path}`) : source])
  }
  for (const [path, target, content] of outputs) {
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
    written.push(path)
  }

  // The classes a style recipe also sets go under own:, so an app's className still beats the recipe (ui.css).
  const sources = written.filter((path) => /\.tsx?$/.test(path)).map((path) => join(PKG, 'src', path))
  if (sources.length) await ownVariant({ files: sources })

  for (const path of written) console.log(`  wrote  src/${path}`)
  for (const path of kept) console.log(`  kept   src/${path} (exists; pass --overwrite to replace)`)
  for (const path of touchedSeed) console.log(`  ignored the CLI's edit to src/${path}`)

  const css = readFileSync(join(sandbox, SANDBOX_CSS), 'utf8')
  if (css !== CSS_SEED) {
    console.log('\nThe item(s) also wanted CSS. Map it onto youj tokens by hand in src/styles/ui.css:\n')
    console.log(css.replace(CSS_SEED, '').trim())
  }

  const requested = existsSync(INSTALL_LOG)
    ? readFileSync(INSTALL_LOG, 'utf8').split(/\s+/).filter((d) => d && !d.startsWith('-') && !['add', 'install', 'i'].includes(d))
    : []
  const missing = requested.filter((d) => d !== 'cn' && !d.startsWith('lucide-react') && !(d.replace(/(?<=.)@.*$/, '') in declared))
  if (missing.length > 0) {
    console.log(`\nNot installed (agents don't run pnpm add; ask for them): ${missing.join(', ')}`)
  }
} finally {
  rmSync(sandbox, { recursive: true, force: true })
}

/** The package.json of a dependency installed here or in the workspace root (shadcn is a root devDependency). */
function findPackage(name) {
  for (let dir = PKG; ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', name, 'package.json')
    if (existsSync(candidate)) return candidate
    if (dirname(dir) === dir) throw new Error(`${name} is not installed; run pnpm install at the workspace root`)
  }
}

/** path (relative to root) → mtime+size, for every file under root. */
function snapshot(root) {
  const out = new Map()
  const walk = (dir) => {
    if (!existsSync(dir)) return
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      const s = statSync(p)
      if (s.isDirectory()) walk(p)
      else out.set(relative(root, p), `${s.mtimeMs}:${s.size}`)
    }
  }
  walk(root)
  return out
}
