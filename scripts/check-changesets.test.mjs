import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apiProblems, beforeFirstRelease, bumps, removesApi } from './check-changesets.mjs'

const changeset = (level) => `---\n'@youj/react': ${level}\n---\n\nSomething.\n`

test('reads the bump levels from a changeset', () => {
  assert.deepEqual(bumps(`---\n'@youj/react': minor\n'youj': patch\n---\nx`), ['minor', 'patch'])
  assert.deepEqual(bumps('no front matter'), [])
})

test('only removed or changed snapshot lines count as taking API away', () => {
  assert.equal(removesApi('--- a/api/x.md\n+++ b/api/x.md\n+export const a'), false)
  assert.equal(removesApi('--- a/api/x.md\n+++ b/api/x.md\n-export const a'), true)
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
