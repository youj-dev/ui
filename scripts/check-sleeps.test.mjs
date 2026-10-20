// node --test scripts/check-sleeps.test.mjs (part of pnpm check:sleeps)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sleepLines, sleepProblems } from './check-sleeps.mjs'

test('flags promise-wrapped timeouts, sleep/wait/delay helpers and waitForTimeout', () => {
  const text = [
    'await new Promise((r) => setTimeout(r, 50))',
    'await new Promise(resolve => setTimeout(resolve, 10))',
    'await sleep(100)',
    'await wait(ms)',
    'await delay(5)',
    'await page.waitForTimeout(200)',
  ].join('\n')
  assert.deepEqual(sleepLines(text), [1, 2, 3, 4, 5, 6])
})

test('ignores waiting on a condition, fake timers, comments and marked lines', () => {
  const text = [
    'await waitFor(() => expect(x).toBe(1))',
    'vi.advanceTimersByTime(100)',
    'setTimeout(() => done(), 5)',
    '// await sleep(100)',
    '// youj-allow: sleep real debounce under test',
    'await sleep(100)',
    'await sleep(100) // youj-allow: sleep animation frame',
  ].join('\n')
  assert.deepEqual(sleepLines(text), [])
})

test('fails a file over its baseline and one under it, passes one at it', () => {
  const found = new Map([['a.test.ts', [1, 4]], ['b.test.ts', [2]]])
  assert.deepEqual(sleepProblems(found, { 'a.test.ts': 2, 'b.test.ts': 1 }), [])
  assert.match(sleepProblems(found, { 'a.test.ts': 1, 'b.test.ts': 1 })[0], /^a\.test\.ts:4 {2}1 new raw sleep/)
  assert.match(sleepProblems(new Map([['b.test.ts', [2]]]), { 'a.test.ts': 2, 'b.test.ts': 1 })[0], /a\.test\.ts has fewer than the 2/)
})

test('a new test file with a sleep fails against an empty baseline entry', () => {
  assert.equal(sleepProblems(new Map([['c.test.ts', [3]]]), {}).length, 1)
})
