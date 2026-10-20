/* Drafting conventions the geometry loaders share. */

/**
 * A dash pattern fitted to a segment `length` long: dashes about `dash`
 * long, gaps a little shorter, starting and ending on a dash, so a dashed
 * edge meets its corners crisply instead of stopping wherever the pattern
 * runs out.
 */
export function fitDash(length: number, dash: number): [number, number] {
  const n = Math.max(2, Math.round((length + dash * 0.8) / (dash * 1.8)))
  const d = length / (n + (n - 1) * 0.8)
  return [d, d * 0.8]
}
