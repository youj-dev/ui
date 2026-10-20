'use client'

import { Stagger } from '@youj/motion'
import { CheckCircleIcon } from '@youj/icons'

const LOG = [
  { step: 'Cloned youj-web at 4f2a91c', time: '0.4s' },
  { step: 'Installed 312 packages', time: '6.1s' },
  { step: 'Compiled 48 routes', time: '11.8s' },
  { step: 'Uploaded 1.4 MB of static assets', time: '2.2s' },
  { step: 'Assigned youj.io', time: '0.3s' },
]

export default function StaggerList() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface">
      <p className="border-b border-line px-4 py-2.5 text-xs font-medium text-fg-muted">Build log</p>
      {/* A real list: `as="ul"` and `itemAs="li"` keep the semantics, and the tight step reads as one sweep. */}
      <Stagger as="ul" itemAs="li" step="tight" variant="fade" inView={false} className="divide-y divide-line">
        {LOG.map(({ step, time }) => (
          <div key={step} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <CheckCircleIcon size={16} className="text-success" />
            <span className="min-w-0 flex-1 truncate text-fg">{step}</span>
            <span className="font-mono text-xs text-fg-muted">{time}</span>
          </div>
        ))}
      </Stagger>
    </div>
  )
}
