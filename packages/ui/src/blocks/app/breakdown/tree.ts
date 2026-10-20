import type { Item, Tone } from './data'

/* The parts as one tree laid around the ring. Each level is sorted largest
 * first; past the top few, the rest fold into one Other part (`id` "other")
 * that opens like any other. Every node knows where it sits on the whole
 * ring as a span of the root, [x0, x1] from 0 to 1, its parts laid inside
 * its own span by size. Zooming in on a node is then one move: the window
 * the ring shows slides from the old node's span to the new one's, and every
 * arc, at any depth, follows. */

export interface Node {
  /** Unique: the path's ids joined by "/". */
  key: string
  /** The item's id, or "other" for the folded rest. */
  id: string
  label: string
  value: number
  previous?: number
  tone: Tone
  /** The item it stands for; none for the root and the folded rest. */
  item?: Item
  children: Node[]
  parent: Node | null
  /** The ids from the top level down to it. */
  path: string[]
  x0: number
  x1: number
}

const sum = (items: { value: number }[]) => items.reduce((t, i) => t + Math.max(0, i.value), 0)
const sumPrevious = (items: { previous?: number }[]) => (items.every((i) => i.previous !== undefined) ? items.reduce((t, i) => t + i.previous!, 0) : undefined)

function grow(parent: Node, items: Item[], top: number, other: (count: number) => string) {
  const sorted = [...items].sort((a, b) => b.value - a.value)
  // Fold the tail only when it is more than one part: "Other (1)" would hide a name for nothing.
  const kept = sorted.length > top + 1 ? sorted.slice(0, top) : sorted
  const rest = sorted.length > top + 1 ? sorted.slice(top) : []
  const whole = sum(sorted) || 1
  let at = parent.x0
  const width = parent.x1 - parent.x0
  const place = (value: number) => {
    const x0 = at
    at += (Math.max(0, value) / whole) * width
    return [x0, at] as const
  }
  kept.forEach((item, i) => {
    const [x0, x1] = place(item.value)
    const path = [...parent.path, item.id]
    const node: Node = { key: path.join('/'), id: item.id, label: item.label, value: item.value, previous: item.previous, tone: item.tone ?? (`chart-${(i % 5) + 1}` as Tone), item, children: [], parent, path, x0, x1 }
    if (item.children?.length) grow(node, item.children, top, other)
    parent.children.push(node)
  })
  if (rest.length) {
    const [x0, x1] = place(sum(rest))
    const path = [...parent.path, 'other']
    const node: Node = { key: path.join('/'), id: 'other', label: other(rest.length), value: sum(rest), previous: sumPrevious(rest), tone: 'quiet', children: [], parent, path, x0, x1 }
    grow(node, rest, top, other)
    parent.children.push(node)
  }
}

/** The tree for `items`, its root spanning the whole ring. */
export function build(items: Item[], top: number, label: string, other: (count: number) => string): Node {
  const root: Node = { key: '', id: '', label, value: sum(items), previous: sumPrevious(items), tone: 'quiet', children: [], parent: null, path: [], x0: 0, x1: 1 }
  grow(root, items, Math.max(1, top), other)
  return root
}

/** The deepest node the path reaches. */
export function find(root: Node, path: string[]) {
  let node = root
  for (const id of path) {
    const next = node.children.find((c) => c.id === id)
    if (!next) break
    node = next
  }
  return node
}

/** The node and every node above it, from the root down. */
export function trail(node: Node) {
  const out: Node[] = []
  for (let n: Node | null = node; n; n = n.parent) out.unshift(n)
  return out
}
