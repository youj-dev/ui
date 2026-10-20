import { Sparkline } from '../../../components/ui/sparkline'
import { cn } from '../../../lib/utils'

/* The mega menu's pictures: small, drawn in tokens, decorative. Each is a
 * miniature of the product page it leads to. */

const TONE = { ok: 'bg-success', warn: 'bg-warning', bad: 'bg-danger', idle: 'bg-fg-subtle' } as const

interface StatusRow {
  label: string
  meta: string
  tone: keyof typeof TONE
}

/** A short list of things with a status dot: deploys, rules, regions. */
export function StatusPreview({ title, rows }: { title: string; rows: StatusRow[] }) {
  return (
    <span className="flex size-full flex-col gap-1.5 bg-surface p-3">
      <span className="text-ui-xs font-medium text-fg-muted">{title}</span>
      {rows.map((row) => (
        <span key={row.label} className="flex items-center gap-2 rounded-md border border-line bg-canvas px-2 py-1.5 text-ui-xs shadow-xs">
          <span className={cn('size-1.5 shrink-0 rounded-full', TONE[row.tone])} />
          <span className="min-w-0 flex-1 truncate font-medium text-fg">{row.label}</span>
          <span className="shrink-0 text-fg-muted tabular-nums">{row.meta}</span>
        </span>
      ))}
    </span>
  )
}

/** A headline figure over a trend line. */
export function ChartPreview({ title, value, delta, data }: { title: string; value: string; delta: string; data: number[] }) {
  return (
    <span className="flex size-full flex-col gap-2 bg-surface p-3">
      <span className="text-ui-xs font-medium text-fg-muted">{title}</span>
      <span className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-fg tabular-nums">{value}</span>
        <span className="text-ui-xs font-medium text-success-text tabular-nums">{delta}</span>
      </span>
      <Sparkline data={data} className="min-h-0 flex-1" />
    </span>
  )
}

/** A few lines of terminal output, the last one the result. */
export function TerminalPreview({ lines }: { lines: string[] }) {
  return (
    <span className="flex size-full flex-col justify-center gap-1 bg-surface p-3 font-mono text-ui-xs text-fg-muted">
      {lines.map((line, i) => (
        <span key={line} className={cn('truncate', i === 0 && 'text-fg', i === lines.length - 1 && 'text-success-text')}>
          {i === 0 && <span className="text-accent-text">$ </span>}
          {line}
        </span>
      ))}
    </span>
  )
}

/** A grid of tiles, some lit: a map of regions or a catalog of integrations. */
export function TilesPreview({ lit, cols = 6, rows = 3 }: { lit: number[]; cols?: number; rows?: number }) {
  return (
    <span className="grid size-full place-content-center gap-1.5 bg-surface p-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: cols * rows }, (_, i) => (
        <span key={i} className={cn('aspect-square rounded-sm border border-line', lit.includes(i) ? 'border-transparent bg-accent' : 'bg-canvas')} />
      ))}
    </span>
  )
}
