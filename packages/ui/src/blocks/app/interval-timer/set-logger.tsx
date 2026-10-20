'use client'

import { useEffect, useRef, useState } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { CheckIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Field, FieldLabel } from '../../../components/ui/field'
import { NumberInput } from '../../../components/ui/number-input'
import { Eyebrow } from '../../../components/ui/typography'
import type { IntervalTimerCopy, IntervalTimerEntry, IntervalTimerItem } from './data'
import { numberFormat } from '../../../lib/utils'

interface SetLoggerProps {
  /** The item the next entry is for. */
  item: IntervalTimerItem
  items: IntervalTimerItem[]
  entries: IntervalTimerEntry[]
  onLog: (entry: IntervalTimerEntry) => void
  copy: IntervalTimerCopy
}

/** Count × amount steppers for the item at hand, and the entries logged so far with their total. */
function SetLogger({ item, items, entries, onLog, copy }: SetLoggerProps) {
  // The steppers start from the item's plan and keep what you last entered for it.
  const [entry, setEntry] = useState<Record<string, { count: number; amount: number }>>({})
  const value = entry[item.id] ?? { count: item.count, amount: item.amount }
  const set = (patch: Partial<typeof value>) => setEntry((e) => ({ ...e, [item.id]: { ...value, ...patch } }))
  const num = numberFormat(copy.locale)
  const amountOf = (w: number) => (w ? `${num.format(w)} ${copy.unit}` : copy.noAmount)
  const total = entries.reduce((sum, s) => sum + s.count * s.amount, 0)
  const nameOf = (id: string) => items.find((e) => e.id === id)?.name ?? id
  // A new set lands at the foot of the list: follow it there.
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => {
    list.current?.scrollTo?.({ top: list.current.scrollHeight })
  }, [entries.length])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>{copy.logLabel}</Eyebrow>
        <span className="font-mono text-ui-sm text-fg-muted tabular-nums">
          {copy.total} <span className="text-fg">{num.format(total)}</span> {copy.unit}
        </span>
      </div>

      <div className="grid gap-x-10 gap-y-5 md:grid-cols-[minmax(0,--spacing(76))_minmax(0,1fr)]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-x-2 gap-y-3">
        <Field>
          <FieldLabel>{copy.count}</FieldLabel>
          <NumberInput value={value.count} onValueChange={(v) => set({ count: v ?? 0 })} min={0} max={200} />
        </Field>
        <span aria-hidden className="pb-2 font-mono text-ui-lg text-fg-muted">
          ×
        </span>
        <Field>
          <FieldLabel>{copy.amount}</FieldLabel>
          <NumberInput value={value.amount} onValueChange={(v) => set({ amount: v ?? 0 })} min={0} max={500} step={2} unit={copy.unit} />
        </Field>
        <Button
          variant="secondary"
          className="col-span-3"
          onClick={() => onLog({ id: `${item.id}-${entries.length}-${value.count}-${value.amount}`, item: item.id, ...value })}
        >
          {copy.log}
        </Button>
      </div>

      {/* The entries scroll in the steppers' height at an app's size: logging one never resizes the card. */}
      <div ref={list} className="-mx-1 flex h-24.5 flex-col overflow-y-auto px-1 yj-scrollbar">
        {entries.length === 0 ? (
          <p className="m-auto text-ui-sm text-fg-muted">{copy.noEntries}</p>
        ) : (
            <PresenceList as="ol" className="flex flex-col">
              {entries.map((s, i) => (
                <PresenceItem key={s.id} className="flex items-center gap-3 border-t border-line py-2.5 first:border-t-0">
                  <span className="w-12 shrink-0 font-mono text-ui-xs text-fg-muted uppercase tabular-nums">{copy.entryNumber(i + 1)}</span>
                  <span className="min-w-0 flex-1 truncate text-ui text-fg">{nameOf(s.item)}</span>
                  <span dir="ltr" className="font-mono text-ui text-fg tabular-nums">
                    {num.format(s.count)} <span className="text-fg-muted">×</span> {amountOf(s.amount)}
                  </span>
                  <CheckIcon size={14} className="shrink-0 text-success" aria-hidden />
                </PresenceItem>
              ))}
            </PresenceList>
        )}
      </div>
      </div>
    </div>
  )
}

export { SetLogger }
