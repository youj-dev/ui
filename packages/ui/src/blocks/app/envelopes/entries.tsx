'use client'

import { AnimatePresence, m } from 'motion/react'
import type { CSSProperties } from 'react'
import { MotionFeatures, useYouj } from '@youj/core'
import { cn, dateTimeFormat, numberFormat } from '../../../lib/utils'
import type { EnvelopesCopy, EnvelopesEntry, EnvelopesEnvelope } from './data'

/** An amount in mono with its decimals muted: "$42.18". */
export function Amount({
  value,
  locale,
  format,
  className,
}: {
  value: number
  locale: string
  format: Intl.NumberFormatOptions
  className?: string
}) {
  const parts = numberFormat(locale, format).formatToParts(value)
  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {parts.map((p, i) => (
        <span key={i} className={p.type === 'decimal' || p.type === 'fraction' ? 'text-fg-muted' : undefined}>
          {p.value}
        </span>
      ))}
    </span>
  )
}

interface EntriesProps {
  items: EnvelopesEntry[]
  envelopes: EnvelopesEnvelope[]
  format: Intl.NumberFormatOptions
  today: string
  yesterday: string
  copy: EnvelopesCopy
}

/** The latest spending, newest first: title, the envelope it came out of as a soft tag, when, and how much. */
export function Entries({ items, envelopes, format, today, yesterday, copy }: EntriesProps) {
  const k = useYouj()
  const day = dateTimeFormat(copy.locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const when = (date: string) => (date === today ? copy.today : date === yesterday ? copy.yesterday : day.format(new Date(`${date}T00:00:00Z`)))
  return (
    <MotionFeatures features="max">
      <ul aria-label={copy.recent} className="-mx-2 flex flex-col">
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const envelope = envelopes.find((e) => e.id === t.envelope)
            return (
              <m.li
                key={t.id}
                layout="position"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={k.reduced ? { type: false } : k.spring('snappy')}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg px-2 py-2.5 hover:bg-hover"
                style={{ '--envelope-tone': envelope?.tone ? `var(--color-${envelope.tone})` : 'var(--color-fg-muted)' } as CSSProperties}
              >
                <span
                  aria-hidden
                  className="grid size-8 place-items-center rounded-full bg-[color-mix(in_oklab,var(--envelope-tone)_16%,transparent)] text-(--envelope-tone) [&>svg]:size-3.5"
                >
                  {envelope?.icon}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-ui-lg text-fg">{t.title}</span>
                  <span className="flex min-w-0 items-center gap-2 text-ui-sm text-fg-muted">
                    <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--envelope-tone)_13%,transparent)] px-2 text-fg">
                      <span aria-hidden className="size-1.5 rounded-full bg-(--envelope-tone)" />
                      {envelope?.name}
                    </span>
                    <span className="truncate font-mono tabular-nums">{when(t.date)}</span>
                  </span>
                </span>
                <Amount value={-t.amount} locale={copy.locale} format={format} className="text-ui-lg text-fg" />
              </m.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </MotionFeatures>
  )
}
