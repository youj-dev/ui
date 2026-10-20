'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { AnimatePresence, m } from 'motion/react'
import type { RowData } from '@tanstack/react-table'
import { CircleAlertIcon, InboxIcon, RotateCwIcon, SearchXIcon } from '@youj/icons'
import { useYouj } from '@youj/core'
import { Button } from '../../../components/ui/button'
import type { DataTableColumn } from '../../../components/ui/data-table'
import { cn } from '../../../lib/utils'
import type { DataTableCopy } from './copy'

/**
 * Watches the scroll area's edges: `data-overflow-start`/`-end` while columns
 * hide under a side (the pinned columns' shadows and the scroll cues read
 * them), `data-scrolled` once rows pass under the header, and whether it
 * scrolls at all (then it takes a Tab stop of its own, so the keyboard can
 * scroll it too). Measured once per frame, not per scroll event: reading
 * scroll geometry right after the virtualizer writes rows would force a layout
 * each time. `schedule` re-checks after a render (sizes and pinning change the
 * scroll width).
 */
export function useScrollEdges(scrollRef: RefObject<HTMLDivElement | null>) {
  const [scrollable, setScrollable] = useState(false)
  const schedule = useRef<() => void>(() => {})
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let frame = 0
    const measure = () => {
      frame = 0
      const max = el.scrollWidth - el.clientWidth
      const x = Math.abs(el.scrollLeft)
      el.toggleAttribute('data-overflow-start', x > 0.5)
      el.toggleAttribute('data-overflow-end', max - x > 0.5)
      el.toggleAttribute('data-scrolled', el.scrollTop > 0.5)
      setScrollable(max > 1 || el.scrollHeight - el.clientHeight > 1)
    }
    const update = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    schedule.current = update
    el.addEventListener('scroll', update, { passive: true })
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      schedule.current = () => {}
      el.removeEventListener('scroll', update)
      observer?.disconnect()
    }
  }, [scrollRef])
  return { scrollable, schedule }
}

/**
 * While skeleton rows resolve into data, a stand-in header holds still over
 * the swap: true from the moment the skeleton goes until the rows have
 * arrived. Never under reduced motion, where the swap is instant.
 */
export function useSkeletonSwap(skeleton: boolean) {
  const k = useYouj()
  const [swapping, setSwapping] = useState(false)
  const [wasSkeleton, setWasSkeleton] = useState(skeleton)
  if (wasSkeleton !== skeleton) {
    setWasSkeleton(skeleton)
    if (wasSkeleton && !k.reduced) setSwapping(true)
  }
  useEffect(() => {
    if (!swapping) return
    const id = setTimeout(() => setSwapping(false), k.ms('base') + k.stagger('base') * 1000 + k.ms('fast'))
    return () => clearTimeout(id)
  }, [swapping, k])
  return swapping
}

/**
 * How the body changes: a new order, filter, page or state panel replaces the
 * rows (`reorder`: those that leave go at once and the rest glide), while new
 * data in the same order animates in place (`presence`: edits, inserts and
 * removals).
 */
export function useRowChange(orderKey: string, data: unknown) {
  const [seen, setSeen] = useState({ key: orderKey, data, kind: 'presence' as 'presence' | 'reorder' })
  let change = seen
  if (orderKey !== seen.key) change = { key: orderKey, data, kind: 'reorder' }
  else if (data !== seen.data) change = { key: orderKey, data, kind: 'presence' }
  if (change !== seen) setSeen(change)
  return change.kind
}

/* The scroll cue: a soft shade on a side where columns are hidden, as a
 * pinned column's edge shows it, so a phone-width table reads as one that
 * scrolls. A side with a pinned column already has its edge. */
export const scrollCue = cn(
  'pointer-events-none absolute inset-y-0 z-4 w-6 from-(--dt-shadow) to-transparent opacity-0',
  'transition-opacity yj-duration-fast ease-standard',
)

/** While a column is dragged wider or narrower, its edge lights up the full height of the grid. */
export function ResizeGuide<TData extends RowData>({
  id,
  leafColumns,
  dir,
  scope,
}: {
  id: string | false
  leafColumns: DataTableColumn<TData>[]
  dir: 'ltr' | 'rtl'
  scope: string
}) {
  if (!id) return null
  const index = leafColumns.findIndex((column) => column.id === id)
  if (index === -1) return null
  const side = dir === 'rtl' ? 'to right' : 'to left'
  return <style>{`[data-dt-scope="${scope}"] [data-dt-col="${index}"]{background-image:linear-gradient(${side},var(--color-focus) 2px,transparent 2px)}`}</style>
}

/** The title row over the table: its heading and a line under it, and the app's buttons at its end. */
export function TableHeading({
  id,
  as: Heading,
  title,
  description,
  actions,
}: {
  id: string
  as: 'h1' | 'h2' | 'h3' | 'h4'
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header data-slot="data-table-header" className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Heading id={id} className="text-ui-lg font-semibold tracking-tight text-balance text-fg">
          {title}
        </Heading>
        {description && <p className="text-ui-sm text-pretty text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/** The progress line under the header while rows refetch: it waits a beat, so a quick answer never flickers. */
export function RefetchLine({ active }: { active: boolean }) {
  const k = useYouj()
  return (
    <div aria-hidden className="pointer-events-none sticky top-(--dt-head-h) z-4 h-0">
      <div
        data-reduced-motion={k.reduced || undefined}
        className={cn('absolute inset-x-0 top-0 h-0.5 overflow-hidden opacity-0', 'transition-opacity yj-duration-fast ease-standard', active && 'opacity-100 delay-(--yj-duration-fast)')}
      >
        <div className="h-full w-full origin-left animate-indeterminate bg-accent rtl:[animation-direction:reverse] reduced:animate-none reduced:opacity-50" />
      </div>
    </div>
  )
}

/**
 * What stands in for the rows: an error with Retry, no matches with Clear
 * filters, or the empty state. A state panel and rows never share the body:
 * the rows it replaces leave at once (reorder mode), and it leaves at once
 * when rows return, so each arrives into an empty frame and nothing overlaps.
 */
export function StatusPanel({
  status,
  filtered,
  error,
  empty,
  onRetry,
  onClearFilters,
  copy,
}: {
  status: 'error' | 'empty' | 'rows'
  filtered: boolean
  error: ReactNode
  empty?: ReactNode
  onRetry?: () => void
  onClearFilters: () => void
  copy: DataTableCopy
}) {
  const k = useYouj()
  let panel: ReactNode = null
  if (status === 'error')
    panel = (
      <StatePanel
        tone="error"
        icon={<CircleAlertIcon trigger="none" />}
        title={copy.loadFailed(copy.noun)}
        description={typeof error === 'string' ? error : error === true ? undefined : error}
        action={
          onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCwIcon />
              {copy.tryAgain}
            </Button>
          )
        }
      />
    )
  else if (filtered)
    panel = (
      <StatePanel
        icon={<SearchXIcon />}
        title={copy.noMatches(copy.noun)}
        description={copy.noMatchesHint}
        action={
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            {copy.clearFilters}
          </Button>
        }
      />
    )
  else panel = empty ?? <StatePanel icon={<InboxIcon />} title={copy.noItems(copy.noun)} description={copy.emptyHint(copy.noun)} />
  return (
    <AnimatePresence initial={false}>
      {status !== 'rows' && (
        <m.div
          key={status}
          data-slot={`data-table-${status}`}
          initial={k.reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0, transition: k.reduced ? { type: false } : k.tween('base', 'enter') }}
        >
          {panel}
        </m.div>
      )}
    </AnimatePresence>
  )
}

function StatePanel({ icon, title, description, action, tone }: { icon: ReactNode; title: string; description?: ReactNode; action?: ReactNode; tone?: 'error' }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span
        aria-hidden
        className={cn(
          'grid size-10 place-items-center rounded-xl border border-line bg-band text-fg-muted [&_svg]:size-5',
          tone === 'error' && 'border-danger-line bg-danger-subtle text-danger-text',
        )}
      >
        {icon}
      </span>
      {/* Only the words are live: the action is not part of the message. */}
      <div role={tone === 'error' ? 'alert' : 'status'} className="flex max-w-sm flex-col gap-1">
        <p className="text-ui-lg font-medium text-fg">{title}</p>
        {description && <p className="text-ui text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/**
 * The table's height, held from its first paint (again whenever `key`, the
 * app's own sizing, changes): a search and its chips, a filter, a shorter
 * page, another density or an empty state never resize the block; rows
 * scroll in what's left. It follows the UI scale.
 */
export function useSteadyHeight(el: HTMLElement | null, key: string, scale: number) {
  const [held, setHeld] = useState<{ height: number; scale: number; key: string }>()
  const current = held?.key === key ? held : undefined
  useLayoutEffect(() => {
    if (current || !el?.offsetHeight) return
    const height = el.offsetHeight
    const frame = requestAnimationFrame(() => setHeld({ height, scale, key }))
    return () => cancelAnimationFrame(frame)
  })
  return current && (current.height * scale) / current.scale
}
