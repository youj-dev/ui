'use client'

import { useState } from 'react'
import { useLocale, useYouj } from '@youj/core'
import { Reveal } from '@youj/motion'
import { CheckCircleIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar'
import { Button } from '../../../../components/ui/button'
import { AsyncButton } from '../../../../components/ui/async-button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '../../../../components/ui/drawer'
import { Field, FieldLabel } from '../../../../components/ui/field'
import { Input } from '../../../../components/ui/input'
import { NumberInput } from '../../../../components/ui/number-input'
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group'
import { useIsMobile } from '../../../../hooks/use-mobile'
import { cn } from '../../../../lib/utils'
import { PAYEES } from '../data'
import { fmt, initials, usd } from '../format'
import { Eyebrow } from '../../../../components/ui/typography'

/* ── Send money ─────────────────────────────────────────────────────────── */

type Step = 'form' | 'review' | 'done'

export function SendDrawer({ open, onOpenChange, balance, onSend }: { open: boolean; onOpenChange: (open: boolean) => void; balance: number; onSend: (payee: string, amount: number, note: string) => Promise<unknown> | unknown }) {
  const k = useYouj()
  const locale = useLocale()
  const mobile = useIsMobile()
  const [step, setStep] = useState<Step>('form')
  const [payee, setPayee] = useState('nia')
  const [amount, setAmount] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const who = PAYEES.find((p) => p.id === payee)!
  const valid = !!amount && amount > 0 && amount <= balance
  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next)
      setTimeout(() => {
        setStep('form')
        setAmount(null)
        setNote('')
      }, k.ms('base'))
  }
  return (
    <Drawer open={open} onOpenChange={close} swipeDirection={mobile ? 'down' : 'right'}>
      <DrawerContent className={cn(!mobile && 'w-[calc(min(26rem,100vw-3rem)+3rem)]')}>
        <DrawerHeader>
          <DrawerTitle>{step === 'done' ? 'Sent' : step === 'review' ? 'Review' : 'Send money'}</DrawerTitle>
          <DrawerDescription>
            {step === 'form' ? `From Everyday · ${fmt(locale).format(balance)} available` : step === 'review' ? 'Check the details before you send.' : 'It’s already in their account.'}
          </DrawerDescription>
        </DrawerHeader>
        <Reveal key={step} inView={false} variant={step === 'done' ? 'scale' : 'rise'} duration="base" className="flex flex-1 flex-col gap-5 px-5 pb-2">
          {step === 'form' && (
            <>
              <Field>
                <FieldLabel id="kite-payee">To</FieldLabel>
                <ToggleGroup aria-labelledby="kite-payee" value={[payee]} onValueChange={(v) => v[0] && setPayee(v[0])} className="-mx-1 flex-wrap justify-start gap-1">
                  {PAYEES.map((p) => (
                    <ToggleGroupItem key={p.id} value={p.id} aria-label={p.name} className="h-auto w-16 flex-col gap-1.5 px-1 py-2 text-ui-sm">
                      <Avatar className="size-10 group-data-pressed/toggle:ring-2 group-data-pressed/toggle:ring-accent">
                        <AvatarFallback>{initials(p.name)}</AvatarFallback>
                      </Avatar>
                      {p.name.split(' ')[0]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
              <Field>
                <FieldLabel>Amount</FieldLabel>
                <NumberInput aria-label="Amount" value={amount} onValueChange={setAmount} min={0} max={balance} step={5} format={usd} placeholder="$0.00" className="[&_input]:text-ui-lg" />
                <div className="flex gap-2">
                  {[20, 50, 100].map((n) => (
                    <Button key={n} variant="outline" size="sm" onClick={() => setAmount((a) => Math.min(balance, (a ?? 0) + n))}>
                      +${n}
                    </Button>
                  ))}
                </div>
              </Field>
              <Field>
                <FieldLabel>Note</FieldLabel>
                <Input value={note} placeholder="Dinner, rent, concert tickets…" onChange={(e) => setNote(e.target.value)} />
              </Field>
            </>
          )}
          {step === 'review' && (
            <dl className="flex flex-col divide-y divide-line rounded-xl border border-line bg-transparent text-ui">
              <div className="flex items-center gap-3 p-4">
                <Avatar size="lg">
                  <AvatarFallback>{initials(who.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <dt className="sr-only">To</dt>
                  <dd className="font-medium text-fg">{who.name}</dd>
                  <dd className="text-ui-sm text-fg-muted">{who.handle}</dd>
                </div>
                <dd className="ms-auto text-2xl font-semibold tracking-tight text-fg tabular-nums">{fmt(locale).format(amount ?? 0)}</dd>
              </div>
              {[
                ['Note', note || 'None'],
                ['Arrives', 'Instantly'],
                ['Fee', fmt(locale).format(0)],
                ['Balance after', fmt(locale).format(balance - (amount ?? 0))],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between px-4 py-2.5">
                  <Eyebrow render={<dt />} className="text-ui text-fg-muted">
                    {label}
                  </Eyebrow>
                  <dd className="text-fg tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {step === 'done' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-success-subtle text-success-text">
                <CheckCircleIcon size={36} strokeWidth={1.75} trigger="mount" />
              </span>
              <p className="text-2xl font-semibold tracking-tight text-fg tabular-nums">{fmt(locale).format(amount ?? 0)}</p>
              <p className="text-ui text-fg-muted">sent to {who.name}</p>
            </div>
          )}
        </Reveal>
        <DrawerFooter className="flex-row">
          {step === 'form' && (
            <Button className="flex-1" size="lg" disabled={!valid} onClick={() => setStep('review')}>
              Continue
            </Button>
          )}
          {step === 'review' && (
            <>
              <Button variant="outline" size="lg" onClick={() => setStep('form')}>
                Back
              </Button>
              <AsyncButton
                className="flex-1"
                size="lg"
                pendingLabel="Sending…"
                successLabel="Sent"
                onAction={() => onSend(who.name, amount ?? 0, note)}
                onActionStateChange={(state) => state === 'success' && setTimeout(() => setStep('done'), k.ms('slow'))}
              >
                Send {fmt(locale).format(amount ?? 0)}
              </AsyncButton>
            </>
          )}
          {step === 'done' && (
            <Button className="flex-1" size="lg" variant="outline" onClick={() => close(false)}>
              Done
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
