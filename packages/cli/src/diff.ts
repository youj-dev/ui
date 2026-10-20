export interface DiffLine {
  type: '+' | '-' | ' '
  text: string
}

/** A line diff (LCS). The files a codemod touches are small, so O(n·m) is fine. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before === '' ? [] : before.replace(/\n$/, '').split('\n')
  const b = after.replace(/\n$/, '').split('\n')
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) lcs[i]![j] = a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!)
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      out.push({ type: ' ', text: a[i]! })
      i++
      j++
    } else if (i < a.length && (j === b.length || lcs[i + 1]![j]! >= lcs[i]![j + 1]!)) out.push({ type: '-', text: a[i++]! })
    else out.push({ type: '+', text: b[j++]! })
  }
  return out
}

/** The changed lines with `context` lines around each run, and "…" between runs. */
export function hunks(lines: DiffLine[], context = 1): string[] {
  const keep = new Set<number>()
  lines.forEach((line, i) => {
    if (line.type === ' ') return
    for (let k = Math.max(0, i - context); k <= Math.min(lines.length - 1, i + context); k++) keep.add(k)
  })
  const out: string[] = []
  let last = -1
  for (const i of [...keep].sort((x, y) => x - y)) {
    if (last >= 0 && i > last + 1) out.push('…')
    const line = lines[i]!
    out.push(`${line.type} ${line.text}`)
    last = i
  }
  return out
}

export function countChanges(lines: DiffLine[]): { added: number; removed: number } {
  return {
    added: lines.filter((l) => l.type === '+').length,
    removed: lines.filter((l) => l.type === '-').length,
  }
}
