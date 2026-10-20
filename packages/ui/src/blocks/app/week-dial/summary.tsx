import { toneFill, type WeekDialKind } from './model'

/* The week's total, large, and under it a legend that is also the totals:
 * one swatch, length and name per kind, the length in the kind's own color
 * when it is the accent. The total is named for screen readers, not drawn. */

interface SummaryProps {
  total: string
  totalLabel: string
  kinds: readonly { kind: WeekDialKind; length: string }[]
}

function Summary({ total, totalLabel, kinds }: SummaryProps) {
  return (
    <dl data-slot="week-dial-summary" className="flex flex-col gap-3">
      <dt className="sr-only">{totalLabel}</dt>
      <dd className="text-4xl leading-none font-semibold tracking-tight text-fg tabular-nums">{total}</dd>
      <dd>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-ui-sm">
          {kinds.map(({ kind, length }) => (
            <li key={kind.id} className="flex items-center gap-2 tabular-nums">
              <span aria-hidden className="size-2 rounded-xs" style={{ background: toneFill(kind.tone) }} />
              <span className={kind.tone === 'accent' ? 'font-medium text-accent-text' : 'font-medium text-fg'}>{length}</span>
              <span className="text-fg-muted">{kind.label}</span>
            </li>
          ))}
        </ul>
      </dd>
    </dl>
  )
}

export { Summary }
