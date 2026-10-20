// Which workspace packages a change touches, for scripts/ship.sh: the packages that own the changed files plus
// everything that depends on them (through package.json dependencies, devDependencies, peerDependencies), so a
// motion change verifies motion, ui, docs... and a docs content change verifies docs alone.
//
//   node scripts/affected.mjs --base <sha>            changed files = git diff --name-only <sha> HEAD
//   git diff --name-only a b | node scripts/affected.mjs --stdin
//   add --json for the whole result, or --field packages|all|mcp|ignored|files to print one value
//
// Rules (affectedFrom below):
// - a file under packages/<dir> or apps/<dir> belongs to that package, and its dependents are affected;
// - docs also counts as depending on @youj/figma (docs' generate step builds it);
// - Markdown, .changeset, docs/, exports/, .github, .claude, the ship scripts and the launch marker
//   (apps/docs/LAUNCHED) change nothing that is verified;
// - any other file outside the packages (root package.json, the lockfile, taxonomy.json, a root script...) means
//   everything: `all`;
// - `mcp` is set when the MCP index's inputs changed (packages/mcp itself, the packages it reads, and the docs
//   modules and content its collector imports): the Worker is deployed separately (pnpm -F @youj/mcp cf:deploy).
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Edges the package.json files don't declare: [package, what it needs]. */
const IMPLICIT_DEPS = [['docs', '@youj/figma']]

const IGNORED = [
  /\.md$/,
  /^\.changeset\//,
  /^docs\//,
  /^exports\//,
  /^\.github\//,
  /^\.claude\//,
  /^\.storybook\//,
  /^tests\//,
  /^api\//,
  /^LICENSE$/,
  /^\.(gitignore|vercelignore)$/,
  /^scripts\/(ship\.sh|affected\.(test\.)?mjs)$/,
  /^apps\/docs\/LAUNCHED$/,
]

const MCP_INPUTS = [
  /^packages\/(mcp|ui|core|motion|loaders|icons|illustrations|miniatures)\//,
  /^apps\/docs\/(content|lib|examples)\//,
  /^apps\/docs\/components\/icons\//,
  /^apps\/docs\/scripts\/(props|installed-files|registry)\./,
]

/** The workspace: [{ name, dir, deps: [workspace names] }], read from packages/* and apps/*. */
export function readWorkspace(root = ROOT) {
  const found = []
  for (const parent of ['packages', 'apps']) {
    for (const entry of readdirSync(join(root, parent), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      try {
        const pkg = JSON.parse(readFileSync(join(root, parent, entry.name, 'package.json'), 'utf8'))
        found.push({ name: pkg.name, dir: `${parent}/${entry.name}`, deps: Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies, ...pkg.optionalDependencies }) })
      } catch {
        // a folder with no package.json is not a package
      }
    }
  }
  const names = new Set(found.map((p) => p.name))
  return found.map((p) => ({ ...p, deps: [...new Set([...p.deps, ...IMPLICIT_DEPS.filter(([n]) => n === p.name).map(([, d]) => d)])].filter((d) => names.has(d)) }))
}

/** @param {{ name: string, dir: string, deps: string[] }[]} workspace @param {string[]} files repo-relative paths */
export function affectedFrom(workspace, files) {
  const owned = new Set()
  const live = []
  let all = false
  for (const file of files) {
    if (IGNORED.some((re) => re.test(file))) continue
    live.push(file)
    const pkg = workspace.find((p) => file.startsWith(`${p.dir}/`))
    if (pkg) owned.add(pkg.name)
    else if (!/^(packages|apps)\//.test(file)) all = true
  }
  const closure = new Set(owned)
  for (let grew = true; grew; ) {
    grew = false
    for (const p of workspace) {
      if (!closure.has(p.name) && p.deps.some((d) => closure.has(d))) {
        closure.add(p.name)
        grew = true
      }
    }
  }
  return {
    all,
    packages: all ? workspace.map((p) => p.name) : workspace.filter((p) => closure.has(p.name)).map((p) => p.name),
    mcp: all || live.some((f) => MCP_INPUTS.some((re) => re.test(f))),
    ignored: files.length - live.length,
    files: files.length,
  }
}

function main() {
  const args = process.argv.slice(2)
  const value = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined)
  let names
  if (args.includes('--stdin')) names = readFileSync(0, 'utf8')
  else if (value('--base')) names = execFileSync('git', ['diff', '--name-only', value('--base'), 'HEAD'], { cwd: ROOT, encoding: 'utf8' })
  else {
    console.error('usage: node scripts/affected.mjs --base <sha> | --stdin  [--json | --field <name>]')
    process.exit(2)
  }
  const result = affectedFrom(readWorkspace(), names.split('\n').filter(Boolean))
  const field = value('--field')
  if (field) {
    const v = result[field]
    console.log(Array.isArray(v) ? v.join(' ') : typeof v === 'boolean' ? (v ? 1 : 0) : v)
  } else if (args.includes('--json')) console.log(JSON.stringify(result))
  else console.log(`${result.all ? 'everything' : result.packages.join(', ') || 'no package'}${result.mcp ? ' (MCP index inputs changed)' : ''}`)
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main()
