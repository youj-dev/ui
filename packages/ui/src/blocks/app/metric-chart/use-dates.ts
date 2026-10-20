'use client'

import { useMemo } from 'react'
import { timeOf, type Granularity, type MetricChartCopy, type Point } from './data'
import { dateTimeFormat } from '../../../lib/utils'

/* The buckets' dates, written for the axis (short), the readout (in full)
 * and the header (the period). Dates are read and written in UTC: a bucket
 * that starts on 3 October is 3 October wherever the reader is. */

const TICK: Record<Granularity, Intl.DateTimeFormatOptions> = {
  hour: { hour: 'numeric' },
  day: { month: 'short', day: 'numeric' },
  week: { month: 'short', day: 'numeric' },
  month: { month: 'short' },
}
const LONG: Record<Granularity, Intl.DateTimeFormatOptions> = {
  hour: { weekday: 'short', hour: 'numeric', minute: '2-digit' },
  day: { weekday: 'short', month: 'short', day: 'numeric' },
  week: { month: 'short', day: 'numeric' },
  month: { month: 'long', year: 'numeric' },
}
const PERIOD: Record<Granularity, Intl.DateTimeFormatOptions> = {
  hour: { month: 'short', day: 'numeric', hour: 'numeric' },
  day: { month: 'short', day: 'numeric' },
  week: { month: 'short', day: 'numeric' },
  month: { month: 'short', year: 'numeric' },
}

function useDates(points: Point[], granularity: Granularity, copy: Pick<MetricChartCopy, 'locale' | 'weekOf'>) {
  const { locale, weekOf } = copy
  return useMemo(() => {
    const as = (options: Intl.DateTimeFormatOptions) => dateTimeFormat(locale, { ...options, timeZone: 'UTC' })
    const short = as(TICK[granularity])
    const full = as(LONG[granularity])
    const span = as(PERIOD[granularity])
    const times = points.map((p) => timeOf(p.date))
    const first = times[0]
    const last = times.at(-1)
    return {
      tick: (i: number) => (times[i] === undefined ? '' : short.format(times[i])),
      long: (i: number) => (times[i] === undefined ? '' : granularity === 'week' ? weekOf(full.format(times[i])) : full.format(times[i])),
      period: first === undefined || last === undefined ? '' : first === last ? span.format(first) : span.formatRange(first, last),
    }
  }, [points, granularity, locale, weekOf])
}

export { useDates }
