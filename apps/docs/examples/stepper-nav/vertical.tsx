'use client'

import { useState } from 'react'
import { Button, StepperNav } from '@youj/react'

const STEPS = [
  { id: 'cart', title: 'Cart', description: '3 items' },
  { id: 'shipping', title: 'Shipping', description: 'Address and speed' },
  { id: 'payment', title: 'Payment', description: 'Card or invoice' },
  { id: 'review', title: 'Review', description: 'Check and place the order' },
]

export default function StepperNavVertical() {
  const [current, setCurrent] = useState(2)

  // Side by side from `sm`; on a phone the panel stacks under the list, so neither is squeezed.
  return (
    <div className="flex w-full max-w-lg flex-col gap-5 sm:flex-row sm:gap-8">
      <StepperNav
        aria-label="Checkout"
        orientation="vertical"
        steps={STEPS}
        current={current}
        href={(i) => `#checkout-${STEPS[i]!.id}`}
        onNavigate={setCurrent}
        className="shrink-0 sm:w-52"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-xl border border-line bg-surface p-4">
        <p className="text-ui font-medium text-fg">{STEPS[Math.min(current, STEPS.length - 1)]!.title}</p>
        <p className="text-ui-sm text-fg-muted">Done steps are links back; upcoming ones can't be skipped to.</p>
        <div className="mt-auto flex gap-2">
          <Button size="sm" variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
            Back
          </Button>
          <Button size="sm" disabled={current === STEPS.length} onClick={() => setCurrent((c) => c + 1)}>
            {current >= STEPS.length - 1 ? 'Place order' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
