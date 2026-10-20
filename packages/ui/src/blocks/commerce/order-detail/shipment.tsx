'use client'

import { useEffect, useId, useState } from 'react'
import { useYouj } from '@youj/core'
import { MorphLabel } from '@youj/motion'
import { CopyIcon, RefreshIcon } from '@youj/icons'
import { AsyncButton } from '../../../components/ui/async-button'
import { Stepper } from '../../../components/ui/stepper'
import { Timeline } from '../../../components/ui/timeline'
import { ProductMedia } from '../product-card'
import { useOrder, type OrderFormat } from './copy'
import { DELIVERED, SCAN_TYPES, STAGES, type Line, type Shipment } from './data'

/**
 * Where the tracker shows the package: it starts at Ordered and steps forward
 * to the package's stage, one stage per connector fill, so the eye follows
 * the parcel along the route. A later stage (a new scan) steps on from where
 * it is. Reduced motion: it is simply at the stage.
 */
function useSweep(target: number) {
  const k = useYouj()
  const [shown, setShown] = useState(k.reduced ? target : 0)
  if (k.reduced && shown !== target) setShown(target)
  useEffect(() => {
    if (k.reduced || shown === target) return
    const id = setTimeout(() => setShown((s) => s + Math.sign(target - s)), shown === 0 ? k.ms('slow') : k.ms('slow') * 0.9)
    return () => clearTimeout(id)
  }, [k, shown, target])
  return shown
}

/** The headline for a package: when it arrives (or arrived) and the fine print. */
function eta(shipment: Shipment, { copy, dayName, clock }: OrderFormat) {
  if (shipment.stage === DELIVERED) return { title: copy.deliveredOn(dayName(shipment.eta)), note: `${shipment.note} · ${clock(shipment.eta)}` }
  return { title: copy.arriving(dayName(shipment.eta)), note: shipment.note }
}

interface ShipmentPanelProps {
  shipment: Shipment
  /** What travels in it. */
  lines: Line[]
  /** Fetches the carrier's latest scans. Resolves true when there was news. */
  onTrack: (shipmentId: string) => Promise<boolean>
}

/**
 * One package: when it arrives, the carrier and tracking number (copied in a
 * press), the tracker, what's inside, and the carrier's scans as a Timeline.
 * Track package asks the carrier for news: a new scan takes its slot at the
 * top of the history, the tracker steps on and the headline morphs.
 */
export function ShipmentPanel({ shipment, lines, onTrack }: ShipmentPanelProps) {
  const headingId = useId()
  const current = useSweep(shipment.stage)
  const format = useOrder()
  const { copy, shortDate } = format
  const { title, note } = eta(shipment, format)
  const [outcome, setOutcome] = useState(copy.updated)
  const steps = STAGES.map((stage, i) => ({
    id: stage.id,
    title: stage.title,
    description: shipment.stamps[i] ? shortDate(shipment.stamps[i]!) : i === STAGES.length - 1 ? copy.estimated(shortDate(shipment.eta)) : undefined,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-ui-sm text-fg-muted">{shipment.carrier}</p>
          <p role="status" className="text-2xl font-semibold tracking-tight text-fg">
            <MorphLabel value={title}>{title}</MorphLabel>
          </p>
          <p className="text-ui text-fg-muted">
            <MorphLabel value={note} contentClassName="whitespace-normal">
              {note}
            </MorphLabel>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AsyncButton
            variant="outline"
            size="sm"
            aria-label={copy.copyTracking(shipment.tracking)}
            successLabel={copy.copied}
            errorLabel={copy.copyFailed}
            onAction={() => navigator.clipboard?.writeText(shipment.tracking.replace(/\s/g, ''))}
          >
            <CopyIcon size={14} />
            <span className="font-mono text-ui-sm tabular-nums">{shipment.tracking}</span>
          </AsyncButton>
          <AsyncButton
            size="sm"
            variant={shipment.stage === DELIVERED ? 'outline' : 'default'}
            pendingLabel={copy.checking}
            successLabel={outcome}
            onAction={async () => setOutcome((await onTrack(shipment.id)) ? copy.updated : copy.upToDate)}
          >
            <RefreshIcon size={14} />
            {copy.track}
          </AsyncButton>
        </div>
      </div>

      <Stepper steps={steps} current={current} compact aria-label={copy.progress(shipment.name)} />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-transparent p-2 pe-3">
        <ul aria-hidden className="flex -space-x-2 rtl:space-x-reverse">
          {lines.map((line) => (
            <li key={line.id} className="relative size-9 overflow-hidden rounded-md border-2 border-surface">
              <ProductMedia product={line.product} color={line.color} />
            </li>
          ))}
        </ul>
        <p className="min-w-0 flex-1 text-ui-sm text-fg-muted">
          <span className="sr-only">{copy.inPackage(shipment.name)}</span>
          <span className="font-medium text-fg">{lines.map((l) => (l.quantity > 1 ? `${l.product.name} ×${l.quantity}` : l.product.name)).join(', ')}</span>
          {` · ${copy.itemCount(lines.reduce((n, l) => n + l.quantity, 0))}`}
        </p>
      </div>

      <section aria-labelledby={headingId} className="flex flex-col gap-3">
        <h3 id={headingId} className="text-ui font-medium text-fg">
          {copy.trackingHistory}
        </h3>
        <Timeline events={shipment.events} types={SCAN_TYPES} />
      </section>
    </div>
  )
}
