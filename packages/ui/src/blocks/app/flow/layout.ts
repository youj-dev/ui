import type { Node, Path } from './data'

/* The sankey's geometry, in pixels down and in thousandths across (the
 * ribbons' layer stretches to the room between the label gutters). Every
 * node is as tall as the paths through it, its stage's nodes stacked in the
 * order given with a gap and centred; the scale is the one that fits the
 * fullest stage. Each path is a ribbon of its own through every stage, in
 * its first node's colour: it leaves a node in the order of where it goes
 * and arrives in the order of where it came from (both then by its first
 * node), so ribbons cross as little as they can and a path changes place
 * only behind a node's bar. */

export interface Box {
  node: Node
  /** Its place in its stage. */
  index: number
  value: number
  y: number
  h: number
}

export interface Piece {
  /** Its path's key and its stage: stable across ranges, so a new range morphs it. */
  key: string
  /** Its path: an index into `paths`. */
  path: number
  origin: string
  from: string
  to: string
  stage: number
  value: number
  /** Its top where it leaves `from` and where it reaches `to`, and its thickness. */
  sy: number
  ty: number
  h: number
}

export interface Layout {
  boxes: Map<string, Box>
  /** The paths drawn: valid, merged by route, in the order given. */
  paths: Path[]
  pieces: Piece[]
  /** What flowed into the first stage. */
  total: number
}

const sum = (values: number[]) => values.reduce((t, v) => t + v, 0)
/** Two keys in order: the first place they differ decides. */
function compare(a: number[], b: number[]) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i]! - b[i]!
  return 0
}

export function layout(nodes: Node[], given: Path[], stages: number, height: number, gap: number): Layout {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  // Routes that follow the stages from the first, merged when one is given twice.
  const routes = new Map<string, Path>()
  for (const p of given) {
    if (!(p.value > 0) || p.steps.length === 0 || !p.steps.every((id, i) => byId.get(id)?.stage === i)) continue
    const key = p.steps.join('>')
    const seen = routes.get(key)
    routes.set(key, { steps: p.steps, value: (seen?.value ?? 0) + p.value })
  }
  const paths = [...routes.values()]
  const through = new Map<string, number>()
  for (const p of paths) for (const id of p.steps) through.set(id, (through.get(id) ?? 0) + p.value)

  const columns = Array.from({ length: stages }, (_, s) => nodes.filter((n) => n.stage === s))
  const scale = Math.min(...columns.map((col) => (height - Math.max(0, col.length - 1) * gap) / Math.max(1, sum(col.map((n) => through.get(n.id) ?? 0)))))
  const boxes = new Map<string, Box>()
  for (const col of columns) {
    const tall = sum(col.map((n) => (through.get(n.id) ?? 0) * scale)) + Math.max(0, col.length - 1) * gap
    let y = (height - tall) / 2
    col.forEach((node, index) => {
      const value = through.get(node.id) ?? 0
      boxes.set(node.id, { node, index, value, y, h: value * scale })
      y += value * scale + gap
    })
  }

  const order = (id: string) => boxes.get(id)?.index ?? 0
  const pieces: Piece[] = paths.flatMap((p, path) =>
    p.steps.slice(0, -1).map((from, stage) => ({
      key: `${p.steps.join('>')}#${stage}`,
      path,
      origin: p.steps[0]!,
      from,
      to: p.steps[stage + 1]!,
      stage,
      value: p.value,
      sy: 0,
      ty: 0,
      h: p.value * scale,
    })),
  )
  // Stack each node's leaving pieces by where they go, its arriving ones by where they came from; then by first node, then as given.
  const stack = (side: 'from' | 'to', by: (p: Piece) => number[]) => {
    const groups = new Map<string, Piece[]>()
    for (const piece of pieces) groups.set(piece[side], [...(groups.get(piece[side]) ?? []), piece])
    for (const [id, group] of groups) {
      let y = boxes.get(id)?.y ?? 0
      group
        .sort((a, b) => compare(by(a), by(b)))
        .forEach((piece) => {
          if (side === 'from') piece.sy = y
          else piece.ty = y
          y += piece.h
        })
    }
  }
  stack('from', (p) => [order(p.to), order(p.origin), p.path])
  stack('to', (p) => [order(p.from), order(p.origin), p.path])

  const total = sum(paths.map((p) => p.value))
  return { boxes, paths, pieces, total }
}

/** The pieces by bundle (one first node, one step), each bundle's in their stacking order, which is the same at both ends. */
export function bundlesOf(pieces: Piece[]) {
  const bundles = new Map<string, Piece[]>()
  for (const p of pieces) {
    const key = `${p.stage}:${p.origin}>${p.from}>${p.to}`
    bundles.set(key, [...(bundles.get(key) ?? []), p])
  }
  return [...bundles.entries()].map(([key, group]) => ({ key, pieces: group.sort((a, b) => a.path - b.path) }))
}

/** Neighbouring pieces as one ribbon: the first's place, their thickness together. */
export const run = (pieces: Piece[]): Piece => ({ ...pieces[0]!, h: pieces.reduce((t, p) => t + p.h, 0), value: pieces.reduce((t, p) => t + p.value, 0) })

/** The runs of neighbours among `pieces` that pass `test`. */
export function runs(pieces: Piece[], test: (p: Piece) => boolean) {
  const out: Piece[][] = []
  let current: Piece[] = []
  for (const p of pieces) {
    if (test(p)) current.push(p)
    else if (current.length) {
      out.push(current)
      current = []
    }
  }
  if (current.length) out.push(current)
  return out
}

/** A ribbon from one stage to the next, in the stretched layer's units: thousandths across, pixels down. */
export function ribbon(piece: Piece, stages: number) {
  const x0 = (1000 * piece.stage) / Math.max(1, stages - 1)
  const x1 = (1000 * (piece.stage + 1)) / Math.max(1, stages - 1)
  const xm = (x0 + x1) / 2
  const { sy, ty, h } = piece
  const n = (v: number) => v.toFixed(2)
  return `M${n(x0)},${n(sy)} C${n(xm)},${n(sy)} ${n(xm)},${n(ty)} ${n(x1)},${n(ty)} L${n(x1)},${n(ty + h)} C${n(xm)},${n(ty + h)} ${n(xm)},${n(sy + h)} ${n(x0)},${n(sy + h)} Z`
}
