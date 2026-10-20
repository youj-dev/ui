import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { Card, CardContent } from './card'
import { Stepper, type StepperProps, type StepperStep } from './stepper'

const meta: Meta<StepperProps> = {
  title: 'UI/Display/Stepper',
  component: Stepper,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Where you are in a sequence: each step is complete, current, upcoming or in error, and can be optional. The connector after a step fills in the direction of travel on the slow token when the step is done and drains back when you return (a reversal mid-fill continues from where it is); the disc changes on the base token and a finished step draws its check. An ordered list with `aria-current="step"` and each state spoken; with `onStepClick`, done steps are buttons. Horizontal or vertical; `compact` hides the labels on small screens. Reduced motion: fills and marks are instant.',
      },
    },
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    current: { control: { type: 'range', min: 0, max: 4, step: 1 } },
  },
  args: { orientation: 'horizontal', current: 2 },
}
export default meta
type Story = StoryObj<StepperProps>

const checkout: StepperStep[] = [
  { id: 'cart', title: 'Cart' },
  { id: 'shipping', title: 'Shipping' },
  { id: 'payment', title: 'Payment' },
  { id: 'review', title: 'Review' },
]

const onboarding: StepperStep[] = [
  { id: 'account', title: 'Create account', description: 'Name and email' },
  { id: 'workspace', title: 'Workspace', description: 'Name and URL' },
  { id: 'integrations', title: 'Integrations', description: 'GitHub, Slack', optional: true },
  { id: 'invite', title: 'Invite team', description: 'Up to 10 seats' },
]

export const Playground: Story = {
  render: (args) => (
    <Card className="w-full max-w-[640px]">
      <CardContent>
        <Stepper {...args} steps={args.orientation === 'vertical' ? onboarding : checkout} />
      </CardContent>
    </Card>
  ),
}

export const Interactive: Story = {
  name: 'Hero: advance and return',
  render: function Render() {
    const [current, setCurrent] = useState(1)
    return (
      <Card className="w-full max-w-[640px]">
        <CardContent className="flex flex-col gap-6">
          <Stepper steps={checkout} current={current} onStepClick={setCurrent} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
              Back
            </Button>
            <Button onClick={() => setCurrent((c) => Math.min(checkout.length, c + 1))} disabled={current === checkout.length}>
              {current >= checkout.length - 1 ? 'Place order' : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  },
}

export const Vertical: Story = {
  render: function Render() {
    const [current, setCurrent] = useState(2)
    return (
      <Card className="w-80">
        <CardContent className="flex flex-col gap-5">
          <Stepper steps={onboarding} current={current} orientation="vertical" onStepClick={setCurrent} />
          <Button variant="outline" size="sm" className="self-start" onClick={() => setCurrent((c) => (c + 1) % (onboarding.length + 1))}>
            Next step
          </Button>
        </CardContent>
      </Card>
    )
  },
}

export const States: Story = {
  name: 'Complete, current, error, optional',
  render: () => (
    <div className="flex w-full max-w-[640px] flex-col gap-8">
      <Stepper steps={checkout} current={0} />
      <Stepper steps={checkout.map((s) => (s.id === 'payment' ? { ...s, invalid: true, description: 'Card declined' } : s))} current={2} />
      <Stepper steps={onboarding} current={2} />
      <Stepper steps={checkout} current={4} aria-label="Checkout, all steps complete" />
    </div>
  ),
}

const launchPlan: StepperStep[] = [
  { id: 'scope', title: 'Scope', description: 'Oct 2' },
  { id: 'design', title: 'Design', description: 'By Oct 9' },
  { id: 'security', title: 'Security', description: 'By Oct 16' },
  { id: 'freeze', title: 'Freeze', description: 'Oct 23' },
  { id: 'submit', title: 'Submission', description: 'Oct 30, deadline', flagged: true },
  { id: 'launch', title: 'Launch', description: 'Nov 12' },
]

/** A launch plan as dated milestones, with the one date that can't move flagged: its disc wears a flag and its date the danger ink. */
export const FlaggedDeadline: Story = {
  render: () => (
    <div className="w-[56rem] max-w-[94vw] rounded-2xl border border-line bg-surface p-6">
      <Stepper steps={launchPlan} current={1} aria-label="Launch plan" />
    </div>
  ),
}

const journey: StepperStep[] = [
  { id: 'depot', title: 'Harbor depot', description: '09:48' },
  { id: 'yard', title: 'North yard', description: '10:41' },
  { id: 'ridge', title: 'Ridge road', description: 'Speed −24%', invalid: true },
  { id: 'junction', title: 'Ridge junction', description: '12:55' },
  { id: 'summit', title: 'Summit DC', description: 'ETA 15:49' },
]

/** A rerouted stretch: the detour leaves North yard over the slow road and rejoins at Ridge junction. Toggle it to see it draw. */
export const Detour: Story = {
  render: function Render() {
    const [on, setOn] = useState(true)
    return (
      <div className="flex w-[44rem] max-w-[94vw] flex-col gap-6 rounded-2xl border border-line bg-surface p-6">
        <Stepper steps={journey} current={2} detour={on ? { from: 1, to: 3, label: 'River road detour', detail: '−31 min' } : undefined} aria-label="Route" />
        <Button variant="outline" size="sm" className="self-start" onClick={() => setOn((v) => !v)}>
          {on ? 'Dismiss detour' : 'Propose detour'}
        </Button>
      </div>
    )
  },
}
