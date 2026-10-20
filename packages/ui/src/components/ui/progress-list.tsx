'use client'

import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { AnimatePresence, m } from 'motion/react'
import { Fragment, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { MotionFeatures } from '@youj/core'
import { Collapse, PresenceItem, PresenceList } from '@youj/motion'
import { AlertTriangleIcon, CheckIcon, FileCodeIcon, FileIcon, FileImageIcon, FileTextIcon, PlayIcon, RotateCcwIcon, XIcon } from '@youj/icons'
import { progressListLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat, byteParts, byteUnit } from '../../lib/utils'
import { Button } from './button'
import { SegmentedMeter } from './segmented-meter'
import { Eyebrow } from './typography'

/* File transfers in flight, one row each: a run of cells that lights as the
 * bytes move (like SegmentedMeter), what's moved of the size, the live rate
 * and the time left in mono, and pause, resume and cancel on every row.
 * - Order: failed rows first, then the ones moving, then queued, and the
 *   done ones sink to the foot. Past `max` rows the rest fold under "Show N
 *   more", so a list of hundreds stays one screen.
 * - Settle: a finished row lets go of its well, its cells fold away, the file
 *   glyph turns into a drawn check and the row glides down to the done pile.
 *   A failed row lights its cells in the danger tone up to where it broke,
 *   says why, and offers Retry.
 * - Motion: cells light on the fast token; the next cell to fill breathes
 *   while bytes arrive; rows enter, leave and reorder through PresenceList.
 * - Screen readers: each row is a named progressbar; finishing and failing
 *   are announced. Focus moves to the next row when a row leaves under it.
 * - Reduced motion: cells light at once, rows fold and move in place, the
 *   check is drawn and nothing breathes.
 * TransferSummary is the header: the bytes moved of the total, an overall
 * meter, the combined rate and time left, and optional all-row actions. */

type TransferStatus = 'queued' | 'active' | 'paused' | 'done' | 'failed'

interface TransferItem {
  id: string
  name: string
  /** The file's size, in bytes. */
  size: number
  /** Bytes moved so far. */
  transferred: number
  /** Bytes a second while active. */
  rate?: number
  status: TransferStatus
  /** Why it failed, shown under a failed row. */
  error?: string
  /** The glyph in the row's disc while it moves. Default: a file glyph picked from the name's extension. */
  icon?: ReactNode
}

type Labels = typeof progressListLabels

/** How a size (bytes) and a rate (bytes a second) are written. Default: decimal bytes in the locale ("48.2 MB", "2.9 MB/s"); pass one when the unit is something else (rows, frames, items). */
interface TransferFormat {
  size?: (bytes: number) => string
  rate?: (bytesPerSecond: number) => string
}

const asParts = (text: string): Intl.NumberFormatPart[] => [{ type: 'literal', value: text }]
/** A size as parts: yours, or the bytes in the locale (`unit` pins the unit, see `byteUnit`). */
const sizeParts = (bytes: number, locale: string, format?: TransferFormat, unit?: number) =>
  format?.size ? asParts(format.size(bytes)) : byteParts(bytes, locale, { base: 1000, unit })
const rateParts = (bytes: number, locale: string, format?: TransferFormat) =>
  format?.rate ? asParts(format.rate(bytes)) : byteParts(bytes, locale, { base: 1000, perSecond: true })

const RANK: Record<TransferStatus, number> = { failed: 0, active: 1, paused: 1, queued: 2, done: 3 }
const OFF = 'own:bg-[color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_9%,transparent))]'
const WELL = 'own:bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))]'
const LIT: Record<TransferStatus, string> = {
  queued: 'own:bg-fg',
  active: 'own:bg-fg',
  paused: 'own:bg-line-strong',
  done: 'own:bg-success',
  failed: 'own:bg-danger',
}
const DISC: Record<TransferStatus, string> = {
  queued: 'own:bg-hover own:text-fg-muted',
  active: 'own:bg-band own:text-fg',
  paused: 'own:bg-hover own:text-fg-muted',
  done: 'own:bg-success-subtle own:text-success-text',
  failed: 'own:bg-danger-subtle own:text-danger-text',
}

/** A figure with its unit muted. */
function Figure({ parts }: { parts: Intl.NumberFormatPart[] }) {
  return (
    <span className="whitespace-nowrap own:text-fg own:tabular-nums">
      {parts.map((p, i) =>
        p.type === 'unit' ? (
          <span key={i} className="own:text-fg-muted">
            {p.value}
          </span>
        ) : (
          p.value
        ),
      )}
    </span>
  )
}

/** A label with figures in it, split around them so each keeps its own styling. */
function fill(template: (...values: string[]) => string, ...figures: ReactNode[]) {
  const text = template(...figures.map((_, i) => `\uE000${i}\uE000`))
  return text.split(/\uE000(\d+)\uE000/).map((part, i) => (i % 2 ? <Fragment key={i}>{figures[Number(part)]}</Fragment> : part))
}

/** A status word inside a phrase: "2 queued". Only the first letter, so a German noun keeps its capital. */
const lowerFirst = (text: string, locale: string) => text.charAt(0).toLocaleLowerCase(locale) + text.slice(1)

/** Seconds as a clock: "0:42", "1:04:09". */
function clock(seconds: number, locale: string) {
  const s = Math.max(0, Math.round(seconds))
  const two = numberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }).format
  const one = numberFormat(locale, { useGrouping: false }).format
  const h = Math.floor(s / 3600)
  const min = Math.floor((s % 3600) / 60)
  return h ? `${one(h)}:${two(min)}:${two(s % 60)}` : `${one(min)}:${two(s % 60)}`
}

function Glyph({ name }: { name: string }) {
  if (/\.(png|jpe?g|gif|webp|avif|heic|svg)$/i.test(name)) return <FileImageIcon size={16} />
  if (/\.(json|jsonl|csv|parquet|sql|ya?ml|js|ts|py|zip|tar|gz)$/i.test(name)) return <FileCodeIcon size={16} />
  if (/\.(pdf|docx?|txt|md|pptx?|xlsx?|key)$/i.test(name)) return <FileTextIcon size={16} />
  return <FileIcon size={16} />
}

interface TransferRowProps {
  item: TransferItem
  labels: Labels
  locale: string
  format?: TransferFormat
  segments: number
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onCancel?: (id: string) => void
  onRetry?: (id: string) => void
}

function TransferRow({ item, labels, locale, format, segments, onPause, onResume, onCancel, onRetry }: TransferRowProps) {
  const k = useYouj()
  const { status, name } = item
  const fraction = item.size > 0 ? Math.min(1, Math.max(0, item.transferred / item.size)) : 0
  const done = status === 'done'
  // Whole cells only: a row shows full when it's done, not a byte before.
  const lit = done ? segments : Math.min(segments - 1, Math.floor(fraction * segments))
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(done ? 1 : Math.min(0.99, fraction))
  const unit = byteUnit(item.size, 1000)
  const moved = fill(labels.transferProgress, <Figure parts={sizeParts(item.transferred, locale, format, unit)} />, <Figure parts={sizeParts(item.size, locale, format)} />)
  const rate = item.rate ?? 0
  const swap = k.reduced ? { type: false as const } : k.spring('snappy')

  let meta: ReactNode = null
  if (status === 'active' && rate > 0)
    meta = (
      <>
        <Figure parts={rateParts(rate, locale, format)} />
        <span aria-hidden className="own:text-fg-subtle">
          ·
        </span>
        <span className="own:text-fg-muted">{fill(labels.transferLeft, <span className="own:text-fg">{clock((item.size - item.transferred) / rate, locale)}</span>)}</span>
      </>
    )
  else if (status === 'paused' || status === 'queued') meta = <span className="own:text-fg-muted">{status === 'paused' ? labels.transferPaused : labels.transferQueued}</span>

  return (
    <div
      data-slot="progress-list-row"
      data-status={status}
      data-reduced-motion={k.reduced || undefined}
      className={cn(
        'own:grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 own:rounded-xl own:ps-2.5 own:pe-3 transition-[background-color,padding] yj-duration-base ease-standard own:sm:px-4',
        done ? 'own:bg-transparent own:py-1.5' : cn(WELL, 'own:py-3'),
        status === 'failed' && 'own:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-danger)_28%,transparent)]',
      )}
    >
      <span
        data-slot="progress-list-icon"
        aria-hidden
        className={cn(
          'relative col-start-1 row-start-1 own:grid size-8 place-items-center own:rounded-full sm:row-span-2 transition-[background-color,color,scale] yj-duration-base ease-standard *:col-start-1 *:row-start-1',
          DISC[status],
          done && 'scale-75',
        )}
      >
        <AnimatePresence initial={false}>
          <m.span
            key={done ? 'done' : status === 'failed' ? 'failed' : 'file'}
            className="grid place-items-center"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6, transition: k.reduced ? { type: false } : k.tween('fast', 'exit') }}
            transition={swap}
          >
            {done ? <CheckIcon size={18} strokeWidth={2} trigger={k.reduced ? 'none' : 'mount'} /> : status === 'failed' ? <AlertTriangleIcon size={16} /> : (item.icon ?? <Glyph name={name} />)}
          </m.span>
        </AnimatePresence>
      </span>

      <div data-slot="progress-list-body" className="col-start-2 row-start-1 own:flex min-w-0 items-baseline gap-3">
          <span data-slot="progress-list-name" className={cn('min-w-0 flex-1 truncate own:font-mono own:text-ui', done ? 'own:text-fg-muted' : 'own:text-fg')} title={name}>
            {name}
          </span>
          <span data-slot="progress-list-value" className="shrink-0 own:font-mono own:text-ui-sm own:tabular-nums">
            {done ? <Figure parts={sizeParts(item.size, locale, format)} /> : <span className={status === 'failed' ? 'own:text-danger-text' : 'own:text-fg'}>{percent}</span>}
          </span>
      </div>
      <Collapse open={!done} className="col-start-2 col-end-4 row-start-2 min-w-0 sm:col-end-3">
          <ProgressPrimitive.Root
            value={Math.round(fraction * 1000) / 10}
            locale={locale}
            aria-label={name}
            getAriaValueText={(formatted) => `${formatted}, ${status === 'paused' ? labels.transferPaused : status === 'queued' ? labels.transferQueued : status === 'failed' ? (item.error ?? labels.transferFailed(name)) : labels.transferProgress(sizeParts(item.transferred, locale, format, unit).map((p) => p.value).join(''), sizeParts(item.size, locale, format).map((p) => p.value).join(''))}`}
            data-slot="progress-list-progress"
            className="own:flex flex-col gap-2 own:pt-2.5"
          >
            <span data-slot="progress-list-track" aria-hidden className="own:flex h-2 gap-0.5">
              {Array.from({ length: segments }, (_, i) => {
                const on = i < lit
                const next = status === 'active' && i === lit && !k.reduced
                return (
                  <span
                    key={i}
                    data-slot="progress-list-cell"
                    data-state={on ? 'on' : 'off'}
                    className={cn('relative min-w-0 flex-1 own:rounded-[2px] transition-[background-color] yj-duration-fast ease-standard', on ? LIT[status] : OFF)}
                  >
                    {next && (
                      <m.span
                        className="absolute inset-0 rounded-[inherit] bg-line-strong"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: k.duration('deliberate') * 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                  </span>
                )
              })}
            </span>
            <span data-slot="progress-list-meta" className="own:flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 own:font-mono own:text-ui-sm">
              <span className="own:text-fg-muted">{moved}</span>
              {status === 'failed' ? (
                <span data-slot="progress-list-error" className="min-w-0 truncate own:text-danger-text">
                  {item.error ?? labels.transferFailed(name)}
                </span>
              ) : (
                meta && (
                  <span data-slot="progress-list-status" className="own:flex items-baseline gap-1.5">
                    {meta}
                  </span>
                )
              )}
            </span>
          </ProgressPrimitive.Root>
      </Collapse>

      {!done && (
      <div data-slot="progress-list-actions" className="col-start-3 row-start-1 own:flex items-center gap-1.5 sm:row-span-2">
        {status === 'failed' && onRetry ? (
          <Button data-slot="progress-list-action" variant="secondary" size="icon-sm" aria-label={labels.fileRetry(name)} onClick={() => onRetry(item.id)}>
            <RotateCcwIcon size={14} />
          </Button>
        ) : (status === 'active' && onPause) || (status === 'paused' && onResume) ? (
          <Button
            data-slot="progress-list-action"
            variant="secondary"
            size="icon-sm"
            aria-label={status === 'active' ? labels.transferPause(name) : labels.transferResume(name)}
            onClick={() => (status === 'active' ? onPause?.(item.id) : onResume?.(item.id))}
          >
            <PlayIcon size={14} active={status === 'active'} />
          </Button>
        ) : (
          // Holds the slot, so every row's cells end on the same line.
          <span aria-hidden className="size-control-sm" />
        )}
        {onCancel && (
          <Button data-slot="progress-list-action" variant="secondary" size="icon-sm" aria-label={labels.transferCancel(name)} onClick={() => onCancel(item.id)}>
            <XIcon size={14} />
          </Button>
        )}
      </div>
      )}
    </div>
  )
}

interface ProgressListProps extends Omit<ComponentProps<'div'>, 'children' | 'onPause'> {
  items: TransferItem[]
  /** Rows shown before the rest fold under "Show N more". Default 6; 0 shows every row. */
  max?: number
  /** Cells per row. Default 32. */
  segments?: number
  /** Default: the YoujProvider locale. */
  locale?: string
  /** The list's accessible name. Default "Transfers". */
  label?: string
  /** Writes sizes and rates in your unit. Default: decimal bytes in the locale. */
  format?: TransferFormat
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  /** Without it a row has no cancel button. */
  onCancel?: (id: string) => void
  /** Without it a failed row has no Retry. */
  onRetry?: (id: string) => void
}

function ProgressList({ items, max = 6, segments = 32, locale: localeProp, label, format, onPause, onResume, onCancel, onRetry, className, ...props }: ProgressListProps) {
  const labels = useComponentLabels(progressListLabels)
  const locale = useLocale(localeProp)
  const { announce, announcer } = useAnnouncer()
  const [expanded, setExpanded] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  // Where focus was among the rows, and where it should go after a cancel.
  const focusAt = useRef<{ id: string; index: number } | undefined>(undefined)
  const moveTo = useRef<string | undefined>(undefined)
  const seen = useRef(new Map(items.map((i) => [i.id, i.status])))

  const ordered = items.map((item, i) => ({ item, i })).sort((a, b) => RANK[a.item.status] - RANK[b.item.status] || a.i - b.i).map((x) => x.item)
  const folded = max > 0 && ordered.length > max && !expanded
  const shown = folded ? ordered.slice(0, max) : ordered
  const rest = ordered.slice(shown.length)

  useLayoutEffect(() => {
    // Say when a row finishes or fails; a row that arrives that way was never in flight here.
    for (const item of items) {
      const before = seen.current.get(item.id)
      if (before && before !== item.status && (item.status === 'done' || item.status === 'failed'))
        announce(item.status === 'done' ? labels.transferFinished(item.name) : labels.transferFailed(item.name))
    }
    seen.current = new Map(items.map((i) => [i.id, i.status]))

    const list = listRef.current
    if (!list) return
    const rows = [...list.querySelectorAll<HTMLElement>('[data-slot="progress-list-item"]')].filter((r) => !r.hasAttribute('inert'))
    const actionOf = (row?: HTMLElement) => row?.querySelector<HTMLElement>('[data-slot="progress-list-action"]')
    if (moveTo.current !== undefined) {
      const target = rows.find((r) => r.dataset.id === moveTo.current)
      moveTo.current = undefined
      ;(actionOf(target) ?? list).focus()
      return
    }
    // The focused button went away (its file finished, or it swapped for another): stay on the row if it still
    // has a button, else take the row now in its place. No blur fired, so this wasn't the person moving on.
    const at = focusAt.current
    if (!at || (document.activeElement && document.activeElement !== document.body)) return
    const live = rows.filter((r) => actionOf(r))
    ;(actionOf(rows.find((r) => r.dataset.id === at.id)) ?? actionOf(live[Math.min(at.index, live.length - 1)]) ?? list).focus()
  })

  const cancel =
    onCancel &&
    ((id: string) => {
      // Focus goes to the next row with buttons, or the one before.
      const i = shown.findIndex((x) => x.id === id)
      const open = (x: TransferItem) => x.status !== 'done'
      moveTo.current = (shown.slice(i + 1).find(open) ?? shown.slice(0, Math.max(0, i)).reverse().find(open))?.id ?? ''
      onCancel(id)
    })
  const counts = rest.reduce<Partial<Record<TransferStatus, number>>>((acc, i) => ({ ...acc, [i.status]: (acc[i.status] ?? 0) + 1 }), {})

  return (
    <MotionFeatures>
      <div
        ref={listRef}
        tabIndex={-1}
        data-slot="progress-list"
        className={cn('own:flex flex-col gap-1.5 outline-none', className)}
        onFocus={(e) => {
          const row = (e.target as HTMLElement).closest<HTMLElement>('[data-slot="progress-list-item"]')
          const rows = [...e.currentTarget.querySelectorAll('[data-slot="progress-list-item"]')]
          focusAt.current = row?.dataset.id ? { id: row.dataset.id, index: rows.indexOf(row) } : undefined
        }}
        onBlur={() => (focusAt.current = undefined)}
        {...props}
      >
        <PresenceList aria-label={label ?? labels.transfers} className="own:flex flex-col gap-1.5">
          {shown.map((item) => (
            <PresenceItem key={item.id} data-slot="progress-list-item" data-id={item.id} data-status={item.status}>
              <TransferRow
                item={item}
                labels={labels}
                locale={locale}
                format={format}
                segments={segments}
                onPause={onPause}
                onResume={onResume}
                onCancel={cancel}
                onRetry={onRetry}
              />
            </PresenceItem>
          ))}
        </PresenceList>
        {max > 0 && ordered.length > max && (
          <button
            type="button"
            data-slot="progress-list-more"
            aria-expanded={expanded}
            onClick={() => setExpanded((e) => !e)}
            className="focus-ring own:flex min-h-control-sm items-center justify-center gap-2 own:rounded-xl own:px-3 own:text-ui own:text-fg-muted transition-[background-color,color] yj-duration-fast ease-standard own:hover:bg-hover own:hover:text-fg"
          >
            <span>{expanded ? labels.showFewer : labels.showMoreCount(rest.length)}</span>
            {folded &&
              (['paused', 'queued', 'done'] as const)
                .filter((st) => counts[st])
                .map((st) => (
                  <span key={st} aria-hidden className="own:flex items-baseline gap-2">
                    <span className="own:text-fg-subtle">·</span>
                    <span>
                      <span className="own:font-mono own:text-ui-sm own:tabular-nums">{numberFormat(locale).format(counts[st]!)}</span>{' '}
                      {lowerFirst(st === 'done' ? labels.done : st === 'queued' ? labels.transferQueued : labels.transferPaused, locale)}
                    </span>
                  </span>
                ))}
          </button>
        )}
        {announcer}
      </div>
    </MotionFeatures>
  )
}

interface TransferSummaryProps extends Omit<ComponentProps<'div'>, 'children'> {
  items: TransferItem[]
  /** Cells in the overall meter. Default 48. */
  segments?: number
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Writes sizes and rates in your unit. Default: decimal bytes in the locale. */
  format?: TransferFormat
  /** With these, the summary carries Pause all / Resume all and Cancel all. */
  onPauseAll?: () => void
  onResumeAll?: () => void
  onCancelAll?: () => void
}

/** The total over a ProgressList: bytes moved of all, an overall meter, the combined rate and the time left. */
function TransferSummary({ items, segments = 48, locale: localeProp, format, onPauseAll, onResumeAll, onCancelAll, className, ...props }: TransferSummaryProps) {
  const labels = useComponentLabels(progressListLabels)
  const locale = useLocale(localeProp)
  const size = items.reduce((sum, i) => sum + i.size, 0)
  const moved = items.reduce((sum, i) => sum + (i.status === 'done' ? i.size : i.transferred), 0)
  const rate = items.reduce((sum, i) => sum + (i.status === 'active' ? (i.rate ?? 0) : 0), 0)
  const left = items.filter((i) => i.status !== 'done' && i.status !== 'failed').reduce((sum, i) => sum + i.size - i.transferred, 0)
  const done = items.filter((i) => i.status === 'done').length
  const running = items.some((i) => i.status === 'active' || i.status === 'queued')
  const open = items.some((i) => i.status !== 'done')

  return (
    <div data-slot="transfer-summary" className={cn('own:flex flex-col gap-4', className)} {...props}>
      <div className="own:flex flex-wrap items-center justify-between gap-3">
        <p data-slot="transfer-summary-figure" className="own:font-mono own:text-2xl own:leading-none own:tracking-tight own:text-fg-muted">
          {fill(labels.transferProgress, <Figure parts={sizeParts(moved, locale, format, byteUnit(size, 1000))} />, <Figure parts={sizeParts(size, locale, format)} />)}
        </p>
        {(onPauseAll || onResumeAll || onCancelAll) && open && (
          <div data-slot="transfer-summary-actions" className="own:flex gap-2">
            {running ? onPauseAll && <Button variant="secondary" size="sm" onClick={onPauseAll}>{labels.transferPauseAll}</Button> : onResumeAll && <Button variant="secondary" size="sm" onClick={onResumeAll}>{labels.transferResumeAll}</Button>}
            {onCancelAll && (
              <Button variant="secondary" size="sm" onClick={onCancelAll}>
                {labels.transferCancelAll}
              </Button>
            )}
          </div>
        )}
      </div>
      <SegmentedMeter data-slot="transfer-summary-meter" label={labels.transferFiles(done, items.length)} value={size ? (moved / size) * 100 : 0} segments={segments} locale={locale} />
      <dl className="grid grid-cols-2 gap-2">
        {[
          { key: 'rate', label: labels.transferRate, value: rate > 0 ? <Figure parts={rateParts(rate, locale, format)} /> : '—' },
          { key: 'left', label: labels.transferTimeLeft, value: rate > 0 && left > 0 ? clock(left / rate, locale) : '—' },
        ].map((stat) => (
          <div key={stat.key} data-slot="transfer-summary-stat" className={cn('own:flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 own:rounded-xl own:px-3.5 own:py-2.5', WELL)}>
            <Eyebrow render={<dt />}>{stat.label}</Eyebrow>
            <dd className="own:font-mono own:text-ui-lg text-fg own:tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export { ProgressList, TransferSummary, type TransferFormat, type TransferItem, type ProgressListProps, type TransferStatus, type TransferSummaryProps }
