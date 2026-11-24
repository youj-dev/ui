'use client'

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { Collapse } from '@youj/motion'
import { ChevronRightIcon } from '@youj/icons/components/youj/icons/chevron-right'
import { ChevronsUpDownIcon } from '@youj/icons/components/youj/icons/chevrons-up-down'
import { CopyIcon } from '@youj/icons/components/youj/icons/copy'
import { RouteIcon } from '@youj/icons/components/youj/icons/route'
import { useYouj } from '@youj/core/lib/youj/provider'
import { jsonViewerLabels, useComponentLabels } from '@youj/core/labels'
import { useLiveRegion } from '../../../hooks/use-announcer'
import { cn } from '../../../lib/utils'
import { Button } from '../button'
import { tokenClass, useCopyText } from '../code-block/code-block'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip'
import { copyText, formatPath, jsonModel, literal, quote, showKey, toJson, visibleRows, type JsonModel, type JsonNode, type JsonPath } from './json-viewer-model'

/* A JSON value as a tree that opens and closes: keys and typed values in
 * CodeBlock's palette, objects and arrays counted ("{4}", "[12]"), strings
 * longer than `collapseStringsAfter` cut short until opened onto their whole
 * text, and arrays of more than a hundred items opened a hundred at a time
 * ("[0 … 99]"). Hovering or focusing a row shows its two copy buttons, for
 * its value (a string as it is, an object or array as JSON) and for its path
 * (`request.headers["content-type"]`); Ctrl/⌘+C copies a focused row's value.
 * The header names it and copies the whole value or opens and closes
 * everything. The keys are Tree view's: ↑ ↓ move, → opens or steps in, ←
 * closes or steps out, Home and End, * opens every sibling, typing jumps to a
 * key, Enter opens or closes. The tree reads left to right on any page, as
 * code does.
 *
 * Motion: rows open with motion's Collapse (height to auto, a reversal
 * continues from where it is) while the chevron turns. Copying a value writes
 * a check on the copy icon, copying a path traces the route icon, and both
 * ease back after a beat. Reduced motion: rows open and close at once and the
 * icons go straight to their end pose. */

export type { JsonPath } from './json-viewer-model'

/** What a copy took: a row's value or its path, or (path `[]`) the whole value. */
export interface JsonViewerCopy {
  part: 'value' | 'path'
  /** Where the row sits: keys and indexes from the root. */
  path: JsonPath
}

export interface JsonViewerProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The value to show: anything `JSON.parse` returns, or a plain object or array. A Date shows as JSON writes it, an ISO string. */
  value: unknown
  /** How deep objects and arrays start open: 1 opens the ones at the top, so what they hold shows; 0 opens none; `Infinity` opens all. Default 1. */
  defaultExpandDepth?: number
  /** Strings longer than this many characters are cut short, and open onto their whole text. `Infinity` shows every string whole. Default 80. */
  collapseStringsAfter?: number
  /** Names the viewer, in its header and to screen readers: "Payload", "Response". Default "JSON". */
  label?: string
  /** Called after a copy succeeds, with the text copied and what it was. */
  onCopyText?: (text: string, copied: JsonViewerCopy) => void
  /** With sound on (`YoujProvider`’s `sound`), the buttons play `tap` and a copy `success` (or `error`). `false` keeps it silent. Default true. */
  sound?: boolean
}

/* The Tab stop lives in a store, not in state, as in Tree view: a focus move
 * re-renders the two rows whose answer changed, not every row. */
interface TabStopStore {
  /** The row last focused. */
  focusId: string | null
  /** The Tab stop: that row if it shows, else its nearest showing ancestor, else the first row. */
  value: string | null
  resolve: (focusId: string | null) => string | null
  listeners: Set<() => void>
}

type CopyState = 'idle' | 'copied' | 'error'

interface JsonTree {
  model: JsonModel
  clip: number
  sound: boolean
  treeId: string
  isOpen: (node: JsonNode) => boolean
  toggle: (node: JsonNode) => void
  copy: (node: JsonNode, part: 'value' | 'path') => void
  /** How the last copy from this row's value or path button went. */
  copied: (node: JsonNode, part: 'value' | 'path') => CopyState
  register: (id: string, element: HTMLElement | null) => void
  tabStops: TabStopStore
}

const TreeContext = createContext<JsonTree | null>(null)
const useTree = () => useContext(TreeContext)!

/** Something derived from the Tab stop, re-rendering the reader only when that answer changes. */
function useTabStopValue<T>(select: (stop: string | null) => T): T {
  const { tabStops } = useTree()
  const subscribe = useCallback(
    (listener: () => void) => {
      tabStops.listeners.add(listener)
      return () => void tabStops.listeners.delete(listener)
    },
    [tabStops],
  )
  const read = () => select(tabStops.value)
  return useSyncExternalStore(subscribe, read, read)
}

const TYPEAHEAD_RESET = 500 // youj-allow: typeahead buffer window, not motion
const INDENT = 1 // rem per level
const indentOf = (level: number, extra = 0.25) => `${(level - 1) * INDENT + extra}rem`

/** Expansion: a depth that opens objects and arrays by default, and the rows opened or closed by hand, by id (so they stay as they were when the value changes). */
interface Expansion {
  depth: number
  rows: ReadonlyMap<string, boolean>
}

export function JsonViewer({
  value,
  defaultExpandDepth = 1,
  collapseStringsAfter = 80,
  label,
  onCopyText,
  sound = true,
  className,
  ...props
}: JsonViewerProps) {
  const k = useYouj()
  const labels = useComponentLabels(jsonViewerLabels)
  label ??= labels.jsonViewer
  const clip = collapseStringsAfter
  const model = useMemo(() => jsonModel(value, clip), [value, clip])
  const [expansion, setExpansion] = useState<Expansion>(() => ({ depth: defaultExpandDepth, rows: new Map() }))
  const isOpen = useCallback(
    (node: JsonNode) =>
      expansion.rows.get(node.id) ?? (node.kind === 'value' && (node.type === 'object' || node.type === 'array') && node.level <= expansion.depth),
    [expansion],
  )
  const rows = useMemo(() => visibleRows(model, isOpen), [model, isOpen])
  const labelId = useId()
  const treeId = useId()

  /* ── Opening and closing ─────────────────────────────────────────────── */
  const setOpen = useCallback((nodes: readonly JsonNode[], open: boolean) => {
    setExpansion((e) => {
      const next = new Map(e.rows)
      for (const node of nodes) next.set(node.id, open)
      return { ...e, rows: next }
    })
  }, [])
  const toggle = useCallback((node: JsonNode) => setOpen([node], !isOpen(node)), [isOpen, setOpen])
  const allOpen = expansion.depth === Infinity
  // Expand all opens every object and array; a big array's ranges and long strings stay as they are, so it never renders more than it must.
  const branches = model.roots.some((node) => node.kind === 'range' || ((node.type === 'object' || node.type === 'array') && model.expandable(node)))

  /* ── Focus: one Tab stop, moved by the arrow keys ───────────────────── */
  const [tabStops] = useState<TabStopStore>(() => ({ focusId: null, value: null, resolve: () => null, listeners: new Set() }))
  const [elements] = useState(() => ({ byId: new Map<string, HTMLElement>(), ids: new WeakMap<HTMLElement, string>() }))
  const register = useCallback(
    (id: string, element: HTMLElement | null) => {
      const old = elements.byId.get(id)
      if (old && old !== element) elements.ids.delete(old)
      if (element) {
        elements.byId.set(id, element)
        elements.ids.set(element, id)
      } else elements.byId.delete(id)
    },
    [elements],
  )
  const showing = useMemo(() => new Set(rows.map((row) => row.id)), [rows])
  const resolveTabStop = (focusId: string | null) => {
    if (focusId && showing.has(focusId)) return focusId
    for (let id = focusId ? (model.get(focusId)?.parent ?? null) : null; id; id = model.get(id)?.parent ?? null) if (showing.has(id)) return id
    return rows[0]?.id ?? null
  }
  tabStops.resolve = resolveTabStop
  // Rows rendered with this pass read the new stop; the rest are told after it commits.
  const tabStop = resolveTabStop(tabStops.focusId)
  tabStops.value = tabStop
  useLayoutEffect(() => {
    for (const listener of tabStops.listeners) listener()
  }, [tabStop, tabStops])

  const setFocusedId = useCallback(
    (id: string) => {
      tabStops.focusId = id
      const next = tabStops.resolve(id)
      if (next === tabStops.value) return
      tabStops.value = next
      for (const listener of tabStops.listeners) listener()
    },
    [tabStops],
  )
  // A row that isn't rendered yet (one a key just opened) takes focus once it is.
  const pendingFocus = useRef<string | null>(null)
  const flushFocus = useCallback(() => {
    const id = pendingFocus.current
    const element = id ? elements.byId.get(id) : undefined
    if (!element) return
    pendingFocus.current = null
    element.focus()
  }, [elements])
  const focusRow = (id: string) => {
    setFocusedId(id)
    pendingFocus.current = id
    flushFocus()
  }
  useLayoutEffect(flushFocus)

  /* ── Copying ─────────────────────────────────────────────────────────── */
  const { politeRef, assertiveRef, announce } = useLiveRegion()
  const pending = useRef<{ text: string; copied: JsonViewerCopy } | null>(null)
  const [target, setTarget] = useState<string | null>(null)
  const { state: copyState, copy: writeText } = useCopyText((result) => {
    announce(result === 'copied' ? labels.copied : labels.copyFailed, { assertive: result === 'error' })
    if (result === 'copied' && pending.current) onCopyText?.(pending.current.text, pending.current.copied)
  }, sound)
  const copyAs = (text: string, copied: JsonViewerCopy, where: string) => {
    pending.current = { text, copied }
    setTarget(where)
    writeText(text)
  }
  const copy = (node: JsonNode, part: 'value' | 'path') =>
    copyAs(part === 'path' ? formatPath(node.path) : copyText(node), { part, path: node.path }, `${part}:${node.id}`)
  const copied = (node: JsonNode, part: 'value' | 'path') => (target === `${part}:${node.id}` ? copyState : 'idle')
  const copiedAll = target === 'all' ? copyState : 'idle'

  /* ── Keys ────────────────────────────────────────────────────────────── */
  const typeahead = useRef({ text: '', at: 0 })
  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const id = elements.ids.get(event.target as HTMLElement)
    const node = id ? model.get(id) : undefined
    if (event.defaultPrevented || !node) return
    const at = rows.findIndex((row) => row.id === node.id)
    if (at < 0) return
    const expandable = model.expandable(node)
    const open = expandable && isOpen(node)
    const go = (i: number) => {
      const next = rows[Math.max(0, Math.min(rows.length - 1, i))]
      if (next) focusRow(next.id)
    }
    const key = event.key

    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && key.toLowerCase() === 'c') {
      // Text selected by hand is the browser's to copy.
      if (event.currentTarget.ownerDocument.getSelection()?.isCollapsed === false) return
      copy(node, 'value')
    } else if (key === 'ArrowDown') go(at + 1)
    else if (key === 'ArrowUp') go(at - 1)
    else if (key === 'Home') go(0)
    else if (key === 'End') go(rows.length - 1)
    else if (key === 'ArrowRight') {
      if (!expandable) return
      if (!open) toggle(node)
      else go(at + 1)
    } else if (key === 'ArrowLeft') {
      if (open) toggle(node)
      else if (node.parent) focusRow(node.parent)
    } else if (key === 'Enter') {
      if (!expandable) return
      toggle(node)
    } else if (key === '*') {
      const parent = node.parent ? model.get(node.parent) : undefined
      const siblings = parent ? model.children(parent) : model.roots
      setOpen(
        siblings.filter((sibling) => model.expandable(sibling)),
        true,
      )
    } else if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey && /\S/.test(key)) {
      const now = event.timeStamp
      const buffer = typeahead.current
      buffer.text = now - buffer.at > TYPEAHEAD_RESET ? key : buffer.text + key
      buffer.at = now
      const needle = buffer.text.toLowerCase()
      // One letter steps to the next match; more keep the current row if it still matches.
      const start = buffer.text.length === 1 ? at + 1 : at
      const order = [...rows.slice(start), ...rows.slice(0, start)]
      const match = order.find((row) => row.key !== null && String(row.key).toLowerCase().startsWith(needle))
      if (match) focusRow(match.id)
    } else return
    event.preventDefault()
    event.stopPropagation()
  }

  const handleFocus = (event: FocusEvent<HTMLUListElement>) => {
    // A row, or a button in one: either way that row becomes the Tab stop.
    const item = (event.target as HTMLElement).closest<HTMLElement>('[role=treeitem]')
    const id = item ? elements.ids.get(item) : undefined
    if (id && id !== tabStops.focusId) setFocusedId(id)
  }

  const tree: JsonTree = { model, clip, sound, treeId, isOpen, toggle, copy, copied, register, tabStops }

  return (
    <div
      data-slot="json-viewer"
      data-reduced-motion={k.reduced || undefined}
      className={cn('own:flex min-w-0 flex-col overflow-hidden own:rounded-lg border own:border-line own:bg-band own:text-fg', className)}
      {...props}
    >
      <TooltipProvider>
        <div data-slot="json-viewer-header" className="own:flex h-8 shrink-0 items-center justify-between gap-2 border-b own:border-line own:ps-3 own:pe-1">
          <span id={labelId} data-slot="json-viewer-label" className="min-w-0 truncate own:font-mono own:text-ui-xs">
            {label}
          </span>
          <span className="own:flex shrink-0 items-center gap-0.5">
            {branches && (
              <IconButton
                slot="json-viewer-expand"
                label={allOpen ? labels.jsonViewerCollapseAll : labels.jsonViewerExpandAll}
                sound={sound}
                onClick={() => setExpansion({ depth: allOpen ? 0 : Infinity, rows: new Map() })}
              >
                <ChevronsUpDownIcon active={allOpen} size={14} strokeWidth={1.75} />
              </IconButton>
            )}
            <IconButton
              slot="json-viewer-copy-all"
              label={labels.jsonViewerCopyAll}
              state={copiedAll}
              sound={sound}
              onClick={() => copyAs(toJson(value), { part: 'value', path: [] }, 'all')}
            >
              <CopyIcon active={copiedAll === 'copied'} size={14} strokeWidth={1.75} />
            </IconButton>
          </span>
        </div>
        <TreeContext.Provider value={tree}>
          <ul
            role="tree"
            aria-labelledby={labelId}
            dir="ltr"
            data-slot="json-viewer-tree"
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            className="relative min-h-0 flex-1 overflow-y-auto yj-scrollbar own:p-1 own:font-mono own:text-[length:var(--text-ui)] own:leading-5 outline-none"
          >
            {model.roots.map((node) => (
              <Item key={node.id} node={node} />
            ))}
          </ul>
        </TreeContext.Provider>
      </TooltipProvider>
      <div ref={politeRef} role="status" className="sr-only" />
      <div ref={assertiveRef} role="alert" className="sr-only" />
    </div>
  )
}

/** A header button: an icon, named by its tooltip, that keeps the tooltip through the click to say how a copy went. */
function IconButton({
  slot,
  label,
  state = 'idle',
  sound,
  tabIndex,
  onClick,
  children,
}: {
  slot: string
  label: string
  state?: CopyState
  sound: boolean
  tabIndex?: number
  onClick: () => void
  children: ReactNode
}) {
  const labels = useComponentLabels(jsonViewerLabels)
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon-xs" sound={sound} />}
        closeOnClick={false}
        aria-label={label}
        data-slot={slot}
        tabIndex={tabIndex}
        onClick={(event: MouseEvent) => {
          event.stopPropagation()
          onClick()
        }}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{state === 'copied' ? labels.copied : state === 'error' ? labels.copyFailed : label}</TooltipContent>
    </Tooltip>
  )
}

/* ── Rows ────────────────────────────────────────────────────────────────── */

const itemClass = cn(
  'relative outline-none',
  // The ring sits on the row, not the item: an item also holds the rows it opens onto.
  '[&:focus-visible>[data-slot=json-viewer-row]]:outline-2 [&:focus-visible>[data-slot=json-viewer-row]]:-outline-offset-2 [&:focus-visible>[data-slot=json-viewer-row]]:outline-focus',
)

const rowClass = cn(
  'group/row relative own:flex min-h-6 items-start own:gap-1 own:rounded-md own:py-0.5 own:pe-2',
  'transition-[background-color] yj-duration-instant ease-standard own:hover:bg-hover',
)

// The copy buttons show on a hovered row, a focused one, or one whose copy just finished; hidden, they can't be clicked.
const actionsClass = cn(
  'absolute end-0.5 top-0 own:flex items-center gap-px',
  'pointer-events-none opacity-0 transition-opacity yj-duration-fast ease-standard',
  'data-shown:pointer-events-auto data-shown:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100',
  '[[data-slot=json-viewer-item]:focus>[data-slot=json-viewer-row]_&]:pointer-events-auto [[data-slot=json-viewer-item]:focus>[data-slot=json-viewer-row]_&]:opacity-100',
)

/* Memoised: a row re-renders when it gains or loses the Tab stop, and the
 * rows inside it, new elements with the same props, should not. */
const Item = memo(function Item({ node }: { node: JsonNode }) {
  const tree = useTree()
  const expandable = tree.model.expandable(node)
  const open = expandable && tree.isOpen(node)
  const tabStop = useTabStopValue((stop) => stop === node.id)
  const labelId = `${tree.treeId}-${node.serial}`
  const { register } = tree
  const ref = useCallback((element: HTMLLIElement | null) => register(node.id, element), [register, node.id])

  return (
    <li
      ref={ref}
      role="treeitem"
      tabIndex={tabStop ? 0 : -1}
      aria-labelledby={labelId}
      aria-expanded={expandable ? open : undefined}
      data-slot="json-viewer-item"
      data-yj-kind={node.kind === 'value' ? node.type : node.kind}
      data-yj-path={node.kind === 'value' && node.path.length > 0 ? formatPath(node.path) : undefined}
      className={itemClass}
    >
      <Row node={node} expandable={expandable} open={open} tabStop={tabStop} labelId={labelId} />
      {expandable && (
        <Collapse open={open} role="none">
          <Group node={node} />
        </Collapse>
      )}
    </li>
  )
})

/** The rows a row opens onto, read only once it opens. */
function Group({ node }: { node: JsonNode }) {
  const tree = useTree()
  return (
    <ul role="group" className="own:flex flex-col">
      {tree.model.children(node).map((child) => (
        <Item key={child.id} node={child} />
      ))}
    </ul>
  )
}

function Row({ node, expandable, open, tabStop, labelId }: { node: JsonNode; expandable: boolean; open: boolean; tabStop: boolean; labelId: string }) {
  const tree = useTree()
  const [hovered, setHovered] = useState(false)
  const copying = tree.copied(node, 'value') !== 'idle' || tree.copied(node, 'path') !== 'idle'
  // Only the rows that can show their buttons render them, so a tree of thousands of rows carries a handful.
  const actions = node.kind === 'value' && (hovered || tabStop || copying)
  return (
    <div
      data-slot="json-viewer-row"
      className={cn(rowClass, expandable && 'cursor-pointer')}
      style={{ paddingInlineStart: indentOf(node.level) }}
      onPointerEnter={(event) => event.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={(event) => {
        // The second click of a double click selects a word; it doesn't close the row again.
        if (!expandable || event.detail > 1) return
        // A drag that selected text is a selection, not a click.
        const selection = event.currentTarget.ownerDocument.getSelection()
        if (selection && !selection.isCollapsed && event.currentTarget.contains(selection.anchorNode)) return
        tree.toggle(node)
      }}
    >
      <Guides level={node.level} />
      <span aria-hidden className="own:grid h-5 w-4 shrink-0 place-items-center own:text-fg-muted">
        {/* youj-allow: unmirrored icon, the tree is dir="ltr" on any page, so → is always "opens" */}
        {expandable && <ChevronRightIcon size={14} strokeWidth={2} active={open} />}
      </span>
      <span id={labelId} data-slot="json-viewer-text" className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        {/* Room for the copy buttons on the first line only: a value that wraps takes the full width below them. */}
        {node.kind === 'value' && <span aria-hidden className="float-end h-5 w-12" />}
        <RowText node={node} open={open} />
      </span>
      {actions && <RowActions node={node} shown={hovered || copying} tabStop={tabStop} />}
    </div>
  )
}

/** Faint lines down each level a row sits in. */
function Guides({ level }: { level: number }) {
  if (level < 2) return null
  return Array.from({ length: level - 1 }, (_, i) => (
    <span key={i} aria-hidden className="pointer-events-none absolute inset-y-0 w-px own:bg-line" style={{ insetInlineStart: indentOf(i + 1, 0.75) }} />
  ))
}

function RowText({ node, open }: { node: JsonNode; open: boolean }) {
  const labels = useComponentLabels(jsonViewerLabels)
  if (node.kind === 'text') {
    return (
      <span data-slot="json-viewer-value" className={cn(tokenClass.string, 'whitespace-pre-wrap')}>
        {node.value as string}
      </span>
    )
  }
  if (node.kind === 'range') {
    return (
      <>
        <span aria-hidden className={tokenClass.punctuation}>{`[${node.from} … ${node.to}]`}</span>
        <span className="sr-only">{labels.jsonViewerRange(node.from, node.to)}</span>
      </>
    )
  }
  return (
    <>
      {node.key !== null && (
        <>
          <span data-slot="json-viewer-key" className={typeof node.key === 'number' ? 'own:text-fg-muted own:tabular-nums' : tokenClass.property}>
            {typeof node.key === 'number' ? node.key : showKey(node.key)}
          </span>
          {/* The space outside the colon's span, so the row's accessible name keeps it. */}
          <span className={tokenClass.punctuation}>:</span>{' '}
        </>
      )}
      <Value node={node} open={open} />
    </>
  )
}

function Value({ node, open }: { node: JsonNode; open: boolean }) {
  const tree = useTree()
  const labels = useComponentLabels(jsonViewerLabels)
  if (node.circular) return <span className="own:text-fg-subtle">{labels.jsonViewerCircular}</span>
  switch (node.type) {
    case 'object':
    case 'array': {
      const [start, end] = node.type === 'object' ? ['{', '}'] : ['[', ']']
      return (
        <>
          <span aria-hidden data-slot="json-viewer-count" className={tokenClass.punctuation}>
            {node.size > 0 ? `${start}${node.size}${end}` : `${start}${end}`}
          </span>
          <span className="sr-only">{node.type === 'object' ? labels.jsonViewerKeys(node.size) : labels.jsonViewerItems(node.size)}</span>
        </>
      )
    }
    case 'string':
      return open ? (
        <span data-slot="json-viewer-count" className="own:text-fg-muted">
          {labels.jsonViewerCharacters(node.size)}
        </span>
      ) : (
        <span data-slot="json-viewer-value" className={tokenClass.string}>
          {quote(node.value as string, tree.clip)}
        </span>
      )
    case 'number':
      return (
        <span data-slot="json-viewer-value" className={tokenClass.number}>
          {literal(node.value)}
        </span>
      )
    case 'boolean':
    case 'null':
      return (
        <span data-slot="json-viewer-value" className={tokenClass.keyword}>
          {literal(node.value)}
        </span>
      )
    default:
      return (
        <span data-slot="json-viewer-value" className="own:text-fg-subtle">
          {literal(node.value)}
        </span>
      )
  }
}

/** Copy value and Copy path, at the end of a row. On the Tab stop's row they're next in the tab order. */
function RowActions({ node, shown, tabStop }: { node: JsonNode; shown: boolean; tabStop: boolean }) {
  const tree = useTree()
  const labels = useComponentLabels(jsonViewerLabels)
  const value = tree.copied(node, 'value')
  const path = tree.copied(node, 'path')
  const tabIndex = tabStop ? 0 : -1
  return (
    <span data-slot="json-viewer-actions" data-shown={shown || undefined} className={actionsClass}>
      <IconButton slot="json-viewer-copy" label={labels.jsonViewerCopyValue} state={value} sound={tree.sound} tabIndex={tabIndex} onClick={() => tree.copy(node, 'value')}>
        <CopyIcon active={value === 'copied'} size={14} strokeWidth={1.75} />
      </IconButton>
      {node.path.length > 0 && (
        <IconButton slot="json-viewer-copy-path" label={labels.jsonViewerCopyPath} state={path} sound={tree.sound} tabIndex={tabIndex} onClick={() => tree.copy(node, 'path')}>
          <RouteIcon active={path === 'copied'} size={14} strokeWidth={1.75} />
        </IconButton>
      )}
    </span>
  )
}
