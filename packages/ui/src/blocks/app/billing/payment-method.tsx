'use client'

import { useState } from 'react'
import { useYouj } from '@youj/core'
import { CreditCardIcon, LockIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { demo, type BillingCard as CardOnFile, type BillingCardInput, type BillingCopy } from './data'

type UpdatePayment = (input: BillingCardInput) => Promise<CardOnFile | void> | CardOnFile | void

/** The card invoices are charged to, and a dialog to replace it. */
export function PaymentMethod({
  card,
  copy,
  onUpdatePayment,
  onUpdate,
}: {
  card: CardOnFile
  copy: BillingCopy
  /** Saves the new card; resolve with the card on file (or nothing to show what was typed), throw to show the error. Default: a demo wait. */
  onUpdatePayment?: UpdatePayment
  onUpdate: (card: CardOnFile) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.paymentTitle}</CardTitle>
        <CardDescription>{copy.paymentDescription}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            {copy.update}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 rounded-md border border-line bg-transparent px-3 py-2.5">
          <span aria-hidden className="grid h-7 w-10 shrink-0 place-items-center rounded-sm bg-fg font-mono text-ui-xs font-semibold tracking-wide text-canvas">
            {card.brand.toUpperCase().slice(0, 4)}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-ui font-medium text-fg tabular-nums">
              {card.brand} <span aria-hidden>•••• </span>
              <span className="sr-only">{copy.endingIn}</span>
              {card.last4}
            </span>
            <span className="text-ui-sm text-fg-muted tabular-nums">
              {copy.expires(card.expMonth, card.expYear)}
            </span>
          </div>
        </div>
      </CardContent>
      <UpdateCardDialog open={open} onOpenChange={setOpen} copy={copy} onUpdatePayment={onUpdatePayment} onUpdate={onUpdate} />
    </Card>
  )
}

function UpdateCardDialog({
  open,
  onOpenChange,
  copy,
  onUpdatePayment,
  onUpdate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  copy: BillingCopy
  onUpdatePayment?: UpdatePayment
  onUpdate: (card: CardOnFile) => void
}) {
  const k = useYouj()
  const [form, setForm] = useState({ name: '', number: '', expiry: '', cvc: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const [failure, setFailure] = useState<string>()
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: event.target.value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }
  const check = () => {
    const digits = form.number.replace(/\D/g, '')
    const [mm, yy] = form.expiry.split('/').map((s) => Number(s.trim()))
    const next: typeof errors = {
      name: form.name.trim() ? undefined : copy.nameError,
      number: digits.length >= 13 && digits.length <= 19 ? undefined : copy.numberError,
      expiry: mm && mm >= 1 && mm <= 12 && yy !== undefined && yy >= 26 ? undefined : copy.expiryError,
      cvc: /^\d{3,4}$/.test(form.cvc.trim()) ? undefined : copy.cvcError,
    }
    setErrors(next)
    return Object.values(next).every((e) => !e)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(next) => {
        if (next) return
        setForm({ name: '', number: '', expiry: '', cvc: '' })
        setErrors({})
        setFailure(undefined)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.updateCardTitle}</DialogTitle>
          <DialogDescription>{copy.updateCardDescription}</DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-4">
          <Field invalid={!!errors.name}>
            <FieldLabel>{copy.nameOnCard}</FieldLabel>
            <Input autoComplete="cc-name" value={form.name} onChange={set('name')} />
            <FieldError>{errors.name}</FieldError>
          </Field>
          <Field invalid={!!errors.number}>
            <FieldLabel>{copy.cardNumber}</FieldLabel>
            <Input inputMode="numeric" autoComplete="cc-number" placeholder={copy.cardNumberPlaceholder} value={form.number} onChange={set('number')} className="tabular-nums" />
            <FieldError>{errors.number}</FieldError>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field invalid={!!errors.expiry}>
              <FieldLabel>{copy.expiry}</FieldLabel>
              <Input inputMode="numeric" autoComplete="cc-exp" placeholder={copy.expiryPlaceholder} value={form.expiry} onChange={set('expiry')} className="tabular-nums" />
              <FieldError>{errors.expiry}</FieldError>
            </Field>
            <Field invalid={!!errors.cvc}>
              <FieldLabel>{copy.cvc}</FieldLabel>
              <Input inputMode="numeric" autoComplete="cc-csc" placeholder={copy.cvcPlaceholder} value={form.cvc} onChange={set('cvc')} className="tabular-nums" />
              <FieldError>{errors.cvc}</FieldError>
            </Field>
          </div>
        </FieldGroup>
        <p className="flex items-center gap-2 text-ui-sm text-fg-muted">
          <LockIcon size={13} aria-hidden className="shrink-0" />
          {copy.processorNote}
        </p>
        {failure && (
          <p role="alert" className="text-ui-sm text-danger-text">
            {failure}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {copy.cancel}
          </Button>
          <AsyncButton
            pendingLabel={copy.saving}
            successLabel={copy.cardSaved}
            onClick={(event) => !check() && event.preventDefault()}
            onAction={async () => {
              setFailure(undefined)
              let saved: CardOnFile | void
              try {
                saved = onUpdatePayment ? await onUpdatePayment(form) : void (await demo('Billing: onUpdatePayment', 900))
              } catch (error) {
                if (error instanceof Error && error.message) setFailure(error.message)
                throw error
              }
              const [mm, yy] = form.expiry.split('/').map((s) => Number(s.trim()))
              onUpdate(
                saved ?? { brand: form.number.trim().startsWith('5') ? 'Mastercard' : 'Visa', last4: form.number.replace(/\D/g, '').slice(-4), expMonth: mm!, expYear: 2000 + yy!, name: form.name.trim() },
              )
            }}
            onActionStateChange={(state) => state === 'success' && setTimeout(() => onOpenChange(false), k.ms('deliberate'))}
          >
            <CreditCardIcon size={14} /> {copy.saveCard}
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
