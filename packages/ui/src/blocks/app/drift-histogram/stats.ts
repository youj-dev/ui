export interface DriftHistogramHit {
  /** How far it landed from its nominal position along X and Y, in the unit `format` reads (the demo: mm). */
  x: number
  y: number
}

export interface Cell {
  /** Grid cell of one `cell` mm, counted from the plate's low corner (0 is the cell that starts at `-limit`). */
  i: number
  j: number
  older: number
  recent: number
  out: number
}

const mean = (values: readonly number[]) => (values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0)

/** The average landing point of these hits. */
export function centroid(hits: readonly DriftHistogramHit[]): DriftHistogramHit {
  return { x: mean(hits.map((h) => h.x)), y: mean(hits.map((h) => h.y)) }
}

/** How far from nominal a hit landed. */
export const radial = (hit: DriftHistogramHit) => Math.hypot(hit.x, hit.y)

/** The distance of the hits' centroid from nominal: how far the process has drifted. */
export function offsetOf(hits: readonly DriftHistogramHit[]): number {
  return radial(centroid(hits))
}

/** The process capability for a position tolerance of diameter `tolerance`: the room left between the drift and the tolerance's radius, over three spreads of the hits (the radial spread of X and Y together). Zero without spread to measure. */
export function capability(hits: readonly DriftHistogramHit[], tolerance: number): number {
  if (hits.length < 2) return 0
  const { x, y } = centroid(hits)
  const variance = hits.reduce((sum, h) => sum + (h.x - x) ** 2 + (h.y - y) ** 2, 0) / (hits.length - 1) / 2
  const spread = Math.sqrt(variance)
  return spread > 0 ? (tolerance / 2 - offsetOf(hits)) / (3 * spread) : 0
}

/** Which hits landed outside the tolerance circle of diameter `tolerance`. */
export const isOut = (hit: DriftHistogramHit, tolerance: number) => radial(hit) > tolerance / 2

/** The hits counted per grid cell of `cell` mm across `[-limit, limit)`, split into older, recent (the last `recent` of them) and out of tolerance. A hit outside the plate is left off. */
export function binHits(hits: readonly DriftHistogramHit[], recent: number, tolerance: number, cell = 0.01, limit = 0.07): Cell[] {
  const cells = new Map<string, Cell>()
  const firstRecent = Math.max(0, hits.length - recent)
  hits.forEach((hit, index) => {
    const i = Math.floor((hit.x + limit) / cell + 1e-9)
    const j = Math.floor((hit.y + limit) / cell + 1e-9)
    const span = Math.round((2 * limit) / cell)
    if (i < 0 || j < 0 || i >= span || j >= span) return
    const key = `${i},${j}`
    const entry = cells.get(key) ?? { i, j, older: 0, recent: 0, out: 0 }
    if (isOut(hit, tolerance)) entry.out += 1
    else if (index >= firstRecent) entry.recent += 1
    else entry.older += 1
    cells.set(key, entry)
  })
  return [...cells.values()]
}
