'use client'

import { useState } from 'react'
import { Counter } from '@youj/motion'
import { cn } from '@youj/react/lib/utils'
import type { Figure } from '../data'
import { change } from '../format'

const USD = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const
const PCT = { style: 'percent', maximumFractionDigits: 1 } as const
const PCT_WHOLE = { style: 'percent', maximumFractionDigits: 0 } as const

/**
 * A figure that arrives at its value (an opening page doesn't count up from
 * zero) and rolls to each new one, digit by digit, when the week changes.
 */
export function Num({ value, format = USD, className }: { value: number; format?: Intl.NumberFormatOptions; className?: string }) {
  const [first] = useState(value)
  return <Counter value={value} from={first} inView={false} mode="roll" format={format} locale="en-US" duration="deliberate" className={className} />
}

/** "↑ 13.8%", in the ink of good or bad news. Up is good unless `invert`. */
export function Delta({ figure, invert = false, className }: { figure: Figure; invert?: boolean; className?: string }) {
  const diff = change(figure)
  const good = invert ? diff <= 0 : diff >= 0
  return (
    <span className={cn('inline-flex items-baseline gap-0.5 text-ui-sm tabular-nums', good ? 'text-success-text' : 'text-danger-text', className)}>
      <span aria-hidden>{diff >= 0 ? '↑' : '↓'}</span>
      <span className="sr-only">{diff >= 0 ? 'up' : 'down'} </span>
      <Num value={Math.abs(diff)} format={Math.abs(diff) >= 1 ? PCT_WHOLE : PCT} />
    </span>
  )
}
