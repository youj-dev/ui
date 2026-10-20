'use client'

import { motion } from 'motion/react'
import { useYouj } from '@youj/core'
import { Stagger } from '@youj/motion'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import { isoDay, type BookingCopy } from './data'

function SlotColumn({
  date,
  duration,
  offset,
  slots,
  dayLabel,
  copy,
  heading: Heading,
  selected,
  onSelect,
  onNext,
}: {
  date: Date
  duration: number
  offset: number
  /** That day's start times, in minutes after midnight, host time. */
  slots: readonly number[]
  dayLabel: string
  copy: BookingCopy
  heading: 'h2' | 'h3' | 'h4'
  selected: number | null
  onSelect: (m: number) => void
  onNext: () => void
}) {
  const k = useYouj()
  return (
    <section aria-labelledby="tempo-slots" className="flex min-h-0 min-w-0 flex-col gap-3">
      <Heading id="tempo-slots" className="text-ui font-medium text-fg">
        {dayLabel}
        <span className="block text-ui-sm font-normal text-fg-muted">{copy.slotsOpen(slots.length)}</span>
      </Heading>
      <Stagger
        key={`${isoDay(date)}-${duration}-${offset}`}
        as="ul"
        itemAs="li"
        inView={false}
        step="tight"
        aria-label={copy.availableTimes}
        className={cn(
          'flex max-h-80 flex-col gap-2 overflow-y-auto pe-1 pb-6 [scrollbar-width:thin] max-lg:max-h-none max-lg:pb-0',
          // The list runs on below the card's edge: fade it out rather than cut a slot in half.
          'lg:[mask-image:linear-gradient(to_bottom,black_calc(100%-2.5rem),transparent)]',
        )}
      >
        {slots.map((m) => {
          const picked = selected === m
          const label = copy.formatTime(m + offset * 60)
          return (
            <div key={m} className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                aria-pressed={picked}
                onClick={() => onSelect(m)}
                render={<motion.button layout={!k.reduced} transition={k.spring('snappy')} />}
                // a slot is a neutral outline choice; only the picked one takes the accent
                className={cn('min-w-0 flex-1 tabular-nums', picked && 'border-accent bg-accent-subtle text-accent-text hover:bg-accent-subtle hover:text-accent-text')}
              >
                {label}
              </Button>
              {picked && (
                <motion.div
                  className="flex flex-1"
                  initial={k.reduced ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={k.reduced ? { type: false } : k.spring('snappy')}
                >
                  <Button size="sm" className="flex-1" onClick={onNext} aria-label={copy.nextLabel(label)}>
                    {copy.next}
                  </Button>
                </motion.div>
              )}
            </div>
          )
        })}
      </Stagger>
      {slots.length === 0 && <p className="text-ui-sm text-fg-muted">{copy.noTimes}</p>}
    </section>
  )
}

export { SlotColumn }
