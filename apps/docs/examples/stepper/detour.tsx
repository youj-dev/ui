'use client'

import { useState } from 'react'
import { Button, Stepper, type StepperStep } from '@youj/react'

const ROUTE: StepperStep[] = [
  { id: 'depot', title: 'Harbor depot', description: '09:48' },
  { id: 'yard', title: 'North yard', description: '10:41' },
  { id: 'ridge', title: 'Ridge road', description: 'Speed −24%', invalid: true },
  { id: 'junction', title: 'Ridge junction', description: '12:55' },
  { id: 'summit', title: 'Summit DC', description: 'ETA 15:49' },
]

export default function StepperDetour() {
  const [proposed, setProposed] = useState(true)
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <Stepper steps={ROUTE} current={2} aria-label="Route" detour={proposed ? { from: 1, to: 3, label: 'River road detour', detail: '−31 min' } : undefined} />
      <Button variant="outline" size="sm" className="self-start" onClick={() => setProposed((on) => !on)}>
        {proposed ? 'Dismiss detour' : 'Propose detour'}
      </Button>
    </div>
  )
}
