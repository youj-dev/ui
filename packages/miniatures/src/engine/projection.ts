/* The isometric projection every miniature is drawn in, exactly as the lab
 * files wrote it (their output strings must match to the digit, so the ports
 * draw the same pixels). World: x runs to the lower right, y to the lower
 * left (front faces look along +y), z up; one world unit is one user unit. */

/** A world point: x, y, z. */
export type Vec3 = readonly [number, number, number]
/** A point on the drawing plane. */
export type Point = [number, number]
/** An axis-aligned box, as the lab files' parts tables list it: x, y, z, w, d, h. */
export type Part = readonly [number, number, number, number, number, number]

/** cos 30°: how far one unit along x or y moves across. */
export const C = Math.sqrt(3) / 2
/** sin 30°: how far one unit along x or y moves down. */
export const S = 0.5
/** The drawing's offset; always 0, kept because the lab files read it. */
export const OX = 0
export const OY = 0
export const NS = 'http://www.w3.org/2000/svg'

/** Projects a world point onto the drawing plane. */
export const P = (x: number, y: number, z: number): Point => [(x - y) * C + OX, (x + y) * S - z + OY]

/** An SVG `matrix()` whose origin is the world point and whose axes are (a, b) and (c, d). */
export const matrix = (a: number, b: number, c: number, d: number, x: number, y: number, z: number) =>
  `matrix(${a} ${b} ${c} ${d} ${P(x, y, z).join(' ')})`

/* Face planes: inside a group with one of these transforms, plain 2D SVG
 * (rects, circles, text) lands on that face of the box at (x, y, z). */

/** The top face at height z: u along +x, v along +y. */
export const TOP = (x: number, y: number, z: number) => matrix(C, S, -C, S, x, y, z)
/** The front face (+y): u along +x, v down. */
export const FRONT = (x: number, y: number, z: number) => matrix(C, S, 0, 1, x, y, z)
/** The right face (+x): u along −y, v down. */
export const SIDE = (x: number, y: number, z: number) => matrix(C, -S, 0, 1, x, y, z)

/** A path through world points: `M…L…`, closed with `close`. */
export const poly = (pts: readonly Vec3[], close = false) =>
  pts.map((p, i) => (i ? 'L' : 'M') + P(...p).join(',')).join(' ') + (close ? ' Z' : '')

/** The viewBox that fits every corner of these parts, with `pad` user units around. */
export function frameBox(parts: readonly Part[], pad = 28) {
  const pts = parts.flatMap(([x, y, z, w, d, h]) => [0, w].flatMap((a) => [0, d].flatMap((b) => [0, h].map((c) => P(x + a, y + b, z + c)))))
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return `${Math.min(...xs) - pad} ${Math.min(...ys) - pad} ${Math.max(...xs) - Math.min(...xs) + pad * 2} ${Math.max(...ys) - Math.min(...ys) + pad * 2}`
}
