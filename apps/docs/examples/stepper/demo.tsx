'use client'

import { useState } from 'react'
import { Button, Card, CardContent, Stepper, type StepperStep } from '@youj/react'

const CHECKOUT: StepperStep[] = [
  { id: 'cart', title: 'Cart' },
  { id: 'shipping', title: 'Shipping' },
  { id: 'payment', title: 'Payment' },
  { id: 'review', title: 'Review' },
]

export default function StepperDemo() {
  const [current, setCurrent] = useState(1)
  const done = current === CHECKOUT.length

  return (
    <Card className="w-full max-w-xl">
      <CardContent className="flex flex-col gap-6">
        {/* Done steps are buttons: press one to go back to it. */}
        <Stepper steps={CHECKOUT} current={current} onStepClick={setCurrent} aria-label="Checkout" />
        <div className="flex items-center justify-between gap-2">
          <p className="text-ui-sm text-fg-muted" aria-live="polite">
            {done ? 'Order placed.' : `Step ${current + 1} of ${CHECKOUT.length}`}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
              Back
            </Button>
            {done ? (
              <Button variant="outline" onClick={() => setCurrent(0)}>
                Start over
              </Button>
            ) : (
              <Button onClick={() => setCurrent((c) => c + 1)}>{current === CHECKOUT.length - 1 ? 'Place order' : 'Continue'}</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
