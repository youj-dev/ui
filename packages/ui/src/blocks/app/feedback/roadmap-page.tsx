import type { ReactNode, Ref } from 'react'
import { Badge } from '../../../components/ui/badge'

/* The app page the floating survey and widget sit over: Tern's public
 * roadmap, quiet enough to stay behind them. */

const COLUMNS = [
  {
    name: 'Now',
    items: [
      { title: 'Offline drafts', note: 'Write while the train is in a tunnel; syncs when you’re back.', tag: 'Editor' },
      { title: 'Faster search', note: 'Results as you type, across every project, under 80 ms.', tag: 'Search' },
    ],
  },
  {
    name: 'Next',
    items: [
      { title: 'Linear sync', note: 'Two-way issue sync with status and assignee.', tag: 'Integrations' },
      { title: 'Saved views', note: 'Pin filters and share them with your team.', tag: 'Projects' },
      { title: 'Audit export', note: 'Stream the audit log to S3 or BigQuery.', tag: 'Security' },
    ],
  },
  {
    name: 'Later',
    items: [
      { title: 'Mobile app', note: 'Triage and reply from your phone.', tag: 'Apps' },
      { title: 'Custom fields', note: 'Numbers, dates and people on any item.', tag: 'Projects' },
    ],
  },
]

function RoadmapPage({ mainRef, brand }: { mainRef: Ref<HTMLElement>; brand: { name: string; logo?: ReactNode } }) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-8">
          {brand.logo ?? (
            <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-ui-sm font-semibold text-on-accent">
              {brand.name.charAt(0)}
            </span>
          )}
          <span className="font-semibold tracking-tight">{brand.name}</span>
          <span aria-hidden className="text-fg-muted">
            /
          </span>
          <span className="truncate text-fg-muted">Roadmap</span>
        </div>
      </header>
      <main ref={mainRef} tabIndex={-1} className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-8 pb-28 outline-none md:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-fg">Roadmap</h1>
          <p className="text-ui text-fg-muted">What we’re building this quarter, and what comes after. Updated Sep 24.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((column) => (
            <section key={column.name} aria-label={column.name} className="flex flex-col gap-2 rounded-xl bg-band p-2">
              <h2 className="flex items-center gap-2 px-2 pt-1 text-ui font-medium text-fg">
                {column.name}
                <span className="text-ui-sm font-normal text-fg-muted tabular-nums">{column.items.length}</span>
              </h2>
              {column.items.map((item) => (
                <article key={item.title} className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-3 shadow-xs">
                  <h3 className="text-ui font-medium text-fg">{item.title}</h3>
                  <p className="text-ui-sm text-fg-muted">{item.note}</p>
                  <Badge variant="outline" className="mt-1 self-start">
                    {item.tag}
                  </Badge>
                </article>
              ))}
            </section>
          ))}
        </div>
      </main>
    </>
  )
}

export { RoadmapPage }
