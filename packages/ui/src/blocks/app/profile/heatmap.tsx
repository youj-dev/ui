'use client'

import { useMemo } from 'react'
import { Counter } from '@youj/motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip'
import { cn, dateTimeFormat } from '../../../lib/utils'
import type { ProfileContribution, ProfileCopy } from './data'

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
const toDate = (value: Date | number | string) => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00`) : new Date(value))

const WEEKS = 26

function hash(n: number) {
  let h = Math.imul(n ^ 0x9e3779b9, 2654435761)
  h ^= h >>> 15
  return ((h >>> 0) % 1000) / 1000
}

function Heatmap({ now, contributions, locale, copy }: { now: number; contributions?: ProfileContribution[]; locale: string; copy: ProfileCopy }) {
  const dayFormat = useMemo(() => dateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }), [locale])
  const days = useMemo(() => {
    const counts = contributions && new Map(contributions.map((c) => [dayKey(toDate(c.date)), c.count]))
    const end = new Date(now)
    end.setHours(0, 0, 0, 0)
    // Start on the Sunday WEEKS weeks back, so columns are calendar weeks.
    const start = new Date(end)
    start.setDate(end.getDate() - end.getDay() - (WEEKS - 1) * 7)
    return Array.from({ length: WEEKS * 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      const r = hash(i + 11)
      const weekend = date.getDay() === 0 || date.getDay() === 6
      const count = date > end ? -1 : counts ? (counts.get(dayKey(date)) ?? 0) : r < (weekend ? 0.6 : 0.2) ? 0 : Math.round(r * (weekend ? 4 : 14))
      return { date, count }
    })
  }, [now, contributions])
  const total = days.reduce((sum, d) => sum + Math.max(d.count, 0), 0)
  const level = (c: number) => (c <= 0 ? 0 : c < 4 ? 1 : c < 8 ? 2 : c < 11 ? 3 : 4)
  const tone = ['bg-well', 'bg-accent-line', 'bg-accent-line', 'bg-accent', 'bg-accent']
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Counter value={total} locale={locale} format={{ useGrouping: true }} /> {copy.contributions}
        </CardTitle>
        <CardDescription>{copy.heatmapDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <TooltipProvider delay={0}>
          <div
            role="img"
            aria-label={copy.heatmapLabel(total, WEEKS)}
            className="grid w-fit max-w-full grid-flow-col grid-rows-7 gap-[3px] overflow-x-auto sm:gap-1"
          >
            {days.map(({ date, count }) =>
              count < 0 ? (
                <span key={date.getTime()} className="size-2.5 sm:size-3.5" />
              ) : (
                <Tooltip key={date.getTime()}>
                  <TooltipTrigger
                    render={<span aria-hidden />}
                    className={cn('size-2.5 rounded-[3px] sm:size-3.5 hover:ring-2 hover:ring-line-strong', tone[level(count)])}
                  />
                  <TooltipContent>
                    {count === 0 ? copy.noContributions : copy.dayContributions(count)} · {dayFormat.format(date)}
                  </TooltipContent>
                </Tooltip>
              ),
            )}
          </div>
        </TooltipProvider>
        <div aria-hidden className="flex items-center gap-1.5 self-end text-ui-xs text-fg-muted">
          {copy.less}
          {tone.map((t, i) => (
            <span key={i} className={cn('size-2.5 rounded-[3px]', t)} />
          ))}
          {copy.more}
        </div>
      </CardContent>
    </Card>
  )
}

export { Heatmap }
