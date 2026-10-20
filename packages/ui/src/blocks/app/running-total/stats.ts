/** The running total at the end of each day. */
export function cumulative(values: readonly number[]) {
  let sum = 0
  return values.map((v) => (sum += v))
}

/** The first day (an index) the running total reaches `target`; undefined if it never does. */
export function passedAt(running: readonly number[], target: number) {
  const i = running.findIndex((v) => v >= target)
  return i < 0 ? undefined : i
}

/** The first day with the most. Undefined without days. */
export function bestDay(values: readonly number[]) {
  if (values.length === 0) return undefined
  return values.reduce((best, v, i) => (v > values[best]! ? i : best), 0)
}

/** The change from `previous` to `current` as a fraction (0.124 is up 12.4%); undefined when there is nothing to compare with. */
export function changeBetween(current: number, previous: number | undefined) {
  return previous === undefined || previous <= 0 ? undefined : (current - previous) / previous
}

export interface GapPoint {
  /** A day, fractional where the lines cross. */
  x: number
  current: number
  previous: number
}

export interface Gap {
  /** The current line is above the previous one across it. */
  ahead: boolean
  points: GapPoint[]
}

/**
 * The stretches between two running totals over the days they share, each
 * wholly ahead or wholly behind: where the lines cross, one stretch ends on
 * the crossing and the next starts there.
 */
export function gaps(current: readonly number[], previous: readonly number[]): Gap[] {
  const n = Math.min(current.length, previous.length)
  const out: Gap[] = []
  let run: Gap | undefined
  const push = (point: GapPoint, ahead: boolean) => {
    if (!run || run.ahead !== ahead) out.push((run = { ahead, points: [] }))
    run.points.push(point)
  }
  for (let i = 0; i < n; i++) {
    const here = { x: i, current: current[i]!, previous: previous[i]! }
    const side = here.current - here.previous
    const before = i > 0 ? current[i - 1]! - previous[i - 1]! : 0
    if (i > 0 && before !== 0 && side !== 0 && before > 0 !== side > 0) {
      const t = before / (before - side)
      const mid = {
        x: i - 1 + t,
        current: current[i - 1]! + t * (here.current - current[i - 1]!),
        previous: previous[i - 1]! + t * (here.previous - previous[i - 1]!),
      }
      push(mid, before > 0)
      push(mid, side > 0)
    }
    // A tie takes the side of the stretch it sits in.
    push(here, side === 0 ? (run?.ahead ?? true) : side > 0)
  }
  return out.filter((g) => g.points.length > 1)
}

/** Positions for labels that want to sit at `ys` (ascending), `gap` apart at least, kept within `min` to `max`: nudged symmetrically where they crowd. */
export function spreadLabels(ys: readonly number[], gap: number, min: number, max: number) {
  const out = ys.map((y) => Math.min(max, Math.max(min, y)))
  for (let pass = 0; pass < 8; pass++) {
    let moved = false
    for (let i = 1; i < out.length; i++) {
      const short = out[i - 1]! + gap - out[i]!
      if (short > 0.01) {
        out[i - 1] = out[i - 1]! - short / 2
        out[i] = out[i]! + short / 2
        moved = true
      }
    }
    if (out.length && out[0]! < min) {
      const by = min - out[0]!
      for (let i = 0; i < out.length; i++) out[i] = out[i]! + by
    }
    if (out.length && out[out.length - 1]! > max) {
      const by = out[out.length - 1]! - max
      for (let i = 0; i < out.length; i++) out[i] = out[i]! - by
    }
    if (!moved) break
  }
  return out
}

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

/** Whether any part of the polyline, widened by `pad`, falls inside `rect`. */
export function rectHitsLine(rect: Rect, line: readonly { x: number; y: number }[], pad = 0) {
  const inside = (x: number, y: number) => x >= rect.left - pad && x <= rect.left + rect.width + pad && y >= rect.top - pad && y <= rect.top + rect.height + pad
  for (let i = 0; i < line.length; i++) {
    const a = line[i]!
    const b = line[i + 1] ?? a
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2))
    for (let s = 0; s <= steps; s++) if (inside(a.x + ((b.x - a.x) * s) / steps, a.y + ((b.y - a.y) * s) / steps)) return true
  }
  return false
}

/** The first of `candidates` that lies within `bounds` and clear of every line; the first of those within bounds when none is clear. */
export function clearSpot(candidates: readonly Rect[], lines: readonly (readonly { x: number; y: number }[])[], bounds: Rect, pad = 4) {
  const within = candidates.filter((r) => r.left >= bounds.left && r.top >= bounds.top && r.left + r.width <= bounds.left + bounds.width && r.top + r.height <= bounds.top + bounds.height)
  return within.find((r) => !lines.some((line) => rectHitsLine(r, line, pad))) ?? within[0] ?? candidates[0]
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

/** Every `step`-th index of `count` days: the smallest of a few calendar-friendly steps that leaves 56px between ticks when a day is `slot` px wide. */
export function tickIndexes(count: number, slot: number) {
  const step = [1, 2, 7, 14, 28].find((s) => s * slot >= 56) ?? 28
  return Array.from({ length: Math.ceil(count / step) }, (_, i) => i * step)
}
