'use client'

import { CheckIcon, SparklesIcon } from '@youj/icons'
import { ShimmerButton } from '@youj/motion/interactions'

const FEATURES = ['Unlimited projects and previews', 'SAML SSO and audit log', 'Priority build queue']

export default function ShimmerBorderButton() {
  return (
    <div className="w-full max-w-xs rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-fg">Pro trial</span>
        <span className="rounded-full bg-raised px-2 py-0.5 font-mono text-[11px] text-fg-muted">14 days left</span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-fg">
        $24<span className="text-base font-normal text-fg-muted"> / seat / mo</span>
      </p>
      <ul className="mt-4 space-y-2 text-sm text-fg-muted">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <CheckIcon size={14} trigger="none" className="text-accent" />
            {f}
          </li>
        ))}
      </ul>
      {/* Tab to it: keyboard focus intensifies the light exactly like hover. */}
      <ShimmerButton className="mt-6 w-full">
        <SparklesIcon size={16} className="text-accent" />
        Upgrade to Pro
      </ShimmerButton>
    </div>
  )
}
