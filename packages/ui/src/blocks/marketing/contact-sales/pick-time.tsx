'use client'

import { useMemo, useState, type RefObject } from 'react'
import { Reveal } from '@youj/motion'
import { ArrowRightIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group'
import { cn, dateTimeFormat } from '../../../lib/utils'
import type { ContactSalesCopy, ContactSalesRegion, ContactSalesSlot } from './data'
import { Person } from './person'

/* Step one: when. Who the visitor will meet (the region's person, swapping in
 * as the region changes), a strip of the days with open times (a raised key
 * glides to the chosen day; dots under each say how full it is), that day's
 * times as keys (taken ones struck out and skipped), then Continue, which
 * names the time once there is one. Writing instead is a link away. */

const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'
/** Days shown in the strip: a working week and a little more. */
const MAX_DAYS = 7

const dayKey = (start: Date | number) => {
  const date = new Date(start)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

interface Day {
  key: string
  date: Date
  slots: ContactSalesSlot[]
  open: number
}

interface PickTimeProps {
  /** The step's heading level, one below the section's. */
  heading: 'h2' | 'h3' | 'h4'
  regions: ContactSalesRegion[]
  region: ContactSalesRegion | undefined
  slots: ContactSalesSlot[]
  value: ContactSalesSlot | null
  onRegionChange: (id: string) => void
  onSlotChange: (slot: ContactSalesSlot) => void
  onContinue: () => void
  onMessage: () => void
  error: string | undefined
  timesRef: RefObject<HTMLDivElement | null>
  locale: string
  copy: ContactSalesCopy
}

export function PickTime({ heading: Heading, regions, region, slots, value, onRegionChange, onSlotChange, onContinue, onMessage, error, timesRef, locale, copy }: PickTimeProps) {
  const format = useMemo(
    () => ({
      weekday: dateTimeFormat(locale, { weekday: 'short' }),
      date: dateTimeFormat(locale, { day: 'numeric' }),
      day: dateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }),
      time: dateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }),
      when: dateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      plural: new Intl.PluralRules(locale),
    }),
    [locale],
  )
  const days = useMemo(() => {
    const byDay = new Map<string, Day>()
    for (const slot of [...slots].sort((a, b) => +new Date(a.start) - +new Date(b.start))) {
      const key = dayKey(slot.start)
      const day = byDay.get(key) ?? { key, date: new Date(slot.start), slots: [], open: 0 }
      day.slots.push(slot)
      if ((slot.left ?? 1) > 0) day.open += 1
      byDay.set(key, day)
    }
    return [...byDay.values()].slice(0, MAX_DAYS)
  }, [slots])
  // The day the visitor chose; until then the picked time's day, or the first with room.
  const [chosen, setChosen] = useState<string | null>(null)
  const active = days.find((d) => d.key === chosen) ?? (value && days.find((d) => d.key === dayKey(value.start))) ?? days.find((d) => d.open > 0) ?? days[0]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <Heading data-yj-step-heading tabIndex={-1} className="rounded-sm text-ui-lg font-semibold text-fg outline-none focus-ring">
          {copy.pickTitle}
        </Heading>
        <p className="text-ui-sm text-fg-muted">{copy.pickDescription}</p>
      </div>

      {region && (
        <Person
          regions={regions}
          region={region}
          title={copy.meet(region.contact.name)}
          line={copy.meetRole(region.contact.role, region.contact.location)}
          onRegionChange={(id) => {
            setChosen(null)
            onRegionChange(id)
          }}
          copy={copy}
        />
      )}

      {days.length > 0 && active ? (
        <>
          <ToggleGroup
            variant="pill"
            aria-label={copy.daysLabel}
            value={[active.key]}
            onValueChange={(next) => next[0] && setChosen(next[0])}
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
            className="grid w-full data-[size=default]:h-auto"
          >
            {days.map((day) => (
              <ToggleGroupItem key={day.key} value={day.key} disabled={day.open === 0} aria-label={copy.dayLabel(format.day.format(day.date), day.open, format.plural.select(day.open))} className="h-auto min-w-0 flex-col gap-1 px-0 py-2">
                <span className={cn('text-ui-xs text-fg-muted', VOICE)}>{format.weekday.format(day.date)}</span>
                <span className="text-ui-lg leading-none font-semibold text-fg tabular-nums">{format.date.format(day.date)}</span>
                {/* How full the day is: a dot per time, filled while it's open. */}
                <span aria-hidden className="flex h-1.5 items-center gap-0.5">
                  {day.slots.slice(0, 6).map((slot) => (
                    <span key={slot.id} className={cn('size-1 rounded-full', (slot.left ?? 1) > 0 ? 'bg-accent' : 'bg-line-strong')} />
                  ))}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div ref={timesRef} className="flex flex-col gap-2">
            <Reveal key={active.key} variant="fade" inView={false} duration="fast">
              <ToggleGroup
                aria-label={copy.timesLabel(format.day.format(active.date))}
                value={value && dayKey(value.start) === active.key ? [value.id] : []}
                onValueChange={(next) => {
                  const slot = active.slots.find((s) => s.id === next[0])
                  if (slot) onSlotChange(slot)
                }}
                spacing={2}
                // shape: separate keys, not a track: a time is a choice among many, and taken ones stay visible as such
                className="grid w-full grid-cols-3 gap-2 bg-transparent p-0"
              >
                {active.slots.map((slot) => {
                  const time = format.time.format(new Date(slot.start))
                  const taken = (slot.left ?? 1) <= 0
                  return (
                    <ToggleGroupItem
                      key={slot.id}
                      value={slot.id}
                      variant="outline"
                      disabled={taken}
                      aria-label={taken ? copy.taken(time) : time}
                      // shape: an outlined time that fills with the accent once picked, struck through once taken
                      className="w-full border-line bg-transparent px-2 text-fg tabular-nums shadow-none hover:border-line-strong data-pressed:border-accent data-pressed:bg-accent data-pressed:text-on-accent data-pressed:shadow-none data-pressed:hover:bg-accent data-disabled:border-transparent data-disabled:text-fg-subtle data-disabled:line-through"
                    >
                      {time}
                    </ToggleGroupItem>
                  )
                })}
              </ToggleGroup>
            </Reveal>
            <p className="text-ui-sm text-fg-muted">{copy.timezone}</p>
            {error && (
              <p role="alert" className="text-ui-sm text-danger-text">
                {error}
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-ui text-fg-muted">{copy.noTimes(region?.label ?? '')}</p>
      )}

      <div className="flex flex-col items-center gap-2">
        {days.length > 0 && (
          <Button size="lg" className="w-full" onClick={onContinue}>
            {value ? copy.nextWith(format.when.format(new Date(value.start))) : copy.next}
            <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
          </Button>
        )}
        <Button variant={days.length > 0 ? 'ghost' : 'outline'} className={cn(days.length === 0 && 'w-full')} onClick={onMessage}>
          {copy.toMessage}
        </Button>
      </div>
    </div>
  )
}
