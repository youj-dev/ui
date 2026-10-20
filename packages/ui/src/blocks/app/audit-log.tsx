'use client'

import { useId, useMemo, useState, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { ShieldCheckIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { DataTable } from '../tables/data-table'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { cn } from '../../lib/utils'
import { auditColumns } from './audit-log/columns'
import { ACTORS, CATEGORIES, DEFAULT_COPY, EVENTS, RESULTS, type AuditActor, type AuditCategory, type AuditEvent, type AuditLogCopy, type AuditResult } from './audit-log/data'
import { EventSheet } from './audit-log/event-sheet'

/* An audit log (the demo: Northwind's): every change to the workspace, who made it, from
 * where, and whether it went through. A DataTable carries the search (names,
 * events, IPs), the filter keys for date range, actor, type and result with a
 * chip per filter set, sorting, paging and CSV export. Each event's summary
 * opens a Sheet with the actor, context, a before → after of what changed
 * and the raw record in a CodeBlock with copy. Swap EVENTS for your audit
 * API (server mode: DataTable's `manual` and `rowCount`). Pass your own
 * `events` and `actors`; every string is in `copy`.
 * It is built for the compact layout density (ui.css), taken from the page.
 * Reduced motion: the table's row and sheet motion follow the provider. */

interface AuditLogProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'results'> {
  /** Default: the host's theme. */
  theme?: ThemeInput
  /**
   * A view inside another app (a settings page): a `section` named by an
   * `h2` instead of the page's `main` and `h1`, and no page height, width or
   * padding, so the host lays it out. Default false.
   */
  embedded?: boolean
  /** The events, newest first or not: the table sorts by time. Default: sample events. */
  events?: AuditEvent[]
  /** Who can appear as an event's `actor`, by id. Default: the demo's people, API key and system. */
  actors?: Record<string, AuditActor>
  /** How events end, with their badge tone and whether the summary counts them as flagged. Default: success, denied, failed. */
  results?: AuditResult[]
  /** The kinds of event, a choice in the Type filter. Default: members, security, billing, projects, sign-in. */
  categories?: AuditCategory[]
  /** Any of the page's strings, to rewrite or translate. Default: the English demo copy. */
  copy?: Partial<AuditLogCopy>
  /** Shows skeleton rows while the events load. Default false. */
  loading?: boolean
  /** Replaces the empty state shown when there are no events. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Replaces the rows with an error panel; a string is its message. Default: none. */
  error?: ReactNode
  /** Adds a Retry button to the error panel. Default: none. */
  onRetry?: () => void
  /** Called when an event's details open, with the event. Default: none. */
  onOpen?: (event: AuditEvent) => void
  /** Formats the events' times (always in UTC). Default: the app's locale (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** The page heading's level. Default: 1, or 2 when `embedded`. */
  headingLevel?: 1 | 2 | 3
  /** Classes for the page's root element, merged with its own. Default: none. */
  className?: string
}

function AuditLog({
  theme,
  embedded = false,
  events = EVENTS,
  actors = ACTORS,
  results = RESULTS,
  categories = CATEGORIES,
  copy: copyProp,
  loading = false,
  empty,
  error,
  onRetry,
  onOpen,
  locale: localeProp,
  headingLevel,
  className,
  ...rest
}: AuditLogProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const [selected, setSelected] = useState<AuditEvent | null>(null)
  const [open, setOpen] = useState(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: React Compiler counts setOpen as a dependency here; naming it lets the compiler keep this memo
  const columns = useMemo(
    () =>
      auditColumns(
        (event) => {
          setSelected(event)
          setOpen(true)
          onOpen?.(event)
        },
        { ...DEFAULT_COPY, ...copyProp },
        actors,
        locale,
        categories,
        results,
      ),
    [onOpen, actors, copyProp, locale, categories, results, setOpen],
  )
  const Title = (`h${headingLevel ?? (embedded ? 2 : 1)}`) as 'h1' | 'h2' | 'h3'
  const flaggedIds = new Set(results.filter((r) => r.flagged).map((r) => r.id))
  const flagged = events.filter((e) => flaggedIds.has(e.result)).length

  const content = (
    <>
      <Reveal inView={false} variant="rise" className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Title id={titleId} className="text-2xl font-semibold tracking-tight">
            {copy.title}
          </Title>
          <p className="text-ui text-fg-muted">{copy.summary(events.length, flagged)}</p>
        </div>
        <Badge variant="outline">
          <ShieldCheckIcon size={12} /> {copy.retention}
        </Badge>
      </Reveal>
      <DataTable<AuditEvent>
        fill
        label={copy.tableLabel}
        copy={{ noun: copy.noun }}
        rows={events}
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={
          empty ?? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        }
        columns={columns}
        getRowId={(e) => e.id}
        getRowLabel={(e) => e.summary}
        search={{ placeholder: copy.searchPlaceholder }}
        exportable={{ filename: copy.exportFilename }}
        initialState={{ sorting: [{ id: 'time', desc: true }], pagination: { pageIndex: 0, pageSize: 10 } }}
      />
      <EventSheet event={selected} open={open} onOpenChange={setOpen} copy={copy} actors={actors} categories={categories} results={results} locale={locale} />
    </>
  )

  if (embedded) {
    const view = (
      <section aria-labelledby={titleId} {...rest} className={cn('flex flex-col gap-6 text-fg', className)}>
        {content}
      </section>
    )
    return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
  }
  const page = (
    <div {...rest} className={cn('min-h-dvh w-full bg-canvas text-fg', className)}>
      <main aria-labelledby={titleId} className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
        {content}
      </main>
    </div>
  )
  return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
}

export { AuditLog, type AuditLogProps, type AuditLogCopy, type AuditEvent, type AuditActor, type AuditCategory, type AuditResult }
