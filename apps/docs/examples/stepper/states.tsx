'use client'

import { Stepper, type StepperStep } from '@youj/react'

const CHECKOUT: StepperStep[] = [
  { id: 'cart', title: 'Cart' },
  { id: 'shipping', title: 'Shipping' },
  { id: 'payment', title: 'Payment' },
  { id: 'review', title: 'Review' },
]

const DECLINED = CHECKOUT.map((step) => (step.id === 'payment' ? { ...step, invalid: true, description: 'Card declined' } : step))

export default function StepperStates() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-8">
      <Stepper steps={CHECKOUT} current={0} aria-label="Checkout, not started" />
      <Stepper steps={DECLINED} current={2} aria-label="Checkout, payment failed" />
      <Stepper steps={CHECKOUT} current={CHECKOUT.length} aria-label="Checkout, all steps complete" />
    </div>
  )
}
