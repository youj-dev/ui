import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { StepperNav } from './stepper-nav'

const meta: Meta<typeof StepperNav> = {
  title: 'UI/Navigation/StepperNav',
  component: StepperNav,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Step navigation for flows that span pages: Stepper in a named nav landmark, with done steps and the current one as links back to their pages (Stepper\'s `stepHref`). Navigation only: the flow\'s logic stays in the app, and upcoming steps can\'t be jumped to. The connector fills as a step completes and drains if you go back; a finished step draws its check. On phones the horizontal row keeps discs and connectors. Reduced motion: fills and checks are instant.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof StepperNav>

const steps = [
  { id: 'account', title: 'Account', description: 'Email and password' },
  { id: 'workspace', title: 'Workspace', description: 'Name and URL' },
  { id: 'plan', title: 'Plan', description: 'Pick what fits' },
  { id: 'invite', title: 'Invite', description: 'Bring your team', optional: true },
]

function Flow({ orientation }: { orientation?: 'horizontal' | 'vertical' }) {
  const [current, setCurrent] = useState(1)
  return (
    <div className={orientation === 'vertical' ? 'flex w-72 flex-col gap-6' : 'flex w-[min(44rem,calc(100vw-2rem))] flex-col gap-8'}>
      <StepperNav
        aria-label="Setup"
        orientation={orientation}
        steps={steps}
        current={current}
        href={(i) => `#${steps[i]!.id}`}
        onNavigate={setCurrent}
      />
      <div className="flex gap-2">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
          Back
        </Button>
        <Button disabled={current === steps.length} onClick={() => setCurrent((c) => c + 1)}>
          {current >= steps.length - 1 ? 'Finish' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}

export const Horizontal: Story = { render: () => <Flow /> }

export const Vertical: Story = { render: () => <Flow orientation="vertical" /> }
