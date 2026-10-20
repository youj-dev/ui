'use client'

import { useState } from 'react'
import { Counter, Reveal } from '@youj/motion'
import { CheckCircleIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Checkbox } from '../../../components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '../../../components/ui/field'
import { NumberInput } from '../../../components/ui/number-input'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { Textarea } from '../../../components/ui/textarea'
import { Wizard, WizardStep } from '../../../components/ui/wizard'
import { ProductMedia } from '../product-card'
import { useOrder } from './copy'
import { lineVariant, totals, type Line, type Order } from './data'
import { Eyebrow } from '../../../components/ui/typography'

const PICKUP_FEE = 6

export interface ReturnRequest {
  rma: string
  /** Units returned, by line id. */
  units: Record<string, number>
  refund: number
  to: 'card' | 'credit'
  dropBy: number
  /** The reason's id and the shopper's note. */
  reason: string
  note: string
}

interface ReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order
  /** Lines that can go back now (delivered, not already returning), with the units left to return. */
  eligible: { line: Line; left: number }[]
  /** Lines still on their way: listed, but not selectable yet. */
  pending: Line[]
  /** Starts the return; resolve with the request as your system recorded it (its RMA, say), or nothing to keep this one. Reject to shake Start return. */
  onReturn: (request: ReturnRequest) => Promise<ReturnRequest | void> | ReturnRequest | void
}

/**
 * A return in three steps (Wizard): which items and how many, why, and how
 * the refund comes back. The refund is a Counter that retargets as items,
 * quantities and options change. Finishing turns the dialog into the
 * confirmation: a drawn check and the RMA with the drop-off deadline.
 */
export function ReturnDialog({ open, onOpenChange, order, eligible, pending, onReturn }: ReturnDialogProps) {
  const [units, setUnits] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [to, setTo] = useState<'card' | 'credit'>('card')
  const [drop, setDrop] = useState<'store' | 'pickup'>('store')
  const [done, setDone] = useState<ReturnRequest | null>(null)
  const { copy, money, shortDate, now, currency, locale } = useOrder()
  const { unitRefund } = totals(order)
  const chosen = eligible.filter(({ line }) => (units[line.id] ?? 0) > 0)
  const base = chosen.reduce((n, { line }) => n + unitRefund(line) * units[line.id]!, 0)
  const refund = Math.max(0, Math.round((base * (to === 'credit' ? 1.1 : 1) - (drop === 'pickup' ? PICKUP_FEE : 0)) * 100) / 100)
  const dropBy = now + 14 * 86_400_000

  const reset = () => {
    setUnits(eligible.length === 1 ? { [eligible[0]!.line.id]: eligible[0]!.left } : {})
    setReason('')
    setNote('')
    setTo('card')
    setDrop('store')
    setDone(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} onOpenChangeComplete={(isOpen) => isOpen && reset()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{done ? copy.returnDoneTitle : copy.returnTitle}</DialogTitle>
          <DialogDescription>
            {done ? copy.returnDoneDescription(order.number, done.rma) : copy.returnDescription(order.number)}
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <Confirmation request={done} order={order} onClose={() => onOpenChange(false)} />
        ) : (
          <Wizard
            finishLabel={copy.startReturn}
            finishSuccessLabel={copy.returnDoneTitle}
            footerStart={
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {copy.cancel}
              </Button>
            }
            onComplete={async () => {
              const draft: ReturnRequest = {
                rma: `RMA-${order.number.replace(/\D/g, '').slice(-4)}${chosen.length}`,
                units: Object.fromEntries(chosen.map(({ line }) => [line.id, units[line.id]!])),
                refund,
                to,
                dropBy,
                reason,
                note: note.trim(),
              }
              const request = (await onReturn(draft)) ?? draft
              setDone(request)
            }}
          >
            <WizardStep
              id="items"
              title={copy.itemsStep}
              description={copy.itemsStepDescription}
              validate={() => chosen.length > 0 || copy.chooseItem}
            >
              <ul className="flex flex-col gap-2">
                {eligible.map(({ line, left }) => {
                  const count = units[line.id] ?? 0
                  return (
                    <li key={line.id} className="flex items-center gap-3">
                      <FieldLabel className="min-w-0 flex-1">
                        <Field orientation="horizontal" className="items-center">
                          <Checkbox
                            checked={count > 0}
                            onCheckedChange={(on) => setUnits((u) => ({ ...u, [line.id]: on ? left : 0 }))}
                          />
                          <span className="relative size-10 shrink-0 overflow-hidden rounded-md border border-line">
                            <ProductMedia product={line.product} color={line.color} />
                          </span>
                          <FieldContent className="min-w-0">
                            <FieldTitle className="truncate">{line.product.name}</FieldTitle>
                            <FieldDescription>{copy.backEach(lineVariant(line), money(unitRefund(line)))}</FieldDescription>
                          </FieldContent>
                        </Field>
                      </FieldLabel>
                      {left > 1 && count > 0 && (
                        <NumberInput
                          aria-label={copy.howMany(line.product.name)}
                          className="w-28 shrink-0"
                          value={count}
                          min={1}
                          max={left}
                          onValueChange={(value) => setUnits((u) => ({ ...u, [line.id]: value ?? 1 }))}
                        />
                      )}
                    </li>
                  )
                })}
                {pending.map((line) => (
                  <li key={line.id} className="flex items-center gap-3 rounded-lg border border-dashed border-line p-2 pe-3 text-fg-muted">
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-md opacity-60">
                      <ProductMedia product={line.product} color={line.color} />
                    </span>
                    <span className="min-w-0 flex-1 text-ui-sm">
                      <span className="block text-ui text-fg">{line.product.name}</span>
                      {copy.stillOnItsWay}
                    </span>
                  </li>
                ))}
              </ul>
            </WizardStep>
            <WizardStep id="reason" title={copy.reasonStep} description={copy.reasonStepDescription} validate={() => !!reason || copy.chooseReason}>
              <RadioGroup aria-label={copy.reasonStep} value={reason} onValueChange={(value) => setReason(value as string)}>
                {copy.reasons.map((r) => (
                  <FieldLabel key={r.id}>
                    <Field orientation="horizontal">
                      <RadioGroupItem value={r.id} />
                      <FieldContent>
                        <FieldTitle>{r.title}</FieldTitle>
                        <FieldDescription>{r.hint}</FieldDescription>
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
              <Field>
                <FieldLabel>{copy.note}</FieldLabel>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={copy.notePlaceholder} rows={2} />
              </Field>
            </WizardStep>
            <WizardStep id="refund" title={copy.refundStep} description={copy.refundStepDescription}>
              <FieldSet>
                <FieldLegend variant="label">
                  <Eyebrow className="text-ui text-fg">{copy.refundTo}</Eyebrow>
                </FieldLegend>
                <RadioGroup value={to} onValueChange={(value) => setTo(value as 'card' | 'credit')}>
                  <Choice value="card" title={copy.cardTitle(order.card.brand, order.card.last4)} hint={copy.cardHint} />
                  <Choice value="credit" title={copy.creditTitle} hint={copy.creditHint} />
                </RadioGroup>
              </FieldSet>
              <FieldSet>
                <FieldLegend variant="label">
                  <Eyebrow className="text-ui text-fg">{copy.handOver}</Eyebrow>
                </FieldLegend>
                <RadioGroup value={drop} onValueChange={(value) => setDrop(value as 'store' | 'pickup')}>
                  <Choice value="store" title={copy.storeTitle} hint={copy.storeHint(shortDate(dropBy))} />
                  <Choice value="pickup" title={copy.pickupTitle} hint={copy.pickupHint(money(PICKUP_FEE))} />
                </RadioGroup>
              </FieldSet>
              <div className="flex items-baseline justify-between gap-3 rounded-lg bg-transparent px-3 py-2.5">
                <span className="text-ui text-fg-muted">{copy.refundFor(chosen.reduce((n, { line }) => n + units[line.id]!, 0))}</span>
                <Counter
                  value={refund}
                  format={{ style: 'currency', currency, minimumFractionDigits: 2 }}
                  locale={locale}
                  duration="fast"
                  className="text-lg font-semibold tracking-tight text-fg tabular-nums"
                />
              </div>
            </WizardStep>
          </Wizard>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Choice({ value, title, hint }: { value: string; title: string; hint: string }) {
  return (
    <FieldLabel>
      <Field orientation="horizontal">
        <RadioGroupItem value={value} />
        <FieldContent>
          <FieldTitle>{title}</FieldTitle>
          <FieldDescription>{hint}</FieldDescription>
        </FieldContent>
      </Field>
    </FieldLabel>
  )
}

function Confirmation({ request, order, onClose }: { request: ReturnRequest; order: Order; onClose: () => void }) {
  const { copy, money, shortDate } = useOrder()
  return (
    <>
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="text-success-text">
          <CheckCircleIcon size={44} strokeWidth={1.75} trigger="mount" />
        </span>
        <Reveal inView={false} variant="rise" delay={2} className="flex max-w-sm flex-col gap-1">
          <p className="font-mono text-ui text-fg">{request.rma}</p>
          <p className="text-ui text-fg-muted">
            {copy.confirmation(order.email, shortDate(request.dropBy), money(request.refund), request.to === 'card' ? copy.cardTitle(order.card.brand, order.card.last4) : copy.yourCredit)}
          </p>
        </Reveal>
      </div>
      <DialogFooter>
        <Button autoFocus onClick={onClose}>
          {copy.done}
        </Button>
      </DialogFooter>
    </>
  )
}
