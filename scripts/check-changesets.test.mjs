import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apiProblems, beforeFirstRelease, bumps, removesApi } from './check-changesets.mjs'

const changeset = (level) => `---\n'@youj/react': ${level}\n---\n\nSomething.\n`

test('reads the bump levels from a changeset', () => {
  assert.deepEqual(bumps(`---\n'@youj/react': minor\n'@youj/cli': patch\n---\nx`), ['minor', 'patch'])
  assert.deepEqual(bumps('no front matter'), [])
})

test('only removed or changed snapshot lines count as taking API away', () => {
  assert.equal(removesApi('--- a/api/x.md\n+++ b/api/x.md\n+export const a'), false)
  assert.equal(removesApi('--- a/api/x.md\n+++ b/api/x.md\n-export const a'), true)
})

test('a tuple that only gained items adds to the API, so a catalogue growing ships as a patch', () => {
  const header = '--- a/api/x.md\n+++ b/api/x.md\n'
  const catalogue = (before, after) => `${header}-const miniatures: readonly [${before} items]\n+const miniatures: readonly [${after} items]`
  assert.equal(removesApi(catalogue(60, 62)), false)
  assert.deepEqual(apiProblems({ apiChanged: true, removes: removesApi(catalogue(60, 62)), added: [changeset('patch')] }), [])
  // Losing an item, or any removal beside the growth, is still a removal.
  assert.equal(removesApi(catalogue(62, 60)), true)
  assert.equal(removesApi(`${catalogue(60, 62)}\n-export const a`), true)
})

test('a grown tuple is an addition only when the rest of its line is the same, once per removed line', () => {
  const changed = (before, after) => `-${before}\n+${after}`
  assert.equal(removesApi(changed('const a: readonly [3 items]', 'const b: readonly [4 items]')), true)
  assert.equal(removesApi(changed('const a: readonly [3 items]', 'const a: readonly [4 items] | null')), true)
  assert.equal(removesApi(changed('const a: readonly [3 items]', 'const a: string')), true)
  assert.equal(removesApi(changed('const a: string', 'const a: readonly [4 items]')), true)
  assert.equal(removesApi('-const a: readonly [3 items]\n-const a: readonly [3 items]\n+const a: readonly [4 items]'), true)
})

test('an API change without a changeset fails', () => {
  assert.equal(apiProblems({ apiChanged: true, removes: false, added: [] }).length, 1)
})

test('no API change needs no changeset', () => {
  assert.deepEqual(apiProblems({ apiChanged: false, removes: false, added: [] }), [])
})

test('an addition may ship as a patch', () => {
  assert.deepEqual(apiProblems({ apiChanged: true, removes: false, added: [changeset('patch')] }), [])
})

test('a removal cannot ship as a patch but can as a minor', () => {
  assert.equal(apiProblems({ apiChanged: true, removes: true, added: [changeset('patch')] }).length, 1)
  assert.deepEqual(apiProblems({ apiChanged: true, removes: true, added: [changeset('minor')] }), [])
})

test('before 0.1.0 is released no changeset may exist; after, the usual rules apply', () => {
  assert.equal(beforeFirstRelease('0.1.0', '## 0.1.0 (Unreleased)\n'), true)
  assert.equal(beforeFirstRelease('0.1.0', '## 0.1.0 - 2026-10-21\n'), false)
  assert.equal(beforeFirstRelease('0.2.0', '## 0.2.0 (Unreleased)\n'), false)
})
