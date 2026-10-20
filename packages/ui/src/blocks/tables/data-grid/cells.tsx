'use client'

import { createContext, memo, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { cn } from '../../../lib/utils'
import { hueOf, initials } from './format'
import type { DataGridOption, DataGridOptionTone, DataGridTone } from './model'

/* The cells behind the column types. Each is memoized on its values, so a
 * row that re-renders (a selection, a hover never does) only redraws what
 * changed. They read the grid through two contexts: a stable one (locale,
 * the announcer) and the clock, which only the dates subscribe to. Figures,
 * meters and trends are in figures.tsx; dates, people, switches, ids and
 * links in values.tsx. */

export interface GridEnv {
  locale: string
  announce: (message: string) => void
  /** Names a row: its `getRowLabel`, or its first column's value. */
  rowLabel: (rowId: string) => string
}
// lint-blocks-allow: a fallback no cell reads; the grid always provides the app's locale
export const GridEnvContext = createContext<GridEnv>({ locale: 'en-US', announce: () => {}, rowLabel: (id) => id })
/** The time relative dates count from: null until the browser has it (SSR). */
export const GridNowContext = createContext<number | null>(null)

const BADGE_VARIANT = {
  neutral: 'secondary',
  accent: 'default',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
} as const satisfies Record<DataGridTone, string>

/* ── Identity: an avatar or logo, a name and a second line ───────────────── */

export const IdentityCell = memo(function IdentityCell({
  name,
  secondary,
  src,
  shape = 'circle',
  leading,
}: {
  name: string
  secondary?: ReactNode
  src?: string
  shape?: 'circle' | 'square'
  /** Replaces the avatar: an icon, a flag, a file type. */
  leading?: ReactNode
}) {
  const square = shape === 'square'
  return (
    <span data-slot="data-grid-identity" className="own:flex own:min-w-0 items-center gap-3">
      {leading ?? (
        <Avatar
          aria-hidden
          data-shape={shape}
          style={{ '--dg-hue': `var(--color-chart-${hueOf(name)})` } as CSSProperties}
          className={cn(
            'size-(--dg-avatar) transition-[width,height] yj-duration-base ease-standard',
            square && 'rounded-[30%] after:rounded-[30%] *:rounded-[inherit]',
          )}
        >
          {src && <AvatarImage src={src} alt="" />}
          <AvatarFallback
            className={cn(
              'own:text-[length:calc(var(--dg-avatar)*0.38)] font-semibold tracking-tight normal-case',
              // A logo takes its name's color: a tint of one chart color, lettered in its ink.
              square &&
                'bg-[color-mix(in_oklab,var(--dg-hue)_16%,var(--color-surface))] text-[color-mix(in_oklab,var(--dg-hue)_62%,var(--color-fg))]',
            )}
          >
            {initials(name)}
          </AvatarFallback>
        </Avatar>
      )}
      <span className="own:flex min-w-0 flex-col">
        <span data-slot="data-grid-identity-name" className="truncate own:font-medium own:text-fg">
          {name}
        </span>
        {secondary !== undefined && secondary !== null && secondary !== '' && (
          <span className="truncate own:text-ui-sm own:text-fg-muted group-data-[density=compact]/dg:sr-only">{secondary}</span>
        )}
      </span>
    </span>
  )
})

/* ── Status: a badge with a dot ─────────────────────────────────────────── */

const isChartTone = (tone: DataGridOptionTone): tone is Exclude<DataGridOptionTone, DataGridTone> => tone.startsWith('chart')

export const StatusCell = memo(function StatusCell({ option }: { option: DataGridOption | undefined }) {
  if (!option) return <span className="own:text-fg-muted">—</span>
  const tone = option.tone ?? 'neutral'
  if (isChartTone(tone)) {
    // A category tints its badge the way a status does: a tenth of its chart color behind the
    // color's ink (fg mixed back in, for AA), the dot in the color itself. Inline, so no style
    // recipe's secondary fill covers it.
    const color = `var(--color-${tone})`
    return (
      <Badge
        variant="secondary"
        data-tone={tone}
        style={{ backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`, color: `color-mix(in oklab, ${color} 62%, var(--color-fg))` }}
      >
        <BadgeDot style={{ backgroundColor: color }} />
        {option.label}
      </Badge>
    )
  }
  return (
    <Badge variant={BADGE_VARIANT[tone]} data-tone={tone}>
      <BadgeDot />
      {option.label}
    </Badge>
  )
})

/* ── Tags: as many as fit, and the rest behind "+2" ──────────────────── */

const TAG_GAP = 4

/* One ResizeObserver for every tags cell on the page: each delivery reads all
 * of their widths first and then sets every count in one synchronous pass, so
 * a scroll that mounts twenty rows lays the page out once, not twenty times,
 * and no row paints with its chips overflowing. Fonts that arrive late
 * (a theme's web font) recount them all. */
interface TagWatcher {
  read: () => number
  apply: (fit: number) => void
}
const tagWatchers = new Map<Element, TagWatcher>()
let tagObserver: ResizeObserver | undefined

function recount(targets: Iterable<Element>) {
  const results: [TagWatcher, number][] = []
  for (const target of targets) {
    const watcher = tagWatchers.get(target)
    if (watcher) results.push([watcher, watcher.read()])
  }
  if (results.length) flushSync(() => results.forEach(([watcher, fit]) => watcher.apply(fit)))
}

function watchTags(el: Element, watcher: TagWatcher) {
  if (typeof ResizeObserver === 'undefined') return () => {}
  if (!tagObserver) {
    tagObserver = new ResizeObserver((entries) => recount(entries.map((entry) => entry.target)))
    document.fonts?.addEventListener?.('loadingdone', () => recount(tagWatchers.keys()))
  }
  tagWatchers.set(el, watcher)
  tagObserver.observe(el)
  return () => {
    tagWatchers.delete(el)
    tagObserver?.unobserve(el)
  }
}

/**
 * Chips at their natural width, as many as the cell holds (up to `max`), then
 * "+N" for the rest, with every tag in its accessible text and the hidden
 * ones on hover. The chips that don't fit stay rendered out of the flow, so
 * the count is measured again whenever the column, the density or the fonts
 * change.
 */
export const TagsCell = memo(function TagsCell({ tags, max }: { tags: readonly DataGridOption[]; max: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const candidates = tags.slice(0, Math.min(tags.length, max))
  const key = tags.map((tag) => tag.value).join('|')
  const [fit, setFit] = useState(candidates.length)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    return watchTags(el, {
      read: () => {
        // A chip squeezed by the row still reports its natural width as scrollWidth.
        const chips = [...el.querySelectorAll<HTMLElement>('[data-tag]')].map((chip) => Math.max(chip.offsetWidth, chip.scrollWidth))
        const plus = el.querySelector<HTMLElement>('[data-tag-more]')?.offsetWidth ?? 28
        const room = el.clientWidth
        let used = 0
        let n = 0
        for (; n < chips.length; n++) {
          const width = chips[n]! + (n > 0 ? TAG_GAP : 0)
          const left = tags.length - (n + 1)
          if (used + width + (left > 0 ? TAG_GAP + plus : 0) > room + 0.5) break
          used += width
        }
        return Math.max(1, n)
      },
      apply: (next) => setFit((old) => (old === next ? old : next)),
    })
  }, [key, tags.length])

  if (tags.length === 0) return <span className="own:text-fg-muted">—</span>
  const shown = Math.min(fit, candidates.length)
  const rest = tags.slice(shown)
  const out = 'invisible absolute start-0 top-0'
  return (
    <span ref={ref} className="relative own:flex w-full min-w-0 items-center gap-1 overflow-hidden">
      {candidates.map((tag, i) => (
        <Badge key={tag.value} data-tag="" aria-hidden={i >= shown || undefined} variant="outline" className={cn('own:max-w-36 own:min-w-0 own:text-fg', i >= shown ? out : i === 0 && shown === 1 && 'own:shrink')}>
          {tag.tone && tag.tone !== 'neutral' && <BadgeDot className={TONE_DOT[tag.tone]} />}
          <span className="truncate">{tag.label}</span>
        </Badge>
      ))}
      <Tooltip>
        <TooltipTrigger render={<span aria-hidden />} className={cn('shrink-0', rest.length === 0 && out)}>
          <Badge data-tag-more="" variant="secondary" className="own:tabular-nums">
            +{Math.max(rest.length, 1)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{rest.map((tag) => tag.label).join(', ')}</TooltipContent>
      </Tooltip>
      {rest.length > 0 && <span className="sr-only">, {rest.map((tag) => tag.label).join(', ')}</span>}
    </span>
  )
})

const TONE_DOT: Record<DataGridOptionTone, string> = {
  neutral: 'own:bg-fg-subtle',
  accent: 'own:bg-accent',
  success: 'own:bg-success',
  warning: 'own:bg-warning',
  danger: 'own:bg-danger',
  'chart-1': 'own:bg-chart-1',
  'chart-2': 'own:bg-chart-2',
  'chart-3': 'own:bg-chart-3',
  'chart-4': 'own:bg-chart-4',
  'chart-5': 'own:bg-chart-5',
}
