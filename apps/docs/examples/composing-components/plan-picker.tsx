'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import { motion } from 'motion/react'
import { Counter, MorphLabel, SlidingIndicator, useMorphRoot } from '@youj/motion'
import { ArrowRightIcon, CheckIcon } from '@youj/icons'

const PLANS = [
  { id: 'hobby', name: 'Hobby', monthly: 0, yearly: 0, features: ['1 project', 'Preview deployments', 'Community support'] },
  { id: 'pro', name: 'Pro', monthly: 24, yearly: 19, features: ['Unlimited projects', 'Password protection', 'Email support'] },
  { id: 'team', name: 'Team', monthly: 48, yearly: 38, features: ['SAML single sign-on', 'Audit logs', 'Priority support'] },
] as const
const PERIODS = ['monthly', 'yearly'] as const
const usd = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const
const formatUsd = new Intl.NumberFormat('en-US', usd).format

/** Arrow keys, Home and End move the selection within a radio group, and focus follows it. */
function radioKeys<T extends string>(options: readonly T[], current: T, select: (next: T) => void) {
  return (event: KeyboardEvent<HTMLElement>) => {
    const forward = getComputedStyle(event.currentTarget).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const index = options.indexOf(current)
    const last = options.length - 1
    let next: number
    if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    else if (event.key === 'ArrowDown' || event.key === forward) next = index === last ? 0 : index + 1
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') next = index === 0 ? last : index - 1
    else return
    event.preventDefault()
    select(options[next]!)
    event.currentTarget.querySelector<HTMLElement>(`[data-value="${options[next]}"]`)?.focus()
  }
}

export default function PlanPicker() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('yearly')
  const [planId, setPlanId] = useState<(typeof PLANS)[number]['id']>('pro')
  const plan = PLANS.find((p) => p.id === planId)!
  const morph = useMorphRoot(8)
  const id = useId()

  return (
    <div className="@container w-full max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p id={`${id}-plan`} className="text-sm font-medium text-fg">
          Choose a plan
        </p>
        <div
          role="radiogroup"
          aria-label="Billing period"
          onKeyDown={radioKeys(PERIODS, period, setPeriod)}
          className="relative isolate flex rounded-lg border border-line bg-canvas p-0.5 text-xs font-medium"
        >
          <SlidingIndicator className="rounded-md bg-raised shadow-sm" />
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              data-value={p}
              aria-checked={period === p}
              tabIndex={period === p ? 0 : -1}
              onClick={() => setPeriod(p)}
              className="rounded-md px-3 py-1.5 text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none aria-checked:text-fg"
            >
              {p === 'monthly' ? 'Monthly' : 'Yearly · save 20%'}
            </button>
          ))}
        </div>
      </div>

      <div
        role="radiogroup"
        aria-labelledby={`${id}-plan`}
        onKeyDown={radioKeys(PLANS.map((p) => p.id), planId, setPlanId)}
        className="relative isolate grid gap-3 @lg:grid-cols-3"
      >
        {/* The selection ring glides between cards. It sits behind them, so only its 2px ring shows. */}
        <SlidingIndicator className="rounded-xl bg-transparent ring-2 ring-accent" />
        {PLANS.map((p) => {
          const price = period === 'yearly' ? p.yearly : p.monthly
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              data-value={p.id}
              aria-checked={planId === p.id}
              // A short name for the radio; the features are its description.
              aria-label={`${p.name}, ${formatUsd(price)} per seat per month`}
              aria-describedby={`${id}-${p.id}`}
              tabIndex={planId === p.id ? 0 : -1}
              onClick={() => setPlanId(p.id)}
              className="rounded-xl border border-line bg-surface p-4 text-start transition-colors yj-duration-fast ease-standard hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="block text-sm font-medium text-fg">{p.name}</span>
              <span className="mt-2 flex items-baseline gap-1">
                <Counter value={price} from={price} inView={false} format={usd} locale="en-US" className="text-2xl font-semibold tracking-tight text-fg" />
                <span className="text-xs text-fg-muted">/ seat / mo</span>
              </span>
              <span id={`${id}-${p.id}`} className="mt-3 flex flex-col gap-1.5">
                {p.features.map((feature) => (
                  <span key={feature} className="flex items-center gap-2 text-xs text-fg-muted">
                    <CheckIcon size={14} strokeWidth={2} trigger="none" className="text-accent" />
                    {feature}
                  </span>
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-fg-muted">
          {plan.name}, billed {period}
        </p>
        <motion.button
          {...morph}
          type="button"
          className="relative inline-flex h-9 items-center overflow-hidden bg-fg px-4 text-sm font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
        >
          <MorphLabel value={plan.id} contentClassName="gap-1.5">
            Continue with {plan.name}
            <ArrowRightIcon size={16} />
          </MorphLabel>
        </motion.button>
      </div>
    </div>
  )
}
