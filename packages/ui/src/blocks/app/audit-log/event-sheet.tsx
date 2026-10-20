'use client'

import { ArrowRightIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { CodeBlock } from '../../../components/ui/code-block'
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../../../components/ui/sheet'
import { ActorBadge } from './columns'
import { formatTime, rawEvent, toneVariant, type AuditActor, type AuditCategory, type AuditEvent, type AuditLogCopy, type AuditResult } from './data'
import { Eyebrow } from '../../../components/ui/typography'

/* One event in full: who, what, where from, what changed, and the raw record
 * as the API returns it (CodeBlock, with copy). The sheet keeps the last
 * event while it slides out, so its content doesn't blank mid-exit. */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[--spacing(28)_minmax(0,1fr)] items-baseline gap-3 py-2">
      <Eyebrow render={<dt />} className="text-ui-sm text-fg-muted">
        {label}
      </Eyebrow>
      <dd className="min-w-0 text-ui text-fg">{children}</dd>
    </div>
  )
}

interface EventSheetProps {
  event: AuditEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  copy: AuditLogCopy
  actors: Record<string, AuditActor>
  categories: AuditCategory[]
  results: AuditResult[]
  locale: string
}

export function EventSheet({ event, open, onOpenChange, copy, actors, categories, results, locale }: EventSheetProps) {
  const result = results.find((r) => r.id === event?.result)
  const category = categories.find((c) => c.id === event?.category)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        {event && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <Badge variant={toneVariant(result?.tone ?? 'neutral')}>{result?.label ?? event.result}</Badge>
                <Badge variant={toneVariant(category?.tone)}>{category?.label ?? event.category}</Badge>
              </div>
              <SheetTitle className="text-balance">{event.summary}</SheetTitle>
              <SheetDescription>
                <time dateTime={event.time}>{formatTime(event.time, locale)} {copy.timeZone}</time> · <span className="font-mono">{event.id}</span>
              </SheetDescription>
            </SheetHeader>
            <SheetBody className="flex flex-col gap-6">
              <dl className="flex flex-col divide-y divide-line">
                <Row label={copy.actor}>
                  <ActorBadge id={event.actor} actors={actors} />
                </Row>
                <Row label={copy.action}>
                  <span className="font-mono text-ui-sm">{event.action}</span>
                </Row>
                <Row label={copy.target}>{event.target}</Row>
                <Row label={copy.location}>
                  {event.location} · <span className="font-mono text-ui-sm">{event.ip}</span>
                </Row>
                <Row label={copy.client}>{event.userAgent}</Row>
              </dl>
              {event.changes && (
                <section aria-labelledby="audit-changes" className="flex flex-col gap-2">
                  <h3 id="audit-changes" className="text-ui font-medium text-fg">
                    {copy.changes}
                  </h3>
                  <ul className="flex flex-col gap-1.5">
                    {event.changes.map((c) => (
                      <li key={c.field} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-transparent px-3 py-2 text-ui">
                        <span className="me-auto font-mono text-ui-sm text-fg-muted">{c.field}</span>
                        <del className="text-danger-text decoration-danger-line">{c.from}</del>
                        <ArrowRightIcon size={14} aria-hidden className="text-fg-muted rtl:-scale-x-100" />
                        <span className="sr-only">{copy.changedTo}</span>
                        <ins className="text-success-text no-underline">{c.to}</ins>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section aria-labelledby="audit-raw" className="flex flex-col gap-2">
                <h3 id="audit-raw" className="text-ui font-medium text-fg">
                  {copy.raw}
                </h3>
                <CodeBlock code={rawEvent(event, actors)} language="json" filename={`${event.id}.json`} copyLabel={copy.copyRaw} />
              </section>
            </SheetBody>
            <SheetFooter>
              <SheetClose render={<Button variant="outline" />}>{copy.close}</SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
