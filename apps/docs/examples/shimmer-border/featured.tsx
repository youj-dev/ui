'use client'

import type { ReactNode } from 'react'
import { CheckIcon } from '@youj/icons'
import { ShimmerBorder } from '@youj/motion/interactions'

function Plan({ name, price, unit, features, children }: { name: string; price: string; unit: string; features: string[]; children: ReactNode }) {
  return (
    <div className="relative z-2 flex h-full flex-col p-5">
      <p className="text-sm font-medium text-fg">{name}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-fg">
        {price}
        <span className="text-sm font-normal text-fg-muted"> {unit}</span>
      </p>
      <ul className="mt-4 mb-6 space-y-2 text-sm text-fg-muted">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <CheckIcon size={14} trigger="none" className="text-accent" />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-auto">{children}</div>
    </div>
  )
}

export default function ShimmerBorderFeatured() {
  return (
    <div className="@container w-full max-w-xl">
      <div className="grid gap-3 @md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface">
          <Plan name="Hobby" price="$0" unit="/ month" features={['3 projects', 'Preview deployments', 'Community support']}>
            <p className="grid h-9 place-items-center rounded-lg border border-line text-sm text-fg-muted">Current plan</p>
          </Plan>
        </div>
        {/* The radius and surface of its neighbor, so the light is the only difference. It's the one light on
            the screen, so the button inside stays plain. */}
        <ShimmerBorder idle="visible">
          <Plan name="Pro" price="$24" unit="/ seat / mo" features={['Unlimited projects', 'SAML SSO and audit log', 'Priority build queue']}>
            <button
              type="button"
              className="h-9 w-full rounded-lg bg-accent text-sm font-medium text-on-accent outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Upgrade to Pro
            </button>
          </Plan>
        </ShimmerBorder>
      </div>
    </div>
  )
}
