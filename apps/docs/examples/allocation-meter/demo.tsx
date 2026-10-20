'use client'

import { useState } from 'react'
import { AllocationMeter, type Envelope } from '@youj/react'
import { CarIcon, CoffeeIcon, GiftIcon, ShoppingCartIcon, TicketIcon } from '@youj/icons'

const ENVELOPES: Envelope[] = [
  { id: 'groceries', name: 'Groceries', icon: <ShoppingCartIcon />, budget: 520, spent: 402, rollover: 40 },
  { id: 'eating', name: 'Eating out', icon: <CoffeeIcon />, budget: 220, spent: 252 },
  { id: 'fun', name: 'Fun', icon: <TicketIcon />, budget: 160, spent: 71 },
  { id: 'transport', name: 'Transport', icon: <CarIcon />, budget: 120, spent: 103 },
  { id: 'gifts', name: 'Gifts', icon: <GiftIcon />, budget: 80, spent: 12, rollover: 30 },
]

export default function AllocationMeterDemo() {
  const [envelopes, setEnvelopes] = useState(ENVELOPES)
  // Moving money shifts budget: the source's shrinks by the amount and the target's grows by it.
  const move = (from: string, to: string, amount: number) =>
    setEnvelopes((list) => list.map((e) => (e.id === from ? { ...e, budget: e.budget - amount } : e.id === to ? { ...e, budget: e.budget + amount } : e)))

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-line bg-surface p-5">
      <AllocationMeter envelopes={envelopes} onMove={move} step={10} />
    </div>
  )
}
