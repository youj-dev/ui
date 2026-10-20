/** What a period's daily readings say about themselves. Indexes point into the readings. */
export interface DayStats {
  total: number
  average: number
  /** The first day with the most. */
  top: number
  /** The first day with the least. */
  quietest: number
}

export function dayStats(values: readonly number[]): DayStats | undefined {
  if (values.length === 0) return undefined
  let top = 0
  let quietest = 0
  let total = 0
  values.forEach((v, i) => {
    total += v
    if (v > values[top]!) top = i
    if (v < values[quietest]!) quietest = i
  })
  return { total, average: total / values.length, top, quietest }
}

/** The change from `previous` to `current` as a fraction (0.124 is up 12.4%); undefined when there is nothing to compare with. */
export function changeBetween(current: number, previous: number | undefined) {
  return previous === undefined || previous <= 0 ? undefined : (current - previous) / previous
}

/** `text` broken on spaces into lines of about `maxChars`, at most `maxLines` of them: what doesn't fit ends the last line in an ellipsis. */
export function wrapWords(text: string, maxChars: number, maxLines: number) {
  const lines: string[] = []
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const last = lines.length - 1
    if (last >= 0 && lines[last]!.length + 1 + word.length <= maxChars) lines[last] += ` ${word}`
    else lines.push(word)
  }
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  const tail = lines.slice(maxLines - 1).join(' ')
  kept[maxLines - 1] = `${tail.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`
  return kept
}

/**
 * Left edges for labels that want to sit centered on `centers` (ascending),
 * `widths` wide, inside 0 to `span`, with `gap` between neighbours: each is
 * nudged just far enough to clear the one before, then the row is pushed back
 * from the far edge. Undefined when they cannot all fit.
 */
export function placeAcross(centers: readonly number[], widths: readonly number[], span: number, gap: number) {
  const n = centers.length
  const left = centers.map((c, i) => Math.min(Math.max(c - widths[i]! / 2, 0), Math.max(0, span - widths[i]!)))
  for (let i = 1; i < n; i++) left[i] = Math.max(left[i]!, left[i - 1]! + widths[i - 1]! + gap)
  if (n && left[n - 1]! + widths[n - 1]! > span) {
    left[n - 1] = span - widths[n - 1]!
    for (let i = n - 2; i >= 0; i--) left[i] = Math.min(left[i]!, left[i + 1]! - gap - widths[i]!)
  }
  return n && left[0]! < 0 ? undefined : left
}

/** Every `step`-th index of `count` days: the smallest of a few calendar-friendly steps that leaves 56px between ticks when a day is `slot` px wide. */
export function tickIndexes(count: number, slot: number) {
  const step = [1, 2, 7, 14, 28].find((s) => s * slot >= 56) ?? 28
  return Array.from({ length: Math.ceil(count / step) }, (_, i) => i * step)
}
