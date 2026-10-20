'use client'

import { useState } from 'react'
import { Button, Card, CardContent, Stepper, type StepperStep } from '@youj/react'

const ONBOARDING: StepperStep[] = [
  { id: 'account', title: 'Create account', description: 'Name and email' },
  { id: 'workspace', title: 'Workspace', description: 'Name and URL' },
  { id: 'integrations', title: 'Integrations', description: 'GitHub, Slack', optional: true },
  { id: 'invite', title: 'Invite team', description: 'Up to 10 seats' },
]

export default function StepperVertical() {
  const [current, setCurrent] = useState(2)

  return (
    <Card className="w-80">
      <CardContent className="flex flex-col gap-5">
        <Stepper steps={ONBOARDING} current={current} orientation="vertical" onStepClick={setCurrent} aria-label="Setup" />
        <Button variant="outline" size="sm" className="self-start" onClick={() => setCurrent((c) => (c + 1) % (ONBOARDING.length + 1))}>
          {current === ONBOARDING.length ? 'Start over' : 'Next step'}
        </Button>
      </CardContent>
    </Card>
  )
}
