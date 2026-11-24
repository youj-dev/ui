/* The JSON viewer's rows, read from the value as they open: a value's children
 * are worked out when its row first shows them, never ahead, so a payload of
 * any size costs only the rows on screen. An array of more than a hundred
 * items opens onto ranges of a hundred ("[0 … 99]"), or of ten thousand and
 * then a hundred for longer ones, so no row ever holds more than a hundred
 * others. A string longer than the clip opens onto its whole text. A value
 * that holds itself shows as circular instead of opening forever. No React
 * here: the component renders what this returns. */

/** Where a value sits in the root: keys and array indexes, outermost first. */
export type JsonPath = readonly (string | number)[]

/** What a value is, as JSON names it (`undefined` also stands in for anything JSON can't hold). */
export type JsonType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'undefined'

/** The most rows one row opens onto: a big array's items come in ranges of this many. */
export const PAGE = 100

export interface JsonNode {
  /** Unique in the tree, and the same for the same path from one value to the next. */
  id: string
  /** A short number, unique in the model, for element ids. */
  serial: number
  /** A value; a range of a big array's items; or a long string's whole text. */
  kind: 'value' | 'range' | 'text'
  /** The value's path. A range has its array's, a text its string's. */
  path: JsonPath
  /** The value's key in its object, its index in its array, or null at the root. */
  key: string | number | null
  /** The value (after `toJSON`, as JSON.stringify reads it). A range holds its array. */
  value: unknown
  type: JsonType
  /** 1 for the rows at the top. */
  level: number
  /** The row this one sits in, or null at the top. */
  parent: string | null
  /** Keys in an object, items in an array or a range, characters in a string. */
  size: number
  /** A range's first and last index. */
  from: number
  to: number
  /** The value holds itself here: shown as circular and never opened. */
  circular: boolean
  /** The objects from the root down to this one, to spot a value that holds itself. */
  seen: readonly object[]
}

export interface JsonModel {
  /** The rows at the top: the root's keys or items, or the root itself when it holds nothing. */
  roots: JsonNode[]
  /** The rows a row opens onto, worked out the first time they're asked for. */
  children: (node: JsonNode) => JsonNode[]
  /** Whether a row opens: an object or array with something in it, a range, or a string longer than the clip. */
  expandable: (node: JsonNode) => boolean
  /** A row met so far, by id. */
  get: (id: string) => JsonNode | undefined
}

/** JSON.stringify's view of a value: a Date becomes its ISO string. */
function read(raw: unknown): unknown {
  if (raw !== null && typeof raw === 'object' && typeof (raw as { toJSON?: unknown }).toJSON === 'function') {
    try {
      return (raw as { toJSON: () => unknown }).toJSON()
    } catch {
      return raw
    }
  }
  return raw
}

export function typeOf(value: unknown): JsonType {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  switch (typeof value) {
    case 'object':
      return 'object'
    case 'string':
      return 'string'
    case 'number':
    case 'bigint':
      return 'number'
    case 'boolean':
      return 'boolean'
    default:
      return 'undefined'
  }
}

function sizeOf(value: unknown, type: JsonType): number {
  if (type === 'array') return (value as unknown[]).length
  if (type === 'object') return Object.keys(value as object).length
  if (type === 'string') return (value as string).length
  return 0
}

/** The rows of a JSON value. `clip` is the longest string shown whole. */
export function jsonModel(root: unknown, clip: number): JsonModel {
  const nodes = new Map<string, JsonNode>()
  const childCache = new Map<string, JsonNode[]>()
  let serial = 0
  const keep = (node: Omit<JsonNode, 'serial'>): JsonNode => {
    const kept = { ...node, serial: serial++ }
    nodes.set(kept.id, kept)
    return kept
  }

  const valueNode = (parent: JsonNode | null, key: string | number | null, raw: unknown, path: JsonPath, level: number): JsonNode => {
    const value = read(raw)
    const type = typeOf(value)
    const seen = parent?.seen ?? []
    const object = type === 'object' || type === 'array'
    const circular = object && seen.includes(value as object)
    return keep({
      id: `v${JSON.stringify(path)}`,
      kind: 'value',
      path,
      key,
      value,
      type,
      level,
      parent: parent?.id ?? null,
      size: circular ? 0 : sizeOf(value, type),
      from: 0,
      to: 0,
      circular,
      seen: object && !circular ? [...seen, value as object] : seen,
    })
  }

  /** A run of an array's items: the items themselves, or ranges of them when there are more than a page. */
  const items = (parent: JsonNode, array: readonly unknown[], from: number, to: number, path: JsonPath, level: number): JsonNode[] => {
    const count = to - from + 1
    const out: JsonNode[] = []
    if (count <= PAGE) {
      for (let i = from; i <= to; i++) out.push(valueNode(parent, i, array[i], [...path, i], level))
      return out
    }
    let span = PAGE
    while (span * PAGE < count) span *= PAGE
    for (let start = from; start <= to; start += span) {
      const end = Math.min(start + span - 1, to)
      out.push(
        keep({
          id: `r${start}:${end}${JSON.stringify(path)}`,
          kind: 'range',
          path,
          key: null,
          value: array,
          type: 'array',
          level,
          parent: parent.id,
          size: end - start + 1,
          from: start,
          to: end,
          circular: false,
          seen: parent.seen,
        }),
      )
    }
    return out
  }

  const expandable = (node: JsonNode) => {
    if (node.kind === 'range') return true
    if (node.kind === 'text' || node.circular) return false
    if (node.type === 'string') return node.size > clip
    return (node.type === 'object' || node.type === 'array') && node.size > 0
  }

  const children = (node: JsonNode): JsonNode[] => {
    const cached = childCache.get(node.id)
    if (cached) return cached
    let out: JsonNode[] = []
    const level = node.level + 1
    if (node.kind === 'range') out = items(node, node.value as unknown[], node.from, node.to, node.path, level)
    else if (!expandable(node)) out = []
    else if (node.type === 'array') out = items(node, node.value as unknown[], 0, node.size - 1, node.path, level)
    else if (node.type === 'object') {
      const object = node.value as Record<string, unknown>
      out = Object.keys(object).map((key) => valueNode(node, key, object[key], [...node.path, key], level))
    } else if (node.type === 'string') {
      out = [keep({ ...node, id: `t${JSON.stringify(node.path)}`, kind: 'text', level, parent: node.id })]
    }
    childCache.set(node.id, out)
    return out
  }

  // The root opens onto its keys or items; one that holds nothing (or isn't an object) is the only row.
  const top = valueNode(null, null, root, [], 0)
  nodes.delete(top.id)
  const holds = (top.type === 'object' || top.type === 'array') && top.size > 0
  const roots = holds ? children(top).map((node) => keep({ ...node, parent: null })) : [keep({ ...top, level: 1 })]

  return { roots, children, expandable, get: (id) => nodes.get(id) }
}

/** The rows on show, top to bottom, given which are open. */
export function visibleRows(model: JsonModel, isOpen: (node: JsonNode) => boolean): JsonNode[] {
  const rows: JsonNode[] = []
  const walk = (nodes: readonly JsonNode[]) => {
    for (const node of nodes) {
      rows.push(node)
      if (model.expandable(node) && isOpen(node)) walk(model.children(node))
    }
  }
  walk(model.roots)
  return rows
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

/** A path as JavaScript reads it: `request.headers["content-type"]`, `items[0].id`. */
export function formatPath(path: JsonPath): string {
  return path
    .map((key, i) => (typeof key === 'number' ? `[${key}]` : IDENTIFIER.test(key) ? (i ? `.${key}` : key) : `[${JSON.stringify(key)}]`))
    .join('')
}

/** JSON text, two-space indented, that never throws: a value that holds itself reads "[Circular]" there, a bigint its digits. */
export function toJson(value: unknown): string {
  const stack: unknown[] = []
  const text = JSON.stringify(
    value,
    function (this: unknown, _key: string, current: unknown) {
      if (typeof current === 'bigint') return current.toString()
      if (current === null || typeof current !== 'object') return current
      // The stack holds the objects above this one: drop the ones whose turn is over.
      while (stack.length && stack[stack.length - 1] !== this) stack.pop()
      if (stack.includes(current)) return '[Circular]'
      stack.push(current)
      return current
    },
    2,
  )
  return text ?? literal(value)
}

/** A value that isn't an object or a string, as text. */
export function literal(value: unknown): string {
  if (typeof value === 'function') return `ƒ ${value.name}()`
  return String(value)
}

/** A string in quotes and escaped, as JSON writes it, cut to `clip` characters with an ellipsis before the closing quote. */
export function quote(text: string, clip: number): string {
  if (text.length <= clip) return JSON.stringify(text)
  let end = Math.max(0, clip)
  // Never cut a character drawn with two code units in half.
  const code = text.charCodeAt(end - 1)
  if (code >= 0xd800 && code <= 0xdbff) end -= 1
  return `${JSON.stringify(text.slice(0, end)).slice(0, -1)}…"`
}

/** An object's key as shown: bare when it reads plainly, in quotes when it's empty, padded or holds characters JSON escapes. */
export function showKey(key: string): string {
  const quoted = JSON.stringify(key)
  return key !== '' && key.trim() === key && quoted === `"${key}"` ? key : quoted
}

/** What copying a row gives: a string as it is, an object or array as JSON, anything else as written. */
export function copyText(node: JsonNode): string {
  if (node.kind === 'range') return toJson((node.value as unknown[]).slice(node.from, node.to + 1))
  if (node.type === 'string') return node.value as string
  if (node.type === 'object' || node.type === 'array') return toJson(node.value)
  return literal(node.value)
}
