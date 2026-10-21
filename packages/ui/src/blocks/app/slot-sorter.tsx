'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Illustration, type IllustrationSlot } from '@youj/illustrations'
import { InboxIcon, ZapIcon } from '@youj/icons'
import { AsyncButton } from '../../components/ui/async-button'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn, numberFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  demo,
  SLOTS,
  ITEMS,
  type SlotSorterAssignments,
  type SlotSorterConfidence,
  type SlotSorterCopy,
  type SlotSorterSlot,
  type SlotSorterItem,
  type SlotSorterTone,
} from './slot-sorter/data'
import { moveItem, splitCounts } from './slot-sorter/model'
import { SplitBar } from './slot-sorter/split-bar'
import { ItemRow } from './slot-sorter/item-row'

/* Sorting items into slots, as a step of setting it up (the demo splits an
 * inbox). A step count and
 * a picture sit over a title, then today's split: one bar, a segment per slot
 * sized by how many items land in it (hatched where a slot is off), with
 * each slot's count in the legend beneath. Under it the sorting runs live:
 * the latest items, each with how sure the sorting is and the slot it went to.
 * - Correcting: drag an item's name onto a slot in the legend, or use the
 *   slot button on its row, which opens a menu of the slots and takes the
 *   number keys 1 to 4 when focused. Either way the slot's counts and the bar
 *   move at once and the change is announced. A slot that is off takes nothing.
 * - The items shown are the latest sorted; a slot's `count` is its whole
 *   day. A correction moves one from the slot it left to the slot it joins.
 * - The assignments are `value` / `onValueChange` (item id → slot id); `onMove`
 *   reports each single correction. Back and Turn on are `onBack` and `onTurnOn`.
 * It keeps its size whatever happens: the list is four rows tall and shows the first four items.
 * It is built for the compact layout density (ui.css), taken from the page. */

/** The items shown: the list is this many rows tall, so the card never changes size. */
const ROWS = 4

interface SlotSorterProps extends Omit<ComponentProps<'section'>, 'children' | 'title' | 'onChange' | 'value' | 'defaultValue'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (28rem at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<SlotSorterCopy>
  /** Formats the counts (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The slots, in the order of their keys: each with today's `count`; `off` hatches one and closes it to items. */
  slots?: SlotSorterSlot[]
  /** The latest items sorted, each with the slot it went to and how sure the sorting was. The first four are shown. */
  items?: SlotSorterItem[]
  /** Which step of the setup this is. Default 2. */
  step?: number
  /** How many steps there are. Default 3. */
  steps?: number
  /** Where each item sits now, as item id to slot id (controlled). A item left out sits where it was sorted. */
  value?: SlotSorterAssignments
  /** Where each item sits at first (uncontrolled). */
  defaultValue?: SlotSorterAssignments
  /** Called with the new assignments after every correction. */
  onValueChange?: (value: SlotSorterAssignments) => void
  /** Called with the item and the slot it was moved to, after every correction. */
  onMove?: (item: SlotSorterItem, slot: SlotSorterSlot) => void
  /** How much the sorting handles: the foot's note. Default 2,400 items in 40 s. */
  throughput?: { items: number; seconds: number }
  /** The picture under the title: a scene from the illustrations by id, or your own node. Default: the mail scene. */
  illustration?: IllustrationSlot
  /** The icon before the title. Default: an inbox. */
  icon?: ReactNode
  /** Called by Back. */
  onBack?: () => void
  /** Called by Turn on; the button shows it pending, then its outcome. */
  onTurnOn?: () => Promise<unknown> | unknown
}

function SlotSorter({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  slots = SLOTS,
  items = ITEMS,
  step = 2,
  steps = 3,
  value,
  defaultValue,
  onValueChange,
  onMove,
  throughput = { items: 2400, seconds: 40 },
  illustration,
  icon = <InboxIcon aria-hidden size={16} className="text-accent-text" />,
  onBack,
  onTurnOn = () => demo('SlotSorter: onTurnOn', 900),
  className,
  ...rest
}: SlotSorterProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const k = useYouj()
  const titleId = useId()
  const hintId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const Sub = embedded ? 'h3' : 'h2'
  const { announce, announcer } = useAnnouncer()
  const slotEls = useRef(new Map<string, HTMLElement>())
  const slotRef = (id: string) => (el: HTMLLIElement | null) => {
    if (el) slotEls.current.set(id, el)
    else slotEls.current.delete(id)
  }
  const slotAt = (x: number, y: number) =>
    slots.find((s) => {
      const r = !s.off && slotEls.current.get(s.id)?.getBoundingClientRect()
      return r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    })?.id ?? null
  const [assigned, setAssigned] = useControllableState<SlotSorterAssignments>(value, defaultValue ?? {})
  const [drag, setDrag] = useState<{ id: string; over: string | null } | null>(null)

  const format = useMemo(() => {
    const nf = numberFormat(locale)
    return (n: number) => nf.format(n)
  }, [locale])
  const counts = splitCounts(slots, items, assigned)
  const total = slots.reduce((sum, s) => sum + (counts[s.id] ?? 0), 0)
  const off = slots.filter((s) => s.off).reduce((sum, s) => sum + (counts[s.id] ?? 0), 0)
  const keys = `1 ${slots.length > 2 ? '–' : '/'} ${slots.length}`

  const move = (id: string, to: string) => {
    const next = moveItem(slots, items, assigned, id, to)
    if (next === assigned) return
    const item = items.find((t) => t.id === id)!
    const slot = slots.find((s) => s.id === to)!
    setAssigned(next)
    onValueChange?.(next)
    onMove?.(item, slot)
    const now = splitCounts(slots, items, next)
    announce(copy.moved(item.name, slot.label, slots.filter((s) => !s.off).map((s) => `${s.label} ${format(now[s.id] ?? 0)}`).join(', ')))
  }

  const card = (
    <Card
      data-slot="slot-sorter"
      className={cn('@container w-full gap-0 py-0 text-fg', !embedded && !fill && 'max-w-md')}
    >
      <header className="flex items-center gap-2 px-(--ui--panel-x) pt-(--ui--panel-head-y) pb-(--ui--panel-y)">
        {icon}
        <Title id={titleId} className="me-auto text-(length:--ui--panel-title) leading-(--ui--panel-title-leading) font-semibold tracking-tight">
          {copy.title}
        </Title>
        <p className="text-ui-sm text-fg-muted tabular-nums">{copy.step(step, steps)}</p>
      </header>

      <div aria-hidden className="flex h-40 items-center justify-center">
        <Illustration scene={illustration} fallback="mail" unit={14} />
      </div>

      <div className="flex flex-col gap-5 px-(--ui--panel-x) pt-(--ui--panel-y) pb-(--ui--panel-y)">
        <Sub className="text-ui-lg font-medium text-fg">{copy.heading}</Sub>

        <section aria-label={copy.splitLabel} className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3 text-ui-sm text-fg-muted">
            <p>{copy.splitLabel}</p>
            <p className="tabular-nums">{copy.total(format(total), format(off))}</p>
          </div>
          <SplitBar slots={slots} counts={counts} copy={copy} format={format} reduced={k.reduced} slotRef={slotRef} dragging={drag !== null} over={drag?.over ?? null} />
        </section>

        <section aria-label={copy.sortingLive}>
          <div className="flex items-center justify-between gap-3 border-b border-line pb-2 text-ui-sm">
            <p className="flex items-center gap-2 font-medium text-fg">
              <span aria-hidden className="size-1.5 rounded-full bg-success" />
              {copy.sortingLive}
            </p>
            <p id={hintId} className="text-fg-muted">
              {copy.correctHint}
              <span className="sr-only">. {copy.dragInstructions(keys)}</span>
            </p>
          </div>
          <ul aria-describedby={hintId} className="flex h-56 flex-col divide-y divide-line">
            {items.slice(0, ROWS).map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                slots={slots}
                current={assigned[item.id] ?? item.slot}
                copy={copy}
                reduced={k.reduced}
                slotAt={slotAt}
                onDragStart={(id) => setDrag({ id, over: null })}
                onDragOver={(over) => setDrag((d) => (d && d.over !== over ? { ...d, over } : d))}
                onDragEnd={(id, slot) => {
                  setDrag(null)
                  if (slot) move(id, slot)
                }}
                onMove={move}
              />
            ))}
          </ul>
        </section>
      </div>

      <footer className="flex items-center gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        <p className="me-auto flex items-center gap-1.5 text-ui-sm text-fg-muted tabular-nums">
          <ZapIcon aria-hidden size={14} />
          {copy.throughput(format(throughput.items), format(throughput.seconds))}
        </p>
        <Button variant="secondary" onClick={() => onBack?.()}>
          {copy.back}
        </Button>
        <AsyncButton pendingLabel={copy.turningOn} successLabel={copy.turnedOn} onAction={onTurnOn}>
          {copy.turnOn}
        </AsyncButton>
      </footer>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-md', className)}>
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

export { SlotSorter, type SlotSorterProps }
export type { SlotSorterAssignments, SlotSorterConfidence, SlotSorterCopy, SlotSorterSlot, SlotSorterItem, SlotSorterTone }
