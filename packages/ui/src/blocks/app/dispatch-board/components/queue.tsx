'use client'

import { useState, type ComponentType, type CSSProperties } from 'react'
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  HammerIcon,
  LeafIcon,
  ShoppingCartIcon,
  StoreIcon,
  WavesIcon,
  type IconProps,
} from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar'
import { Badge } from '../../../../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group'
import { cn, initials } from '../../../../lib/utils'
import { clock, DRIVERS, PRIORITY_LABEL, STATUS_LABEL, type Load, type LoadStatus, type Priority } from '../data'

type Filter = 'all' | 'risk' | 'unassigned'

const STATUS_BADGE: Record<LoadStatus, { icon: ComponentType<IconProps>; variant: 'warning' | 'danger' | 'secondary' | 'success' }> = {
  'at-risk': { icon: AlertTriangleIcon, variant: 'warning' },
  delayed: { icon: ClockIcon, variant: 'danger' },
  booked: { icon: CalendarIcon, variant: 'secondary' },
  'on-time': { icon: CheckCircleIcon, variant: 'success' },
}

/** Each customer's mark: what they ship, tinted with one of the chart colors. */
const CUSTOMER: Record<string, { icon: ComponentType<IconProps>; tone: string }> = {
  'Pinecrest Grocers': { icon: ShoppingCartIcon, tone: 'var(--color-chart-1)' },
  'Bluefin Supply': { icon: WavesIcon, tone: 'var(--color-chart-3)' },
  'Orchard Row': { icon: LeafIcon, tone: 'var(--color-chart-4)' },
  'Copperline Hardware': { icon: HammerIcon, tone: 'var(--color-chart-2)' },
  'Tidewater Market': { icon: StoreIcon, tone: 'var(--color-chart-5)' },
}

/** The customer's mark: their icon knocked out of a tile in their color. */
function CustomerMark({ customer }: { customer: string }) {
  const mark = CUSTOMER[customer] ?? { icon: StoreIcon, tone: 'var(--color-fg-muted)' }
  const Icon = mark.icon
  return (
    <span
      aria-hidden
      style={{ '--mark': mark.tone } as CSSProperties}
      className="grid size-7 shrink-0 place-items-center rounded-lg bg-(--mark) text-surface shadow-xs"
    >
      <Icon size={14} />
    </span>
  )
}

/** Signal bars for priority, the lit count said in words. */
function PriorityBars({ priority }: { priority: Priority }) {
  const lit = { low: 1, medium: 2, high: 3 }[priority]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-ui-xs font-medium',
        priority === 'high' ? 'text-danger-text' : priority === 'medium' ? 'text-warning-text' : 'text-success-text',
      )}
    >
      <span aria-hidden className="flex items-end gap-0.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn('w-0.75 rounded-full', ['h-1.5', 'h-2.5', 'h-3.5'][i], i < lit ? 'bg-current' : 'bg-well')} />
        ))}
      </span>
      {PRIORITY_LABEL[priority]}
    </span>
  )
}

/** The loads that need a dispatcher, as cards; one is selected and drawn on the map. Pills filter to at risk or unassigned. */
export function Queue({
  loads,
  selected,
  onSelect,
  pending,
  className,
}: {
  loads: Load[]
  selected: string
  onSelect: (id: string) => void
  pending: number
  className?: string
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const risky = (l: Load) => l.status === 'at-risk' || l.status === 'delayed'
  const shown = loads.filter((l) => (filter === 'risk' ? risky(l) : filter === 'unassigned' ? !l.driver : true))
  const counts: Record<Filter, number> = { all: loads.length, risk: loads.filter(risky).length, unassigned: loads.filter((l) => !l.driver).length }
  return (
    <Card role="region" aria-labelledby="dispatch-queue" size="sm" className={cn('min-w-0', className)}>
      <CardHeader>
        <CardTitle>
          <h2 id="dispatch-queue">Dispatch queue</h2>
        </CardTitle>
        <CardDescription>
          {loads.length} loads · {pending} need a decision
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain pb-1 yj-scrollbar">
        <ToggleGroup
          aria-label="Show"
          variant="segmented"
          size="sm"
          value={[filter]}
          onValueChange={(next: unknown[]) => setFilter((next[0] as Filter | undefined) ?? 'all')}
          className="w-full shrink-0"
        >
          {(['all', 'risk', 'unassigned'] as const).map((f) => (
            <ToggleGroupItem key={f} value={f} className="gap-1.5">
              {{ all: 'All', risk: 'At risk', unassigned: 'Unassigned' }[f]} <span className="text-fg-muted tabular-nums">{counts[f]}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ul className="flex flex-col gap-2">
          {shown.map((load) => {
            const driver = DRIVERS.find((d) => d.id === load.driver)
            const current = load.id === selected
            const badge = STATUS_BADGE[load.status]
            const StatusIcon = badge.icon
            return (
              <li key={load.id}>
                <button
                  type="button"
                  aria-pressed={current}
                  onClick={() => onSelect(load.id)}
                  className={cn(
                    'focus-ring flex w-full flex-col gap-3 rounded-xl p-3 text-start transition-[background-color,box-shadow] yj-duration-fast ease-standard',
                    current ? 'bg-surface shadow-xs ring-2 ring-accent' : 'bg-band hover:ring-1 hover:ring-line-subtle',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-ui-sm font-medium text-fg tabular-nums">{load.id}</span>
                    <Badge variant={badge.variant} className="gap-1">
                      <StatusIcon size={12} />
                      {STATUS_LABEL[load.status]}
                    </Badge>
                  </span>
                  <span className="flex min-w-0 items-center gap-2.5">
                    <CustomerMark customer={load.customer} />
                    <span className="truncate text-ui font-medium text-fg">
                      {load.customer} <span className="font-normal text-fg-muted">· {load.pallets} pallets</span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      'relative grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1.5 rounded-lg px-3 py-2.5 text-ui-sm',
                      current ? 'bg-band' : 'bg-surface',
                    )}
                  >
                    <span aria-hidden className="absolute start-[--spacing(3.875)] top-5 bottom-5 w-px bg-well" />
                    <span aria-hidden className="relative size-2 rounded-full bg-fg" />
                    <span className="truncate text-fg">{load.origin.name}</span>
                    <span className="text-fg-muted tabular-nums">{clock(load.departs)}</span>
                    <span aria-hidden className={cn('relative size-2 rounded-full border-2 border-accent', current ? 'bg-band' : 'bg-surface')} />
                    <span className="truncate text-fg">{load.destination.name}</span>
                    <span className={cn('tabular-nums', load.late ? 'font-medium text-danger-text' : 'text-fg-muted')}>{clock(load.eta)}</span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    {driver ? (
                      <span className="flex min-w-0 items-center gap-2 text-ui-sm text-fg">
                        <Avatar size="sm">
                          <AvatarFallback>{initials(driver.name)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{driver.name}</span>
                      </span>
                    ) : (
                      <span className="text-ui-sm font-medium text-accent-text">Unassigned · 1 match</span>
                    )}
                    <PriorityBars priority={load.priority} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
