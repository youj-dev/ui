'use client'

import { Counter, MorphLabel } from '@youj/motion'
import { HIDDEN, usd } from '../format'

/** A figure that hides behind dots with the balance. */
export function Amount({ value, hidden, format = usd, className }: { value: number; hidden: boolean; format?: Intl.NumberFormatOptions; className?: string }) {
  return (
    <MorphLabel value={hidden ? 'hidden' : 'shown'} className={className}>
      {hidden ? (
        <span aria-label="Hidden" className="tracking-widest">
          {HIDDEN}
        </span>
      ) : (
        <Counter value={value} format={format} inView={false} />
      )}
    </MorphLabel>
  )
}
