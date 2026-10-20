import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckIcon, LockIcon, SparklesIcon } from '@youj/icons'
import { Button } from './button'
import { ProposalCard, type ProposalCardProps, type ProposalStatus } from './proposal-card'

const REROUTE: ProposalCardProps = {
  source: (
    <>
      <SparklesIcon size={12} /> Route agent · 92% confidence
    </>
  ),
  title: 'Reroute load 4821 via Ridge Rd',
  description: 'Congestion on Harbor Fwy has cut speed by 24%. The delivery window stays intact.',
  options: [
    { id: 'current', label: 'Harbor Fwy · current', value: '15:49', detail: '+47 min', tone: 'danger' },
    { id: 'proposed', label: 'Ridge Rd · proposed', value: '15:18', detail: '−31 min', proposed: true },
  ],
  facts: [
    { label: 'Time saved', value: '31 min', tone: 'success' },
    { label: 'Extra distance', value: '+4.2 mi' },
    { label: 'Delivery window', value: 'Kept', tone: 'success' },
  ],
  note: (
    <span className="inline-flex items-center gap-1.5">
      <LockIcon size={12} /> Route changes need a dispatcher’s approval.
    </span>
  ),
}

function Decide(args: ProposalCardProps) {
  const [status, setStatus] = useState<ProposalStatus>(args.status ?? 'pending')
  return (
    <ProposalCard
      {...args}
      status={status}
      resolution={
        <span className="flex items-center justify-between gap-2">
          {status === 'approved' ? 'Approved by you · driver notified' : 'Dismissed · keeping Harbor Fwy'}
          <Button variant="ghost" size="sm" onClick={() => setStatus('pending')}>
            Undo
          </Button>
        </span>
      }
      actions={
        <>
          <Button size="sm" onClick={() => setStatus('approved')}>
            <CheckIcon size={14} /> Approve reroute
          </Button>
          <Button size="sm" variant="outline">
            Compare
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setStatus('dismissed')}>
            Dismiss
          </Button>
        </>
      }
    />
  )
}

const meta: Meta<ProposalCardProps> = {
  title: 'UI/Data/Proposal Card',
  component: ProposalCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A change someone (or an agent) proposes and a person decides on: where it came from, what it is, the options side by side with the proposed one as a dashed accent outline, the impact as figures, and your actions. Approved, the proposal turns solid, the old plan steps back and the actions fold away for your resolution; dismissed, the proposal fades. Reduced motion: every change lands in place.',
      },
    },
  },
  args: REROUTE,
  render: (args) => <Decide {...args} />,
  decorators: [(Story) => <div className="w-96 max-w-[calc(100vw-2rem)]">{Story()}</div>],
}
export default meta
type Story = StoryObj<ProposalCardProps>

/** A reroute waiting on a dispatcher: approve it, or dismiss it, then undo. */
export const Default: Story = {}

/** Approved: the proposal is the plan now, and the resolution replaces the actions. */
export const Approved: Story = { args: { status: 'approved' } }

/** A reassignment: no figures to weigh, just the reason, the gain and the actions. */
export const Reassign: Story = {
  args: {
    source: 'Dispatch agent',
    title: 'Move load 4930 to Priya Raman',
    description: 'Mateo has a dock appointment at 13:30 that overlaps this drop.',
    options: undefined,
    facts: [{ label: 'Saves', value: '22 min', tone: 'success' }],
    note: undefined,
  },
}
