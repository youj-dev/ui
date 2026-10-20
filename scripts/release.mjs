// Publishes the workspace packages: @youj/core, @youj/motion, @youj/loaders, @youj/sound, @youj/icons,
// @youj/illustrations, @youj/miniatures, @youj/react, the CLI (@youj/cli, whose command is `youj`) and the MCP server
// (@youj/mcp).
//
//   node scripts/release.mjs             publish to GitHub Packages what it doesn't have yet
//   node scripts/release.mjs --to npm    the same on the public npm registry, with public access
//   node scripts/release.mjs --dry-run   build and pack, then `npm publish --dry-run`
//
// Each package is packed by pnpm (which builds it, applies publishConfig and
// resolves workspace: ranges) and published from the unpacked tarball.
//
// Env: NODE_AUTH_TOKEN, a token that can publish there (GITHUB_TOKEN in
// Actions for GitHub Packages, an npm token for npm). YOUJ_NPM_REGISTRY
// overrides the registry URL, for example with a local Verdaccio.
// YOUJ_NPM_TAG=next publishes a prerelease (0.5.0-next.1) on the next channel:
// required for a prerelease, refused for a release (which goes on latest).
// YOUJ_REPO_URL points the published repository, bugs and README links at a
// moved or renamed repository (default https://github.com/youj-dev/ui).
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

const root = join(import.meta.dirname, '..')
// Strict: a mistyped option stops the release instead of publishing somewhere else.
const { values: options } = parseArgs({
  options: { 'dry-run': { type: 'boolean', default: false }, to: { type: 'string', default: 'github' } },
})
const dryRun = options['dry-run']
const TARGETS = {
  github: { registry: 'https://npm.pkg.github.com' },
  // Scoped packages are private on npm unless published public.
  npm: { registry: 'https://registry.npmjs.org', access: 'public' },
}
const target = TARGETS[options.to]
if (!target) {
  console.error(`--to takes ${Object.keys(TARGETS).join(' or ')}, not "${options.to}"`)
  process.exit(1)
}
const DEFAULT_REPO_URL = 'https://github.com/youj-dev/ui'
const repoUrl = (process.env.YOUJ_REPO_URL?.trim() || DEFAULT_REPO_URL).replace(/\/+$/, '')
if (!/^https:\/\/[^/?#\s]+\/[^?#\s]+$/.test(repoUrl)) {
  console.error(`YOUJ_REPO_URL must be a repository's https URL, like ${DEFAULT_REPO_URL}; got "${repoUrl}"`)
  process.exit(1)
}
// The workspace's package.json and READMEs link the default repository; the published copies link the configured one.
const retarget = (text) => text.replaceAll(DEFAULT_REPO_URL, repoUrl)
const registry = (process.env.YOUJ_NPM_REGISTRY ?? target.registry).replace(/\/?$/, '/')
// The CLI goes first (it installs the rest at its own version, so `npx @youj/cli` works as soon as they follow). Then dependencies first: motion,
// loaders, sound, icons and illustrations depend on core, miniatures on nothing; ui on core, motion and icons.
const PACKAGES = ['cli', 'core', 'motion', 'loaders', 'sound', 'icons', 'illustrations', 'miniatures', 'ui', 'mcp']

const work = mkdtempSync(join(tmpdir(), 'youj-release-'))
const userconfig = join(work, '.npmrc')
const scopes = ['@youj']
writeFileSync(
  userconfig,
  [...scopes].map((scope) => `${scope}:registry=${registry}\n`).join('') + `${registry.replace(/^https?:/, '')}:_authToken=\${NODE_AUTH_TOKEN}\n`,
)
const npm = (args, options = {}) =>
  execFileSync('npm', [...args, '--registry', registry, '--userconfig', userconfig], {
    encoding: 'utf8',
    env: { ...process.env, NODE_AUTH_TOKEN: process.env.NODE_AUTH_TOKEN ?? '' },
    ...options,
  })

function isPublished(name, version) {
  try {
    npm(['view', `${name}@${version}`, 'version'], { stdio: 'pipe' })
    return true
  } catch (error) {
    if (/E404|404 Not Found/.test(`${error.stderr}`)) return false
    // A dry run may have no token to read a private registry with.
    if (dryRun) return false
    throw error
  }
}

// A prerelease (0.5.0-next.1) goes out on `next`, for testers; a release on `latest`. Never one on the other's tag.
const { version } = JSON.parse(readFileSync(join(root, 'packages/core/package.json'), 'utf8'))
const tag = process.env.YOUJ_NPM_TAG || undefined
if (version.includes('-') && !tag) {
  console.error(`${version} is a prerelease: publish it on the next channel, YOUJ_NPM_TAG=next (RELEASING.md, "Prereleases").`)
  process.exit(1)
}
if (!version.includes('-') && tag && tag !== 'latest') {
  console.error(`${version} is a release, so it goes on latest; unset YOUJ_NPM_TAG (it's "${tag}").`)
  process.exit(1)
}

// The .npmrc in `work` names the token's variable, never its value; the packed copies are throwaway.
process.on('exit', () => rmSync(work, { recursive: true, force: true }))

const summary = []
for (const dir of PACKAGES) {
  const workspace = JSON.parse(readFileSync(join(root, 'packages', dir, 'package.json'), 'utf8'))
  const name = workspace.name
  if (isPublished(name, workspace.version)) {
    summary.push(`${name}@${workspace.version} is already published`)
    continue
  }

  const out = join(work, dir)
  mkdirSync(out)
  execFileSync('pnpm', ['pack', '--pack-destination', out], { cwd: join(root, 'packages', dir), stdio: ['ignore', 'ignore', 'inherit'] })
  const tarball = readdirSync(out).find((f) => f.endsWith('.tgz'))
  execFileSync('tar', ['-xzf', tarball], { cwd: out })

  const pkg = join(out, 'package')
  const manifestPath = join(pkg, 'package.json')
  const manifest = JSON.parse(retarget(readFileSync(manifestPath, 'utf8')))
  manifest.name = name
  delete manifest.private
  delete manifest.scripts
  delete manifest.devDependencies
  manifest.publishConfig = { registry, ...(target.access && { access: target.access }) }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  const readme = join(pkg, 'README.md')
  if (existsSync(readme)) writeFileSync(readme, retarget(readFileSync(readme, 'utf8')))
  // A published bin that points at a file the tarball lacks installs a command that can't run.
  const bins = typeof manifest.bin === 'string' ? [manifest.bin] : Object.values(manifest.bin ?? {})
  const missing = bins.filter((file) => !existsSync(join(pkg, file)))
  if (missing.length) {
    console.error(`${name}: bin ${missing.join(', ')} is not in the packed tarball; build it before releasing.`)
    process.exit(1)
  }

  // Provenance links each npm release to the workflow run that built it; npm only accepts it from CI.
  const provenance = options.to === 'npm' && !dryRun && process.env.GITHUB_ACTIONS === 'true'
  npm(['publish', pkg, ...(tag ? ['--tag', tag] : []), ...(dryRun ? ['--dry-run'] : []), ...(provenance ? ['--provenance'] : [])], { stdio: 'inherit' })
  summary.push(`${dryRun ? 'would publish' : 'published'} ${name}@${workspace.version}`)
}

console.log(`\n${summary.join('\n')}\nchannel: ${tag ?? 'latest'}\nregistry: ${registry}\nrepository: ${repoUrl}${dryRun ? '\n(dry run: nothing was published)' : ''}`)
