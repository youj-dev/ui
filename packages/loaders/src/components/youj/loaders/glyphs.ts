/* The youj letterforms the loaders draw with, on the wordmark's 24-unit
 * grid (the same outlines as docs/brand/logo.ts, which a test holds them to),
 * and a sampler that spaces points evenly along an outline. */

/** The o: its outer outline, then its counter. */
export const O_OUTER =
  'M14.24 8.57H18.93C20.32 8.57 21.52 9.32 21.52 11.77V16.8C21.52 19.25 20.32 20 18.93 20H14.24C12.85 20 11.65 19.25 11.65 16.8V11.77C11.65 9.32 12.85 8.57 14.24 8.57Z'
export const O_INNER =
  'M14.39 10.52C13.94 10.52 13.84 10.92 13.84 11.72V16.85C13.84 17.65 13.94 18.05 14.39 18.05H18.78C19.23 18.05 19.33 17.65 19.33 16.85V11.72C19.33 10.92 19.23 10.52 18.78 10.52Z'
/** The o's box on the grid. */
export const O_BOX = { x: 11.65, y: 8.57, w: 9.87, h: 11.43 }

/** The word's letters in reading order, each as its outlines (the o has two: its outline and its counter). */
export const WORDMARK: { letter: string; outlines: string[] }[] = [
  {
    letter: 'y',
    outlines: [
      'M0 8.57H2.19V15.6C2.19 16.4 2.29 16.8 2.74 16.8H7.13C7.58 16.8 7.68 16.4 7.68 15.6V8.57H9.87V20.8C9.87 23.25 8.67 24 7.28 24H4.28V22.05H7.13C7.58 22.05 7.68 21.65 7.68 20.85V18.75H2.59C1.2 18.75 0 18 0 15.55Z',
    ],
  },
  { letter: 'o', outlines: [O_OUTER, O_INNER] },
  {
    letter: 'u',
    outlines: [
      'M23.27 8.57H25.46V16.85C25.46 17.65 25.56 18.05 26.01 18.05H30.4C30.85 18.05 30.95 17.65 30.95 16.85V8.57H33.14V16.8C33.14 19.25 31.94 20 30.55 20H25.86C24.47 20 23.27 19.25 23.27 16.8Z',
    ],
  },
  { letter: 'j', outlines: ['M35.2 8.57H37.39V20.8C37.39 23.25 36.19 24 34.8 24H31.8V22.05H34.65C35.1 22.05 35.2 21.65 35.2 20.85Z'] },
]
/** The word's box on the grid, ascender to descender, and the j's square tittle as the wordmark draws it at display sizes. */
export const WORDMARK_BOX = { x: 0, y: 4, w: 37.39, h: 20 }
export const TITTLE = { x: 35.13, y: 4, size: 2.33 }

type Pt = [number, number]

/** An absolute path (M, H, V, C, Z only) as a polyline, each curve cut into `steps` straight pieces. */
export function flatten(d: string, steps = 16): Pt[] {
  const tokens = d.match(/[MHVCZ]|-?\d*\.?\d+/g) ?? []
  const pts: Pt[] = []
  let at: Pt = [0, 0]
  let start: Pt = [0, 0]
  let i = 0
  const num = () => parseFloat(tokens[i++]!)
  while (i < tokens.length) {
    const cmd = tokens[i++]
    if (cmd === 'M') {
      at = [num(), num()]
      start = at
      pts.push(at)
    } else if (cmd === 'H') {
      at = [num(), at[1]]
      pts.push(at)
    } else if (cmd === 'V') {
      at = [at[0], num()]
      pts.push(at)
    } else if (cmd === 'C') {
      const c1: Pt = [num(), num()]
      const c2: Pt = [num(), num()]
      const end: Pt = [num(), num()]
      const from = at
      for (let s = 1; s <= steps; s++) {
        const u = s / steps
        const v = 1 - u
        pts.push([
          v * v * v * from[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * end[0],
          v * v * v * from[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * end[1],
        ])
      }
      at = end
    } else if (cmd === 'Z') {
      if (at[0] !== start[0] || at[1] !== start[1]) pts.push(start)
      at = start
    }
  }
  return pts
}

/** `n` points spaced evenly along a closed outline, starting where it starts. */
export function sampleOutline(d: string, n: number): Pt[] {
  const line = flatten(d)
  const lengths = [0]
  for (let i = 1; i < line.length; i++) lengths.push(lengths[i - 1]! + Math.hypot(line[i]![0] - line[i - 1]![0], line[i]![1] - line[i - 1]![1]))
  const total = lengths[lengths.length - 1]!
  const out: Pt[] = []
  let j = 1
  for (let k = 0; k < n; k++) {
    const at = (k / n) * total
    while (j < lengths.length - 1 && lengths[j]! < at) j++
    const a = line[j - 1]!
    const b = line[j]!
    const u = (at - lengths[j - 1]!) / (lengths[j]! - lengths[j - 1]! || 1)
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u])
  }
  return out
}
