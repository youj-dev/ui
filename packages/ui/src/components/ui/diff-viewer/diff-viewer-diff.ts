/* The line diff behind DiffViewer: Myers' O(ND) algorithm in linear space
 * (the middle-snake bisection), over lines interned to integers, with the
 * common prefix and suffix trimmed at every level. Inside a changed block,
 * removed and added lines are paired in order and diffed again by word, so
 * the view can mark what changed within a line. Line endings are normalized
 * (CRLF reads as LF); a missing newline at the end of a file counts as a
 * difference of its last line, as git counts it. A unified diff (`patch`)
 * parses to the same rows. No HTML anywhere: text and ranges only. */

export type DiffLineType = 'context' | 'add' | 'del'

/** A character range [start, end) inside a line that changed within a changed pair. */
export type DiffMark = [start: number, end: number]

export interface DiffLine {
  type: DiffLineType
  /** 1-based line number in the old file (context and removed lines). */
  oldNumber?: number
  /** 1-based line number in the new file (context and added lines). */
  newNumber?: number
  text: string
  /** What changed inside the line, when it pairs with a similar line on the other side. */
  marks?: DiffMark[]
  /** The file ends on this line with no newline after it. */
  noNewline?: boolean
}

/** A hunk header of a patch: the lines between two hunks aren't in the patch, so they can't be shown. */
export interface DiffGap {
  type: 'gap'
  header: string
}

export type DiffRow = DiffLine | DiffGap

export interface DiffResult {
  rows: DiffRow[]
  additions: number
  deletions: number
  /** The file name a patch names (its `+++` line, else `---`), without the `a/`/`b/` prefix. */
  filename?: string
}

/** Splits text into lines: CRLF and CR read as LF, and a final newline ends the last line rather than starting an empty one. */
export function splitLines(text: string): { lines: string[]; finalNewline: boolean } {
  if (text === '') return { lines: [], finalNewline: true }
  const normal = text.replace(/\r\n?/g, '\n')
  const finalNewline = normal.endsWith('\n')
  const lines = (finalNewline ? normal.slice(0, -1) : normal).split('\n')
  return { lines, finalNewline }
}

/** Pairs of equal indices [i in a, j in b], in order, forming a shortest edit script between two integer sequences. */
export function matchSequences(a: ArrayLike<number>, b: ArrayLike<number>): number[] {
  const out: number[] = []
  compare(a, b, 0, a.length, 0, b.length, out)
  return out
}

function compare(a: ArrayLike<number>, b: ArrayLike<number>, aLo: number, aHi: number, bLo: number, bHi: number, out: number[]) {
  while (aLo < aHi && bLo < bHi && a[aLo] === b[bLo]) {
    out.push(aLo++, bLo++)
  }
  let suffix = 0
  while (aLo < aHi - suffix && bLo < bHi - suffix && a[aHi - 1 - suffix] === b[bHi - 1 - suffix]) suffix++
  const aEnd = aHi - suffix
  const bEnd = bHi - suffix
  if (aLo < aEnd && bLo < bEnd) {
    const split = middleSnake(a, b, aLo, aEnd, bLo, bEnd)
    if (split) {
      compare(a, b, aLo, split[0], bLo, split[1], out)
      compare(a, b, split[0], aEnd, split[1], bEnd, out)
    }
  }
  for (let i = 0; i < suffix; i++) out.push(aEnd + i, bEnd + i)
}

/** Where a shortest path through a[aLo..aHi) × b[bLo..bHi) crosses its middle, searched from both ends at once. Null when nothing is shared. */
function middleSnake(a: ArrayLike<number>, b: ArrayLike<number>, aLo: number, aHi: number, bLo: number, bHi: number): [number, number] | null {
  const n = aHi - aLo
  const m = bHi - bLo
  const maxD = Math.ceil((n + m) / 2)
  const offset = maxD
  const size = 2 * maxD + 2
  const v1 = new Int32Array(size).fill(-1)
  const v2 = new Int32Array(size).fill(-1)
  v1[offset + 1] = 0
  v2[offset + 1] = 0
  const delta = n - m
  const front = delta % 2 !== 0
  let k1start = 0
  let k1end = 0
  let k2start = 0
  let k2end = 0
  const split = (x: number, y: number): [number, number] | null =>
    // A split at either corner would recurse forever; it can't happen after trimming, but stay safe.
    (x === 0 && y === 0) || (x === n && y === m) ? null : [aLo + x, bLo + y]
  for (let d = 0; d < maxD; d++) {
    for (let k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
      const i = offset + k1
      let x1 = k1 === -d || (k1 !== d && v1[i - 1]! < v1[i + 1]!) ? v1[i + 1]! : v1[i - 1]! + 1
      let y1 = x1 - k1
      while (x1 < n && y1 < m && a[aLo + x1] === b[bLo + y1]) {
        x1++
        y1++
      }
      v1[i] = x1
      if (x1 > n) k1end += 2
      else if (y1 > m) k1start += 2
      else if (front) {
        const j = offset + delta - k1
        if (j >= 0 && j < size && v2[j] !== -1 && x1 >= n - v2[j]!) return split(x1, y1)
      }
    }
    for (let k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
      const i = offset + k2
      let x2 = k2 === -d || (k2 !== d && v2[i - 1]! < v2[i + 1]!) ? v2[i + 1]! : v2[i - 1]! + 1
      let y2 = x2 - k2
      while (x2 < n && y2 < m && a[aHi - 1 - x2] === b[bHi - 1 - y2]) {
        x2++
        y2++
      }
      v2[i] = x2
      if (x2 > n) k2end += 2
      else if (y2 > m) k2start += 2
      else if (!front) {
        const j = offset + delta - k2
        if (j >= 0 && j < size && v1[j] !== -1) {
          const x1 = v1[j]!
          const y1 = offset + x1 - j
          if (x1 >= n - x2) return split(x1, y1)
        }
      }
    }
  }
  return null
}

/** Interns strings to integers shared across both sides, so the diff compares numbers. */
function intern(left: string[], right: string[]): [Int32Array, Int32Array] {
  const ids = new Map<string, number>()
  const id = (s: string) => {
    let v = ids.get(s)
    if (v === undefined) {
      v = ids.size
      ids.set(s, v)
    }
    return v
  }
  return [Int32Array.from(left, id), Int32Array.from(right, id)]
}

const WORD = /[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu

/** Ranges that changed between two similar lines, by word. Null when the lines share too little for marks to help. */
export function diffWords(before: string, after: string): [DiffMark[], DiffMark[]] | null {
  const left = before.match(WORD) ?? []
  const right = after.match(WORD) ?? []
  const [a, b] = intern(left, right)
  const pairs = matchSequences(a, b)
  const keepA = new Uint8Array(a.length)
  const keepB = new Uint8Array(b.length)
  let shared = 0
  for (let p = 0; p < pairs.length; p += 2) {
    keepA[pairs[p]!] = 1
    keepB[pairs[p + 1]!] = 1
    // Whitespace alone doesn't make two lines alike.
    if (left[pairs[p]!]!.trim()) shared += left[pairs[p]!]!.length
  }
  const longest = Math.max(before.trim().length, after.trim().length)
  if (longest === 0 || shared / longest < 0.4) return null
  return [ranges(left, keepA), ranges(right, keepB)]
}

function ranges(tokens: string[], keep: Uint8Array): DiffMark[] {
  const out: DiffMark[] = []
  let at = 0
  tokens.forEach((token, i) => {
    const end = at + token.length
    if (!keep[i]) {
      const last = out.at(-1)
      if (last && last[1] === at) last[1] = end
      else out.push([at, end])
    }
    at = end
  })
  return out
}

/** Marks the changed parts of each removed/added pair in a changed block, pairing them in order. */
function markBlock(dels: DiffLine[], adds: DiffLine[]) {
  const pairs = Math.min(dels.length, adds.length)
  for (let i = 0; i < pairs; i++) {
    const marks = diffWords(dels[i]!.text, adds[i]!.text)
    if (!marks) continue
    // A pair that differs only in its line ending (or not at all) has nothing to mark.
    if (marks[0].length) dels[i]!.marks = marks[0]
    if (marks[1].length) adds[i]!.marks = marks[1]
  }
}

/** Walks rows and marks each changed block (removals followed by additions). */
function markChanges(rows: DiffRow[]) {
  let dels: DiffLine[] = []
  let adds: DiffLine[] = []
  const flush = () => {
    if (dels.length && adds.length) markBlock(dels, adds)
    dels = []
    adds = []
  }
  for (const row of rows) {
    if (row.type === 'del') {
      if (adds.length) flush()
      dels.push(row)
    } else if (row.type === 'add') adds.push(row)
    else flush()
  }
  flush()
}

/** The rows of a diff between two versions of a file. */
export function diffText(before: string, after: string): DiffResult {
  const old = splitLines(before)
  const next = splitLines(after)
  // A missing final newline makes the last line differ from the same text with one, as in git.
  const key = (lines: string[], finalNewline: boolean) => (finalNewline ? lines : lines.map((l, i) => (i === lines.length - 1 ? `${l}\u0000` : l)))
  const [a, b] = intern(key(old.lines, old.finalNewline), key(next.lines, next.finalNewline))
  const pairs = matchSequences(a, b)
  const rows: DiffLine[] = []
  let i = 0
  let j = 0
  let additions = 0
  let deletions = 0
  const tail = (side: 'old' | 'new', index: number) =>
    side === 'old' ? !old.finalNewline && index === old.lines.length - 1 : !next.finalNewline && index === next.lines.length - 1
  const emit = (toI: number, toJ: number) => {
    for (; i < toI; i++, deletions++) rows.push({ type: 'del', oldNumber: i + 1, text: old.lines[i]!, ...(tail('old', i) && { noNewline: true }) })
    for (; j < toJ; j++, additions++) rows.push({ type: 'add', newNumber: j + 1, text: next.lines[j]!, ...(tail('new', j) && { noNewline: true }) })
  }
  for (let p = 0; p < pairs.length; p += 2) {
    emit(pairs[p]!, pairs[p + 1]!)
    rows.push({ type: 'context', oldNumber: i + 1, newNumber: j + 1, text: old.lines[i]!, ...(tail('old', i) && { noNewline: true }) })
    i++
    j++
  }
  emit(old.lines.length, next.lines.length)
  markChanges(rows)
  return { rows, additions, deletions }
}

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/

/** The rows of a unified diff (`git diff` output) for one file; a patch of several files shows the first. */
export function parsePatch(patch: string): DiffResult {
  const rows: DiffRow[] = []
  let additions = 0
  let deletions = 0
  let filename: string | undefined
  let oldNo = 0
  let newNo = 0
  let inHunk = false
  let files = 0
  for (const line of splitLines(patch).lines) {
    if (line.startsWith('diff --git ')) {
      if (++files > 1) break
      inHunk = false
      continue
    }
    const hunk = HUNK.exec(line)
    if (hunk) {
      oldNo = Number(hunk[1])
      newNo = Number(hunk[2])
      inHunk = true
      rows.push({ type: 'gap', header: line })
      continue
    }
    if (!inHunk) {
      const name = /^(\+\+\+|---) (?:[ab]\/)?(.+?)(?:\t.*)?$/.exec(line)
      if (name && name[2] !== '/dev/null' && (name[1] === '+++' || !filename)) filename = name[2]
      continue
    }
    const sign = line[0]
    const text = line.slice(1)
    if (sign === '+') {
      rows.push({ type: 'add', newNumber: newNo++, text })
      additions++
    } else if (sign === '-') {
      rows.push({ type: 'del', oldNumber: oldNo++, text })
      deletions++
    } else if (sign === ' ' || line === '') {
      rows.push({ type: 'context', oldNumber: oldNo++, newNumber: newNo++, text })
    } else if (sign === '\\') {
      const last = rows.at(-1)
      if (last && last.type !== 'gap') last.noNewline = true
    } else inHunk = false
  }
  markChanges(rows)
  return { rows, additions, deletions, filename }
}
