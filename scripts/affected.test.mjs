import assert from 'node:assert/strict'
import { test } from 'node:test'
import { affectedFrom, ciJobsFrom, readWorkspace, verifyWorkspacesFrom } from './affected.mjs'

const ws = readWorkspace()
const of = (...files) => affectedFrom(ws, files)

test('the workspace graph is read from the package.json files', () => {
  const by = Object.fromEntries(ws.map((p) => [p.name, p.deps]))
  assert.ok(by['@youj/react'].includes('@youj/motion'))
  assert.ok(by['@youj/motion'].includes('@youj/core'))
  assert.ok(by.docs.includes('@youj/react'))
  assert.ok(by.docs.includes('@youj/figma'), 'docs builds figma in generate')
  assert.ok(!by['@youj/mcp'].includes('@youj/react'))
})

test('a docs content change affects docs alone', () => {
  const r = of('apps/docs/content/docs/index.mdx')
  assert.deepEqual(r.packages, ['docs'])
  assert.equal(r.all, false)
})

test('a UI component change affects react, figma, docs and promo, not mcp, cli or sound', () => {
  const r = of('packages/ui/src/components/button.tsx')
  assert.deepEqual([...r.packages].sort(), ['@youj/figma', '@youj/react', 'docs', 'promo'])
  assert.equal(r.mcp, true, 'the MCP index reads the ui sources')
})

test('a core change reaches every package that depends on it', () => {
  const r = of('packages/core/src/lib/youj/provider.tsx')
  for (const name of ['@youj/core', '@youj/motion', '@youj/react', '@youj/icons', '@youj/sound', '@youj/illustrations', '@youj/figma', 'docs']) assert.ok(r.packages.includes(name), name)
})

test('a package nothing depends on affects only itself', () => {
  assert.deepEqual(of('packages/cli/src/index.ts').packages, ['@youj/cli'])
  assert.deepEqual(of('packages/mcp/src/server.ts').packages, ['@youj/mcp'])
})

test('Markdown, changesets and the ship scripts verify nothing', () => {
  const r = of('CLAUDE.md', 'packages/ui/CLAUDE.md', 'apps/docs/README.md', '.changeset/a.md', 'scripts/ship.sh', 'scripts/affected.mjs', 'docs/upgrade-guides/x.md')
  assert.deepEqual(r.packages, [])
  assert.equal(r.all, false)
  assert.equal(r.mcp, false)
  assert.equal(r.ignored, 7)
})

test('the launch marker verifies nothing: the launch already deployed the public site', () => {
  const r = of('apps/docs/LAUNCHED')
  assert.deepEqual(r.packages, [])
  assert.equal(r.all, false)
})

test('root config, the lockfile and other root files mean everything', () => {
  for (const file of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'taxonomy.json', 'scripts/check-imports.mjs']) {
    const r = of(file)
    assert.equal(r.all, true, file)
    assert.equal(r.packages.length, ws.length, file)
  }
})

test('a docs source change flags the MCP index; docs app config does not', () => {
  assert.equal(of('apps/docs/lib/registry.ts').mcp, true)
  assert.equal(of('apps/docs/next.config.mjs').mcp, false)
})

test('no changes affect nothing', () => {
  assert.deepEqual(of().packages, [])
})

const ci = (...files) => ciJobsFrom(files)
const NONE = { packages: false, storybook: false, docs: false }
const ALL = { packages: true, storybook: true, docs: true }

test('CI: a change in packages runs every job', () => {
  assert.deepEqual(ci('packages/ui/src/components/button.tsx'), ALL)
  assert.deepEqual(ci('packages/cli/README.md'), ALL)
  assert.deepEqual(ci('apps/docs/content/docs/index.mdx', 'packages/core/src/x.ts'), ALL)
})

test('CI: root config, the lockfile, root scripts, ci.yml and unknown files run every job', () => {
  for (const file of ['package.json', 'pnpm-lock.yaml', 'biome.json', 'taxonomy.json', 'scripts/check-imports.mjs', '.github/workflows/ci.yml', 'something/new.txt'])
    assert.deepEqual(ci(file), ALL, file)
  assert.deepEqual(ci('README.md', 'package.json'), ALL)
})

test('CI: .github (but ci.yml) and root Markdown run only the root checks', () => {
  assert.deepEqual(ci('.github/pull_request_template.md', '.github/CODEOWNERS', '.github/workflows/other.yml'), NONE)
  assert.deepEqual(ci('README.md', 'CONTRIBUTING.md', 'docs/upgrade-guides/x.md', 'apps/promo/src/a.tsx'), NONE)
})

test('CI: files the docs site reads from the root run the docs build', () => {
  for (const file of ['CHANGELOG.md', 'SECURITY.md', '.changeset/a.md', 'api/youj-react.api.md']) assert.deepEqual(ci(file), { ...NONE, docs: true }, file)
})

test('CI: docs content, pages and tests run the docs build but not Storybook', () => {
  for (const file of ['apps/docs/content/docs/index.mdx', 'apps/docs/app/page.tsx', 'apps/docs/public/og.png', 'apps/docs/README.md', 'apps/docs/next.config.mjs'])
    assert.deepEqual(ci(file), { ...NONE, docs: true }, file)
})

test('CI: docs components, lib and examples can reach a story, and the blocks photos are served by it', () => {
  for (const file of ['apps/docs/components/sound/sound-builder.tsx', 'apps/docs/lib/registry.ts', 'apps/docs/public/blocks/a.jpg'])
    assert.deepEqual(ci(file), { ...NONE, docs: true, storybook: true }, file)
})

test('CI: Storybook config and its suites run Storybook and what follows it', () => {
  for (const file of ['.storybook/main.ts', 'tests/storybook/a11y.spec.ts', 'playwright.config.ts']) assert.deepEqual(ci(file), { ...NONE, storybook: true }, file)
})

test('CI: no changed files run only the root checks; one unknown file among known ones runs everything', () => {
  assert.deepEqual(ci(), NONE)
  assert.deepEqual(ci('README.md', 'scripts/new.mjs'), ALL)
})

const verified = (...files) => verifyWorkspacesFrom(ws, files)
const everyWorkspace = ws.map((p) => p.name)

test('CI matrix: a docs content change verifies docs alone', () => {
  assert.deepEqual(verified('apps/docs/content/docs/index.mdx'), ['docs'])
})

test('CI matrix: a change in a leaf package verifies that package alone', () => {
  assert.deepEqual(verified('packages/cli/src/index.ts'), ['@youj/cli'])
})

test('CI matrix: a core change verifies core and everything built on it', () => {
  const names = verified('packages/core/src/index.ts')
  for (const name of ['@youj/core', '@youj/motion', '@youj/react', 'docs']) assert.ok(names.includes(name), name)
  assert.ok(!names.includes('@youj/cli'))
  assert.ok(!names.includes('@youj/miniatures'))
})

test('CI matrix: root config, the lockfile, a root script and ci.yml verify every workspace', () => {
  for (const file of ['package.json', 'pnpm-lock.yaml', 'biome.json', 'scripts/check-imports.mjs', '.github/workflows/ci.yml'])
    assert.deepEqual([...verified(file)].sort(), [...everyWorkspace].sort(), file)
})

test('CI matrix: Markdown, other workflows and the changesets verify no workspace', () => {
  assert.deepEqual(verified('README.md', '.changeset/a.md', '.github/CODEOWNERS', '.github/workflows/codeql.yml'), [])
  assert.deepEqual(verified(), [])
})
