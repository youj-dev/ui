'use client'

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Collapse, SlidingIndicator } from '@youj/motion'
import { ChevronRightIcon } from '@youj/icons'
import { cn } from '../../../lib/utils'
import { useFrame } from './context'
import { matchParts } from './filter'
import { badgeText, type FrameNavItem, type FrameNavSection } from './model'
import { FrameNavIcon } from './nav-icon'
import { FrameSectionLabel } from './section-label'
import { BREATH } from './signature'

/* Pages as an ARIA navigation tree, to any depth (Rail + panel's panel, the
 * glass explorer): one tree per section, each named by its heading, with one
 * Tab stop for all of them. ↑ ↓ move between the rows you can see, across
 * sections; → opens a branch, or steps into an open one; ← closes it, or
 * steps out to its parent (mirrored right to left); Home and End go to the
 * ends; typing a name's first letters jumps there; * opens every branch
 * beside the one you're on. Enter follows a page and opens or closes a
 * branch, as does Space.
 * A branch is a chevron and its name; its pages hang off a guide line under
 * the chevron. Counts sit on one column at the row's end, as pills. The
 * current page wears the sidebar's key (raised, or a quiet fill), which
 * glides from page to page and waits on the closed branch that hides it. */

/** A row you can see, in order: what the keyboard moves through. */
interface Row {
  id: string
  label: string
  branch: boolean
  parent?: string
}

function rowsOf(nav: readonly FrameNavSection[], isOpen: (id: string) => boolean): Row[] {
  const rows: Row[] = []
  const walk = (items: readonly FrameNavItem[], parent?: string) => {
    for (const item of items) {
      const branch = Boolean(item.items?.length)
      rows.push({ id: item.id, label: item.label, branch, parent })
      if (branch && isOpen(item.id)) walk(item.items!, item.id)
    }
  }
  for (const section of nav) walk(section.items)
  return rows
}

/** A label with the part that matches the filter marked. */
function Marked({ text, query, id }: { text: string; query: string; id?: string }) {
  const parts = matchParts(text, query)
  return (
    <span id={id} className="min-w-0 flex-1 truncate">
      {parts ? (
        <>
          {parts[0]}
          <mark className="rounded-xs bg-accent-subtle text-fg">{parts[1]}</mark>
          {parts[2]}
        </>
      ) : (
        text
      )}
    </span>
  )
}

/** A count or a short tag as a pill on a well (loud in danger), read after the name. */
function Count({ item }: { item: FrameNavItem }) {
  if (item.badge === undefined) return null
  return (
    <>
      <span className="sr-only">, {badgeText(item)}</span>
      <span
        aria-hidden
        data-slot="frame-count"
        className={cn(
          'flex h-5 min-w-5 shrink-0 items-center justify-center rounded-chip px-1.5 text-ui-xs font-medium tabular-nums',
          item.badgeTone === 'danger' ? 'bg-danger-subtle text-danger-text' : 'bg-well text-fg-muted',
        )}
      >
        {item.badge}
      </span>
    </>
  )
}

/* A row: one control height, its wash coming at once and going slowly, the current page in ink with its icon in the
 * accent. The focus ring is the row's own, inset, so a scrolled tree never cuts it. */
const rowClass = cn(
  'relative flex h-control w-full min-w-0 items-center gap-2 rounded-md px-2 text-start text-ui text-fg-muted outline-none select-none',
  'hover:bg-hover hover:text-fg data-[yj-current]:font-medium data-[yj-current]:text-fg data-[yj-current]:hover:bg-transparent',
  BREATH,
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus focus-visible:outline-solid',
  '[&>svg]:shrink-0 [&>svg]:text-fg-subtle hover:[&>svg]:text-fg data-[yj-current]:[&>svg:not([data-chevron])]:text-accent-text',
)

/** How the current page is marked: the kit's indicators, sliding here. */
const KEYS = {
  raised: 'rounded-md bg-key shadow-xs ring-1 ring-line',
  fill: 'rounded-md bg-selected',
}

export interface FrameTreeProps {
  /** The sections to draw (filtered while a filter is on). */
  nav: FrameNavSection[]
  query: string
  isOpen: (id: string) => boolean
  onOpenChange: (ids: string[], open: boolean) => void
  /** The row the current page shows on: its own, or the closed branch that hides it. */
  here: string | undefined
  /** The headings' ids are built on it. */
  idBase: string
  /** The current page's key. Default `raised`. */
  current?: keyof typeof KEYS
  /** Draw the sections' headings. Default true. */
  headings?: boolean
}

export function FrameTree({ nav, query, isOpen, onOpenChange, here, idBase, current = 'raised', headings = true }: FrameTreeProps) {
  const { active, link, Link } = useFrame()
  const root = useRef<HTMLDivElement>(null)
  const [focusId, setFocusId] = useState<string>()
  const typed = useRef({ text: '', at: 0 })
  const rows = rowsOf(nav, isOpen)
  // One Tab stop: the row last focused while it's still there, else where the current page shows, else the first.
  const stop = rows.some((r) => r.id === focusId) ? focusId : rows.some((r) => r.id === here) ? here : rows[0]?.id

  const focus = (id: string | undefined) => {
    if (!id) return
    setFocusId(id)
    // Matched by comparing the id, not by building a selector from it: an id may hold quotes, backslashes or brackets.
    Array.from(root.current?.querySelectorAll<HTMLElement>('[data-yj-tree-item]') ?? [])
      .find((row) => row.dataset.yjTreeItem === id)
      ?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const id = (event.target as HTMLElement).closest<HTMLElement>('[data-yj-tree-item]')?.dataset.yjTreeItem
    const at = rows.findIndex((r) => r.id === id)
    const row = rows[at]
    if (!row || event.altKey || event.ctrlKey || event.metaKey) return
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const key = rtl && event.key === 'ArrowLeft' ? 'ArrowRight' : rtl && event.key === 'ArrowRight' ? 'ArrowLeft' : event.key
    const handled = () => event.preventDefault()
    const move = { ArrowDown: rows[at + 1], ArrowUp: rows[at - 1], Home: rows[0], End: rows.at(-1) }[key]
    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
      handled()
      focus(move?.id)
    } else if (key === 'ArrowRight') {
      handled()
      if (row.branch && !isOpen(row.id)) onOpenChange([row.id], true)
      else if (row.branch) focus(rows[at + 1]?.id)
    } else if (key === 'ArrowLeft') {
      handled()
      if (row.branch && isOpen(row.id)) onOpenChange([row.id], false)
      else focus(row.parent)
    } else if (key === '*') {
      handled()
      onOpenChange(rows.filter((r) => r.branch && r.parent === row.parent).map((r) => r.id), true)
    } else if ((key === 'Enter' || key === ' ') && row.branch) {
      handled()
      onOpenChange([row.id], !isOpen(row.id))
    } else if (key.length === 1 && key !== ' ') {
      // Type-ahead: the next row whose name starts with what's been typed in the last half second.
      const now = event.timeStamp
      typed.current = { text: now - typed.current.at < 500 ? typed.current.text + key.toLowerCase() : key.toLowerCase(), at: now }
      const order = [...rows.slice(at + 1), ...rows.slice(0, at + 1)]
      const next = order.find((r) => r.label.toLowerCase().startsWith(typed.current.text))
      if (next) {
        handled()
        focus(next.id)
      }
    }
  }

  const item = (entry: FrameNavItem, level: number, index: number, size: number): ReactNode => {
    const branch = Boolean(entry.items?.length)
    const open = branch && isOpen(entry.id)
    const Icon = entry.icon
    const position = { 'aria-level': level, 'aria-setsize': size, 'aria-posinset': index + 1 }
    const roving = { tabIndex: entry.id === stop ? 0 : -1, onFocus: () => setFocusId(entry.id), 'data-yj-tree-item': entry.id }
    const hereRow = entry.id === here || undefined
    const labelId = `${idBase}-label-${entry.id.replace(/\s+/g, '-')}`
    if (!branch)
      return (
        <li key={entry.id} role="none">
          <Link {...link(entry)} role="treeitem" aria-selected={active === entry.id} {...position} {...roving} data-yj-here={hereRow} data-yj-current={active === entry.id || undefined} className={rowClass}>
            {Icon && <FrameNavIcon icon={Icon} current={active === entry.id} />}
            <Marked text={entry.label} query={query} />
            <Count item={entry} />
          </Link>
        </li>
      )
    return (
      // Named by its row alone: a treeitem would otherwise take the names of every page inside it.
      <li
        key={entry.id}
        role="treeitem"
        aria-selected={false}
        aria-expanded={open}
        aria-labelledby={labelId}
        {...position}
        {...roving}
        className="outline-none focus-visible:[&>[data-yj-row]]:outline-2 focus-visible:[&>[data-yj-row]]:-outline-offset-2 focus-visible:[&>[data-yj-row]]:outline-focus focus-visible:[&>[data-yj-row]]:outline-solid"
      >
        <div
          data-yj-row=""
          data-yj-here={hereRow}
          // A press anywhere on the row opens or closes it; the treeitem keeps focus.
          onClick={() => onOpenChange([entry.id], !open)}
          className={cn(rowClass, 'cursor-pointer', open && 'text-fg')}
        >
          <ChevronRightIcon data-chevron="" size={14} strokeWidth={1.75} className="text-fg-subtle transition-transform yj-duration-fast ease-standard rtl:-scale-x-100 [[aria-expanded=true]>[data-yj-row]>&]:rotate-90" />
          {Icon && <Icon size={16} strokeWidth={1.75} />}
          <Marked text={entry.label} query={query} id={labelId} />
          <Count item={entry} />
        </div>
        <Collapse open={open} duration="base">
          {/* The guide line runs under the branch's chevron. */}
          <ul role="group" className="ms-3.75 flex flex-col gap-0.5 border-s border-line ps-1.5 pt-0.5">
            {entry.items!.map((child, i) => item(child, level + 1, i, entry.items!.length))}
          </ul>
        </Collapse>
      </li>
    )
  }

  return (
    <div ref={root} onKeyDown={onKeyDown} className="relative isolate flex min-w-0 flex-col">
      {nav.map((section) => {
        const heading = `${idBase}-${section.id}`
        const named = headings && section.label
        return (
          <div key={section.id} className="flex flex-col gap-0.5 py-1">
            {named && <FrameSectionLabel id={heading}>{section.label}</FrameSectionLabel>}
            <ul role="tree" aria-labelledby={named ? heading : undefined} aria-label={named ? undefined : section.label} className="flex flex-col gap-0.5">
              {section.items.map((entry, i) => item(entry, 1, i, section.items.length))}
            </ul>
          </div>
        )
      })}
      <SlidingIndicator match="[data-yj-here]" className={KEYS[current]} />
    </div>
  )
}
