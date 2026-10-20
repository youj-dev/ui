'use client'

import { useId, type CSSProperties } from 'react'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { cn } from '../../../lib/utils'
import type { AnswerProps } from './shared'

/* A matrix: each row a statement answered on the same columns, one radio
 * group per row, named by its statement. On a wide container it's a grid with
 * the column heads once at the top and each answer a radio under its head; on
 * a narrow one (a phone) each row stacks its statement over its answers as
 * cards that say their column, so nothing scrolls sideways. A required matrix
 * needs every row. */

export function MatrixAnswer({ question, answer, onAnswer, labelledBy, describedBy, invalid, size }: AnswerProps<'matrix'>) {
  const id = useId()
  const values = (answer && typeof answer === 'object' && !Array.isArray(answer) ? answer : {}) as Record<string, string>
  const grid = { '--matrix-cols': `minmax(0,1.5fr) repeat(${question.columns.length},minmax(0,1fr))` } as CSSProperties

  return (
    <div role="group" aria-labelledby={labelledBy} aria-describedby={describedBy} className="flex flex-col" style={grid}>
      <div aria-hidden className="hidden gap-2 pb-2 text-center text-ui-sm text-fg-muted @xl:grid @xl:grid-cols-(--matrix-cols)">
        <span />
        {question.columns.map((column) => (
          <span key={column.value} className="text-balance">
            {column.label}
          </span>
        ))}
      </div>
      {question.rows.map((row) => {
        const rowId = `${id}-${row.value}`
        const missing = invalid && !values[row.value]
        return (
          <div key={row.value} className="grid gap-2 border-t border-line py-3 @xl:grid-cols-(--matrix-cols) @xl:items-center @xl:gap-x-2 @xl:py-2">
            <span id={rowId} className={cn('font-medium text-fg', size === 'lg' ? 'text-ui-lg' : 'text-ui', missing && 'text-danger-text')}>
              {row.label}
            </span>
            <RadioGroup
              aria-labelledby={rowId}
              aria-invalid={missing || undefined}
              value={values[row.value] ?? null}
              onValueChange={(value) => onAnswer({ ...values, [row.value]: value as string })}
              className="flex flex-wrap gap-1.5 @xl:col-[2/-1] @xl:grid @xl:grid-cols-subgrid @xl:gap-x-2"
            >
              {question.columns.map((column) => (
                <label
                  key={column.value}
                  className={cn(
                    'relative flex cursor-pointer items-center gap-2 rounded-md border border-line px-2.5 py-1.5 select-none',
                    'transition-colors yj-duration-fast ease-standard hover:bg-hover',
                    'has-data-checked:border-accent has-data-checked:bg-accent-subtle',
                    '@xl:justify-center @xl:border-transparent @xl:py-2 @xl:has-data-checked:border-transparent @xl:has-data-checked:bg-transparent',
                  )}
                >
                  <RadioGroupItem value={column.value} />
                  <span className="text-ui text-fg @xl:sr-only">{column.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
        )
      })}
    </div>
  )
}
