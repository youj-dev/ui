'use client'

import { useState } from 'react'
import { SlidingIndicator } from '@youj/motion'
import { BellIcon, CreditCardIcon, KeyIcon, SettingsIcon, ShieldIcon, UsersIcon } from '@youj/icons'

const SECTIONS = [
  { label: 'General', Icon: SettingsIcon, detail: 'Project name, framework preset and root directory.' },
  { label: 'Members', Icon: UsersIcon, detail: 'Who can deploy, and who can only view.' },
  { label: 'Billing', Icon: CreditCardIcon, detail: 'Plan, usage and invoices for this team.' },
  { label: 'Security', Icon: ShieldIcon, detail: 'Deployment protection and trusted IPs.' },
  { label: 'Notifications', Icon: BellIcon, detail: 'Email and Slack alerts for failed builds.' },
  { label: 'API keys', Icon: KeyIcon, detail: 'Tokens for the CLI and CI pipelines.' },
]

export default function SlidingIndicatorVertical() {
  const [current, setCurrent] = useState('Billing')
  const section = SECTIONS.find((s) => s.label === current)!

  return (
    <div className="@container w-full max-w-xl">
      <div className="grid gap-4 rounded-xl border border-line bg-surface p-2 @md:grid-cols-[180px_1fr]">
        {/* Measured, not assumed: the pill glides vertically as easily as across. */}
        <nav aria-label="Settings" className="relative isolate flex flex-col gap-0.5">
          <SlidingIndicator />
          {SECTIONS.map(({ label, Icon }) => (
            <a
              key={label}
              href={`/settings/${label.toLowerCase().replace(' ', '-')}`}
              aria-current={current === label ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault()
                setCurrent(label)
              }}
              className={`flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm outline-none transition-colors yj-duration-fast ease-standard focus-visible:ring-2 focus-visible:ring-accent ${
                current === label ? 'text-fg' : 'text-fg-muted hover:text-fg'
              }`}
            >
              <Icon size={15} />
              {label}
            </a>
          ))}
        </nav>
        <div className="rounded-lg border border-line bg-canvas p-4">
          <p className="text-sm font-medium text-fg">{section.label}</p>
          <p className="mt-1 text-sm text-fg-muted">{section.detail}</p>
        </div>
      </div>
    </div>
  )
}
