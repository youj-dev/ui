// node --test scripts/check-copy-in-lint.test.mjs (part of pnpm lint:copy-in)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { baselineProblems, disablesIn } from './check-copy-in-lint.mjs'

test('counts one-line disables with a reason, by rule', () => {
  const text = [
    '// eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, on mount',
    '{/* eslint-disable-next-line @next/next/no-img-element -- copy-in blocks run in Vite too */}',
    'f() // eslint-disable-line a/b, c/d -- both are wrong here',
  ].join('\n')
  assert.deepEqual(disablesIn(text, 'x.tsx'), { rules: ['react-hooks/exhaustive-deps', '@next/next/no-img-element', 'a/b', 'c/d'], problems: [] })
})

test('flags file- and block-wide disables, and disables without a reason', () => {
  const text = ['/* eslint-disable react-hooks/refs */', '// eslint-enable', '// eslint-disable-next-line react-hooks/refs', '// eslint-disable-next-line react-hooks/refs -- ok'].join('\n')
  const { problems } = disablesIn(text, 'x.tsx')
  assert.equal(problems.length, 4)
  assert.match(problems[0], /x\.tsx:1 .*more than one line/)
  assert.match(problems[2], /x\.tsx:3 .*reason/)
  assert.match(problems[3], /x\.tsx:4 .*reason/)
})

test('the baseline only shrinks', () => {
  assert.deepEqual(baselineProblems({ a: 2 }, { a: 2 }), [])
  assert.match(baselineProblems({ a: 3 }, { a: 2 })[0], /^a: 3 disables .* 2 allowed/)
  assert.match(baselineProblems({ b: 1 }, {})[0], /^b: 1 disables .* 0 allowed/)
  assert.match(baselineProblems({}, { a: 1 })[0], /fewer than the 1/)
})
