import { diffText, diffWords, matchSequences, parsePatch, splitLines, type DiffLine } from './diff-viewer-diff'

const shape = (before: string, after: string) =>
  diffText(before, after)
    .rows.map((row) => (row.type === 'gap' ? '@' : `${row.type === 'add' ? '+' : row.type === 'del' ? '-' : ' '}${row.text}`))
    .join('|')

/** Rebuilds both sides from the rows, to prove a diff loses nothing. */
function sides(before: string, after: string) {
  const rows = diffText(before, after).rows as DiffLine[]
  return {
    old: rows.filter((r) => r.type !== 'add').map((r) => r.text),
    new: rows.filter((r) => r.type !== 'del').map((r) => r.text),
  }
}

describe('diffText', () => {
  test('two empty files have no rows', () => {
    expect(diffText('', '')).toEqual({ rows: [], additions: 0, deletions: 0 })
  })

  test('identical files are all context, numbered on both sides', () => {
    const { rows, additions, deletions } = diffText('a\nb\nc\n', 'a\nb\nc\n')
    expect(additions + deletions).toBe(0)
    expect(rows).toEqual([
      { type: 'context', oldNumber: 1, newNumber: 1, text: 'a' },
      { type: 'context', oldNumber: 2, newNumber: 2, text: 'b' },
      { type: 'context', oldNumber: 3, newNumber: 3, text: 'c' },
    ])
  })

  test('a new file is all additions, a deleted one all removals', () => {
    expect(diffText('', 'one\ntwo\n')).toMatchObject({ additions: 2, deletions: 0 })
    expect(shape('', 'one\ntwo\n')).toBe('+one|+two')
    expect(diffText('one\ntwo\n', '')).toMatchObject({ additions: 0, deletions: 2 })
    expect(shape('one\ntwo\n', '')).toBe('-one|-two')
  })

  test('a changed line reads as its removal then its addition, with the words that changed marked', () => {
    const { rows } = diffText('const a = 1\nkeep\n', 'const a = 2\nkeep\n')
    expect(rows).toEqual([
      { type: 'del', oldNumber: 1, text: 'const a = 1', marks: [[10, 11]] },
      { type: 'add', newNumber: 1, text: 'const a = 2', marks: [[10, 11]] },
      { type: 'context', oldNumber: 2, newNumber: 2, text: 'keep' },
    ])
  })

  test('the edit is minimal: insertions and removals in the middle keep the shared lines', () => {
    expect(shape('a\nb\nc\nd\n', 'a\nx\nc\nd\ne\n')).toBe(' a|-b|+x| c| d|+e')
    expect(shape('a\nb\nc\na\nb\nb\na\n', 'c\nb\na\nb\na\nc\n').split('|').filter((r) => r[0] !== ' ')).toHaveLength(5)
  })

  test('both sides rebuild exactly from the rows, on a longer shuffled file', () => {
    const before = Array.from({ length: 400 }, (_, i) => `line ${i % 37} ${i % 5}`).join('\n')
    const after = Array.from({ length: 420 }, (_, i) => `line ${(i * 7) % 37} ${i % 5}`).join('\n')
    const rebuilt = sides(before, after)
    expect(rebuilt.old).toEqual(before.split('\n'))
    expect(rebuilt.new).toEqual(after.split('\n'))
  })

  test('CRLF and LF line endings compare equal', () => {
    const { rows, additions, deletions } = diffText('a\r\nb\r\n', 'a\nb\n')
    expect(additions + deletions).toBe(0)
    expect(rows.map((r) => (r as DiffLine).text)).toEqual(['a', 'b'])
  })

  test('a missing final newline changes the last line, and says so', () => {
    const { rows } = diffText('a\nb', 'a\nb\n')
    expect(rows).toEqual([
      { type: 'context', oldNumber: 1, newNumber: 1, text: 'a' },
      { type: 'del', oldNumber: 2, text: 'b', noNewline: true },
      { type: 'add', newNumber: 2, text: 'b' },
    ])
    // Both sides without one: nothing changed.
    expect(diffText('a\nb', 'a\nb')).toMatchObject({ additions: 0, deletions: 0 })
    expect((diffText('a\nb', 'a\nb').rows.at(-1) as DiffLine).noNewline).toBe(true)
  })

  test('a 2,000-line file with scattered edits diffs quickly', () => {
    const before = Array.from({ length: 2000 }, (_, i) => `export const value${i} = compute(${i}, 'item-${i}')`)
    const after = before.map((line, i) => (i % 97 === 0 ? `${line} // touched` : line))
    after.splice(1000, 0, 'export const inserted = true')
    const start = performance.now()
    const { additions, deletions } = diffText(before.join('\n'), after.join('\n'))
    expect(performance.now() - start).toBeLessThan(500)
    expect(deletions).toBe(21)
    expect(additions).toBe(22)
  })

  test('two unrelated 2,000-line files still diff in linear space', () => {
    const before = Array.from({ length: 2000 }, (_, i) => `old ${i}`).join('\n')
    const after = Array.from({ length: 2000 }, (_, i) => `new ${i}`).join('\n')
    expect(diffText(before, after)).toMatchObject({ additions: 2000, deletions: 2000 })
  })
})

describe('diffWords', () => {
  test('marks the changed words on each side', () => {
    expect(diffWords('timeout: 30', 'timeout: 45')).toEqual([[[9, 11]], [[9, 11]]])
  })

  test('lines with too little in common get no marks', () => {
    expect(diffWords('import React from "react"', 'return null')).toBeNull()
  })
})

describe('matchSequences', () => {
  test('pairs the longest common subsequence in order', () => {
    expect(matchSequences([1, 2, 3, 4], [2, 4])).toEqual([1, 0, 3, 1])
    expect(matchSequences([], [1])).toEqual([])
  })
})

describe('splitLines', () => {
  test('ends on a final newline rather than an empty line', () => {
    expect(splitLines('a\nb\n')).toEqual({ lines: ['a', 'b'], finalNewline: true })
    expect(splitLines('a\r\nb')).toEqual({ lines: ['a', 'b'], finalNewline: false })
    expect(splitLines('')).toEqual({ lines: [], finalNewline: true })
  })
})

const PATCH = `diff --git a/src/config.ts b/src/config.ts
index 3b18e51..a9c2f04 100644
--- a/src/config.ts
+++ b/src/config.ts
@@ -1,4 +1,4 @@ export const config = {
 export const config = {
-  retries: 3,
+  retries: 5,
   timeout: 30,
 }
@@ -20,3 +20,4 @@ export function load() {
   return read()
+  // cached
 }
\\ No newline at end of file
`

describe('parsePatch', () => {
  test('reads hunks, numbers and the file name', () => {
    const { rows, additions, deletions, filename } = parsePatch(PATCH)
    expect(filename).toBe('src/config.ts')
    expect(additions).toBe(2)
    expect(deletions).toBe(1)
    expect(rows[0]).toEqual({ type: 'gap', header: '@@ -1,4 +1,4 @@ export const config = {' })
    expect(rows[2]).toEqual({ type: 'del', oldNumber: 2, text: '  retries: 3,', marks: [[11, 12]] })
    expect(rows[3]).toEqual({ type: 'add', newNumber: 2, text: '  retries: 5,', marks: [[11, 12]] })
    expect(rows[6]).toEqual({ type: 'gap', header: '@@ -20,3 +20,4 @@ export function load() {' })
    expect(rows[8]).toEqual({ type: 'add', newNumber: 21, text: '  // cached' })
    expect(rows.at(-1)).toEqual({ type: 'context', oldNumber: 21, newNumber: 22, text: '}', noNewline: true })
  })

  test('a patch of several files shows the first', () => {
    const two = `${PATCH}diff --git a/b.ts b/b.ts\n--- a/b.ts\n+++ b/b.ts\n@@ -1 +1 @@\n-x\n+y\n`
    expect(parsePatch(two).filename).toBe('src/config.ts')
    expect(parsePatch(two).additions).toBe(2)
  })

  test('a new file names its +++ side', () => {
    expect(parsePatch('--- /dev/null\n+++ b/new.md\n@@ -0,0 +1 @@\n+hello\n')).toMatchObject({ filename: 'new.md', additions: 1 })
  })
})
