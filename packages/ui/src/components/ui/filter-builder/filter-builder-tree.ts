import {
  operatorsFor,
  takesNoValue,
  type FilterField,
  type FilterGroup,
  type FilterOperator,
  type FilterRule,
  type FilterValue,
} from './filter-builder-model'

/* Edits to a filter tree, each returning a new tree. The builder's own state
 * is a copy of the applied filter in which every node has an id, so a row
 * keeps its identity (and its animation) while its neighbors change. */

type FilterNode = FilterRule | FilterGroup

let counter = 0
const newId = () => `fb${++counter}`

/** The tree with an id on every node that lacks one. */
function withIds<T extends FilterNode>(node: T): T {
  if (node.type === 'rule') return { ...node, id: node.id ?? newId() }
  return { ...node, id: node.id ?? newId(), children: node.children.map(withIds) } as T
}

/** The tree without ids, for comparing a draft with what was applied. */
function withoutIds(node: FilterNode): unknown {
  if (node.type === 'rule') return { type: node.type, field: node.field, operator: node.operator, value: node.value ?? null }
  return { type: node.type, combinator: node.combinator, children: node.children.map(withoutIds) }
}

const sameFilter = (a: FilterGroup, b: FilterGroup) => JSON.stringify(withoutIds(a)) === JSON.stringify(withoutIds(b))

/** A fresh value for an operator: the shape its editor edits. */
function emptyValue(operator: FilterOperator, type: FilterField['type']): FilterValue {
  if (takesNoValue(operator)) return null
  if (operator === 'between') return [null, null]
  if (operator === 'isAnyOf' || operator === 'hasAny' || operator === 'hasAll') return []
  if (type === 'number' || operator === 'inLast') return null
  return ''
}

function newRule(field: FilterField | undefined): FilterRule {
  const operator = field ? operatorsFor(field.type)[0]! : 'is'
  return { id: newId(), type: 'rule', field: field?.id ?? '', operator, value: field ? emptyValue(operator, field.type) : '' }
}

function newGroup(field: FilterField | undefined, combinator: FilterGroup['combinator'] = 'and'): FilterGroup {
  return { id: newId(), type: 'group', combinator, children: [newRule(field)] }
}

/** Applies `change` to the group with this id. */
function editGroup(root: FilterGroup, id: string, change: (group: FilterGroup) => FilterGroup): FilterGroup {
  if (root.id === id) return change(root)
  return { ...root, children: root.children.map((child) => (child.type === 'group' ? editGroup(child, id, change) : child)) }
}

function editRule(root: FilterGroup, id: string, change: (rule: FilterRule) => FilterRule): FilterGroup {
  return {
    ...root,
    children: root.children.map((child) => (child.type === 'rule' ? (child.id === id ? change(child) : child) : editRule(child, id, change))),
  }
}

/** A rule with its field changed: the operator and value stay when they still make sense. */
function changeField(rule: FilterRule, from: FilterField | undefined, to: FilterField): FilterRule {
  const keep = from && from.type === to.type && (to.type === 'text' || to.type === 'number' || to.type === 'date')
  if (keep) return { ...rule, field: to.id }
  const operator = operatorsFor(to.type)[0]!
  return { ...rule, field: to.id, operator, value: emptyValue(operator, to.type) }
}

function changeOperator(rule: FilterRule, operator: FilterOperator, type: FilterField['type']): FilterRule {
  const was = rule.value
  const shape = emptyValue(operator, type)
  // A list keeps its picks across the operators that take a list; a single value survives a swap with another single value.
  const value = Array.isArray(shape) === Array.isArray(was) && shape !== null && operator !== 'between' && rule.operator !== 'between' ? was : shape
  return { ...rule, operator, value }
}

/** Where a node sits: its parent group and index. */
function locate(root: FilterGroup, id: string): { parent: FilterGroup; index: number } | null {
  for (const [index, child] of root.children.entries()) {
    if (child.id === id) return { parent: root, index }
    if (child.type === 'group') {
      const found = locate(child, id)
      if (found) return found
    }
  }
  return null
}

function removeNode(root: FilterGroup, id: string): FilterGroup {
  return {
    ...root,
    children: root.children.filter((child) => child.id !== id).map((child) => (child.type === 'group' ? removeNode(child, id) : child)),
  }
}

/** The group with this id, the root included. */
function findGroup(root: FilterGroup, id: string): FilterGroup | undefined {
  if (root.id === id) return root
  for (const child of root.children) {
    if (child.type === 'group') {
      const found = findGroup(child, id)
      if (found) return found
    }
  }
  return undefined
}

/** The tree with `node` put back at `index` in the group with this id (an undone removal). */
function insertNode(root: FilterGroup, parentId: string, index: number, node: FilterNode): FilterGroup {
  return editGroup(root, parentId, (group) => ({ ...group, children: [...group.children.slice(0, index), node, ...group.children.slice(index)] }))
}

/** The tree with a nested group replaced by its children, in place. */
function ungroupNode(root: FilterGroup, id: string): FilterGroup {
  const where = locate(root, id)
  const group = where?.parent.children[where.index]
  if (!where || group?.type !== 'group') return root
  return editGroup(root, where.parent.id!, (parent) => ({
    ...parent,
    children: [...parent.children.slice(0, where.index), ...group.children, ...parent.children.slice(where.index + 1)],
  }))
}

/** A copy with new ids all the way down. */
function cloneNode<T extends FilterNode>(node: T): T {
  if (node.type === 'rule') return { ...node, id: newId(), value: Array.isArray(node.value) ? [...node.value] : node.value }
  return { ...node, id: newId(), children: node.children.map(cloneNode) } as T
}

/** The tree with a copy of the node right after it. */
function duplicateNode(root: FilterGroup, id: string): { root: FilterGroup; copy: FilterNode } | null {
  const where = locate(root, id)
  if (!where) return null
  const original = where.parent.children[where.index]!
  const copy = cloneNode(original)
  const next = editGroup(root, where.parent.id!, (group) => ({
    ...group,
    children: [...group.children.slice(0, where.index + 1), copy, ...group.children.slice(where.index + 1)],
  }))
  return { root: next, copy }
}

/** How many groups deep a node is, the root counting as 1. */
function groupDepth(root: FilterGroup, id: string, depth = 1): number {
  if (root.id === id) return depth
  for (const child of root.children) {
    if (child.type === 'group') {
      const found = groupDepth(child, id, depth + 1)
      if (found) return found
    }
  }
  return 0
}

/** The first rule that passes `test`, in reading order. */
function firstNode(group: FilterGroup, test: (rule: FilterRule) => boolean): FilterRule | undefined {
  for (const child of group.children) {
    if (child.type === 'rule') {
      if (test(child)) return child
    } else {
      const found = firstNode(child, test)
      if (found) return found
    }
  }
  return undefined
}

export {
  changeField,
  changeOperator,
  duplicateNode,
  editGroup,
  editRule,
  emptyValue,
  findGroup,
  firstNode,
  groupDepth,
  insertNode,
  locate,
  newGroup,
  newId,
  newRule,
  removeNode,
  sameFilter,
  ungroupNode,
  withIds,
  type FilterNode,
}
