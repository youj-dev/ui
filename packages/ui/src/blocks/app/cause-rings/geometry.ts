/* The donut's arithmetic: shares of a circle, annular sectors as SVG paths. Angles
 * run clockwise from 12 o'clock, in radians. */

export const TAU = Math.PI * 2

export interface Arc {
  /** Start and end angles of the slice, after the gap is taken off each side. */
  from: number
  to: number
}

/** A point on a circle: angle 0 is straight up, increasing clockwise. */
export function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.sin(angle), cy - r * Math.cos(angle)]
}

/** One slice per value, sized by its share of the whole between `from` and `to`, with `gap` radians left off each end (a lone slice keeps its whole span). */
export function sliceArcs(values: readonly number[], from = 0, to = TAU, gap = 0): Arc[] {
  const total = values.reduce((sum, v) => sum + v, 0)
  if (total <= 0) return values.map(() => ({ from, to: from }))
  let at = from
  return values.map((value) => {
    const start = at
    at += ((to - from) * value) / total
    const trim = values.length > 1 ? Math.min(gap, (at - start) / 3) : 0
    return { from: start + trim, to: at - trim }
  })
}

const f = (n: number) => Math.round(n * 100) / 100

/** An annular sector from radius `r0` to `r1` between two angles, as a path. A full turn is drawn a hair short so it stays a sector. */
export function sectorPath(cx: number, cy: number, r0: number, r1: number, from: number, to: number): string {
  const end = Math.min(to, from + TAU - 0.0001)
  const large = end - from > Math.PI ? 1 : 0
  const [ox0, oy0] = polar(cx, cy, r1, from)
  const [ox1, oy1] = polar(cx, cy, r1, end)
  const [ix1, iy1] = polar(cx, cy, r0, end)
  const [ix0, iy0] = polar(cx, cy, r0, from)
  return `M${f(ox0)} ${f(oy0)}A${r1} ${r1} 0 ${large} 1 ${f(ox1)} ${f(oy1)}L${f(ix1)} ${f(iy1)}A${r0} ${r0} 0 ${large} 0 ${f(ix0)} ${f(iy0)}Z`
}

/** The share of the whole the `n` largest values make up, 0–1. */
export function topShare(values: readonly number[], n: number): number {
  const total = values.reduce((sum, v) => sum + v, 0)
  if (total <= 0) return 0
  return [...values].sort((a, b) => b - a).slice(0, n).reduce((sum, v) => sum + v, 0) / total
}

export interface CauseRingsContribution {
  label: string
  value: number
}

/** A cause's contributors largest first: the first `keep` ranked, the rest folded into one unranked remainder (rank 0), so the pattern a slice wears says how big a contributor it is. */
export function rankContributors(parts: readonly CauseRingsContribution[], total: number, keep = 3): (CauseRingsContribution & { rank: number })[] {
  const sorted = [...parts].sort((a, b) => b.value - a.value)
  const ranked = sorted.slice(0, keep).map((p, i) => ({ ...p, rank: i + 1 }))
  const named = ranked.reduce((sum, p) => sum + p.value, 0)
  const rest = Math.max(0, total - named)
  return rest > 0 ? [...ranked, { label: '', value: rest, rank: 0 }] : ranked
}
