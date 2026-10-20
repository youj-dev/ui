'use client'

import { useState } from 'react'
import { Counter } from '@youj/motion'

const usd = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const

export default function CounterDemo() {
  const [yearly, setYearly] = useState(true)

  return (
    <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-fg">Pro</p>
        <div role="radiogroup" aria-label="Billing period" className="flex rounded-full border border-line bg-canvas p-0.5 text-xs">
          {[false, true].map((option) => (
            <button
              key={String(option)}
              type="button"
              role="radio"
              aria-checked={yearly === option}
              onClick={() => setYearly(option)}
              className={`rounded-full px-3 py-1 font-medium transition-colors duration-(--yj-duration-fast) ease-standard focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                yearly === option ? 'bg-fg text-canvas' : 'text-fg-muted hover:text-fg'
              }`}
            >
              {option ? 'Yearly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-6 flex items-baseline gap-1.5">
        <Counter
          value={yearly ? 19 : 24}
          from={24}
          inView={false}
          format={usd}
          locale="en-US"
          className="text-5xl font-semibold tracking-tight text-fg"
        />
        <span className="text-sm text-fg-muted">/ seat / month</span>
      </p>
      <p className="mt-2 text-xs text-fg-muted">{yearly ? 'Billed yearly, save 20%' : 'Billed monthly, cancel anytime'}</p>
    </div>
  )
}
