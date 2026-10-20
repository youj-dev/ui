'use client'

import { useEffect, useState, type HTMLAttributes } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { PlusIcon, WebhookIcon } from '@youj/icons'
import { ConfirmDialog } from '../../components/ui/alert-dialog'
import { AppPage } from '../../components/ui/app-page'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { DEFAULT_COPY, DELIVERIES, demo, ENDPOINTS, makeDelivery, NOW, type Delivery, type Endpoint, type WebhooksCopy } from './webhooks/data'
import { DeliveryLog } from './webhooks/delivery-log'
import { EndpointSheet } from './webhooks/endpoint-sheet'
import { EndpointsTable } from './webhooks/endpoints-table'
import { cn } from '../../lib/utils'

/* Webhook endpoints for a developer platform, dense and table-first. The
 * table lists each URL with its events, its health (enabled, failing when the
 * last delivery failed, or disabled) and its last delivery; pick a row and
 * its delivery log opens below: attempts with their status code, duration
 * and age, and beside them the chosen one's request and response as code,
 * with Resend. Adding or editing an endpoint happens in a Sheet: the URL is
 * checked as you leave it (https only, no duplicates), events are chosen by
 * group (a group's box shows mixed when partly on), and an existing
 * endpoint's signing secret can be revealed (it decodes in), copied or
 * rotated behind a confirmation. Rows and attempts enter and leave through
 * PresenceList. Wire `onSaveEndpoint`, `onDeleteEndpoint`, `onRotateSecret`,
 * `onTest` and `onResend` to your API; without your endpoints and deliveries
 * it shows the demo's under a "Demo data" badge. Reduced motion: rows,
 * attempts and the secret change in place.
 * It is built for the compact layout density (ui.css), taken from the page. */

interface WebhooksProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width. Default true; `false` draws its own page (a centered canvas). */
  embedded?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<WebhooksCopy>
  /** Formats numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The endpoints to start with. Default: three demo endpoints. */
  endpoints?: Endpoint[]
  /** Their recent deliveries, newest first; fresh ones you pass replace the log. Default: the demo's. */
  deliveries?: Delivery[]
  /** The time delivery ages are measured from, which the server and the browser agree on. Default: the demo's fixed time with the demo deliveries; with yours, the browser's clock once mounted. */
  now?: Date | number
  /** Shows a dashed "Demo data" badge while the page shows the demo's endpoints and deliveries (neither passed). Default true. */
  demoMarker?: boolean
  /** Sends a test event to an endpoint; resolve with the resulting delivery to log it. Default: the demo logs a successful one. */
  onTest?: (endpoint: Endpoint, event: string) => Promise<Delivery | unknown> | Delivery | unknown
  /** Saves an added or edited endpoint; the sheet closes once it resolves, and a rejection's message shows on its button. Default: a short demo wait. */
  onSaveEndpoint?: (endpoint: Endpoint) => Promise<unknown> | unknown
  /** Deletes an endpoint after the confirmation; it leaves the list once it resolves. Default: a short demo wait. */
  onDeleteEndpoint?: (endpoint: Endpoint) => Promise<unknown> | unknown
  /** Rotates an endpoint's signing secret; resolve with the new secret to show it (otherwise the demo makes one). Default: a short demo wait. */
  onRotateSecret?: (endpoint: Endpoint) => Promise<unknown> | unknown
  /** Sends a delivery again; resolve with the new attempt to log it. Default: the demo logs a successful one. */
  onResend?: (delivery: Delivery) => Promise<unknown> | unknown
}

function Webhooks({ theme, embedded = true, copy: copyProp, locale, endpoints: ownEndpoints, deliveries: ownDeliveries, now: nowProp, demoMarker = true, onTest, onSaveEndpoint, onDeleteEndpoint, onRotateSecret, onResend, className, ...rest }: WebhooksProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  // Without your endpoints and deliveries it shows the demo's, marked as such.
  const simulated = ownEndpoints === undefined && ownDeliveries === undefined
  const initial = ownEndpoints ?? ENDPOINTS
  const initialDeliveries = ownDeliveries ?? DELIVERIES
  const [endpoints, setEndpoints] = useState(initial)
  const [deliveries, setDeliveries] = useState(initialDeliveries)
  // Fresh deliveries from the app replace the log.
  const [source, setSource] = useState(initialDeliveries)
  if (source !== initialDeliveries) {
    setSource(initialDeliveries)
    setDeliveries(initialDeliveries)
  }
  // Your deliveries without a `now`: the browser's clock once mounted, a minute at a time.
  const [clock, setClock] = useState<number>()
  const ticking = nowProp === undefined && ownDeliveries !== undefined
  useEffect(() => {
    if (!ticking) return
    const tick = () => setClock(Date.now())
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 60_000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [ticking])
  const latest = deliveries.reduce((t, d) => Math.max(t, d.at), 0)
  const now = nowProp !== undefined ? +nowProp : ownDeliveries === undefined ? NOW : (clock ?? latest)
  const [selected, setSelected] = useState<string | undefined>(initial[0]?.id)
  const [delivery, setDelivery] = useState<string>()
  const [sheet, setSheet] = useState<{ open: boolean; endpoint?: Endpoint }>({ open: false })
  const [deleting, setDeleting] = useState<Endpoint>()
  const current = endpoints.find((e) => e.id === selected)

  const log = (endpoint: Endpoint, next: unknown) => {
    // Only a delivery your handler resolves with is logged; the demo makes its own.
    if (!next || typeof next !== 'object' || !('id' in next) || !('endpointId' in next)) return
    setDeliveries((list) => [next as Delivery, ...list])
    setSelected(endpoint.id)
    setDelivery((next as Delivery).id)
  }
  const fake = (endpoint: Endpoint, event: string, attempt: number) => makeDelivery(endpoint.id, event, 200, now, attempt, deliveries.length * 131 + attempt)
  const test = async (endpoint: Endpoint) => {
    const event = endpoint.events[0] ?? 'invoice.created'
    log(endpoint, onTest ? await onTest(endpoint, event) : (await demo('Webhooks: onTest', 600), fake(endpoint, event, 1)))
  }
  const save = async (endpoint: Endpoint) => {
    await (onSaveEndpoint ? onSaveEndpoint(endpoint) : demo('Webhooks: onSaveEndpoint', 600))
    setEndpoints((list) => (list.some((e) => e.id === endpoint.id) ? list.map((e) => (e.id === endpoint.id ? endpoint : e)) : [...list, endpoint]))
    setSelected(endpoint.id)
  }

  const marker = simulated && demoMarker && (
    <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
      {copy.demoData}
    </Badge>
  )
  const add = (
    <Button onClick={() => setSheet({ open: true })}>
      <PlusIcon size={14} /> {copy.add}
    </Button>
  )

  const content = (
    <>
      {endpoints.length ? (
        <section aria-label={copy.endpointsLabel} className="overflow-hidden rounded-md border border-line bg-surface">
          <EndpointsTable
            endpoints={endpoints}
            deliveries={deliveries}
            selected={selected}
            now={now}
            copy={copy}
            onSelect={(endpoint) => {
              setSelected(endpoint.id)
              setDelivery(undefined)
            }}
            onEdit={(endpoint) => setSheet({ open: true, endpoint })}
            onTest={test}
            onToggle={(endpoint) => save({ ...endpoint, enabled: !endpoint.enabled })}
            onDelete={setDeleting}
          />
        </section>
      ) : (
        <Empty className="rounded-md border border-dashed border-line py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WebhookIcon />
            </EmptyMedia>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setSheet({ open: true })}>
              <PlusIcon size={14} /> {copy.add}
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {current && (
        <Reveal key={current.id} inView={false} variant="fade" duration="fast">
          <DeliveryLog
            heading="h2"
            endpoint={current}
            deliveries={deliveries.filter((d) => d.endpointId === current.id)}
            selected={delivery}
            now={now}
            copy={copy}
            onSelect={setDelivery}
            onResend={async (d) => {
              log(current, onResend ? await onResend(d) : (await demo('Webhooks: onResend', 700), fake(current, d.event, d.attempt + 1)))
            }}
          />
        </Reveal>
      )}

      <EndpointSheet
        open={sheet.open}
        endpoint={sheet.endpoint}
        taken={endpoints.filter((e) => e.id !== sheet.endpoint?.id).map((e) => e.url)}
        copy={copy}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
        onSave={save}
        onRotateSecret={(endpoint) => (onRotateSecret ? onRotateSecret(endpoint) : demo('Webhooks: onRotateSecret', 600))}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        destructive
        title={copy.deleteTitle(deleting?.url ?? '')}
        description={copy.deleteDescription}
        confirmLabel={copy.deleteConfirm}
        cancelLabel={copy.cancel}
        onConfirm={async () => {
          if (!deleting) return
          await (onDeleteEndpoint ? onDeleteEndpoint(deleting) : demo('Webhooks: onDeleteEndpoint', 600))
          const id = deleting.id
          setEndpoints((list) => list.filter((e) => e.id !== id))
          setDeliveries((list) => list.filter((d) => d.endpointId !== id))
          if (selected === id) setSelected(endpoints.find((e) => e.id !== id)?.id)
        }}
      />
    </>
  )

  const view = embedded ? (
    <AppPage
      {...rest}
      title={copy.title}
      description={copy.description}
      actions={
        <>
          {marker}
          {add}
        </>
      }
      width="fill"
      className={cn('text-fg', className)}
    >
      {content}
    </AppPage>
  ) : (
    <div {...rest} className={cn('min-h-dvh bg-canvas text-fg', className)}>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="text-xl font-semibold tracking-tight text-fg">{copy.title}</h1>
              {marker}
            </div>
            <p className="max-w-2xl text-ui text-pretty text-fg-muted">{copy.description}</p>
          </div>
          {add}
        </div>
        {content}
      </main>
    </div>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { Webhooks, type WebhooksProps }
