'use client'

import { SpotlightSurface } from '@youj/motion'
import { ArrowRightIcon, ShieldCheckIcon } from '@youj/icons'

export default function SpotlightStandalone() {
  return (
    <div className="@container w-full max-w-xl">
      {/* Outside a group, a surface tracks the pointer itself. */}
      <SpotlightSurface radius={300} className="rounded-2xl border border-line bg-surface">
        <div className="flex flex-col gap-4 p-5 @md:flex-row @md:items-center">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-raised text-fg">
            <ShieldCheckIcon size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-fg">Enterprise</p>
            <p className="mt-0.5 text-sm text-fg-muted">SAML SSO, audit logs and a 99.99% SLA, on your own contract.</p>
          </div>
          <a
            href="#contact-sales"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-lg bg-fg px-3.5 text-sm font-medium text-canvas outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface @md:self-center"
          >
            Talk to sales
            <ArrowRightIcon size={14} />
          </a>
        </div>
      </SpotlightSurface>
    </div>
  )
}
