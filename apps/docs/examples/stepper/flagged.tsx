'use client'

import { Stepper, type StepperStep } from '@youj/react'

const LAUNCH_PLAN: StepperStep[] = [
  { id: 'scope', title: 'Scope', description: 'Oct 2' },
  { id: 'design', title: 'Design', description: 'By Oct 9' },
  { id: 'security', title: 'Security', description: 'By Oct 16' },
  { id: 'freeze', title: 'Freeze', description: 'Oct 23' },
  { id: 'submit', title: 'Submission', description: 'Oct 30, deadline', flagged: true },
  { id: 'launch', title: 'Launch', description: 'Nov 12' },
]

export default function StepperFlagged() {
  return <Stepper steps={LAUNCH_PLAN} current={1} aria-label="Launch plan" className="w-full max-w-4xl" />
}
