'use client'

import { useMemo, useState, type ElementType } from 'react'
import { CheckIcon, ExternalLinkIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Button, buttonVariants } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../../../components/ui/sheet'
import { HistoryStrip } from '../../../components/ui/history-strip'
import { cn, dateTimeFormat } from '../../../lib/utils'
import { HEALTH_DOT, Mark } from './card'
import type { Integration, IntegrationConnection, IntegrationStatus, MarketingIntegrationsCopy } from './data'

/* The connection detail, in a sheet from the inline end: what the integration
 * is and does, what it may access, and, once connected, who connected it,
 * when it last synced, how healthy it is and a month of sync history. The
 * footer holds the action: Connect, or Disconnect (and Reconnect when the
 * connection needs attention). Both run through Button's onAction, so the
 * pending state and a failure's message show in place. */

const MINUTE = 60_000
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 24 * 60 * MINUTE],
  ['hour', 60 * MINUTE],
  ['minute', MINUTE],
]

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-ui text-fg-muted">{label}</dt>
      <dd className="text-end text-ui font-medium text-fg">{children}</dd>
    </div>
  )
}

interface DetailProps {
  integration: Integration | null
  status: IntegrationStatus
  connection: IntegrationConnection | undefined
  onOpenChange: (open: boolean) => void
  onConnect: (integration: Integration) => Promise<unknown> | unknown
  onDisconnect: (integration: Integration) => Promise<unknown> | unknown
  locale: string
  now: number
  copy: MarketingIntegrationsCopy
  Link: ElementType
}

export function IntegrationDetail({ integration, status, connection, onOpenChange, onConnect, onDisconnect, locale, now, copy, Link }: DetailProps) {
  const [shown, setShown] = useState(integration)
  // Keep the last integration while the sheet slides away.
  if (integration && integration !== shown) setShown(integration)
  const item = integration ?? shown
  const formats = useMemo(
    () => ({
      ago: new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
      date: dateTimeFormat(locale, { dateStyle: 'medium' }),
    }),
    [locale],
  )
  const ago = (at: number) => {
    const diff = at - now
    const [unit, size] = UNITS.find(([, ms]) => Math.abs(diff) >= ms) ?? UNITS[2]!
    return Math.abs(diff) < MINUTE ? formats.ago.format(0, 'second') : formats.ago.format(Math.round(diff / size), unit)
  }
  const failing = connection?.health === 'error'
  return (
    <Sheet open={integration !== null} onOpenChange={onOpenChange}>
      <SheetContent side="end" className="sm:max-w-md">
        {item && (
          <>
            <SheetHeader className="flex-row items-center gap-3 pe-12">
              <Mark integration={item} className="size-12" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <SheetTitle>{item.name}</SheetTitle>
                <SheetDescription>{item.category}</SheetDescription>
              </div>
              <Badge variant={status === 'connected' ? 'success' : status === 'soon' ? 'secondary' : status === 'beta' ? 'default' : 'outline'} className="ms-auto">
                {copy.status[status]}
              </Badge>
            </SheetHeader>
            <SheetBody className="gap-6">
              <section aria-label={copy.about} className="flex flex-col gap-2">
                <p className="text-pretty text-ui text-fg-muted">{item.about ?? item.description}</p>
              </section>

              {status === 'connected' && connection && (
                <section aria-labelledby="integration-connection" className="flex flex-col gap-2">
                  <h3 id="integration-connection" className="text-ui font-semibold text-fg">
                    {copy.connection}
                  </h3>
                  <dl className="divide-y divide-line rounded-xl border border-line px-4">
                    <Row label={copy.account}>{connection.account}</Row>
                    <Row label={copy.connectedBy}>
                      {connection.connectedBy}
                      <span className="block text-ui-sm font-normal text-fg-muted">{formats.date.format(connection.connectedAt)}</span>
                    </Row>
                    <Row label={copy.lastSync}>{ago(connection.lastSync)}</Row>
                    <Row label={copy.healthLabel}>
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden className={cn('size-2 rounded-full', HEALTH_DOT[connection.health])} />
                        {copy.health[connection.health]}
                      </span>
                    </Row>
                  </dl>
                  {connection.healthNote && (
                    <p role={failing ? 'alert' : undefined} className={cn('text-ui-sm', failing ? 'text-danger-text' : 'text-warning-text')}>
                      {connection.healthNote}
                    </p>
                  )}
                  {connection.history && <HistoryStrip days={connection.history} label={copy.syncHistory} />}
                </section>
              )}

              {item.features && item.features.length > 0 && (
                <section aria-labelledby="integration-does" className="flex flex-col gap-2">
                  <h3 id="integration-does" className="text-ui font-semibold text-fg">
                    {copy.whatItDoes}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-ui text-fg-muted">
                        <CheckIcon size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {item.scopes && item.scopes.length > 0 && (
                <section aria-labelledby="integration-scopes" className="flex flex-col gap-2">
                  <h3 id="integration-scopes" className="text-ui font-semibold text-fg">
                    {copy.permissions}
                  </h3>
                  <ul className="flex flex-col gap-1.5 text-ui text-fg-muted">
                    {item.scopes.map((scope) => (
                      <li key={scope} className="rounded-md bg-band px-3 py-1.5">
                        {scope}
                      </li>
                    ))}
                  </ul>
                  <p className="text-ui-sm text-fg-muted">{copy.permissionsNote}</p>
                </section>
              )}
            </SheetBody>
            <SheetFooter className="flex-col gap-2 sm:flex-col">
              {status === 'connected' ? (
                <>
                  {failing && (
                    <AsyncButton onAction={() => onConnect(item)} pendingLabel={copy.connecting} errorLabel={(error) => (error instanceof Error ? error.message : copy.failed)}>
                      {copy.reconnect}
                    </AsyncButton>
                  )}
                  <AsyncButton
                    variant="outline"
                    onAction={() => onDisconnect(item)}
                    pendingLabel={copy.disconnecting}
                    errorLabel={(error) => (error instanceof Error ? error.message : copy.failed)}
                  >
                    {copy.disconnect}
                  </AsyncButton>
                </>
              ) : status === 'soon' ? (
                <Button variant="outline" disabled>
                  {copy.status.soon}
                </Button>
              ) : (
                <AsyncButton onAction={() => onConnect(item)} pendingLabel={copy.connecting} errorLabel={(error) => (error instanceof Error ? error.message : copy.failed)}>
                  {copy.connect}
                </AsyncButton>
              )}
              {item.docsHref && (
                <Link href={item.docsHref} className={buttonVariants({ variant: 'ghost' })}>
                  {copy.docs}
                  <ExternalLinkIcon size={14} aria-hidden />
                </Link>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
