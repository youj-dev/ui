'use client'

import { useMemo, useState, type ComponentType } from 'react'
import { useLocale } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { ArrowDownLeftIcon, ArrowLeftRightIcon, CarIcon, CoffeeIcon, LeafIcon, SearchIcon, ShoppingBagIcon, ZapIcon, type IconProps } from '@youj/icons'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../../components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../../components/ui/input-group'
import { cn, dateTimeFormat } from '../../../../lib/utils'
import { CATEGORY_LABEL, type Category, type Txn } from '../data'
import { dayLabel, fmt, HIDDEN } from '../format'
import { Eyebrow } from '../../../../components/ui/typography'

const ICON: Record<Category, ComponentType<IconProps>> = {
  groceries: LeafIcon,
  dining: CoffeeIcon,
  transport: CarIcon,
  shopping: ShoppingBagIcon,
  bills: ZapIcon,
  income: ArrowDownLeftIcon,
  transfer: ArrowLeftRightIcon,
}

export function Transactions({ txns, hidden }: { txns: Txn[]; hidden: boolean }) {
  const locale = useLocale()
  const [query, setQuery] = useState('')
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const shown = txns.filter((t) => !q || `${t.merchant} ${CATEGORY_LABEL[t.category]}`.toLowerCase().includes(q))
    const byDay = new Map<string, Txn[]>()
    for (const t of shown) byDay.set(dayLabel(t.time, locale), [...(byDay.get(dayLabel(t.time, locale)) ?? []), t])
    return [...byDay]
  }, [txns, query, locale])
  const time = dateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })
  return (
    <section aria-labelledby="kite-activity" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="kite-activity" className="text-ui-lg font-semibold text-fg">
          Activity
        </h2>
        <InputGroup className="w-full sm:w-56">
          <InputGroupAddon>
            <SearchIcon size={16} />
          </InputGroupAddon>
          <InputGroupInput aria-label="Search transactions" placeholder="Search transactions" value={query} onChange={(e) => setQuery(e.target.value)} />
        </InputGroup>
      </div>
      <p role="status" className="sr-only">
        {query ? `${groups.reduce((n, [, list]) => n + list.length, 0)} transactions match` : ''}
      </p>
      {groups.length === 0 ? (
        <Empty className="rounded-xl border border-dashed border-line py-10">
          <EmptyHeader>
            <EmptyTitle>Nothing matches “{query}”</EmptyTitle>
            <EmptyDescription>Try a merchant or a category, like “dining”.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(([day, list]) => (
            <div key={day} className="flex flex-col gap-1">
              <Eyebrow render={<h3 />} className="flex items-center justify-between px-1 text-ui-sm font-medium text-fg-muted">
                {day}
                {!hidden && <span className="tabular-nums">{fmt(locale).format(list.reduce((s, t) => s + t.amount, 0))}</span>}
              </Eyebrow>
              <PresenceList className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
                {list.map((t) => {
                  const Icon = ICON[t.category]
                  const incoming = t.amount > 0
                  return (
                    <PresenceItem key={t.id} className="flex items-center gap-3 border-b border-line bg-surface px-3 py-2.5 last:border-b-0">
                      <span
                        aria-hidden
                        className={cn('grid size-9 shrink-0 place-items-center rounded-full', incoming ? 'bg-success-subtle text-success-text' : 'bg-well text-fg')}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-ui font-medium text-fg">{t.merchant}</span>
                        <span className="text-ui-sm text-fg-muted">
                          {CATEGORY_LABEL[t.category]} · {time.format(t.time)}
                        </span>
                      </span>
                      <span className={cn('text-ui font-medium tabular-nums', incoming ? 'text-success-text' : 'text-fg')}>
                        {hidden ? HIDDEN : `${incoming ? '+' : '−'}${fmt(locale).format(Math.abs(t.amount))}`}
                      </span>
                    </PresenceItem>
                  )
                })}
              </PresenceList>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
