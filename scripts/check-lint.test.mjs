// node --test scripts/check-lint.test.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { depsProblems, eslintDisableProblems, warningCounts } from './check-lint.mjs'

const warn = (path, category = 'lint/correctness/useExhaustiveDependencies') => ({
  severity: 'warning',
  category,
  message: 'm',
  location: { path, start: { line: 1 } },
})

test('counts hook-dependency warnings per file and reports every other warning', () => {
  const { deps, other } = warningCounts([
    warn('a.tsx'),
    warn('a.tsx'),
    warn('b.tsx'),
    warn('c.ts', 'lint/style/useConst'),
    { severity: 'error', category: 'x', location: { path: 'd.ts' } },
  ])
  assert.deepEqual(
    [...deps],
    [
      ['a.tsx', 2],
      ['b.tsx', 1],
    ],
  )
  assert.equal(other.length, 1)
})

test('a file over its baseline fails, and so does one under it', () => {
  assert.equal(depsProblems(new Map([['a.tsx', 2]]), { 'a.tsx': 2 }).length, 0)
  assert.equal(depsProblems(new Map([['a.tsx', 3]]), { 'a.tsx': 2 }).length, 1)
  assert.equal(depsProblems(new Map([['a.tsx', 1]]), { 'a.tsx': 2 }).length, 1)
  assert.equal(depsProblems(new Map([['new.tsx', 1]]), {}).length, 1)
})

test('an eslint-disable needs a reason', () => {
  assert.equal(eslintDisableProblems('a.ts', 'x // eslint-disable-line no-control-regex -- rejects control characters').length, 0)
  assert.equal(eslintDisableProblems('a.ts', 'x // eslint-disable-line no-control-regex').length, 1)
})
