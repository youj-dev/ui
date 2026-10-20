'use client'

import { useState } from 'react'
import { Button, Card, CardContent, Field, FieldLabel, Input, Label, RadioGroup, RadioGroupItem, Wizard, WizardStep } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const DELIVERY = [
  { value: 'email', title: 'Email only', meta: 'Free · instant' },
  { value: 'standard', title: 'Hardware key, standard', meta: '$6 · 3–5 days' },
  { value: 'express', title: 'Hardware key, express', meta: '$18 · next day' },
]

export default function WizardCheckout() {
  const [card, setCard] = useState('')
  const [cardError, setCardError] = useState(false)

  return (
    <Card className="w-full max-w-xl">
      <CardContent>
        <Wizard
          finishLabel="Place order"
          finishSuccessLabel="Order placed"
          onComplete={() => wait(1100)}
          footerStart={<Button variant="ghost">Cancel</Button>}
        >
          <WizardStep id="shipping" title="Delivery" description="Licenses arrive by email; hardware keys ship.">
            <RadioGroup defaultValue="email" aria-label="Delivery method" className="grid gap-2">
              {DELIVERY.map((option) => (
                <Label key={option.value} className="flex items-center gap-3 rounded-lg border border-line p-3 has-data-checked:border-accent-line">
                  <RadioGroupItem value={option.value} />
                  <span className="flex-1 font-medium">{option.title}</span>
                  <span className="text-ui-sm text-fg-muted">{option.meta}</span>
                </Label>
              ))}
            </RadioGroup>
          </WizardStep>
          <WizardStep
            id="payment"
            title="Payment"
            description="Try continuing with the field empty."
            validate={() => {
              const ok = card.replace(/\s/g, '').length >= 12
              setCardError(!ok)
              // A string fails the step: it's shown under the step and announced.
              return ok || 'Enter a card number to continue.'
            }}
          >
            <Field invalid={cardError}>
              <FieldLabel>Card number</FieldLabel>
              <Input value={card} onChange={(e) => setCard(e.target.value)} inputMode="numeric" placeholder="4242 4242 4242 4242" autoComplete="cc-number" />
            </Field>
          </WizardStep>
          <WizardStep id="review" title="Review and pay">
            <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-ui">
              <dt className="text-fg-muted">Subtotal</dt>
              <dd className="tabular-nums">$348.00</dd>
              <dt className="text-fg-muted">Tax</dt>
              <dd className="tabular-nums">$27.84</dd>
              <dt className="border-t border-line pt-1.5 font-medium">Total</dt>
              <dd className="border-t border-line pt-1.5 font-semibold tabular-nums">$375.84</dd>
            </dl>
          </WizardStep>
        </Wizard>
      </CardContent>
    </Card>
  )
}
