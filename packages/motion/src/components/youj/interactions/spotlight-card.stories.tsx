import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowUpRight, BarChart3, Database, GitBranch, MessageSquare, ShieldCheck, Webhook } from 'lucide-react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SpotlightCard, SpotlightGrid, type SpotlightGridProps } from './spotlight-card'

const meta: Meta<SpotlightGridProps> = {
  title: 'Motion/Interactions/SpotlightCard',
  component: SpotlightGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`SpotlightGrid` tracks the pointer once and gives every `SpotlightCard` the position in its own coordinates, so the hovered card gets a soft surface spotlight while neighbors light up along the edges nearest the cursor. The light is a radial blob moved with `transform`; the border glow is the same blob masked to a 1px ring. Keyboard focus parks the light on the focused card and glides it between cards. Reduced motion drops tracking: the hovered or focused card shows a static accent border.',
      },
    },
  },
  argTypes: { radius: { control: { type: 'range', min: 120, max: 480, step: 20 } } },
  args: { radius: 260 },
}
export default meta
type Story = StoryObj<SpotlightGridProps>

const INTEGRATIONS = [
  { icon: GitBranch, name: 'Git provider', body: 'Preview every branch. Status checks land on the pull request.', installed: true },
  { icon: MessageSquare, name: 'Chat alerts', body: 'Route deploy and incident alerts to the channel that owns them.', installed: true },
  { icon: Database, name: 'Postgres', body: 'Branch your database with every preview, seeded and isolated.', installed: false },
  { icon: BarChart3, name: 'Analytics', body: 'Core Web Vitals per route, per deploy, with regressions flagged.', installed: false },
  { icon: ShieldCheck, name: 'SSO', body: 'SAML and SCIM provisioning with role mapping from your IdP.', installed: false },
  { icon: Webhook, name: 'Webhooks', body: 'Signed events for deploys, domains and checks, retried for 24h.', installed: false },
]

function Integrations(props: SpotlightGridProps) {
  return (
    <div className="mx-auto w-full max-w-[960px] px-4 py-14 sm:px-8">
      <p className="font-mono text-xs tracking-wide text-fg-subtle uppercase">Marketplace</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg">Integrations</h2>
      <p className="mt-1 text-sm text-fg-muted">Connect the tools your team already uses.</p>
      <SpotlightGrid {...props} className="mt-8 grid-cols-1 gap-3 sm:grid-cols-3">
        {INTEGRATIONS.map(({ icon: Icon, name, body, installed }) => (
          <SpotlightCard key={name}>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="block h-full rounded-xl p-5 outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-start justify-between">
                <span className="grid size-9 place-items-center rounded-lg border border-line bg-well text-fg">
                  <Icon className="size-4" />
                </span>
                {installed ? (
                  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-fg-muted">Installed</span>
                ) : (
                  <ArrowUpRight className="size-4 text-fg-subtle" />
                )}
              </div>
              <h3 className="mt-5 text-sm font-medium text-fg">{name}</h3>
              <p className="mt-1 text-[13px] leading-5 text-fg-muted">{body}</p>
            </a>
          </SpotlightCard>
        ))}
      </SpotlightGrid>
    </div>
  )
}

/** An integrations marketplace. Move across the grid, or Tab through it. */
export const Hero: Story = {
  render: (args) => <Integrations {...args} />,
}

/** A single card works without a grid. */
export const Standalone: Story = {
  parameters: { layout: 'centered' },
  render: (args) => (
    <SpotlightCard radius={args.radius} className="w-80 p-6">
      <p className="font-mono text-xs text-fg-subtle">p95 latency</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-fg">
        82<span className="text-base font-normal text-fg-muted"> ms</span>
      </p>
      <p className="mt-1 text-sm text-success">−14% since last deploy</p>
    </SpotlightCard>
  ),
}

/** Reduced motion: no pointer tracking; hover or focus shows a static accent border. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <Integrations {...args} />
    </YoujProvider>
  ),
}
