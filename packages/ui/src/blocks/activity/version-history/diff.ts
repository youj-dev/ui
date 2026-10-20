/* What changed between two versions of a document, word by word.
 *
 * Text is cut into tokens (words, runs of spaces, single punctuation marks)
 * and diffed with Myers' algorithm, the one git uses: the shortest edit
 * script, in O((N + M) · D) for D differences. A run of spaces kept between
 * two changes is folded into them, so "the old plan" → "a new plan" reads as
 * one replacement, not three. Blocks are matched by id: a block only in the
 * new version is inserted whole, one only in the old is deleted whole (at the
 * place it held), and a block in both is diffed word by word. */

export type Op = 'equal' | 'insert' | 'delete'
export interface Piece {
  op: Op
  text: string
}

const TOKEN = /\s+|[\p{L}\p{N}_'’-]+|[^\s\p{L}\p{N}]/gu
export const tokenize = (text: string) => text.match(TOKEN) ?? []
const isWord = (token: string) => /[\p{L}\p{N}]/u.test(token)

/** The shortest edit script from `a` to `b`, as runs of equal, deleted and inserted tokens. */
export function diffTokens(a: readonly string[], b: readonly string[]): Piece[] {
  const n = a.length
  const m = b.length
  const max = n + m
  const offset = max + 1
  const v = new Array<number>(2 * max + 3).fill(0)
  const trace: number[][] = []
  let found = false
  for (let d = 0; d <= max && !found; d++) {
    trace.push(v.slice())
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[offset + k - 1]! < v[offset + k + 1]!) ? v[offset + k + 1]! : v[offset + k - 1]! + 1
      let y = x - k
      while (x < n && y < m && a[x] === b[y]) {
        x++
        y++
      }
      v[offset + k] = x
      if (x >= n && y >= m) {
        found = true
        break
      }
    }
  }
  // Walk the trace back from the end to recover the path.
  const steps: { op: Op; token: string }[] = []
  let x = n
  let y = m
  for (let d = trace.length - 1; d >= 0 && (x > 0 || y > 0); d--) {
    const t = trace[d]!
    const k = x - y
    const prevK = k === -d || (k !== d && t[offset + k - 1]! < t[offset + k + 1]!) ? k + 1 : k - 1
    const prevX = t[offset + prevK]!
    const prevY = prevX - prevK
    while (x > prevX && y > prevY) {
      steps.push({ op: 'equal', token: a[--x]! })
      y--
    }
    if (d > 0) {
      if (x === prevX) steps.push({ op: 'insert', token: b[--y]! })
      else steps.push({ op: 'delete', token: a[--x]! })
    }
  }
  steps.reverse()
  return coalesce(steps)
}

/** Joins neighbouring tokens of one kind. A run of spaces between two parts of a replacement joins it too. */
function coalesce(steps: { op: Op; token: string }[]): Piece[] {
  const runs: Piece[] = []
  for (const { op, token } of steps) {
    const last = runs[runs.length - 1]
    if (last?.op === op) last.text += token
    else runs.push({ op, text: token })
  }
  const out: Piece[] = []
  let deleted = ''
  let inserted = ''
  let gap = ''
  const flush = () => {
    // Deletions read before insertions within one change.
    if (deleted) out.push({ op: 'delete', text: deleted })
    if (inserted) out.push({ op: 'insert', text: inserted })
    if (gap) out.push({ op: 'equal', text: gap })
    deleted = inserted = gap = ''
  }
  for (const run of runs) {
    if (run.op === 'equal') {
      // Spaces after a replacement ("old␣" → "new␣") may sit inside a longer one: hold them to see.
      if (deleted && inserted && !gap && /^\s+$/.test(run.text)) gap = run.text
      else {
        flush()
        out.push({ ...run })
      }
      continue
    }
    if (gap) {
      deleted += gap
      inserted += gap
      gap = ''
    }
    if (run.op === 'delete') deleted += run.text
    else inserted += run.text
  }
  flush()
  // Neighbouring equal runs (a held gap that ended a change) read as one.
  return out.reduce<Piece[]>((list, piece) => {
    const last = list[list.length - 1]
    if (last?.op === 'equal' && piece.op === 'equal') last.text += piece.text
    else list.push(piece)
    return list
  }, [])
}

export const diffText = (a: string, b: string) => diffTokens(tokenize(a), tokenize(b))

/** Words added and removed. */
export function wordCounts(pieces: readonly Piece[]) {
  let added = 0
  let removed = 0
  for (const piece of pieces) {
    if (piece.op === 'equal') continue
    const words = tokenize(piece.text).filter(isWord).length
    if (piece.op === 'insert') added += words
    else removed += words
  }
  return { added, removed }
}

export interface DocBlock {
  id: string
  type?: 'heading' | 'paragraph'
  text: string
}

export interface BlockDiff {
  id: string
  type?: 'heading' | 'paragraph'
  /** The whole block is new, or gone, or its words changed. */
  change: 'inserted' | 'deleted' | 'changed' | null
  pieces: Piece[]
}

/** Block by block: the new version's order, with deleted blocks where they stood. */
export function diffBlocks(before: readonly DocBlock[], after: readonly DocBlock[]): BlockDiff[] {
  const old = new Map(before.map((b) => [b.id, b]))
  const kept = new Set(after.map((b) => b.id))
  const out: BlockDiff[] = []
  const gone = (from: number, to: number) => {
    for (const block of before.slice(from, to)) {
      if (!kept.has(block.id)) out.push({ id: block.id, type: block.type, change: 'deleted', pieces: [{ op: 'delete', text: block.text }] })
    }
  }
  let cursor = 0
  for (const block of after) {
    const prior = old.get(block.id)
    if (prior) {
      const at = before.indexOf(prior)
      gone(cursor, at)
      cursor = Math.max(cursor, at + 1)
      const pieces = prior.text === block.text ? [{ op: 'equal' as const, text: block.text }] : diffText(prior.text, block.text)
      out.push({ id: block.id, type: block.type, change: pieces.some((p) => p.op !== 'equal') ? 'changed' : null, pieces })
    } else out.push({ id: block.id, type: block.type, change: 'inserted', pieces: [{ op: 'insert', text: block.text }] })
  }
  gone(cursor, before.length)
  return out
}

/** Properties whose value changed, was added or was removed. */
export function diffProperties(before: Record<string, string> = {}, after: Record<string, string> = {}) {
  const keys = [...new Set([...Object.keys(after), ...Object.keys(before)])]
  return keys.filter((key) => before[key] !== after[key]).map((key) => ({ key, from: before[key], to: after[key] }))
}
