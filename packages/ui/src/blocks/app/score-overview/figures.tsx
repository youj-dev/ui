'use client'

import { Skeleton } from '../../../components/ui/skeleton'
import { Stat, StatNote, StatValue } from '../../../components/ui/stat-card'
import { cn } from '../../../lib/utils'

/* The four figures under the score, side by side and two by two on a narrow
 * card. While the data loads each is a skeleton; once it failed, a dash. */

interface Figure {
  label: string
  value: number
  note: string
  alarm?: boolean
  format?: Intl.NumberFormatOptions
}

interface FiguresProps {
  figures: readonly Figure[]
  loading: boolean
  failed: boolean
  locale: string
}

function Figures({ figures, loading, failed, locale }: FiguresProps) {
  return (
    // youj-allow: fixed size, a container query can't read the scale
    <div className="grid grid-cols-4 @max-[26rem]/stats:grid-cols-2">
      {figures.map((f, i) => (
        <Stat
          key={f.label}
          label={f.label}
          className={cn(
            'min-w-0 gap-1 border-line px-(--card-spacing) py-3',
            i > 0 && 'border-s',
            // Two by two on a narrow card: the second row gets a top rule, its first tile no start rule.
            // youj-allow: fixed size, a container query can't read the scale
            '@max-[26rem]/stats:nth-[3]:border-s-0 @max-[26rem]/stats:nth-[n+3]:border-t',
          )}
        >
          {loading ? (
            <>
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-3.5 w-16" />
            </>
          ) : failed ? (
            <>
              <span className="text-ui-lg text-fg-subtle">—</span>
              <StatNote className="invisible">{f.label}</StatNote>
            </>
          ) : (
            <>
              <StatValue value={f.value} size="sm" format={f.format} locale={locale} />
              <StatNote className={cn('truncate', f.alarm && 'text-danger-text')}>{f.note}</StatNote>
            </>
          )}
        </Stat>
      ))}
    </div>
  )
}

export { Figures }
