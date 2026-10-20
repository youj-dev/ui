'use client'

import { AnimatePresence } from 'motion/react'
import { useId, useState, type CSSProperties, type ComponentProps, type ReactNode } from 'react'
import { MotionFeatures, ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { ChevronDownIcon, MoreHorizontalIcon, PlusIcon, SnowflakeIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { CalendarHeatmap, StreakSummary, streakStats, type StreakDay } from '../../components/ui/calendar-heatmap'
import { Skeleton } from '../../components/ui/skeleton'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, FREEZES, ITEMS, TODAY, WEEKS, demo, yesterdayOf, type StreaksCopy, type StreaksItem } from './streaks/data'
import { ItemRow, toneOf } from './streaks/item-row'
import { StreaksPlaceholder } from './streaks/states'

/* Anything you keep a run of days on, as an instrument: the picked item's run
 * as a flame meter (the streak in big mono, cells warming toward the next
 * milestone, the longest run, the completion rate and the freezes left), then
 * its last 26 weeks as heat dots, where today's dot is the toggle, and the
 * day's list, each item with its streak, twelve weeks of mini dots and a Mark
 * done pill that morphs into a check. When yesterday broke a run, a freeze
 * saves it: the missed dot turns hatched, a token goes, and the run rolls
 * back up. The demo is four daily habits; pass your own items, each with the
 * icon in its disc and its own scale (1 for done or not, 8 for eight glasses).
 * Swap the demo wait for your API with `onFreeze`. Loading, an error with
 * Retry and no items take the card's body at its size.
 * Reduced motion: dots and cells light in place.
 * It is built for the compact layout density (ui.css), taken from the page; embedded,
 * it stops at its natural width, as it does on its own, unless `fill`. */

interface StreaksProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (736px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<StreaksCopy>
  /** How its dates, times and numbers read (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** What you keep a run on, the first picked. Default: four demo habits. */
  items?: StreaksItem[]
  /** The day it is, as an ISO date. Default: the demo's Monday. */
  today?: string
  /** Freeze tokens left this month, of how many. */
  freezes?: { left: number; total: number }
  /** Items listed before the rest fold under "Show all". Default 3. */
  max?: number
  /** Spends a freeze on yesterday for an item; resolve when it's saved. Default: a short demo wait. */
  onFreeze?: (item: StreaksItem) => Promise<unknown> | unknown
  /** Skeletons in the card's body while your items load. Default false. */
  loading?: boolean
  /** Shown in the card's body when the items fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no items. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Classes for its parts: `card` holds the block's size (945px tall at 100%; today's items scroll in what the picked item leaves, so picking, showing all and freezing never resize it). */
  classNames?: { card?: string }
}

const keptOn = (days: StreakDay[], date: string) => days.some((d) => d.date === date && (d.frozen || (d.value ?? 1) > 0))

interface FrameProps {
  copy: StreaksCopy
  Title: 'h1' | 'h2'
  titleId: string
  subtitle: ReactNode
  card?: string
  /** Its natural width, on the card on its own page. */
  cap: string | false
  embedded: boolean
  children: ReactNode
  /** After the foot: what is not drawn, like the live region. */
  tail?: ReactNode
}

/** The card around the body: its head and its foot, the same whether the items are there or not. */
function Frame({ copy, Title, titleId, subtitle, card, cap, embedded, children, tail }: FrameProps) {
  return (
    <Card className={cn('h-236.25 w-full text-fg', !embedded && cap, card)}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className="tabular-nums">{subtitle}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label={copy.more}>
            <MoreHorizontalIcon size={16} />
          </Button>
        </CardAction>
      </CardHeader>
      {children}
      <CardFooter className="flex-wrap justify-end">
        <span className="me-auto basis-full text-ui-sm text-fg-muted sm:basis-auto">{copy.resets}</span>
        <Button variant="secondary">
          <PlusIcon size={14} />
          {copy.newItem}
        </Button>
      </CardFooter>
      {tail}
    </Card>
  )
}

function Streaks({ theme, embedded = true, fill = false, copy: copyProp, locale, items = ITEMS, today = TODAY, freezes = FREEZES, max = 3, onFreeze, loading = false, error, onRetry, empty, classNames, className, ...rest }: StreaksProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  // Its natural width: on the card on its own page, on the section embedded (where a className can change it).
  const cap = !fill && 'max-w-184'
  const state = loading ? 'loading' : error ? 'error' : items.length === 0 ? 'empty' : null
  const frame = { copy, Title, titleId, card: classNames?.card, cap, embedded } as const

  const card = state ? (
    <Frame {...frame} subtitle={state === 'loading' ? <Skeleton className="inline-block h-4 w-24 align-middle" /> : <span className="text-fg-subtle">—</span>}>
      <StreaksPlaceholder state={state} copy={copy} error={error} onRetry={onRetry} empty={empty} />
    </Frame>
  ) : (
    // Its items are its own state from the first paint: a card that was loading mounts again when they arrive.
    <StreaksCard {...frame} items={items} today={today} freezes={freezes} max={max} onFreeze={onFreeze} />
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', cap, className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

type StreaksCardProps = Omit<FrameProps, 'subtitle' | 'children' | 'tail'> & Required<Pick<StreaksProps, 'items' | 'today' | 'freezes' | 'max'>> & Pick<StreaksProps, 'onFreeze'>

function StreaksCard({ items: initial, today, freezes: initialFreezes, max, onFreeze, ...frame }: StreaksCardProps) {
  const { copy } = frame
  const { announce, announcer } = useAnnouncer()
  const [items, setItems] = useState(initial)
  const [selectedId, setSelectedId] = useState(initial[0]?.id)
  const [freezes, setFreezes] = useState(initialFreezes)
  const [expanded, setExpanded] = useState(false)
  const item = items.find((h) => h.id === selectedId) ?? items[0]
  const doneCount = items.filter((h) => keptOn(h.days, today)).length

  const update = (id: string, change: (days: StreakDay[]) => StreakDay[]) => setItems((list) => list.map((h) => (h.id === id ? { ...h, days: change(h.days) } : h)))
  const setToday = (h: StreaksItem, done: boolean) => update(h.id, (days) => [...days.filter((d) => d.date !== today), ...(done ? [{ date: today, value: h.max }] : [])])

  const yesterday = yesterdayOf(today)
  const before = yesterdayOf(yesterday)
  // A run a freeze could save: yesterday missed, the day before kept.
  const saveable = item && !keptOn(item.days, yesterday) && keptOn(item.days, before) ? streakStats(item.days, yesterday).current : 0
  const stats = item ? streakStats(item.days, today) : undefined
  const status = !item ? undefined : stats?.today ? 'done' : saveable || !stats?.current ? 'risk' : 'track'

  const freeze = async () => {
    if (!item) return
    await (onFreeze ? onFreeze(item) : demo('Streaks: onFreeze', 700))
    update(item.id, (days) => [...days.filter((d) => d.date !== yesterday), { date: yesterday, frozen: true }])
    setFreezes((f) => ({ ...f, left: Math.max(0, f.left - 1) }))
    announce(copy.frozen(item.name))
  }

  return (
    <Frame {...frame} subtitle={copy.subtitle(doneCount, items.length)} tail={announcer}>
      {item && (
        <>
          <CardContent className="flex flex-col gap-5" style={{ '--item-tone': toneOf(item) } as CSSProperties}>
            <div className="flex items-center gap-3">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--item-tone)_18%,transparent)] text-(--item-tone) [&_svg]:size-3.75">
                {item.icon}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-ui-lg font-medium text-fg">{item.name}</span>
                <span className="truncate text-ui-sm text-fg-muted">{item.detail}</span>
              </div>
              <Badge variant={status === 'risk' ? 'warning' : 'success'} className="shrink-0">
                <BadgeDot />
                {status === 'done' ? copy.doneToday : status === 'risk' ? copy.atRisk : copy.onTrack}
              </Badge>
            </div>
            <StreakSummary days={item.days} today={today} freezes={freezes} locale={copy.locale} />
            {saveable > 0 && (
              <div
                data-slot="streaks-rescue"
                className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl bg-[color-mix(in_oklab,var(--color-chart-5)_9%,transparent)] px-4 py-3 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-chart-5)_22%,transparent)]"
              >
                <SnowflakeIcon aria-hidden size={16} className="shrink-0 text-(--chart-5)" />
                <p className="min-w-0 flex-1 basis-56 text-ui text-fg">{freezes.left ? copy.rescue(saveable) : copy.noFreezes}</p>
                {freezes.left > 0 && (
                  <AsyncButton variant="secondary" size="sm" onAction={freeze} pendingLabel={copy.freezing}>
                    {copy.useFreeze}
                  </AsyncButton>
                )}
              </div>
            )}
          </CardContent>

          <CardContent className="flex flex-col gap-4">
            <Eyebrow>{copy.history(WEEKS)}</Eyebrow>
            <CalendarHeatmap
              key={item.id}
              days={item.days}
              today={today}
              weeks={WEEKS}
              max={item.max}
              tone={item.tone}
              locale={copy.locale}
              label={`${item.name}, ${copy.history(WEEKS)}`}
              onTodayChange={(done) => setToday(item, done)}
            />
          </CardContent>
        </>
      )}

      {/* Today's items scroll in what the picked one leaves: picking one, showing all or a rescue note never resize the card. */}
      <CardContent className="-my-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-1 yj-scrollbar">
        <Eyebrow>{copy.today}</Eyebrow>
        <MotionFeatures features="max">
          <ul aria-label={copy.list} className="-mx-3 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 sm:-mx-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <AnimatePresence initial={false}>
              {(expanded ? items : items.slice(0, max)).map((h) => (
                <ItemRow key={h.id} item={h} today={today} selected={h.id === item?.id} copy={copy} onSelect={() => setSelectedId(h.id)} onToggle={(done) => setToday(h, done)} />
              ))}
            </AnimatePresence>
          </ul>
        </MotionFeatures>
        {items.length > max && (
          <Button variant="ghost" size="sm" aria-expanded={expanded} className="self-center" onClick={() => setExpanded((e) => !e)}>
            {expanded ? copy.showFewer : copy.showAll(items.length)}
            <ChevronDownIcon size={14} className={cn('transition-transform yj-duration-fast ease-standard', expanded && 'rotate-180')} />
          </Button>
        )}
      </CardContent>
    </Frame>
  )
}

export { Streaks, type StreaksProps }
export type { StreaksCopy, StreaksItem }
