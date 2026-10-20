'use client'

import { useState } from 'react'
import { PresenceItem, PresenceList, Reveal } from '@youj/motion'
import { ActivityIcon, RefreshIcon } from '@youj/icons'
import { AsyncButton } from '../../../components/ui/async-button'
import { CodeBlock } from '../../../components/ui/code-block'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../../components/ui/empty'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { cn, dateTimeFormat } from '../../../lib/utils'
import { ago, formatDuration, ok, type Delivery, type Endpoint, type WebhooksCopy } from './data'
import { StatusCode } from './endpoints-table'
import { Eyebrow } from '../../../components/ui/typography'

type Filter = 'all' | 'succeeded' | 'failed'

function Viewer({ delivery, copy, onResend }: { delivery: Delivery; copy: WebhooksCopy; onResend: (delivery: Delivery) => unknown }) {
  const sent = dateTimeFormat(copy.locale, { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' }).format(delivery.at)
  return (
    <Reveal key={delivery.id} inView={false} variant="fade" duration="fast" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusCode status={delivery.status} copy={copy} />
        <span dir="ltr" className="min-w-0 truncate font-mono text-ui font-medium text-fg">
          {delivery.event}
        </span>
        <AsyncButton variant="outline" size="sm" className="ms-auto" pendingLabel={copy.resending} successLabel={copy.resent} onAction={() => onResend(delivery)}>
          <RefreshIcon size={14} /> {copy.resend}
        </AsyncButton>
      </div>
      <dl className="grid grid-cols-2 gap-3 rounded-md border border-line bg-transparent px-3 py-2.5 text-ui-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] max-sm:*:first:col-span-2">
        {[
          [copy.sent, sent],
          [copy.duration, formatDuration(delivery.duration, copy.locale)],
          [copy.attempt, `#${delivery.attempt}`],
        ].map(([term, value]) => (
          <div key={term} className="flex min-w-0 flex-col gap-0.5">
            <Eyebrow render={<dt />} className="text-ui-xs text-fg-muted">
              {term}
            </Eyebrow>
            <dd className="truncate text-fg tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <Tabs defaultValue="request" className="gap-3">
        <TabsList>
          <TabsTrigger value="request">{copy.request}</TabsTrigger>
          <TabsTrigger value="response">{copy.response}</TabsTrigger>
        </TabsList>
        <TabsContent value="request">
          <CodeBlock dir="ltr" code={delivery.request} language="json" filename={`POST · ${delivery.id}`} />
        </TabsContent>
        <TabsContent value="response">
          {delivery.response ? (
            <CodeBlock dir="ltr" code={delivery.response} language={delivery.response.startsWith('<') ? 'html' : 'json'} filename={delivery.status ? `HTTP ${delivery.status}` : undefined} />
          ) : (
            <p className="rounded-md border border-dashed border-line px-4 py-8 text-center text-ui-sm text-fg-muted">{copy.noResponse}</p>
          )}
        </TabsContent>
      </Tabs>
    </Reveal>
  )
}

export function DeliveryLog({ endpoint, deliveries, selected, now, copy, heading: Heading, onSelect, onResend }: { heading: 'h2' | 'h3'; endpoint: Endpoint; deliveries: Delivery[]; selected?: string; now: number; copy: WebhooksCopy; onSelect: (id: string) => void; onResend: (delivery: Delivery) => unknown }) {
  const [filter, setFilter] = useState<Filter>('all')
  const shown = deliveries.filter((d) => filter === 'all' || (filter === 'succeeded') === ok(d.status))
  const current = shown.find((d) => d.id === selected) ?? shown[0]

  return (
    <section aria-label={copy.deliveriesFor(endpoint.url)} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <Heading className="text-ui-lg font-semibold tracking-tight text-fg">{copy.deliveries}</Heading>
          <p dir="ltr" className="truncate font-mono text-ui-sm text-fg-muted rtl:text-end">
            {endpoint.url}
          </p>
        </div>
        <SegmentedControl size="sm" aria-label={copy.filter} value={filter} onValueChange={(next) => setFilter(next as Filter)}>
          <SegmentedControlItem value="all">{copy.all}</SegmentedControlItem>
          <SegmentedControlItem value="succeeded">{copy.succeeded}</SegmentedControlItem>
          <SegmentedControlItem value="failed">{copy.failed}</SegmentedControlItem>
        </SegmentedControl>
      </div>
      {shown.length === 0 ? (
        <Empty className="rounded-md border border-line bg-surface py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ActivityIcon />
            </EmptyMedia>
            <EmptyTitle>{copy.noDeliveries}</EmptyTitle>
            <EmptyDescription>{copy.noDeliveriesDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 rounded-md border border-line bg-surface p-2 lg:grid-cols-[--spacing(76)_minmax(0,1fr)] lg:p-3">
          <PresenceList as="ul" aria-label={copy.deliveries} className="yj-scrollbar flex max-h-96 flex-col gap-0.5 overflow-y-auto max-lg:max-h-64">
            {shown.map((d) => {
              const on = d.id === current?.id
              return (
                <PresenceItem as="li" key={d.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => onSelect(d.id)}
                    className={cn(
                      'grid w-full grid-cols-[--spacing(17)_minmax(0,1fr)_auto] items-center *:first:justify-self-start gap-x-2.5 gap-y-0.5 rounded-sm px-2 py-1.5 text-start transition-colors yj-duration-fast ease-standard focus-ring',
                      on ? 'bg-accent-subtle' : 'hover:bg-hover',
                    )}
                  >
                    <StatusCode status={d.status} copy={copy} />
                    <span dir="ltr" className="truncate font-mono text-ui-sm text-fg rtl:text-end">
                      {d.event}
                    </span>
                    <span className="text-ui-xs text-fg-muted tabular-nums">{ago(d.at, copy.locale, now)}</span>
                    <span className="col-start-2 col-end-4 text-ui-xs text-fg-muted tabular-nums">
                      {formatDuration(d.duration, copy.locale)} · {copy.attempt} #{d.attempt}
                    </span>
                  </button>
                </PresenceItem>
              )
            })}
          </PresenceList>
          <div className="min-w-0 border-line max-lg:border-t max-lg:px-1 max-lg:pt-4 lg:border-s lg:ps-4">
            {current ? <Viewer delivery={current} copy={copy} onResend={onResend} /> : <p className="text-ui-sm text-fg-muted">{copy.pickDelivery}</p>}
          </div>
        </div>
      )}
    </section>
  )
}
