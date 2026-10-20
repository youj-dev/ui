import { CheckIcon, MinusIcon } from '@youj/icons'
import { cn } from '../../../lib/utils'
import type { ComparisonCell, ProductComparisonCopy } from './data'

/** What a cell shows, and says: a check, a half mark, a dash or the value itself. Included, partial and missing are announced, not just drawn. */
export function Cell({ value, copy }: { value: ComparisonCell | undefined; copy: ProductComparisonCopy }) {
  if (value === true)
    return (
      <span className="inline-flex text-accent">
        <CheckIcon size={16} strokeWidth={2.25} aria-hidden />
        <span className="sr-only">{copy.included}</span>
      </span>
    )
  if (value === 'partial')
    return (
      <span className="inline-flex items-center gap-1.5 text-ui-sm text-warning-text">
        <span aria-hidden className="size-3.5 rounded-full border-2 border-current [background:linear-gradient(90deg,currentColor_50%,transparent_50%)] rtl:-scale-x-100" />
        <span>{copy.partial}</span>
      </span>
    )
  if (value === false || value === undefined)
    return (
      <span className="text-fg-muted">
        <MinusIcon size={14} aria-hidden />
        <span className="sr-only">{copy.notIncluded}</span>
      </span>
    )
  return <span className={cn('text-ui font-medium text-fg tabular-nums')}>{value.text}</span>
}

/** The cells that count as having the feature: yes, or a value; partial counts for half. */
export function score(value: ComparisonCell | undefined) {
  if (value === true) return 1
  if (value === 'partial') return 0.5
  if (value === false || value === undefined) return 0
  return 1
}
