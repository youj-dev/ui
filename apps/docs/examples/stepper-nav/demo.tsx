'use client'

import { useState } from 'react'
import { Button, StepperNav } from '@youj/react'

const STEPS = [
  { id: 'account', title: 'Account', description: 'Email and password' },
  { id: 'workspace', title: 'Workspace', description: 'Name and URL' },
  { id: 'plan', title: 'Plan', description: 'Pick what fits' },
  { id: 'invite', title: 'Invite', description: 'Bring your team', optional: true },
]

export default function StepperNavDemo() {
  // In an app, `current` comes from the route: /setup/workspace is step 1.
  const [current, setCurrent] = useState(1)
  const done = current === STEPS.length

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <StepperNav aria-label="Setup" steps={STEPS} current={current} href={(i) => `#setup-${STEPS[i]!.id}`} onNavigate={setCurrent} />
      <div className="flex items-center gap-2">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
          Back
        </Button>
        <Button disabled={done} onClick={() => setCurrent((c) => c + 1)}>
          {current >= STEPS.length - 1 ? 'Finish' : 'Continue'}
        </Button>
        <span className="ms-auto text-ui-sm text-fg-muted" aria-live="polite">
          {done ? 'All set' : `Step ${current + 1} of ${STEPS.length}`}
        </span>
      </div>
    </div>
  )
}
