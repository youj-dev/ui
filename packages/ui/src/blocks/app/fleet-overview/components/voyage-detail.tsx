'use client'

import { useId, useRef, useState } from 'react'
import { useLocale } from '@youj/core'
import { Counter } from '@youj/motion'
import {
  ArrowRightIcon,
  CloudLightningIcon,
  FlagIcon,
  MapPinIcon,
  NavigationIcon,
  PackageIcon,
  RouteIcon,
  ShareIcon,
  ShieldCheckIcon,
  WavesIcon,
  XIcon,
} from '@youj/icons'
import { Button } from '../../../../components/ui/button'
import { AsyncButton } from '../../../../components/ui/async-button'
import { Kbd } from '../../../../components/ui/kbd'
import { Progress } from '../../../../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Timeline, type TimelineEventType } from '../../../../components/ui/timeline'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../components/ui/tooltip'
import { cn } from '../../../../lib/utils'
import { PORTS } from '../data'
import { DAY, dateFormat, nauticalMiles, numberFormat, progressOf, type Tracked } from '../model'
import { Contacts } from './contacts'
import { Manifest } from './manifest'
import { StatusBadge } from './status-badge'
import { Eyebrow } from '../../../../components/ui/typography'

/* The whole voyage: route, log, manifest and contacts. */

const VOYAGE_EVENTS: Record<string, TimelineEventType> = {
  load: { icon: PackageIcon, label: 'Loaded' },
  depart: { icon: NavigationIcon, tone: 'accent', label: 'Departed' },
  waypoint: { icon: MapPinIcon, label: 'Waypoint' },
  canal: { icon: WavesIcon, tone: 'accent', label: 'Canal' },
  weather: { icon: CloudLightningIcon, tone: 'warning', label: 'Weather' },
  reroute: { icon: RouteIcon, tone: 'accent', label: 'Reroute' },
  customs: { icon: ShieldCheckIcon, tone: 'success', label: 'Customs' },
  arrive: { icon: FlagIcon, tone: 'success', label: 'Arrived' },
}

export function VesselDetail({
  ship,
  time,
  onClose,
  onReroute,
  titleId: titleIdProp,
}: {
  ship: Tracked
  time: number
  onClose?: () => void
  onReroute: (id: string) => Promise<void>
  /** The heading's id, for a drawer that it names. */
  titleId?: string
}) {
  const locale = useLocale()
  const ownId = useId()
  const titleId = titleIdProp ?? ownId
  const heading = useRef<HTMLHeadingElement>(null)
  const [tab, setTab] = useState('voyage')
  const [settling, setSettling] = useState(false)
  // Dates are by the day: the time the panel first drew is near enough.
  const [now] = useState(Date.now)
  const progress = progressOf(ship, time)
  const miles = nauticalMiles(ship.geo)
  const left = Math.round(miles * (1 - progress))
  const departed = ship.events.find((e) => e.type === 'depart')
  const from = PORTS[ship.from]!
  const to = PORTS[ship.to]!
  const arrived = ship.status === 'arrived'
  const underWay = ship.status === 'on-time' || ship.status === 'rerouted'
  return (
    <article aria-labelledby={titleId} className="flex h-full min-h-0 flex-col">
      <header className="flex items-start gap-3 border-b border-line px-4 pt-4 pb-3.5">
        <div className="flex min-w-0 flex-1 flex-col">
          <Eyebrow render={<p />} className="font-mono text-[10.5px] tracking-[0.08em] text-fg-muted uppercase">
            IMO {ship.imo} · {ship.booking}
          </Eyebrow>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <h2 ref={heading} id={titleId} tabIndex={-1} className="truncate rounded-sm text-xl font-semibold tracking-tight text-fg outline-none">
              {ship.vessel}
            </h2>
            <StatusBadge status={ship.status} />
          </div>
          <p className="truncate text-ui-sm text-fg-muted">
            {ship.master} · {numberFormat(locale).format(ship.teu)} TEU
          </p>
        </div>
        {onClose && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Close voyage" aria-keyshortcuts="Escape" onClick={onClose} className="-me-1.5 -mt-1">
                  <XIcon size={16} />
                </Button>
              }
            />
            <TooltipContent>
              Close <Kbd>Esc</Kbd>
            </TooltipContent>
          </Tooltip>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <section aria-label="Route" className="flex flex-col gap-3 px-4 pt-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="flex min-w-0 flex-col">
              <span className="font-mono text-2xl leading-none font-semibold tracking-tight text-fg">{from.code}</span>
              <span className="truncate text-ui-sm text-fg-muted">{from.name}</span>
            </div>
            <span aria-hidden className="mb-1.5 text-fg-muted">
              <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
            </span>
            <div className="flex min-w-0 flex-col items-end text-end">
              <span className="font-mono text-2xl leading-none font-semibold tracking-tight text-fg">{to.code}</span>
              <span className="truncate text-ui-sm text-fg-muted">{to.name}</span>
            </div>
          </div>
          <Progress value={Math.round(progress * 100)} aria-label="Voyage progress" className="gap-y-1.5">
            <span className="text-ui-sm text-fg-muted">{departed ? `Departed ${dateFormat(locale).format(new Date(departed.time))}` : 'Loading'}</span>
            <span className="text-ui-sm text-fg tabular-nums">{Math.round(progress * 100)}%</span>
          </Progress>
          <p className="flex items-baseline justify-between gap-3 text-ui-sm text-fg-muted">
            {arrived ? (
              <span>In port since {dateFormat(locale).format(now - ship.eta * DAY)}</span>
            ) : (
              <>
                <span>ETA {dateFormat(locale).format(now + ship.eta * DAY)}</span>
                <span className="text-fg">
                  in{' '}
                  <Counter
                    value={ship.eta}
                    from={ship.eta}
                    format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                    inView={false}
                    className="font-semibold"
                  />{' '}
                  days
                </span>
              </>
            )}
          </p>
        </section>

        {(ship.status === 'delayed' || settling) && (
          <div
            className={cn(
              'mx-4 mt-3 flex flex-col gap-2 rounded-lg border p-3 transition-colors yj-duration-base ease-standard',
              ship.status === 'delayed' ? 'border-warning-line bg-warning-subtle' : 'border-accent-line bg-accent-subtle',
            )}
          >
            <p className="flex items-start gap-2 text-ui text-fg">
              {ship.status === 'delayed' ? (
                <CloudLightningIcon size={16} className="mt-0.5 shrink-0 text-warning" />
              ) : (
                <RouteIcon size={16} trigger="mount" className="mt-0.5 shrink-0 text-accent" />
              )}
              {ship.status === 'delayed' ? ship.hold : 'Under way again, on a lane west of the storm cell.'}
            </p>
            <AsyncButton
              size="sm"
              variant="outline"
              className="self-start"
              onAction={async () => {
                setSettling(true)
                await onReroute(ship.id)
              }}
              onActionStateChange={(state) => {
                if (state !== 'idle') return
                // The notice leaves with the button in it: hand focus to the voyage first.
                heading.current?.focus()
                setSettling(false)
              }}
              pendingLabel="Rerouting…"
              successLabel="Rerouted"
            >
              <RouteIcon size={14} /> Reroute west of the storm
            </AsyncButton>
          </div>
        )}

        <dl className="mx-4 mt-4 grid grid-cols-3 divide-x divide-line rounded-lg border border-line rtl:divide-x-reverse">
          {[
            { label: 'Speed', value: underWay ? `${ship.speed.toFixed(1)} kn` : '0.0 kn' },
            { label: 'To go', value: arrived ? '—' : `${numberFormat(locale).format(left)} nm` },
            { label: 'Lane', value: `${numberFormat(locale).format(miles)} nm` },
          ].map((m) => (
            <div key={m.label} className="flex flex-col gap-0.5 px-3 py-2">
              <Eyebrow render={<dt />} className="text-ui-xs tracking-[0.06em] text-fg-muted uppercase">
                {m.label}
              </Eyebrow>
              <dd className="text-ui font-medium text-fg tabular-nums">{m.value}</dd>
            </div>
          ))}
        </dl>

        <Tabs value={tab} onValueChange={(value) => setTab(String(value))} className="mt-4">
          <TabsList aria-label="Voyage details" className="px-4">
            <TabsTrigger value="voyage">Voyage</TabsTrigger>
            <TabsTrigger value="manifest">Manifest</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
          </TabsList>
          <TabsContent value="voyage" className="px-4 pt-4 pb-5">
            <Timeline events={ship.events} types={VOYAGE_EVENTS} locale={locale} />
          </TabsContent>
          <TabsContent value="manifest" className="px-4 pt-4 pb-5">
            <Manifest ship={ship} />
          </TabsContent>
          <TabsContent value="contacts" className="px-4 pt-4 pb-5">
            <Contacts ship={ship} />
          </TabsContent>
        </Tabs>
      </div>

      <footer className="flex items-center gap-2 border-t border-line px-4 py-3">
        <AsyncButton
          variant="outline"
          size="sm"
          onAction={async () => {
            await navigator.clipboard?.writeText(`https://harbor.app/track/${ship.booking}`).catch(() => {})
          }}
          successLabel="Link copied"
        >
          <ShareIcon size={14} /> Share tracking
        </AsyncButton>
        <span className="ms-auto font-mono text-[11px] tracking-wide text-fg-muted">{ship.booking}</span>
      </footer>
    </article>
  )
}
