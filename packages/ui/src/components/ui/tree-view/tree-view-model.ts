import type { ReactNode } from 'react'

/* The tree as data: an index for O(1) lookups, the visible order the keyboard
 * walks (and the DOM follows), and tri-state checking. No React here. */

export interface TreeNode {
  id: string
  name: string
  /** A branch's children. Leave undefined with `hasChildren` for a branch that loads them lazily. */
  children?: TreeNode[]
  /** The node is a branch whose children haven't been loaded yet (see `loadChildren`). */
  hasChildren?: boolean
  /** Replaces the file-type icon. */
  icon?: ReactNode
  /** Trailing content: a status letter, a count. Decorative; put anything it says into `description`. */
  meta?: ReactNode
  /** Announced after the name, e.g. "modified". */
  description?: string
  disabled?: boolean
}

export interface NodeInfo {
  node: TreeNode
  parent: string | null
  /** 1-based, as aria-level. */
  level: number
  /** 1-based position among its siblings, as aria-posinset. */
  pos: number
  size: number
}

export const isBranch = (node: TreeNode) => node.children !== undefined || node.hasChildren === true

export function indexTree(data: TreeNode[]) {
  const index = new Map<string, NodeInfo>()
  const walk = (nodes: TreeNode[], parent: string | null, level: number) => {
    nodes.forEach((node, i) => {
      index.set(node.id, { node, parent, level, pos: i + 1, size: nodes.length })
      if (node.children) walk(node.children, node.id, level + 1)
    })
  }
  walk(data, null, 1)
  return index
}

/** A row in visible order: a node, or the retry row of a branch whose children failed to load. */
export type VisibleRow = { kind: 'node'; id: string } | { kind: 'retry'; id: string; parent: string }

export const retryId = (parent: string) => `${parent}::retry`

export function visibleRows(data: TreeNode[], expanded: ReadonlySet<string>, failed: ReadonlySet<string>) {
  const rows: VisibleRow[] = []
  const walk = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      rows.push({ kind: 'node', id: node.id })
      if (!expanded.has(node.id)) continue
      if (node.children) walk(node.children)
      else if (failed.has(node.id)) rows.push({ kind: 'retry', id: retryId(node.id), parent: node.id })
    }
  }
  walk(data)
  return rows
}

export type CheckState = boolean | 'mixed'

/** Every node's check state in one post-order pass: a branch with loaded children is derived from them. */
export function checkStates(data: TreeNode[], selected: ReadonlySet<string>) {
  const states = new Map<string, CheckState>()
  // A selected branch selects everything inside it, so `selected` may name just the branch.
  const walk = (node: TreeNode, inherited = false): CheckState => {
    const own = inherited || selected.has(node.id)
    let state: CheckState = own
    if (node.children && node.children.length > 0) {
      const kids = node.children.map((child) => walk(child, own))
      state = kids.every((s) => s === true) ? true : kids.some((s) => s !== false) ? 'mixed' : false
    }
    states.set(node.id, state)
    return state
  }
  data.forEach((node) => walk(node))
  return states
}

/** Checks or unchecks a node with its loaded descendants, then brings every ancestor in line. */
export function toggleCheck(id: string, index: Map<string, NodeInfo>, states: Map<string, CheckState>, selected: ReadonlySet<string>) {
  // Start from the explicit form (every checked node named), so implied children can be unchecked one by one.
  const next = new Set([...selected].filter((id) => !index.has(id)))
  for (const [nodeId, state] of states) if (state === true) next.add(nodeId)
  const on = states.get(id) !== true
  const apply = (node: TreeNode) => {
    if (on) next.add(node.id)
    else next.delete(node.id)
    node.children?.forEach(apply)
  }
  const info = index.get(id)
  if (!info) return next
  apply(info.node)
  for (let parent = info.parent; parent; parent = index.get(parent)?.parent ?? null) {
    const branch = index.get(parent)!.node
    if (branch.children!.every((c) => next.has(c.id))) next.add(parent)
    else next.delete(parent)
  }
  return next
}

/** The ids of a node's ancestors, nearest first. */
export function ancestorsOf(id: string, index: Map<string, NodeInfo>) {
  const out: string[] = []
  for (let parent = index.get(id)?.parent ?? null; parent; parent = index.get(parent)?.parent ?? null) out.push(parent)
  return out
}
