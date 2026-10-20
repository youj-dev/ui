'use client'

import { useEffect, useState } from 'react'
import { Counter } from '@youj/motion'
import { cn } from '@youj/react/lib/utils'

const DAY = 86_400_000
const DIGITS = { minimumIntegerDigits: 2 }

/** Time to launch, re-read every twenty seconds; the digits roll over as it counts down. */
export function Countdown({ to, className }: { to: number; className?: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 20_000)
    return () => clearInterval(id)
  }, [])
  const left = Math.max(0, to - now)
  const parts = [
    { value: Math.floor(left / DAY), unit: 'd', word: 'days' },
    { value: Math.floor((left % DAY) / 3_600_000), unit: 'h', word: 'hours' },
    { value: Math.floor((left % 3_600_000) / 60_000), unit: 'm', word: 'minutes' },
  ]
  return (
    <time dateTime={new Date(to).toISOString()} className={cn('flex items-baseline gap-2 font-semibold tracking-tight text-fg tabular-nums', className)}>
      <span className="sr-only">Launch in {parts.map((p) => `${p.value} ${p.word}`).join(', ')}</span>
      {parts.map((p) => (
        <span key={p.unit} aria-hidden className="flex items-baseline gap-0.5">
          <Counter value={p.value} mode="roll" format={DIGITS} inView={false} />
          <span className="text-ui font-medium text-fg-muted">{p.unit}</span>
        </span>
      ))}
    </time>
  )
}
