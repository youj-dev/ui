import { Badge } from '../../../components/ui/badge'
import { useSupportChat } from './context'

/* The app the widget floats over, standalone: Tern's Sources page, where the
 * paused Segment source Mira is fixing lives. Quiet on purpose, so the
 * widget stays the subject. */

const SOURCES = [
  { name: 'Segment', kind: 'Stream', events: '—', paused: true },
  { name: 'Web SDK', kind: 'Browser', events: '812,406' },
  { name: 'iOS SDK', kind: 'Mobile', events: '301,977' },
  { name: 'Postgres', kind: 'Warehouse', events: '96,120' },
]

export function HostPage() {
  const { brand } = useSupportChat()
  return (
    <div className="min-h-dvh bg-canvas text-fg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 md:px-8">
          {brand.logo ?? (
            <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-ui-sm font-semibold text-on-accent">
              {brand.name.charAt(0)}
            </span>
          )}
          <span className="font-semibold tracking-tight">{brand.name}</span>
          <span aria-hidden className="text-fg-muted">/</span>
          <span className="truncate text-fg-muted">Data sources</span>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8 md:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Sources</h1>
          <p className="text-ui text-fg-muted">Where your events come from, and how many arrived today.</p>
        </div>
        <ul className="overflow-hidden rounded-xl border border-line bg-surface">
          {SOURCES.map((source) => (
            <li key={source.name} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-ui font-medium">{source.name}</span>
                <span className="text-ui-sm text-fg-muted">{source.kind}</span>
              </span>
              {source.paused ? <Badge variant="warning">Paused</Badge> : <span className="text-ui text-fg-muted tabular-nums">{source.events} today</span>}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
