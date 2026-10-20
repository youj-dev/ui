import { CheckCircleIcon, HistoryIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { cn } from '../../../lib/utils'

/* The demo's featured picture: a deploy history with the previous deploy
 * about to be promoted back. Decorative; the entry's text says what it is. */

const ROWS = [
  { id: 'a1f9', note: 'Fix checkout rounding', state: 'now' as const },
  { id: '8be07d', note: 'New pricing page', state: 'rollback' as const },
  { id: '3f9c2a', note: 'Add Klarna', state: 'old' as const },
]

export function StatusPreviewList({ title = 'Production deploys', rollback = 'Roll back', live = 'Live' }: { title?: string; rollback?: string; live?: string }) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-xl border border-line bg-surface p-3 text-ui">
      <p className="flex items-center gap-2 px-1 text-ui-sm font-medium text-fg-muted">
        <HistoryIcon size={14} aria-hidden />
        {title}
      </p>
      {ROWS.map((row) => (
        <div key={row.id} className={cn('flex items-center gap-3 rounded-lg border px-3 py-2', row.state === 'rollback' ? 'border-line bg-band' : 'border-line bg-canvas')}>
          <span className="font-mono text-ui-sm text-fg-muted">{row.id}</span>
          <span className="min-w-0 flex-1 truncate text-fg">{row.note}</span>
          {row.state === 'now' && <Badge variant="success">{live}</Badge>}
          {row.state === 'rollback' && (
            <span className="inline-flex items-center gap-1 text-ui-sm font-medium text-accent-text">
              <CheckCircleIcon size={14} aria-hidden />
              {rollback}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
