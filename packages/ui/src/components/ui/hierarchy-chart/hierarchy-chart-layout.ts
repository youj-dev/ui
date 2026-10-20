/* A tidy tree: Reingold–Tilford in Walker's form, made linear by Buchheim,
 * Jünger and Leipert ("Improving Walker's algorithm to run in linear time",
 * 2002). Every parent is centered over its children, subtrees sit as close as
 * the gaps allow without overlapping, identical subtrees are drawn
 * identically, and a small subtree between two large ones is spaced evenly.
 * Only open branches are laid out: a closed branch is a leaf here. */

export type HierarchyOrientation = 'vertical' | 'horizontal'

export interface HierarchyItem {
  id: string
  children?: readonly HierarchyItem[]
}

export interface HierarchyLayoutNode {
  id: string
  parent: string | null
  /** 0 for a root. */
  depth: number
  /** The top-left corner, before any RTL mirroring. */
  x: number
  y: number
  width: number
  height: number
  /** Position among its siblings, from 1, and how many there are. */
  pos: number
  size: number
  /** Children it has in the data, laid out or not. */
  childCount: number
  /** Everyone below it in the data. */
  descendants: number
  open: boolean
}

export interface HierarchyLayout {
  nodes: Map<string, HierarchyLayoutNode>
  /** The laid-out nodes, depth first: the order a tree is read in. */
  order: string[]
  width: number
  height: number
}

export interface HierarchyLayoutOptions {
  orientation?: HierarchyOrientation
  /** Which branches are open. Default: all. */
  isOpen?: (id: string) => boolean
  nodeWidth?: number
  nodeHeight?: number
  /** Between two siblings. */
  siblingGap?: number
  /** Between two neighbours with different parents. */
  subtreeGap?: number
  /** Between a parent and its children. */
  levelGap?: number
}

interface W {
  item: HierarchyItem | null
  parent: W | null
  children: W[]
  /** Index among siblings. */
  i: number
  depth: number
  prelim: number
  mod: number
  change: number
  shift: number
  thread: W | null
  ancestor: W
  defaultAncestor: W | null
}

const make = (item: HierarchyItem | null, parent: W | null, i: number, depth: number): W => {
  const w = { item, parent, children: [], i, depth, prelim: 0, mod: 0, change: 0, shift: 0, thread: null, defaultAncestor: null } as unknown as W
  w.ancestor = w
  return w
}

const nextLeft = (v: W) => v.children[0] ?? v.thread
const nextRight = (v: W) => v.children[v.children.length - 1] ?? v.thread

function moveSubtree(wm: W, wp: W, shift: number) {
  const change = shift / (wp.i - wm.i)
  wp.change -= change
  wp.shift += shift
  wm.change += change
  wp.prelim += shift
  wp.mod += shift
}

function executeShifts(v: W) {
  let shift = 0
  let change = 0
  for (let i = v.children.length - 1; i >= 0; i--) {
    const w = v.children[i]!
    w.prelim += shift
    w.mod += shift
    change += w.change
    shift += w.shift + change
  }
}

/** Counts every node below each item in the data, open or not. */
function countDescendants(items: readonly HierarchyItem[], into: Map<string, number>): number {
  let total = 0
  for (const item of items) {
    const below = item.children?.length ? countDescendants(item.children, into) : 0
    into.set(item.id, below)
    total += below + 1
  }
  return total
}

export function layoutHierarchy(nodes: HierarchyItem | readonly HierarchyItem[], options: HierarchyLayoutOptions = {}): HierarchyLayout {
  const { orientation = 'vertical', isOpen = () => true, nodeWidth = 216, nodeHeight = 68 } = options
  const vertical = orientation === 'vertical'
  const siblingGap = options.siblingGap ?? (vertical ? 16 : 12)
  const subtreeGap = options.subtreeGap ?? (vertical ? 32 : 24)
  const levelGap = options.levelGap ?? (vertical ? 56 : 64)
  const roots = Array.isArray(nodes) ? (nodes as readonly HierarchyItem[]) : [nodes as HierarchyItem]
  const breadth = vertical ? nodeWidth : nodeHeight
  const depthStep = (vertical ? nodeHeight : nodeWidth) + levelGap
  const descendants = new Map<string, number>()
  countDescendants(roots, descendants)

  // The forest hangs from a virtual root, so several roots are spaced like cousins.
  const top = make(null, null, 0, -1)
  const order: W[] = []
  const build = (item: HierarchyItem, parent: W, i: number) => {
    const w = make(item, parent, i, parent.depth + 1)
    order.push(w)
    if (item.children?.length && isOpen(item.id)) item.children.forEach((child, j) => w.children.push(build(child, w, j)))
    return w
  }
  roots.forEach((root, i) => top.children.push(build(root, top, i)))

  const separation = (a: W, b: W) => breadth + (a.parent === b.parent && a.parent !== top ? siblingGap : subtreeGap)

  function apportion(v: W, w: W | undefined, defaultAncestor: W): W {
    if (!w) return defaultAncestor
    let vop: W = v
    let vom: W = v.parent!.children[0]!
    let inner: W = v
    let outer: W = w
    let sip = v.mod
    let sop = v.mod
    let sim = w.mod
    let som = vom.mod
    // Walk down the facing contours of the left forest (vim) and v's subtree (vip) together.
    let vim: W | null = nextRight(outer)
    let vip: W | null = nextLeft(inner)
    while (vim && vip) {
      outer = vim
      inner = vip
      vom = nextLeft(vom)!
      vop = nextRight(vop)!
      vop.ancestor = v
      const shift = vim.prelim + sim - (vip.prelim + sip) + separation(vim, vip)
      if (shift > 0) {
        moveSubtree(vim.ancestor.parent === v.parent ? vim.ancestor : defaultAncestor, v, shift)
        sip += shift
        sop += shift
      }
      sim += vim.mod
      sip += vip.mod
      som += vom.mod
      sop += vop.mod
      vim = nextRight(outer)
      vip = nextLeft(inner)
    }
    if (vim && !nextRight(vop)) {
      vop.thread = vim
      vop.mod += sim - sop
    }
    if (vip && !nextLeft(vom)) {
      vom.thread = vip
      vom.mod += sip - som
      return v
    }
    return defaultAncestor
  }

  function firstWalk(v: W) {
    for (const child of v.children) firstWalk(child)
    const siblings = v.parent!.children
    const left = v.i ? siblings[v.i - 1] : undefined
    if (v.children.length) {
      executeShifts(v)
      const mid = (v.children[0]!.prelim + v.children[v.children.length - 1]!.prelim) / 2
      if (left) {
        v.prelim = left.prelim + separation(v, left)
        v.mod = v.prelim - mid
      } else v.prelim = mid
    } else if (left) v.prelim = left.prelim + separation(v, left)
    v.parent!.defaultAncestor = apportion(v, left, v.parent!.defaultAncestor ?? siblings[0]!)
  }

  for (const root of top.children) firstWalk(root)
  // The virtual root, laid out like any parent so its roots are spaced as subtrees.
  executeShifts(top)

  const center = new Map<W, number>()
  const secondWalk = (v: W, m: number) => {
    center.set(v, v.prelim + m)
    for (const child of v.children) secondWalk(child, m + v.mod)
  }
  for (const root of top.children) secondWalk(root, 0)

  let min = Infinity
  let max = -Infinity
  let deepest = 0
  for (const [w, c] of center) {
    min = Math.min(min, c)
    max = Math.max(max, c)
    deepest = Math.max(deepest, w.depth)
  }
  if (!order.length) return { nodes: new Map(), order: [], width: 0, height: 0 }

  const out = new Map<string, HierarchyLayoutNode>()
  for (const w of order) {
    const item = w.item!
    // The leading edge across the levels: the outermost node starts at 0.
    const across = center.get(w)! - min
    const along = w.depth * depthStep
    const siblings = w.parent === top ? roots : w.parent!.item!.children!
    out.set(item.id, {
      id: item.id,
      parent: w.parent === top ? null : w.parent!.item!.id,
      depth: w.depth,
      x: vertical ? across : along,
      y: vertical ? along : across,
      width: nodeWidth,
      height: nodeHeight,
      pos: w.i + 1,
      size: siblings.length,
      childCount: item.children?.length ?? 0,
      descendants: descendants.get(item.id) ?? 0,
      open: !!item.children?.length && isOpen(item.id),
    })
  }
  const span = max - min + breadth
  const length = deepest * depthStep + (vertical ? nodeHeight : nodeWidth)
  return { nodes: out, order: order.map((w) => w.item!.id), width: vertical ? span : length, height: vertical ? length : span }
}

/**
 * An elbow from a parent's foot to a child's head, its two corners rounded by
 * `radius`. Always the same commands (M L Q L Q L), so one path morphs into
 * another as the layout moves. `mirror` flips x for RTL.
 */
export function elbowPath(a: HierarchyLayoutNode, b: HierarchyLayoutNode, orientation: HierarchyOrientation, radius: number, mirror: (x: number) => number = (x) => x) {
  if (orientation === 'vertical') {
    const sx = mirror(a.x + a.width / 2)
    const sy = a.y + a.height
    const tx = mirror(b.x + b.width / 2)
    const ty = b.y
    const mid = (sy + ty) / 2
    const r = Math.min(radius, Math.abs(tx - sx) / 2, (ty - sy) / 2)
    const dir = Math.sign(tx - sx)
    return `M${sx} ${sy}L${sx} ${mid - r}Q${sx} ${mid} ${sx + dir * r} ${mid}L${tx - dir * r} ${mid}Q${tx} ${mid} ${tx} ${mid + r}L${tx} ${ty}`
  }
  const sx = mirror(a.x + a.width)
  const sy = a.y + a.height / 2
  const tx = mirror(b.x)
  const ty = b.y + b.height / 2
  const mid = (sx + tx) / 2
  const r = Math.min(radius, Math.abs(ty - sy) / 2, Math.abs(tx - sx) / 2)
  const dir = Math.sign(ty - sy)
  const out = Math.sign(tx - sx)
  return `M${sx} ${sy}L${mid - out * r} ${sy}Q${mid} ${sy} ${mid} ${sy + dir * r}L${mid} ${ty - dir * r}Q${mid} ${ty} ${mid + out * r} ${ty}L${tx} ${ty}`
}
