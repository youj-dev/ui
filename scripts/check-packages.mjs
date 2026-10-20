// Builds and packs every published package the way scripts/release.mjs does
// (`pnpm pack`: prepack builds it, then publishConfig and `files` decide the
// contents, and workspace: ranges become versions), into a temporary folder
// that's removed afterwards. Fails when a build breaks, when an entry the
// manifest points at (main, types, exports, bin) isn't in the package, or when
// the packed manifest breaks the dependency contract (RELEASING.md): a
// workspace: or non-exact @youj/* range, @youj/core (or, for the components,
// @youj/motion) as a dependency rather than a peer, react or react-dom as a dependency, a missing Tailwind peer, or a Base UI
// that is a dependency or an unbounded peer. Also fails on any workspace manifest that isn't "private": true (only scripts/release.mjs
// publishes, so a stray `npm publish` must refuse). Also fails on any `@youj/<pkg>/<subpath>` import in a packed
// file that the target package's published `exports` doesn't expose (scripts/dist-subpaths.mjs). Part of `pnpm verify`.
//
//   node scripts/check-packages.mjs           all of them
//   node scripts/check-packages.mjs ui cli    some of them (folder names)
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { unexposedImports } from './dist-subpaths.mjs'

const root = join(import.meta.dirname, '..')
// The same list scripts/release.mjs publishes.
const PACKAGES = ['core', 'motion', 'loaders', 'sound', 'icons', 'illustrations', 'miniatures', 'ui', 'cli', 'mcp']
const BUNDLED = ['cli', 'mcp']
const only = process.argv.slice(2)

// Every workspace manifest, not just the published list: a public one is an accident waiting for `npm publish`.
const publicManifests = ['packages', 'apps'].flatMap((folder) =>
  readdirSync(join(root, folder)).flatMap((dir) => {
    const file = join(root, folder, dir, 'package.json')
    return existsSync(file) && JSON.parse(readFileSync(file, 'utf8')).private !== true ? `${folder}/${dir}` : []
  }),
)
if (publicManifests.length) {
  console.error(`✗ ${publicManifests.join(', ')}: package.json isn't "private": true. Only scripts/release.mjs publishes (RELEASING.md).`)
  process.exit(1)
}
// Each published package's `exports` as it ships (publishConfig overrides the workspace's src/ paths).
const exportsByName = Object.fromEntries(
  PACKAGES.flatMap((dir) => {
    const manifest = JSON.parse(readFileSync(join(root, 'packages', dir, 'package.json'), 'utf8'))
    const published = { ...manifest, ...manifest.publishConfig }
    return published.exports ? [[manifest.name, published.exports]] : []
  }),
)
const out = mkdtempSync(join(tmpdir(), 'youj-check-packages-'))
// Packages that build on @youj/core, which holds YoujProvider's contexts, and on @youj/motion, whose
// components ride on them: each must be a peer, so an app has one copy.
const PEERS = { core: ['motion', 'loaders', 'ui', 'icons', 'sound', 'illustrations'], motion: ['ui'] }
// Packages whose stylesheet is Tailwind source: a required peer where the components are Tailwind classes, optional where only the sheet needs it.
const TAILWIND = { ui: 'required', core: 'optional', motion: 'optional', icons: 'optional', illustrations: 'optional' }

function pack(dir) {
  return new Promise((resolve) => {
    const child = spawn('pnpm', ['pack', '--json', '--pack-destination', join(out, dir)], { cwd: join(root, 'packages', dir) })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    child.on('close', (code) => resolve({ code, output }))
  })
}

/** Every file path the manifest promises: main, types, bin and each exports target. */
function promised(manifest) {
  const paths = []
  const walk = (value) => {
    if (typeof value === 'string') paths.push(value)
    else if (value && typeof value === 'object') Object.values(value).forEach(walk)
  }
  const published = { ...manifest, ...manifest.publishConfig }
  walk([published.main, published.types, published.bin, published.exports])
  return paths.filter((p) => p.startsWith('./') || p.startsWith('dist/')).map((p) => p.replace(/^\.\//, ''))
}

/** What's wrong with a packed manifest's dependencies, per the contract in RELEASING.md. */
function contractProblems(dir, manifest) {
  const problems = []
  const { version, dependencies = {}, peerDependencies = {}, optionalDependencies = {}, peerDependenciesMeta = {} } = manifest
  for (const [field, deps] of Object.entries({ dependencies, peerDependencies, optionalDependencies }))
    for (const [name, range] of Object.entries(deps)) {
      if (range.startsWith('workspace:')) problems.push(`${field}.${name} is "${range}": pnpm pack should have resolved it`)
      else if (name.startsWith('@youj/') && range !== version) problems.push(`${field}.${name} is "${range}", not "${version}": the kit releases together, so Youj ranges are exact`)
    }
  for (const name of ['react', 'react-dom']) if (dependencies[name]) problems.push(`${name} is a dependency: it's the app's, so a peer`)
  for (const [peer, dirs] of Object.entries(PEERS)) {
    if (!dirs.includes(dir)) continue
    const name = `@youj/${peer}`
    if (dependencies[name]) problems.push(`${name} is a dependency: it holds YoujProvider's contexts or runs on them, so a peer (one copy per app)`)
    if (!peerDependencies[name]) problems.push(`${name} is missing from peerDependencies`)
    if (!peerDependencies.react) problems.push('react is missing from peerDependencies')
  }
  const tailwind = TAILWIND[dir]
  if (tailwind && peerDependencies.tailwindcss !== '^4') problems.push(`tailwindcss isn't a peer at "^4" (it's ${JSON.stringify(peerDependencies.tailwindcss)})`)
  else if (tailwind && Boolean(peerDependenciesMeta.tailwindcss?.optional) !== (tailwind === 'optional')) problems.push(`the tailwindcss peer should be ${tailwind}`)
  if (dir === 'ui') {
    if (dependencies['@base-ui/react']) problems.push('@base-ui/react is a dependency: the app owns one copy, so a peer')
    if (!/^>=\d+\.\d+\.\d+ <\d+\.\d+\.\d+$/.test(peerDependencies['@base-ui/react'] ?? ''))
      problems.push(`@base-ui/react peer is "${peerDependencies['@base-ui/react']}": Field uses its internals, so bound it to tested minors (>=x.y.z <x.y.z)`)
  }
  return problems
}

/** Imports in a tarball's JS and declaration files of a `@youj/*` subpath the target doesn't expose. */
function subpathProblems(tarball) {
  const unpacked = mkdtempSync(join(out, 'unpacked-'))
  execFileSync('tar', ['-xzf', tarball, '-C', unpacked])
  const problems = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (/\.(m?js|d\.m?ts)$/.test(entry.name))
        for (const { specifier, line } of unexposedImports(readFileSync(file, 'utf8'), exportsByName))
          problems.push(`${file.slice(unpacked.length + 'package/'.length + 1)}:${line} imports ${specifier}, which the package's exports don't expose: an app can't resolve it (rewrite it to a published entry, e.g. sourceEntryImports() in tsdown.config.ts)`)
    }
  }
  walk(join(unpacked, 'package'))
  return problems
}

// Files a package must carry because its code (or what `youj add` copies from it) is derived from someone else's under a licence that wants its notice kept with every copy.
const NOTICES = { ui: ['THIRD_PARTY_NOTICES.md'] }

const matches = (pattern, files) => {
  if (!pattern.includes('*')) return files.has(pattern)
  const re = new RegExp(`^${pattern.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.+')}$`)
  return [...files].some((f) => re.test(f))
}

const started = Date.now()
const dirs = only.length ? PACKAGES.filter((d) => only.includes(d)) : PACKAGES
const results = await Promise.all(
  dirs.map(async (dir) => {
    const t = Date.now()
    const { code, output } = await pack(dir)
    const problems = []
    if (code !== 0) problems.push(`pnpm pack exited ${code}`)
    else {
      // The JSON report follows the prepack build's log.
      const json = output.slice(output.lastIndexOf('\n{\n') + 1)
      const files = new Set(JSON.parse(json).files.map((f) => f.path))
      const manifest = JSON.parse(readFileSync(join(root, 'packages', dir, 'package.json'), 'utf8'))
      for (const path of promised(manifest)) if (!matches(path, files)) problems.push(`${path} is in the manifest but not in the package`)
      for (const notice of NOTICES[dir] ?? []) if (!files.has(notice)) problems.push(`${notice} is missing from the package: it carries a licence notice that must ship with every copy`)
      const tarball = readdirSync(join(out, dir)).find((f) => f.endsWith('.tgz'))
      const packed = JSON.parse(execFileSync('tar', ['-xzOf', join(out, dir, tarball), 'package/package.json'], { encoding: 'utf8' }))
      problems.push(...contractProblems(dir, packed))
      // cli and mcp are single bundles whose strings hold code for `youj add` to write out, not imports.
      if (!BUNDLED.includes(dir)) problems.push(...subpathProblems(join(out, dir, tarball)))
    }
    return { dir, problems, output, secs: ((Date.now() - t) / 1000).toFixed(1) }
  }),
)

rmSync(out, { recursive: true, force: true })

let failed = false
for (const { dir, problems, output, secs } of results) {
  if (!problems.length) {
    console.log(`✓ ${dir} (${secs}s)`)
    continue
  }
  failed = true
  console.error(`✗ ${dir}\n${output.trimEnd()}\n  ${problems.join('\n  ')}`)
}
console.log(`${failed ? 'Package check failed' : 'All packages build and pack'} in ${((Date.now() - started) / 1000).toFixed(1)}s`)
process.exit(failed ? 1 : 0)
