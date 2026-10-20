'use client'

import { useId } from 'react'
import { Button } from '../../../components/ui/button'
import { SidebarCard } from '../../../components/ui/sidebar'

/* The setup card at Workspace's foot: the next step of getting started, how
 * far along it is as a small ring, and Skip and Next. It is the kit's
 * SidebarCard, so it steps aside while the sidebar is folded to icons. */

/** Where getting started stands. */
export interface FrameSetup {
  /** The step's name: "Connect the front desk". */
  title: string
  /** One line on why. */
  description?: string
  done: number
  total: number
}

export const SETUP_COPY = {
  skip: 'Skip',
  next: 'Next',
  progress: (done: number, total: number) => `${done} of ${total}`,
  /** The ring's name for assistive tech. */
  progressLabel: (done: number, total: number) => `Setup: ${done} of ${total} steps done`,
}

export type FrameSetupCopy = typeof SETUP_COPY

export function SetupCard({ setup, copy, onNext, onSkip }: { setup: FrameSetup; copy: FrameSetupCopy; onNext?: () => void; onSkip?: () => void }) {
  const titleId = useId()
  const share = setup.total ? Math.min(1, setup.done / setup.total) : 0
  return (
    <SidebarCard role="region" aria-labelledby={titleId} data-slot="frame-setup">
      <div className="flex flex-col gap-0.5">
        <span id={titleId} className="text-ui font-medium">
          {setup.title}
        </span>
        {setup.description && <p className="text-ui-sm text-pretty text-fg-muted">{setup.description}</p>}
      </div>
      <div className="flex items-center gap-1">
        <span role="img" aria-label={copy.progressLabel(setup.done, setup.total)} className="me-auto flex items-center gap-1.5 text-ui-xs text-fg-muted tabular-nums">
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 -rotate-90">
            <circle cx="8" cy="8" r="6" fill="none" strokeWidth="2" className="stroke-line" />
            <circle cx="8" cy="8" r="6" fill="none" strokeWidth="2" pathLength={1} strokeDasharray={`${share} 1`} strokeLinecap="round" className="stroke-accent" />
          </svg>
          {copy.progress(setup.done, setup.total)}
        </span>
        <Button variant="ghost" size="xs" onClick={onSkip}>
          {copy.skip}
        </Button>
        <Button variant="outline" size="xs" onClick={onNext}>
          {copy.next}
        </Button>
      </div>
    </SidebarCard>
  )
}
