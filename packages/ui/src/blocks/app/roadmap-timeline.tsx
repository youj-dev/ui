'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { MilestoneRuler } from '../../components/ui/milestone-ruler'
import { Skeleton } from '../../components/ui/skeleton'
import { Eyebrow } from '../../components/ui/typography'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useNow } from '../../hooks/use-now'
import { cn, numberFormat, relativeTimeFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  DEMO_TODAY,
  ITEMS,
  STATUSES,
  type RoadmapTimelineCopy,
  type RoadmapTimelineItem,
  type RoadmapTimelineStatus,
  type RoadmapTimelineTone,
} from './roadmap-timeline/data'

/* A year of anything with dates on one ruler (a product, a wedding, a
 * renovation): a MilestoneRuler of fine ticks with a pin per item, taller for
 * the big ones, solid once done, hollow while upcoming and amber when it needs
 * attention, a bright tick for today and a count where items crowd one week. Hover anywhere along it (the nearest pin
 * answers) or walk the pins with the arrow keys, and the callout says the
 * date, status, title and one line about it; the one you pick stays shown.
 * The head counts the items; the foot says how many are done, how soon the
 * next one lands and how many need attention. Loading holds the ruler and the
 * foot's figures as skeletons, and an error with Retry sits over the ruler.
 * Pass `today` from your server so the counts hydrate; with the demo data it
 * is the demo's own day. Embedded, it stops at its natural width unless `fill`.
 * Reduced motion: the pins stand in place and the callout jumps. */

interface RoadmapTimelineProps extends Omit<ComponentProps<'section'>, 'children' | 'title' | 'defaultValue'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<RoadmapTimelineCopy>
  /** Formats dates and counts (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The year's items, in any order. */
  items?: RoadmapTimelineItem[]
  /** The states an item can be in, each with a role for the ruler and the foot. Default: Shipped, Upcoming, At risk. */
  statuses?: RoadmapTimelineStatus[]
  /** Skeletons in place of the ruler and the foot's figures while your data loads. Default false. */
  loading?: boolean
  /** Shown over the ruler when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** The year the ruler spans. Default: today's year. */
  year?: number
  /** Marked on the ruler; splits done from upcoming. Default: the demo's day with the demo items; with your own, the browser's clock once mounted. */
  today?: Date | string | number
  /** The picked item's id, when your app owns it. */
  value?: string | null
  /** The item picked at first. Default: the next one from today. */
  defaultValue?: string | null
  /** Called with the item picked on the ruler. */
  onValueChange?: (id: string | null) => void
}

/** The attention count's dot, as literal classes for Tailwind. */
const DOT: Record<RoadmapTimelineTone, string> = {
  accent: 'bg-accent',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

/** How the ruler names each role; an item with no status of its own is left to the ruler's date rule. */
const RULER = { done: 'done', upcoming: 'upcoming', attention: 'at-risk', none: undefined } as const

const DAY = 86_400_000
/** A calendar day as days since the epoch: "2026-11-26" as written, a Date or ms by its local date. */
function dayOf(input: Date | string | number) {
  const m = typeof input === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(input) : null
  if (m) return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / DAY
  const d = new Date(input)
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY
}

function RoadmapTimeline({
  theme,
  embedded = true,
  fill = false,
  className,
  copy: copyProp,
  locale: localeProp,
  items: itemsProp,
  statuses = STATUSES,
  loading = false,
  error,
  onRetry,
  year: yearProp,
  today: todayProp,
  value: valueProp,
  defaultValue,
  onValueChange,
  ...rest
}: RoadmapTimelineProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const milestones = itemsProp ?? ITEMS
  const clock = useNow(todayProp === undefined && itemsProp ? 60 * 60_000 : 0)
  const todayInput = todayProp ?? (itemsProp ? (clock ?? undefined) : DEMO_TODAY)
  const today = todayInput === undefined ? null : dayOf(todayInput)
  const firstDay = milestones.length ? Math.min(...milestones.map((m) => dayOf(m.date))) : null
  const [mountedDay] = useState(() => dayOf(Date.now()))
  const year = yearProp ?? new Date((today ?? firstDay ?? mountedDay) * DAY).getUTCFullYear()
  const [value, setValue] = useControllableState<string | null | undefined>(valueProp, defaultValue)
  const count = numberFormat(locale)

  // The foot's counts, over the milestones in the year shown.
  const inYear = milestones
    .map((m) => ({ ...m, day: dayOf(m.date) }))
    .filter((m) => new Date(m.day * DAY).getUTCFullYear() === year)
    .sort((a, b) => a.day - b.day)
  const named = (role: RoadmapTimelineStatus['role']) => statuses.find((st) => st.role === role)
  const roleOf = (m: (typeof inYear)[number]): RoadmapTimelineStatus['role'] =>
    statuses.find((st) => st.id === m.status)?.role ?? (today !== null && m.day < today ? 'done' : 'upcoming')
  const shipped = inYear.filter((m) => roleOf(m) === 'done').length
  const risky = inYear.filter((m) => roleOf(m) === 'attention').length
  const next = today === null ? undefined : inYear.find((m) => m.day >= today && roleOf(m) !== 'done')
  const attention = named('attention')
  const soon = next && today !== null ? relativeTimeFormat(locale, { numeric: 'auto' }).format(next.day - today, 'day') : copy.none

  const figure = (node: ReactNode) => (loading ? <Skeleton className="h-5 w-12" /> : error ? <span className="text-fg-subtle">—</span> : node)
  const covered = loading || !!error
  const doneStatus = named('done')
  const stats = [
    doneStatus && {
      label: doneStatus.label,
      value: figure(
        <>
          <span aria-hidden className="font-mono">
            {count.format(shipped)}
            <span className="text-fg-muted"> / {count.format(inYear.length)}</span>
          </span>
          <span className="sr-only">{copy.doneValue(count.format(shipped), count.format(inYear.length))}</span>
        </>,
      ),
    },
    { label: copy.next, value: figure(<span className="truncate">{soon}</span>) },
    attention && {
      label: attention.label,
      value: figure(
        <span className="flex items-center gap-1.5 font-mono">
          {risky > 0 && <span aria-hidden className={cn('size-2 shrink-0 rounded-full', DOT[attention.tone ?? 'warning'])} />}
          {count.format(risky)}
        </span>,
      ),
    },
  ].filter((stat): stat is { label: string; value: ReactNode } => Boolean(stat))

  const card = (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-md')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title(year)}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
        <CardAction>
          <span className="tabular-nums">
            {loading ? <Skeleton className="inline-block h-4 w-20 align-middle" /> : error ? '—' : copy.count(inYear.length)}
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="relative">
        <div aria-hidden={covered || undefined} inert={covered || undefined} className={covered ? 'invisible' : undefined}>
          <MilestoneRuler
            label={copy.rulerLabel}
            milestones={inYear.map((m) => ({ ...m, status: RULER[statuses.find((st) => st.id === m.status)?.role ?? 'none'] }))}
            start={`${year}-01-01`}
            end={`${year}-12-31`}
            today={todayInput}
            locale={locale}
            value={value}
            onValueChange={(id) => {
              setValue(id)
              onValueChange?.(id)
            }}
          />
        </div>
        {loading && (
          <div className="pointer-events-none absolute inset-x-(--card-spacing) inset-y-0 flex flex-col justify-end gap-4 pb-3">
            <span className="sr-only">{copy.loadingLabel}</span>
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-3 w-full" />
          </div>
        )}
        {!loading && error && (
          <div className="absolute inset-x-(--card-spacing) inset-y-0 grid place-items-center">
            <Alert variant="danger">
              <AlertDescription>{error}</AlertDescription>
              {onRetry && (
                <AlertAction>
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    {copy.retry}
                  </Button>
                </AlertAction>
              )}
            </Alert>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-0">
        <dl className="grid w-full" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
          {stats.map((stat, i) => (
            <div key={stat.label} className={cn('flex min-w-0 flex-col gap-1 px-(--card-spacing) py-3', i > 0 && 'border-s border-line')}>
              <dt className="truncate">
                <Eyebrow>{stat.label}</Eyebrow>
              </dt>
              <dd className="flex min-w-0 text-ui-lg text-fg tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </CardFooter>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} data-slot="roadmap-timeline" {...rest} className={cn('w-full', !fill && 'max-w-md', className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      data-slot="roadmap-timeline"
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { RoadmapTimeline, type RoadmapTimelineProps }
export type { RoadmapTimelineCopy, RoadmapTimelineItem, RoadmapTimelineStatus }
