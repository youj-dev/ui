import { placeOf, type HubMapHub } from './data'
import { GRID } from './land'

const W = GRID.cols
const H = GRID.rows

/** An arc from a to b in map units, bowed toward the pole by a fifth of its length: its path, length and midpoint heading. */
export function arcOf(a: HubMapHub, b: HubMapHub) {
  const p = placeOf(a.lng, a.lat)
  const q = placeOf(b.lng, b.lat)
  const [x1, y1, x2, y2] = [p.x * W, p.y * H, q.x * W, q.y * H]
  const [dx, dy] = [x2 - x1, y2 - y1]
  const len = Math.hypot(dx, dy) || 1
  let [nx, ny] = [dy / len, -dx / len]
  if (ny > 0) [nx, ny] = [-nx, -ny]
  const [cx, cy] = [(x1 + x2) / 2 + nx * len * 0.2, (y1 + y2) / 2 + ny * len * 0.2]
  const at = (t: number) => [(1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2, (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2] as const
  let length = 0
  for (let i = 1; i <= 16; i++) length += Math.hypot(at(i / 16)[0] - at((i - 1) / 16)[0], at(i / 16)[1] - at((i - 1) / 16)[1])
  const [mx, my] = at(0.5)
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
  return {
    d: `M${x1.toFixed(2)} ${y1.toFixed(2)}Q${cx.toFixed(2)} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    length,
    mid: [mx, my] as const,
    angle,
  }
}
