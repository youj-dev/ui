import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  ArchiveIcon,
  BellIcon,
  EyeIcon,
  LayersIcon,
  MailIcon,
  MessagesIcon,
  MoonIcon,
  ShieldIcon,
  SquarePenIcon,
  TimerIcon,
  WalletIcon,
} from '@youj/icons'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ChoiceCard, ChoiceCardGroup } from './choice-card'
import { FieldDescription, FieldLegend, FieldSet } from './field'
import { HatchedBar } from './hatched-bar'

const meta: Meta<typeof ChoiceCard> = {
  title: 'UI/Inputs/Choice card',
  component: ChoiceCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A selectable card: icon, title, description and its control, with the whole card as the target. ChoiceCardGroup sets the control: `radio` (one tab stop, arrows move the choice), `checkbox` (a value list) or `switch` (independent toggles). The card\'s edge doubles in the accent and its icon tile tints when it is on, both on the fast token; the control keeps its own motion and sound. `badge` sits beside the title, `note` at the row\'s end, and children (a meter, a figure) under the description. Reduced motion: the control\'s own reduced behaviour; the tint still changes.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ChoiceCard>

const ACCESS = [
  { value: 'manage', icon: <ShieldIcon />, title: 'Manage', description: 'Members, billing and every project' },
  { value: 'build', icon: <SquarePenIcon />, title: 'Build', description: 'Create, edit and publish projects' },
  { value: 'review', icon: <EyeIcon />, title: 'Review', description: 'Comment on and approve changes' },
  { value: 'billing', icon: <WalletIcon />, title: 'Billing', description: 'Invoices and payment methods only' },
]

function AccessPicker() {
  return (
    <FieldSet className="w-full max-w-[520px]">
      <FieldLegend variant="label">Access level</FieldLegend>
      <ChoiceCardGroup defaultValue="build" name="access" columns={2}>
        {ACCESS.map((a) => (
          <ChoiceCard key={a.value} {...a} />
        ))}
      </ChoiceCardGroup>
    </FieldSet>
  )
}

/** Picking an access level for a new member: a two-column radio grid. Tab in, then use the arrow keys. */
export const AccessLevel: Story = { render: () => <AccessPicker /> }

/** Resolving an overage: radio rows with a suggested option and what each one means at the row's end. */
export const OverageOptions: Story = {
  render: () => (
    <FieldSet className="w-full max-w-[560px]">
      <FieldLegend variant="label">When the build minutes run out</FieldLegend>
      <ChoiceCardGroup defaultValue="queue" name="overage">
        <ChoiceCard value="queue" title="Queue until the cycle resets" badge="Suggested" note="No extra cost" />
        <ChoiceCard value="burst" title="Buy a burst pack" note="+1,000 min for $12" />
        <ChoiceCard value="stop" title="Stop non-production builds" note="Production keeps running" />
      </ChoiceCardGroup>
    </FieldSet>
  ),
}

const LEVERS = [
  { id: 'cache', icon: <LayersIcon />, title: 'Cache dependencies', saving: 0.32, minutes: '−410 min', description: 'Reuse installs between builds on the same lockfile.' },
  { id: 'sleep', icon: <MoonIcon />, title: 'Sleep idle previews', saving: 0.18, minutes: '−230 min', description: 'Previews nobody opened for a day stop until visited.' },
  { id: 'batch', icon: <TimerIcon />, title: 'Batch docs builds', saving: 0.09, minutes: '−115 min', description: 'Docs-only commits build once an hour.' },
  { id: 'archive', icon: <ArchiveIcon />, title: 'Archive stale branches', saving: 0.04, minutes: '−50 min', description: 'Branches untouched for 30 days stop building.' },
]

function Levers() {
  const [on, setOn] = useState<Record<string, boolean>>({ cache: true })
  return (
    <ChoiceCardGroup control="switch" aria-label="Ways to save build minutes" columns={4} className="w-full max-w-[960px]">
      {LEVERS.map((l) => (
        <ChoiceCard
          key={l.id}
          orientation="vertical"
          icon={l.icon}
          title={l.title}
          description={l.description}
          checked={!!on[l.id]}
          onCheckedChange={(checked) => setOn((prev) => ({ ...prev, [l.id]: checked }))}
        >
          <div className="flex flex-col gap-2">
            <span className="text-ui-lg font-medium text-fg tabular-nums">{l.minutes}</span>
            <div className="overflow-hidden rounded-full bg-band">
              <HatchedBar orientation="horizontal" value={l.saving} max={0.4} tone={on[l.id] ? 'success' : 'neutral'} fill={on[l.id] ? 'solid' : 'hatched'} />
            </div>
          </div>
        </ChoiceCard>
      ))}
    </ChoiceCardGroup>
  )
}

/** Weighing ways to save build minutes: vertical switch cards, each with its impact as a figure and a meter. */
export const SavingLevers: Story = { render: () => <Levers /> }

/** Choosing notification channels: a checkbox group whose value is the ticked cards. */
export const NotificationChannels: Story = {
  render: () => (
    <FieldSet className="w-full max-w-[420px]">
      <FieldLegend variant="label">Notify me by</FieldLegend>
      <FieldDescription>Pick any. You can change this per project later.</FieldDescription>
      <ChoiceCardGroup control="checkbox" defaultValue={['email', 'inbox']} aria-label="Notify me by">
        <ChoiceCard value="email" icon={<MailIcon />} title="Email" description="A digest each morning, and failures at once" />
        <ChoiceCard value="inbox" icon={<BellIcon />} title="In-app inbox" description="Everything, as it happens" />
        <ChoiceCard value="chat" icon={<MessagesIcon />} title="Team chat" description="Deploys and incidents in a channel" />
      </ChoiceCardGroup>
    </FieldSet>
  ),
}

/** Off, on, disabled, and a standalone card outside any group. */
export const States: Story = {
  render: () => (
    <div className="grid w-full max-w-[420px] gap-6">
      <ChoiceCardGroup defaultValue="b" aria-label="States">
        <ChoiceCard value="a" title="Unchosen" description="The resting card" />
        <ChoiceCard value="b" title="Chosen" description="The edge doubles in the accent" />
        <ChoiceCard value="c" title="Disabled" description="Skipped by the arrow keys" disabled />
      </ChoiceCardGroup>
      <ChoiceCard control="switch" title="Standalone switch card" description="No group around it" defaultChecked />
    </div>
  ),
}

export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <AccessPicker />
    </YoujProvider>
  ),
}
