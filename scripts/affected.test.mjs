import assert from 'node:assert/strict'
import { test } from 'node:test'
import { affectedFrom, readWorkspace } from './affected.mjs'

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
  assert.deepEqual(of('packages/cli/src/index.ts').packages, ['youj'])
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
