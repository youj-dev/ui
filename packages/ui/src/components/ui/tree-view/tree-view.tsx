'use client'

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useId,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Collapse } from '@youj/motion'
import { ChevronRightIcon } from '@youj/icons/components/youj/icons/chevron-right'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { treeViewLabels } from '@youj/core/labels'
import { useAnnouncer } from '../../../hooks/use-announcer'
import { useControllableState } from '../../../hooks/use-controllable-state'
import { cn } from '../../../lib/utils'
import { CheckboxMark } from '../checkbox'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '../context-menu'
import { Input } from '../input'
import { Spinner } from '../spinner'
import { TreeFileIcon, TreeFolderIcon } from './tree-view-icons'
import {
  ancestorsOf,
  checkStates,
  indexTree,
  isBranch,
  retryId,
  toggleCheck,
  visibleRows,
  type CheckState,
  type NodeInfo,
  type TreeNode,
  type VisibleRow,
} from './tree-view-model'

/* A WAI-ARIA tree. One Tab stop (a roving tabindex on the focused item);
 * ↑ ↓ move, → opens a branch or steps into it, ← closes it or steps out to
 * its parent, Home / End, * opens every sibling branch, typing jumps to the
 * next matching name, Enter activates (opens a file, toggles a folder), Space
 * selects or checks, F2 renames, Shift+F10 / the Menu key opens the context
 * menu.
 *
 * Motion: branches open with motion's Collapse (height to auto, a reversal
 * continues from where it is) while the chevron turns a quarter and the
 * folder's front panel tips open. Reduced motion: instant. The virtual mode
 * (`virtual`, for thousands of rows) renders a flat, windowed list with
 * aria-level / aria-setsize / aria-posinset and opens instantly.
 *
 * Selection: `single` (aria-selected), or `multiple` as a checkbox tree
 * (aria-checked, tri-state: a branch is checked when all of its loaded
 * children are, mixed when some are). Lazy branches (`hasChildren` without
 * `children`) call `loadChildren` on first open and show a spinner row; a
 * failure leaves a retry row in their place. Loads are announced. */

export type { TreeNode } from './tree-view-model'

export interface TreeViewContextActions {
  /** Start renaming the node in place (needs `onRename`). */
  rename: () => void
}

export interface TreeViewProps extends Omit<ComponentProps<'ul'>, 'children' | 'onSelect' | 'defaultValue' | 'contextMenu'> {
  data: TreeNode[]
  /** Open branches. */
  expanded?: string[]
  defaultExpanded?: string[]
  onExpandedChange?: (ids: string[]) => void
  /** `single` selects one item; `multiple` is a checkbox tree with tri-state branches. Default `single`. */
  selectionMode?: 'single' | 'multiple'
  selected?: string[]
  defaultSelected?: string[]
  onSelectedChange?: (ids: string[]) => void
  /** Enter or double-click on a leaf: open the file. */
  onAction?: (node: TreeNode) => void
  /** Loads a lazy branch's children. Resolve once `data` holds them; reject to show a retry row. */
  loadChildren?: (node: TreeNode) => Promise<unknown>
  /** Enables F2 / inline rename. Called with the trimmed new name when it changed. */
  onRename?: (node: TreeNode, name: string) => void
  /** Context-menu items for a node (ContextMenuItem and friends). */
  contextMenu?: (node: TreeNode, actions: TreeViewContextActions) => ReactNode
  /** File-explorer icons: folders that open, files by type. Default true. */
  icons?: boolean
  /** Window the rows for large trees. Give the tree a height. */
  virtual?: boolean
}

/* The Tab stop lives in a store, not in state: a focus move then re-renders
 * the rows whose answer changed, not the tree and every row in it. */
interface TabStopStore {
  /** The item last focused. */
  focusId: string | null
  /** The Tab stop: that item if it is showing, else its nearest visible ancestor, else the selection, else the first row. */
  value: string | null
  resolve: (focusId: string | null) => string | null
  listeners: Set<() => void>
}

interface TreeState {
  index: Map<string, NodeInfo>
  expanded: Set<string>
  selectionMode: 'single' | 'multiple'
  selected: Set<string>
  checks: Map<string, CheckState> | null
  tabStops: TabStopStore
  loading: Set<string>
  failed: Set<string>
  renaming: string | null
  icons: boolean
  toggle: (id: string) => void
  select: (id: string) => void
  check: (id: string) => void
  activate: (id: string) => void
  retry: (id: string) => void
  commitRename: (id: string, name: string | null) => void
  onContextMenu: (id: string) => void
  /** Set while a rename input is open, so the context menu doesn't take focus back from it. */
  renamingRef: { current: boolean }
  treeId: string
}

const TreeContext = createContext<TreeState | null>(null)
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
const INDENT = '0.875rem'

export function TreeView({
  data,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selectionMode = 'single',
  selected: selectedProp,
  defaultSelected = [],
  onSelectedChange,
  onAction,
  loadChildren,
  onRename,
  contextMenu,
  icons = true,
  virtual = false,
  className,
  onKeyDown,
  onFocus,
  ...props
}: TreeViewProps) {
  const k = useYouj()
  const labels = useComponentLabels(treeViewLabels)
  const index = useMemo(() => indexTree(data), [data])
  const [expandedList, setExpandedList] = useControllableState(expandedProp, defaultExpanded)
  const [selectedList, setSelectedList] = useControllableState(selectedProp, defaultSelected)
  const expanded = useMemo(() => new Set(expandedList), [expandedList])
  const selected = useMemo(() => new Set(selectedList), [selectedList])
  const checks = useMemo(() => (selectionMode === 'multiple' ? checkStates(data, selected) : null), [selectionMode, data, selected])
  const [loading, setLoading] = useState<Set<string>>(() => new Set())
  const [failed, setFailed] = useState<Set<string>>(() => new Set())
  const [renaming, setRenaming] = useState<string | null>(null)
  const [tabStops] = useState<TabStopStore>(() => ({ focusId: null, value: null, resolve: () => null, listeners: new Set() }))
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
  const [menuId, setMenuId] = useState<string | null>(null)
  const { announce, announcer } = useAnnouncer()
  const treeId = useId()
  const renamingRef = useRef(false)
  const treeRef = useRef<HTMLUListElement>(null)
  const pendingFocus = useRef<string | null>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const rows = useMemo(() => visibleRows(data, expanded, failed), [data, expanded, failed])
  const rowIds = useMemo(() => rows.map((r) => r.id), [rows])

  // The Tab stop: the focused item if it's visible, else its nearest visible ancestor, else the selection, else the first row.
  const visibleIds = useMemo(() => new Set(rowIds), [rowIds])
  const resolveTabStop = (focusedId: string | null) => {
    if (focusedId && visibleIds.has(focusedId)) return focusedId
    if (focusedId) for (const a of ancestorsOf(focusedId, index)) if (visibleIds.has(a)) return a
    const firstSelected = selectedList.find((id) => visibleIds.has(id))
    return firstSelected ?? rowIds[0] ?? null
  }
  tabStops.resolve = resolveTabStop
  // Rows rendered with this pass read the new stop; the rest are told after it commits.
  const tabStop = resolveTabStop(tabStops.focusId)
  tabStops.value = tabStop
  useLayoutEffect(() => {
    for (const listener of tabStops.listeners) listener()
  }, [tabStop, tabStops])

  /* ── State changes ────────────────────────────────────────────────────── */
  const setExpanded = useCallback(
    (next: Set<string>) => {
      const list = [...next]
      setExpandedList(list)
      onExpandedChange?.(list)
    },
    [setExpandedList, onExpandedChange],
  )

  const load = useCallback(
    (node: TreeNode) => {
      if (!loadChildren || node.children !== undefined || !node.hasChildren) return
      setFailed((f) => (f.has(node.id) ? new Set([...f].filter((id) => id !== node.id)) : f))
      setLoading((l) => new Set(l).add(node.id))
      announce(labels.treeLoadingItem(node.name))
      const done = (ok: boolean) => {
        if (!mounted.current) return
        setLoading((l) => {
          const next = new Set(l)
          next.delete(node.id)
          return next
        })
        if (!ok) setFailed((f) => new Set(f).add(node.id))
        announce(ok ? labels.treeLoaded(node.name) : labels.treeLoadFailed(node.name))
      }
      Promise.resolve()
        .then(() => loadChildren(node))
        .then(
          () => done(true),
          () => done(false),
        )
    },
    [loadChildren, announce, labels],
  )

  const setOpen = useCallback(
    (ids: string[], open: boolean) => {
      const next = new Set(expanded)
      for (const id of ids) {
        const info = index.get(id)
        if (!info || !isBranch(info.node)) continue
        if (open) {
          next.add(id)
          if (!expanded.has(id)) load(info.node)
        } else next.delete(id)
      }
      setExpanded(next)
    },
    [expanded, index, load, setExpanded],
  )

  const toggle = useCallback((id: string) => setOpen([id], !expanded.has(id)), [expanded, setOpen])

  const select = useCallback(
    (id: string) => {
      if (selectionMode !== 'single' || index.get(id)?.node.disabled) return
      setSelectedList([id])
      onSelectedChange?.([id])
    },
    [selectionMode, index, setSelectedList, onSelectedChange],
  )

  const check = useCallback(
    (id: string) => {
      if (!checks || index.get(id)?.node.disabled) return
      const list = [...toggleCheck(id, index, checks, selected)]
      setSelectedList(list)
      onSelectedChange?.(list)
    },
    [checks, index, selected, setSelectedList, onSelectedChange],
  )

  // `now`: nothing else will render, so the row is already there to focus (a key moving between rows).
  const flushFocus = useRef(() => {})
  const focusItem = useCallback(
    (id: string, now = false) => {
      setFocusedId(id)
      pendingFocus.current = id
      if (now) flushFocus.current()
    },
    [setFocusedId],
  )

  const retry = useCallback(
    (parent: string) => {
      const info = index.get(parent)
      if (!info) return
      focusItem(parent, true)
      load(info.node)
    },
    [index, load, focusItem],
  )

  const activate = useCallback(
    (id: string) => {
      const info = index.get(id)
      if (!info || info.node.disabled) return
      if (isBranch(info.node)) toggle(id)
      else {
        if (selectionMode === 'single') select(id)
        onAction?.(info.node)
      }
    },
    [index, toggle, select, selectionMode, onAction],
  )

  const commitRename = useCallback(
    (id: string, name: string | null) => {
      const node = index.get(id)?.node
      setRenaming(null)
      focusItem(id)
      if (!node || name === null) return
      const trimmed = name.trim()
      if (trimmed && trimmed !== node.name) {
        onRename?.(node, trimmed)
        announce(labels.treeRenamed(trimmed))
      }
    },
    [index, onRename, focusItem, announce, labels],
  )

  const startRename = useCallback((id: string) => onRename && !index.get(id)?.node.disabled && setRenaming(id), [onRename, index])

  /* ── Virtualization ───────────────────────────────────────────────────── */
  const virtualizer = useVirtualizer({
    count: virtual ? rows.length : 0,
    getScrollElement: () => treeRef.current,
    estimateSize: () => 28,
    overscan: 10,
  })

  // Move DOM focus once the item is rendered (a virtual row may need scrolling in first).
  flushFocus.current = () => {
    const id = pendingFocus.current
    if (!id) return
    const el = treeRef.current?.querySelector<HTMLElement>(`[data-tree-id="${CSS.escape(id)}"]`)
    if (virtual) {
      const at = rowIds.indexOf(id)
      if (at >= 0) virtualizer.scrollToIndex(at, { align: 'auto' })
    }
    if (el) {
      pendingFocus.current = null
      el.focus({ preventScroll: virtual })
    }
  }
  useLayoutEffect(() => flushFocus.current())

  /* ── Keyboard ─────────────────────────────────────────────────────────── */
  const typeahead = useRef({ text: '', at: 0 })

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    onKeyDown?.(event)
    const item = (event.target as HTMLElement).closest<HTMLElement>('[data-tree-id]')
    if (event.defaultPrevented || !item || item !== event.target) return
    const id = item.dataset.treeId!
    const at = rowIds.indexOf(id)
    const row = rows[at]
    if (!row) return
    const info = row.kind === 'node' ? index.get(id) : undefined
    const rtl = getComputedStyle(item).direction === 'rtl'
    const inward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const outward = rtl ? 'ArrowRight' : 'ArrowLeft'
    const go = (i: number) => {
      const target = rowIds[Math.max(0, Math.min(rowIds.length - 1, i))]
      if (target) focusItem(target, true)
    }
    const key = event.key

    if (key === 'ArrowDown') go(at + 1)
    else if (key === 'ArrowUp') go(at - 1)
    else if (key === 'Home') go(0)
    else if (key === 'End') go(rowIds.length - 1)
    else if (key === inward) {
      if (!info || !isBranch(info.node)) return
      if (!expanded.has(id)) toggle(id)
      else if (info.node.children?.length || failed.has(id)) go(at + 1)
    } else if (key === outward) {
      if (info && isBranch(info.node) && expanded.has(id)) toggle(id)
      else {
        const parent = row.kind === 'retry' ? row.parent : info?.parent
        if (parent) focusItem(parent, true)
      }
    } else if (key === 'Enter') {
      if (row.kind === 'retry') retry(row.parent)
      else activate(id)
    } else if (key === ' ') {
      if (row.kind === 'retry') retry(row.parent)
      else if (selectionMode === 'multiple') check(id)
      else select(id)
    } else if (key === '*') {
      const parent = info?.parent ?? null
      const siblings = parent ? index.get(parent)!.node.children! : data
      setOpen(
        siblings.filter((n) => isBranch(n)).map((n) => n.id),
        true,
      )
    } else if (key === 'F2' && info && onRename) startRename(id)
    else if (key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey && /\S/.test(key)) {
      const now = event.timeStamp
      const buffer = typeahead.current
      buffer.text = now - buffer.at > TYPEAHEAD_RESET ? key : buffer.text + key
      buffer.at = now
      const needle = buffer.text.toLowerCase()
      const nodes = rows.filter((r) => r.kind === 'node')
      const start = buffer.text.length === 1 ? nodes.findIndex((r) => r.id === id) + 1 : nodes.findIndex((r) => r.id === id)
      const order = [...nodes.slice(start), ...nodes.slice(0, start)]
      const match = order.find((r) => index.get(r.id)!.node.name.toLowerCase().startsWith(needle))
      if (match) focusItem(match.id, true)
    } else return
    event.preventDefault()
    event.stopPropagation()
  }

  const handleFocus = (event: FocusEvent<HTMLUListElement>) => {
    onFocus?.(event)
    const id = (event.target as HTMLElement).dataset?.treeId
    if (id && id !== tabStops.focusId) setFocusedId(id)
  }

  const onContextMenu = useCallback(
    (id: string) => {
      setMenuId(id)
      focusItem(id)
    },
    [focusItem],
  )

  const state: TreeState = {
    index,
    expanded,
    selectionMode,
    selected,
    checks,
    tabStops,
    loading,
    failed,
    renaming,
    icons,
    toggle,
    select,
    check,
    activate,
    retry,
    commitRename,
    onContextMenu,
    renamingRef,
    treeId,
  }

  const treeProps = {
    ...props,
    ref: treeRef,
    role: 'tree',
    'data-slot': 'tree-view',
    'data-reduced-motion': k.reduced || undefined,
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
    style: { '--tree-indent': INDENT, ...props.style } as CSSProperties,
    className: cn('relative own:flex flex-col own:text-ui outline-none select-none', virtual && 'overflow-auto yj-scrollbar', className),
  }

  const body = virtual ? (
    <li role="none" className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((v) => {
        const row = rows[v.index]!
        return (
          <div key={row.id} data-index={v.index} ref={virtualizer.measureElement} className="absolute inset-x-0 top-0" style={{ transform: `translateY(${v.start}px)` }}>
            {row.kind === 'retry' ? <RetryItem row={row} flat /> : <Item id={row.id} flat />}
          </div>
        )
      })}
    </li>
  ) : (
    data.map((node) => <Item key={node.id} id={node.id} />)
  )

  const menuNode = menuId ? index.get(menuId)?.node : undefined

  return (
    <TreeContext.Provider value={state}>
      {contextMenu ? (
        <ContextMenu
          onOpenChange={(open) => {
            if (!open) setMenuId(null)
          }}
        >
          <ContextMenuTrigger
            render={<ul {...treeProps} />}
            onContextMenu={(event: MouseEvent & { preventBaseUIHandler?: () => void }) => {
              // Only rows have a menu: a right click on empty space keeps the browser's.
              if (!(event.target as HTMLElement).closest('[data-tree-id]:not([data-retry])')) event.preventBaseUIHandler?.()
            }}
          >
            {body}
          </ContextMenuTrigger>
          <ContextMenuContent
            // Focus goes back to the row the menu opened on, unless the menu started a rename.
            finalFocus={() => !renamingRef.current}
            className="min-w-44"
          >
            {menuNode && contextMenu(menuNode, { rename: () => startRename(menuNode.id) })}
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        <ul {...treeProps}>{body}</ul>
      )}
      {announcer}
    </TreeContext.Provider>
  )
}

/* ── Items ──────────────────────────────────────────────────────────────── */

const itemClass = cn(
  'group/item relative outline-none',
  // The ring sits on the row, not the item: in the nested tree an item also holds its children.
  '[&:focus-visible>[data-slot=tree-row]]:outline-2 [&:focus-visible>[data-slot=tree-row]]:-outline-offset-2 [&:focus-visible>[data-slot=tree-row]]:outline-focus',
)

const rowClass = cn(
  'relative own:flex own:h-control-sm items-center gap-1.5 own:rounded-md own:pe-2 own:text-fg',
  'transition-[background-color] yj-duration-instant ease-standard',
  'own:hover:bg-hover own:data-selected:bg-selected data-selected:hover:bg-selected',
  'data-disabled:pointer-events-none data-disabled:opacity-50',
)

/** Faint indent guides at each ancestor level; the guide beside the focused item's siblings is stronger. */
function Guides({ id, level }: { id: string; level: number }) {
  const { index } = useTree()
  const chain = level < 2 ? [] : [...ancestorsOf(id, index)].reverse()
  // Which guide is stronger: where the Tab stop's parent sits in this row's chain.
  const active = useTabStopValue((stop) => {
    const parent = stop ? index.get(stop)?.parent : null
    return parent ? chain.indexOf(parent) : -1
  })
  if (level < 2) return null
  return (
    <>
      {chain.map((ancestor, i) => (
        <span
          key={ancestor}
          aria-hidden
          className={cn('pointer-events-none absolute inset-y-0 w-px bg-line', i === active && 'bg-fg-subtle')}
          style={{ insetInlineStart: `calc(${i} * var(--tree-indent) + 0.75rem)` }}
        />
      ))}
    </>
  )
}

/* Memoised: a branch re-renders when it gains or loses the Tab stop, and its
 * children, which are new elements with the same props, should not. */
const Item = memo(function Item({ id, flat = false }: { id: string; flat?: boolean }) {
  const tree = useTree()
  const labels = useComponentLabels(treeViewLabels)
  const info = tree.index.get(id)!
  const { node, level } = info
  const branch = isBranch(node)
  const open = branch && tree.expanded.has(id)
  const loading = tree.loading.has(id)
  const selected = tree.selectionMode === 'single' && tree.selected.has(id)
  const checked = tree.checks?.get(id) ?? false
  const labelId = `${tree.treeId}-${id}`
  const Tag = flat ? 'div' : 'li'
  const tabStop = useTabStopValue((stop) => stop === id)

  return (
    <Tag
      role="treeitem"
      data-tree-id={id}
      tabIndex={tabStop ? 0 : -1}
      aria-labelledby={labelId}
      aria-describedby={node.description ? `${labelId}-d` : undefined}
      aria-expanded={branch ? open : undefined}
      aria-selected={tree.selectionMode === 'single' ? selected : undefined}
      aria-checked={tree.selectionMode === 'multiple' ? checked : undefined}
      aria-disabled={node.disabled || undefined}
      aria-busy={loading || undefined}
      aria-level={flat ? level : undefined}
      aria-setsize={flat ? info.size : undefined}
      aria-posinset={flat ? info.pos : undefined}
      className={itemClass}
    >
      <Row id={id} labelId={labelId} />
      {!flat && branch && (
        <Collapse open={open} role="none">
          <ul role="group" className="flex flex-col">
            {node.children?.map((child) => <Item key={child.id} id={child.id} />)}
            {loading && <StatusRow level={level + 1} label={<><Spinner label={null} size={12} /> {labels.loadingEllipsis}</>} />}
            {!loading && node.children?.length === 0 && <StatusRow level={level + 1} label={labels.empty} />}
            {!loading && tree.failed.has(id) && !node.children && <RetryItem row={{ kind: 'retry', id: retryId(id), parent: id }} />}
          </ul>
        </Collapse>
      )}
      {flat && open && loading && <StatusRow as="div" level={level + 1} label={<><Spinner label={null} size={12} /> {labels.loadingEllipsis}</>} />}
    </Tag>
  )
})

const Row = memo(function Row({ id, labelId }: { id: string; labelId: string }) {
  const tree = useTree()
  const { node, level } = tree.index.get(id)!
  const branch = isBranch(node)
  const open = branch && tree.expanded.has(id)
  const multiple = tree.selectionMode === 'multiple'
  const selected = !multiple && tree.selected.has(id)
  const checked = tree.checks?.get(id) ?? false
  const renaming = tree.renaming === id

  return (
    <div
      data-slot="tree-row"
      data-selected={selected || undefined}
      data-disabled={node.disabled || undefined}
      style={{ paddingInlineStart: `calc(${level - 1} * var(--tree-indent) + 0.25rem)` }}
      className={rowClass}
      onClick={() => {
        if (renaming) return
        if (branch) {
          tree.toggle(id)
          if (!multiple) tree.select(id)
        } else if (multiple) tree.check(id)
        else tree.select(id)
      }}
      onDoubleClick={() => !branch && !renaming && tree.activate(id)}
      onContextMenu={() => tree.onContextMenu(id)}
    >
      <Guides id={id} level={level} />
      <span
        aria-hidden
        className="own:grid size-4 shrink-0 place-items-center own:text-fg-muted"
        onClick={(event) => {
          if (!branch) return
          event.stopPropagation()
          tree.toggle(id)
        }}
      >
        {branch && <ChevronRightIcon size={14} strokeWidth={2} active={open} className="rtl:-scale-x-100" />}
      </span>
      {multiple && (
        <span
          aria-hidden
          className="own:grid size-4 shrink-0 place-items-center"
          onClick={(event) => {
            event.stopPropagation()
            tree.check(id)
          }}
        >
          <CheckboxMark checked={checked === 'mixed' ? 'indeterminate' : checked} />
        </span>
      )}
      {tree.icons && (node.icon ?? (branch ? <TreeFolderIcon open={open} /> : <TreeFileIcon name={node.name} />))}
      {renaming ? (
        <RenameInput id={id} name={node.name} labelId={labelId} />
      ) : (
        <span id={labelId} className="min-w-0 flex-1 truncate">
          {node.name}
        </span>
      )}
      {node.description && (
        <span id={`${labelId}-d`} className="sr-only">
          {node.description}
        </span>
      )}
      {node.meta !== undefined && !renaming && (
        <span aria-hidden className="shrink-0 own:text-ui-xs own:text-fg-muted own:tabular-nums">
          {node.meta}
        </span>
      )}
    </div>
  )
})

function RenameInput({ id, name, labelId }: { id: string; name: string; labelId: string }) {
  const tree = useTree()
  const labels = useComponentLabels(treeViewLabels)
  const ref = useRef<HTMLInputElement>(null)
  const done = useRef(false)
  const { renamingRef } = tree
  useLayoutEffect(() => {
    renamingRef.current = true
    const input = ref.current!
    input.focus()
    // Select the stem, not the extension, as file managers do.
    const dot = name.lastIndexOf('.')
    input.setSelectionRange(0, dot > 0 ? dot : name.length)
    return () => {
      renamingRef.current = false
    }
  }, [name, renamingRef])
  const finish = (value: string | null) => {
    if (done.current) return
    done.current = true
    tree.commitRename(id, value)
  }
  return (
    <Input
      ref={ref}
      id={labelId}
      aria-label={labels.treeRename(name)}
      defaultValue={name}
      // shape: a rename field laid in its 24px row, at the row's height
      className="h-6 flex-1 own:px-1.5 text-ui"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') finish(e.currentTarget.value)
        else if (e.key === 'Escape') finish(null)
      }}
      onBlur={(e) => finish(e.currentTarget.value)}
    />
  )
}

/** A branch's failed load: a focusable item that retries on Enter, Space or click. */
function RetryItem({ row, flat = false }: { row: Extract<VisibleRow, { kind: 'retry' }>; flat?: boolean }) {
  const tree = useTree()
  const labels = useComponentLabels(treeViewLabels)
  const info = tree.index.get(row.parent)!
  const Tag = flat ? 'div' : 'li'
  const tabStop = useTabStopValue((stop) => stop === row.id)
  return (
    <Tag
      role="treeitem"
      data-tree-id={row.id}
      data-retry=""
      tabIndex={tabStop ? 0 : -1}
      aria-level={flat ? info.level + 1 : undefined}
      aria-setsize={flat ? 1 : undefined}
      aria-posinset={flat ? 1 : undefined}
      className={itemClass}
    >
      <div
        data-slot="tree-row"
        className={cn(rowClass, 'own:text-danger-text')}
        style={{ paddingInlineStart: `calc(${info.level} * var(--tree-indent) + 1.625rem)` }}
        onClick={() => tree.retry(row.parent)}
      >
        <span className="truncate">{labels.treeLoadFailed(info.node.name)}.</span>
        <span className="own:font-medium underline underline-offset-2">{labels.retry}</span>
      </div>
    </Tag>
  )
}

/** Loading and empty notes inside a branch. Not items: the branch's aria-busy and the announcer carry them. */
function StatusRow({ level, label, as: Tag = 'li' }: { level: number; label: ReactNode; as?: 'li' | 'div' }) {
  return (
    <Tag
      role="none"
      aria-hidden
      className="own:flex own:h-control-sm items-center gap-2 own:text-ui-sm own:text-fg-muted"
      style={{ paddingInlineStart: `calc(${level - 1} * var(--tree-indent) + 1.625rem)` }}
    >
      {label}
    </Tag>
  )
}
