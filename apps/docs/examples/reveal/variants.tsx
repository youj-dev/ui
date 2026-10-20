'use client'

import { Reveal, revealVariantNames } from '@youj/motion'

export default function RevealVariants() {
  return (
    <div className="@container w-full max-w-2xl">
      <div className="grid grid-cols-2 gap-3 @lg:grid-cols-4">
        {revealVariantNames.map((variant, i) => (
          <Reveal key={variant} variant={variant} inView={false} delay={i} delayStep="loose">
            <div className="flex h-24 flex-col justify-between rounded-xl border border-line bg-surface p-3">
              <div className="h-8 rounded-md bg-accent-subtle" />
              <span className="font-mono text-xs text-fg-muted">{variant}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
