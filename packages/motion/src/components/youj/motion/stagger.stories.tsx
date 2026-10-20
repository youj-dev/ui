import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Blocks,
  Cloud,
  Database,
  GitBranch,
  GitMerge,
  KeyRound,
  ChartLine,
  Mail,
  MessageSquare,
  Radio,
  ShieldCheck,
  Webhook,
} from 'lucide-react'
import { revealVariantNames } from './reveal'
import { Stagger, type StaggerOrder } from './stagger'
import { Replayable } from './story-kit'

const meta = {
  title: 'Motion/Stagger',
  component: Stagger,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Plays children in sequence with a stagger token step when the group enters view. `order`: `start`, `end`, `center` or `random` (seeded, so server and client agree). `Reveal` children keep their own variant and add their own `delay`; any other child is wrapped in a `Reveal` of the group `variant` (tag via `itemAs`). Reduced motion shows everything at once.',
      },
    },
  },
  args: {
    order: 'start',
    step: 'base',
    variant: 'rise',
    delay: 0,
    inView: true,
    seed: 1,
  },
  argTypes: {
    order: { control: 'inline-radio', options: ['start', 'end', 'center', 'random'] },
    step: { control: 'inline-radio', options: ['tight', 'base', 'loose'] },
    variant: { control: 'select', options: revealVariantNames },
    inView: { control: 'boolean' },
    as: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Stagger>

export default meta
type Story = StoryObj<typeof meta>

const INTEGRATIONS = [
  { name: 'GitHub', desc: 'Deploy on push', icon: GitMerge, on: true },
  { name: 'Postgres', desc: 'Branch per preview', icon: Database, on: true },
  { name: 'Webhooks', desc: 'Signed events', icon: Webhook },
  { name: 'Slack', desc: 'Deploy notifications', icon: MessageSquare, on: true },
  { name: 'Edge Config', desc: 'Read at the edge', icon: Cloud },
  { name: 'Analytics', desc: 'Core web vitals', icon: ChartLine },
  { name: 'Secrets', desc: 'Encrypted env vars', icon: KeyRound, on: true },
  { name: 'Firewall', desc: 'Managed rules', icon: ShieldCheck },
  { name: 'Resend', desc: 'Transactional email', icon: Mail },
  { name: 'Realtime', desc: 'Presence channels', icon: Radio },
  { name: 'Git branches', desc: 'Preview per branch', icon: GitBranch },
  { name: 'Blocks', desc: 'Starter templates', icon: Blocks },
]

export const Hero: Story = {
  parameters: { layout: 'fullscreen' },
  args: { order: 'center', inView: false },
  render: (args) => (
    <Replayable className="flex min-h-screen items-center justify-center p-8">
      <div className="w-[min(880px,92vw)]">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-fg">Integrations</h2>
            <p className="mt-1 text-sm text-fg-muted">Connect the services your project already uses.</p>
          </div>
          <span className="text-xs text-fg-subtle">4 connected</span>
        </div>
        <Stagger {...args} className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {INTEGRATIONS.map(({ name, desc, icon: Icon, on }) => (
            <div key={name} className="flex h-full flex-col gap-4 rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-lg border border-line bg-well text-fg">
                  <Icon aria-hidden className="size-4" strokeWidth={1.75} />
                </span>
                {on && <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-[11px] font-medium text-accent">Connected</span>}
              </div>
              <div>
                <p className="text-sm font-medium text-fg">{name}</p>
                <p className="text-xs text-fg-muted">{desc}</p>
              </div>
            </div>
          ))}
        </Stagger>
      </div>
    </Replayable>
  ),
}

function OrderGrid({ order }: { order: StaggerOrder }) {
  return (
    <figure className="flex flex-col items-center gap-3">
      <Stagger order={order} step="base" variant="scale" inView={false} className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} className="size-7 rounded-md bg-accent" />
        ))}
      </Stagger>
      <figcaption className="font-mono text-xs text-fg-muted">{order}</figcaption>
    </figure>
  )
}

/** The same 25 tiles in each order. Center ripples out from the middle of the sequence. */
export const Orders: Story = {
  render: () => (
    <Replayable className="pt-12">
      <div className="flex flex-wrap justify-center gap-10">
        {(['start', 'end', 'center', 'random'] as const).map((o) => (
          <OrderGrid key={o} order={o} />
        ))}
      </div>
    </Replayable>
  ),
}

/** Semantic lists: `as="ul"` with `itemAs="li"` wraps each child in an animated `li`. */
export const List: Story = {
  args: { as: 'ul', itemAs: 'li', inView: false, step: 'tight', variant: 'fade' },
  render: (args) => (
    <Replayable className="w-80 pt-12">
      <Stagger {...args} className="divide-y divide-line rounded-xl border border-line bg-surface">
        {['Build started', 'Installed 312 packages', 'Compiled 48 routes', 'Uploaded 1.4 MB', 'Assigned domain'].map((s) => (
          <span key={s} className="block px-4 py-2.5 text-sm text-fg-muted">
            {s}
          </span>
        ))}
      </Stagger>
    </Replayable>
  ),
}

export const ReducedMotion: Story = {
  ...Hero,
  globals: { reducedMotion: 'always' },
}
