'use client'

import { useRef, useState, type ComponentProps, type CSSProperties } from 'react'
import { m } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { EraserIcon } from '@youj/icons/components/youj/icons/eraser'
import { MoreHorizontalIcon } from '@youj/icons/components/youj/icons/more-horizontal'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../../lib/utils'
import { ConfirmDialog } from '../alert-dialog'
import { Button } from '../button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../dropdown-menu'
import type { TranslationStatus } from './multi-language-input-model'
import { useMultiLanguageContext } from './multi-language-input-provider'

/* Status is told by shape first and color second, so it reads without
 * color and at 12px: a filled disc with a check (complete), a hollow ring
 * (missing), a half-filled ring (outdated: right once, the source moved on),
 * a dashed ring (needs review) and a diamond (the source). A glyph that
 * changes after it first rendered pops in on the fast token, and a locale
 * becoming complete draws its check and lands on the settle spring. */

function StatusGlyph({ status, className }: { status: TranslationStatus; className?: string }) {
  const k = useYouj()
  // Only a change animates: a page of glyphs appears still.
  const seen = useRef(status)
  const changed = useRef(false)
  if (seen.current !== status) {
    seen.current = status
    changed.current = true
  }
  const moving = changed.current && !k.reduced
  return (
    <MotionFeatures>
      <m.svg
        key={status}
        aria-hidden
        viewBox="0 0 12 12"
        data-status={status}
        className={cn('size-3 shrink-0 overflow-visible', className)}
        initial={moving ? { scale: 0.4, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={status === 'complete' ? k.spring('settle') : k.tween('fast', 'enter')}
      >
        {status === 'complete' && (
          <>
            <circle cx="6" cy="6" r="5.25" className="fill-success" />
            <m.path
              d="M3.6 6.2 5.3 7.8 8.4 4.5"
              className="fill-none stroke-canvas"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={moving ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={k.tween('base', 'enter')}
            />
          </>
        )}
        {status === 'missing' && <circle cx="6" cy="6" r="4.5" className="fill-none stroke-fg-subtle" strokeWidth={1.5} />}
        {status === 'outdated' && (
          <>
            <circle cx="6" cy="6" r="4.5" className="fill-none stroke-warning" strokeWidth={1.5} />
            <path d="M6 1.5a4.5 4.5 0 0 0 0 9z" className="origin-center fill-warning rtl:-scale-x-100" />
          </>
        )}
        {status === 'review' && <circle cx="6" cy="6" r="4.5" className="fill-none stroke-accent" strokeWidth={1.5} strokeDasharray="2.2 1.6" />}
        {status === 'source' && <path d="M6 1.4 10.6 6 6 10.6 1.4 6z" className="fill-fg-muted" />}
      </m.svg>
    </MotionFeatures>
  )
}

/* ── Progress ─────────────────────────────────────────────────────────── */

type Segment = 'complete' | 'review' | 'outdated'
const SEGMENT_CLASS: Record<Segment, string> = { complete: 'bg-success', review: 'bg-accent', outdated: 'bg-warning' }

function useProgress(locale: string | undefined) {
  const { summaries, locales, labels } = useMultiLanguageContext()
  const counts = { complete: 0, review: 0, outdated: 0, missing: 0 }
  let total = 0
  if (locale) {
    const summary = summaries[locale]
    if (summary) {
      counts.complete = summary.counts.complete + summary.counts.source
      counts.review = summary.counts.review
      counts.outdated = summary.counts.outdated
      counts.missing = summary.counts.missing
      total = summary.fields
    }
  } else {
    for (const l of locales) {
      const status = summaries[l.code]?.status ?? 'missing'
      counts[status === 'source' ? 'complete' : status]++
    }
    total = locales.length
  }
  const complete = locale ? labels.fieldsComplete(counts.complete, total) : labels.languagesComplete(counts.complete, total)
  const text = [
    complete,
    ...(['outdated', 'review', 'missing'] as const).filter((s) => counts[s] > 0).map((s) => labels.translationCount(counts[s], s)),
  ].join(', ')
  return { counts, total, text, complete, name: labels.translationProgress }
}

interface MultiLanguageProgressProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** 'ring' is compact, for a toolbar; 'bar' also shows what's outdated or waiting for review. Default 'ring'. */
  variant?: 'ring' | 'bar'
  /** One locale across the fields. Default: every locale. */
  locale?: string
  /** Shows the count: "12/16" beside a ring, a caption with a legend over a bar. Default: true for a ring, false for a bar. */
  showCount?: boolean
}

/** How much is translated, as a progress bar: a ring, or a bar broken down by status. Its value text reads the whole breakdown. */
function MultiLanguageProgress({ variant = 'ring', locale, showCount = variant === 'ring', className, ...props }: MultiLanguageProgressProps) {
  const k = useYouj()
  const { counts, total, text, complete, name } = useProgress(locale)
  const fraction = total ? counts.complete / total : 0
  const done = total > 0 && counts.complete === total
  const meter = {
    role: 'progressbar',
    'aria-valuemin': 0,
    'aria-valuemax': total,
    'aria-valuenow': counts.complete,
    'aria-valuetext': text,
    'aria-label': name,
  } as const

  if (variant === 'bar') {
    let start = 0
    const segments = (['complete', 'review', 'outdated'] as const).map((key) => {
      const size = total ? counts[key] / total : 0
      const segment = { key, start, size }
      start += size
      return segment
    })
    return (
      <div data-slot="multi-language-progress" data-variant="bar" className={cn('own:flex w-full flex-col own:gap-2', className)} {...props}>
        {showCount && (
          <div aria-hidden className="own:flex items-center justify-between own:gap-3 own:text-ui-sm text-fg-muted">
            <span className="truncate">{complete}</span>
            <span className="own:flex shrink-0 items-center own:gap-2.5 own:tabular-nums">
              {(['outdated', 'review', 'missing'] as const)
                .filter((s) => counts[s] > 0)
                .map((s) => (
                  <span key={s} className="own:flex items-center own:gap-1">
                    <StatusGlyph status={s} />
                    {counts[s]}
                  </span>
                ))}
            </span>
          </div>
        )}
        <div {...meter} className="relative h-1.5 w-full own:overflow-hidden own:rounded-full own:bg-well">
          {segments.map(({ key, start, size }) => (
            <span
              key={key}
              className={cn(
                'absolute inset-y-0 start-0 w-full origin-left rtl:origin-right',
                '[scale:var(--size)_1] [translate:calc(var(--start)*100%)_0] rtl:[translate:calc(var(--start)*-100%)_0]',
                'transition-[translate,scale] yj-duration-slow ease-standard',
                SEGMENT_CLASS[key],
              )}
              style={{ '--start': start, '--size': size } as CSSProperties}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div data-slot="multi-language-progress" data-variant="ring" className={cn('own:flex items-center own:gap-1.5', className)} {...props}>
      <svg {...meter} viewBox="0 0 16 16" className="size-4 shrink-0 -rotate-90 own:overflow-visible">
        <circle cx="8" cy="8" r="6" className="fill-none stroke-line" strokeWidth={2} />
        <MotionFeatures>
          <m.circle
            cx="8"
            cy="8"
            r="6"
            strokeWidth={2}
            strokeLinecap="round"
            className={cn('fill-none transition-[stroke] yj-duration-base ease-standard', done ? 'stroke-success' : 'stroke-accent')}
            initial={false}
            animate={{ pathLength: fraction, opacity: fraction > 0 ? 1 : 0 }}
            transition={k.reduced ? { type: false } : k.spring('smooth')}
          />
        </MotionFeatures>
      </svg>
      {showCount && (
        <span aria-hidden className="own:text-ui-sm own:text-fg-muted own:tabular-nums">
          {counts.complete}/{total}
        </span>
      )}
    </div>
  )
}

/* ── Bulk actions ─────────────────────────────────────────────────────── */

interface MultiLanguageActionsProps {
  className?: string
  /** The locale the actions apply to. Default: the one being edited. */
  locale?: string
}

/**
 * A menu of actions over every field in a locale: fill the empty ones from
 * the source, mark them all reviewed, or clear them (after a confirm). Each
 * is announced; pass `onBulkAction` to the provider to offer an Undo.
 */
function MultiLanguageActions({ className, locale: localeProp }: MultiLanguageActionsProps) {
  const { active, sourceLocale, byCode, summaries, labels, bulk } = useMultiLanguageContext()
  const [confirming, setConfirming] = useState(false)
  const locale = localeProp ?? active
  const summary = summaries[locale]
  const name = byCode.get(locale)?.label ?? locale
  const isSource = locale === sourceLocale
  const counts = summary?.counts
  const filled = summary ? summary.fields - summary.counts.missing : 0
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={labels.translationActions} className={className}>
              <MoreHorizontalIcon size={16} />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-60">
          <DropdownMenuItem disabled={isSource || !counts?.missing} onClick={() => bulk('copy', locale)}>
            {labels.fillFromSource(byCode.get(sourceLocale)?.label ?? sourceLocale)}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isSource || !(counts && (counts.outdated || counts.review))} onClick={() => bulk('review', locale)}>
            {labels.markAllReviewed}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="danger" disabled={isSource || filled === 0} onClick={() => setConfirming(true)}>
            <EraserIcon size={16} />
            {labels.clearLanguage(name)}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        destructive
        title={`${labels.clearLanguage(name)}?`}
        description={labels.clearLanguageDescription(name, filled)}
        confirmLabel={labels.clearLanguage(name)}
        onConfirm={() => bulk('clear', locale)}
      />
    </>
  )
}

export { MultiLanguageActions, MultiLanguageProgress, StatusGlyph }
export type { MultiLanguageActionsProps, MultiLanguageProgressProps }
