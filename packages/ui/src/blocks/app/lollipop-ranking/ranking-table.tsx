'use client'

import { ArrowDownIcon, ArrowUpIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Sparkline } from '../../../components/ui/sparkline'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { cn, numberFormat, relativeTimeFormat } from '../../../lib/utils'
import { statusOf, type LollipopRankingCopy, type LollipopRankingItem, type LollipopRankingStatus, type LollipopRankingTone } from './data'

/* The items as a table: the name (a button that picks it) over its detail,
 * target and period; the owner; the last 90 days as a sparkline in the
 * status ink; the value, signed; when it crosses the line; and the alert. The
 * value column sorts. Rows keep one height in a region of stable size that
 * scrolls under a sticky head; on a narrow card the trend, owner, runs-out
 * and alert columns fold away (the head's badge still counts the paging). */

interface RankingTableProps {
  items: LollipopRankingItem[]
  statuses: readonly LollipopRankingStatus[]
  selected: string | null
  onSelect: (id: string) => void
  sort: 'ascending' | 'descending'
  onSortChange: (sort: 'ascending' | 'descending') => void
  copy: LollipopRankingCopy
  locale: string
}

const INK: Record<LollipopRankingTone, string> = {
  accent: 'var(--color-accent)',
  neutral: 'var(--color-fg-muted)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
}
const TEXT: Record<LollipopRankingTone, string> = {
  accent: 'text-accent-text',
  neutral: 'text-fg-muted',
  success: 'text-success-text',
  warning: 'text-warning-text',
  danger: 'text-danger-text',
}

export function RankingTable({ items, statuses, selected, onSelect, sort, onSortChange, copy, locale }: RankingTableProps) {
  const signed = numberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' })
  const target = numberFormat(locale, { style: 'percent', maximumFractionDigits: 2 })
  const days = relativeTimeFormat(locale, { numeric: 'auto' })
  const Arrow = sort === 'ascending' ? ArrowUpIcon : ArrowDownIcon

  return (
    <div
      data-slot="lollipop-ranking-table"
      className={cn(
        '@container/ranking h-120 min-w-0',
        // The table's own frame scrolls, so its head can stick.
        '[&>[data-slot=table-container]]:h-full [&>[data-slot=table-container]]:overflow-y-auto',
      )}
    >
      <Table aria-label={copy.items} className="table-fixed">
        <TableHeader className="sticky top-0 z-10 bg-surface">
          <TableRow>
            <TableHead className="ps-0">{copy.item}</TableHead>
            <TableHead className="hidden w-16 @2xl/ranking:table-cell">{copy.owner}</TableHead>
            <TableHead className="hidden w-32 @lg/ranking:table-cell">{copy.trend}</TableHead>
            <TableHead aria-sort={sort} className="w-32 pe-0 text-end @md/ranking:pe-3">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onSortChange(sort === 'ascending' ? 'descending' : 'ascending')}
                className="-me-1 @md/ranking:-me-2"
              >
                {copy.value}
                <Arrow aria-hidden />
              </Button>
            </TableHead>
            <TableHead className="hidden w-28 ps-6 @xl/ranking:table-cell">{copy.eta}</TableHead>
            <TableHead className="hidden w-24 pe-0 @md/ranking:table-cell">{copy.alert}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const tone = statusOf(item, statuses)?.tone ?? 'neutral'
            const isSelected = item.id === selected
            return (
              <TableRow
                key={item.id}
                data-state={isSelected ? 'selected' : undefined}
                data-status={statusOf(item, statuses)?.id}
                onClick={() => onSelect(item.id)}
                className="cursor-pointer"
              >
                <TableCell className="ps-0">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={(event) => {
                        event.stopPropagation()
                        onSelect(item.id)
                      }}
                      className="w-fit max-w-full truncate rounded-xs text-start text-ui text-fg focus-ring"
                    >
                      {item.name}
                    </button>
                    <span className="flex min-w-0 items-center gap-1.5 text-ui-sm text-fg-muted [&_svg]:size-3.5 [&_svg]:shrink-0">
                      {item.icon && <span aria-hidden>{item.icon}</span>}
                      <span className="truncate font-mono">{copy.meta(item.detail, target.format(item.target), copy.period(item.period))}</span>
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden @2xl/ranking:table-cell">
                  {/* The name is in the panel for the picked SLO; here it is spoken, and shown on hover. */}
                  <Tooltip>
                    <TooltipTrigger render={<span className="inline-flex" />}>
                      <Avatar size="sm" aria-hidden>
                        <AvatarFallback>{item.owner.initials}</AvatarFallback>
                      </Avatar>
                      <span className="sr-only">{item.owner.name}</span>
                    </TooltipTrigger>
                    <TooltipContent>{item.owner.name}</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="hidden @lg/ranking:table-cell">
                  <Sparkline data={item.history} color={INK[tone]} area={false} dot={false} label={copy.trendOf(item.name)} className="h-7 w-28" />
                </TableCell>
                <TableCell className={cn('pe-0 text-end font-mono text-ui tabular-nums @md/ranking:pe-3', TEXT[tone])}>
                  {signed.format(item.value)}
                </TableCell>
                <TableCell className="hidden ps-6 text-ui @xl/ranking:table-cell">
                  {item.value < 0 ? (
                    <span className="text-danger-text">{copy.pastZero}</span>
                  ) : item.eta !== undefined ? (
                    <span className="text-fg tabular-nums">{days.format(item.eta, 'day')}</span>
                  ) : (
                    <span className="text-fg-muted">{copy.steady}</span>
                  )}
                </TableCell>
                <TableCell className="hidden pe-0 @md/ranking:table-cell">
                  {item.alert === 'raised' ? (
                    <Badge variant="danger">
                      <BadgeDot />
                      {copy.alerts.raised}
                    </Badge>
                  ) : (
                    <span className="text-ui text-fg-muted">{copy.alerts[item.alert]}</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-96 px-0">
                <Empty className="border-0">
                  <EmptyHeader>
                    <EmptyTitle>{copy.noMatch}</EmptyTitle>
                    <EmptyDescription>{copy.noMatchHint}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
