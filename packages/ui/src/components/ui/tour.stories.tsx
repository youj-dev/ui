import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { BellIcon, DownloadIcon, FilterIcon, HomeIcon, PlusIcon, SearchIcon, SettingsIcon, UsersIcon } from '@youj/icons'
import { YoujProvider } from '@youj/core'
import { Badge } from './badge'
import { Button } from './button'
import { Input } from './input'
import { Tour, TourBeacon, type TourProps, type TourStep } from './tour'

const meta: Meta<typeof Tour> = {
  title: 'UI/Overlays/Tour',
  component: Tour,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Guided coach-marks: a dim scrim with a rounded cut-out over one element at a time and a card beside it with the step’s title and text, the count (“2 of 5”, and dots), Back / Next / Done and Skip. Between steps the cut-out glides to the next target on the smooth spring and follows it while the page scrolls it into view; the card is a popover anchored to the target, so it flips to stay on screen. Steps are `{ target, title, body, placement, action }`, the target a selector or a ref; one that isn’t on the page is skipped. `open`/`step` can be controlled, `onComplete` and `onSkip` tell you how it ended, `allowInteraction` lets clicks reach the spotlighted element, and `dismissible={false}` takes away Skip and Escape. TourBeacon is the small pulsing dot that starts a tour or marks something new. Reduced motion: the cut-out moves at once and only the card’s text fades.',
      },
    },
  },
  args: { allowInteraction: false, dismissible: true, spotlightPadding: 6 },
  argTypes: {
    spotlightPadding: { control: { type: 'range', min: 0, max: 16, step: 1 } },
    steps: { control: false },
  },
}
export default meta
type Story = StoryObj<typeof Tour>

const nav = [
  { icon: HomeIcon, label: 'Overview' },
  { icon: UsersIcon, label: 'Customers' },
  { icon: SettingsIcon, label: 'Settings' },
]

const kpis = [
  { label: 'Revenue', value: '$48.2k', delta: '+12%' },
  { label: 'Orders', value: '1,284', delta: '+4%' },
  { label: 'Refunds', value: '23', delta: '−8%' },
]

/** A small analytics app with the targets the tours point at (ids prefixed by `id`). */
function Dashboard({ id, onStart, beacon }: { id: string; onStart?: () => void; beacon?: React.ReactNode }) {
  return (
    <div className="flex min-h-[560px] w-full bg-canvas text-fg">
      <aside id={`${id}-nav`} className="hidden w-48 shrink-0 flex-col gap-1 border-e border-line bg-surface p-3 sm:flex">
        <div className="mb-3 px-2 text-ui-lg font-semibold">Northwind</div>
        {nav.map(({ icon: Icon, label }, i) => (
          <a
            key={label}
            href="#nav"
            aria-current={i === 0 ? 'page' : undefined}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-ui text-fg-muted aria-[current=page]:bg-selected aria-[current=page]:text-fg"
          >
            <Icon className="size-4" />
            {label}
          </a>
        ))}
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-5 p-5">
        <header className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Overview</h1>
          <div className="ms-auto flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
              <Input id={`${id}-search`} className="w-48 ps-8" placeholder="Search orders" aria-label="Search orders" />
            </div>
            <span className="relative">
              <Button id={`${id}-alerts`} variant="outline" size="icon" aria-label="Notifications">
                <BellIcon />
              </Button>
              {beacon && <span className="absolute -end-2 -top-3">{beacon}</span>}
            </span>
            {onStart && (
              <Button variant="secondary" onClick={onStart}>
                Take the tour
              </Button>
            )}
          </div>
        </header>
        <section id={`${id}-kpis`} className="grid grid-cols-3 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-line bg-surface p-4">
              <div className="text-ui-sm text-fg-muted">{k.label}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{k.value}</div>
              <Badge variant="outline" className="mt-2">
                {k.delta}
              </Badge>
            </div>
          ))}
        </section>
        <section className="flex flex-1 flex-col gap-3 rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Recent orders</h2>
            <Button id={`${id}-filter`} variant="ghost" size="sm" className="ms-auto">
              <FilterIcon />
              Filter
            </Button>
            <Button id={`${id}-export`} variant="outline" size="sm">
              <DownloadIcon />
              Export
            </Button>
          </div>
          {['#4821 · Ada Lovelace · $320', '#4820 · Grace Hopper · $86', '#4819 · Alan Turing · $1,240'].map((row) => (
            <div key={row} className="border-t border-line-subtle pt-3 text-ui text-fg-muted">
              {row}
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}

const dashboardSteps = (id: string): TourStep[] => [
  { target: `#${id}-nav`, title: 'Everything in one place', body: 'Your overview, customers and settings live in the sidebar.', placement: 'inline-end' },
  { target: `#${id}-search`, title: 'Find any order', body: 'Search by number, customer or amount. Press / from anywhere to jump here.' },
  { target: `#${id}-kpis`, title: 'Today at a glance', body: 'Revenue, orders and refunds against the same day last week.' },
  { target: `#${id}-filter`, title: 'Narrow the list', body: 'Filter by status, channel or date range.', placement: 'top' },
  { target: `#${id}-export`, title: 'Take it with you', body: 'Export the orders you see as CSV for your books.', placement: 'top' },
]

function DashboardTour({ id, ...props }: Partial<TourProps> & { id: string }) {
  const [open, setOpen] = useState(true)
  const [ended, setEnded] = useState('')
  return (
    <div className="relative">
      <Dashboard
        id={id}
        onStart={() => {
          setEnded('')
          setOpen(true)
        }}
      />
      <Tour
        steps={dashboardSteps(id)}
        {...props}
        open={open}
        onOpenChange={setOpen}
        onComplete={() => setEnded('Tour completed')}
        onSkip={(step) => setEnded(`Skipped at step ${step + 1}`)}
      />
      {ended && <p className="absolute bottom-3 start-5 text-ui-sm text-fg-muted">{ended}</p>}
    </div>
  )
}

/** Every prop on the controls, over a small dashboard. Next, Back, the arrow keys and Escape all work; Take the tour starts it again. */
export const Playground: Story = {
  render: (args) => <DashboardTour id="play" {...args} />,
}

/** A first-run tour of an analytics dashboard: five targets, from the sidebar to Export, with the cut-out gliding between them. */
export const OnboardingADashboard: Story = {
  name: 'Onboarding a dashboard',
  render: () => <DashboardTour id="onboard" />,
}

/** A beacon on a new control: clicking it runs a one-step tour about it, with clicks allowed through to the control. The beacon goes once it has been seen. */
export const NewFeatureBeacon: Story = {
  name: 'New feature beacon',
  render: function NewFeature() {
    const [open, setOpen] = useState(false)
    const [seen, setSeen] = useState(false)
    return (
      <>
        <Dashboard id="beacon" beacon={seen ? null : <TourBeacon label="What’s new: notifications" onClick={() => setOpen(true)} />} />
        <Tour
          steps={[
            {
              target: '#beacon-alerts',
              title: 'New: notifications',
              body: 'Get told when an order is refunded or a payout lands. Click the bell to try it.',
              action: (
                <Button variant="link" size="sm" className="h-auto px-0">
                  Choose what you hear about
                </Button>
              ),
            },
          ]}
          open={open}
          onOpenChange={setOpen}
          onComplete={() => setSeen(true)}
          onSkip={() => setSeen(true)}
          allowInteraction
        />
      </>
    )
  },
}

const sections = ['Profile', 'Workspace', 'Members', 'Billing', 'Integrations', 'Danger zone']

/** A settings page taller than the screen: each step scrolls its section into view and the cut-out follows it as it moves. */
export const LongPageWithScrolling: Story = {
  name: 'Long page with scrolling',
  render: function LongPage() {
    const [open, setOpen] = useState(true)
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 bg-canvas p-6 text-fg">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">Settings</h1>
          <Button className="ms-auto" variant="secondary" onClick={() => setOpen(true)}>
            Take the tour
          </Button>
        </div>
        {sections.map((name) => (
          <section key={name} id={`long-${name.toLowerCase().replace(' ', '-')}`} className="flex h-72 flex-col gap-2 rounded-xl border border-line bg-surface p-5">
            <h2 className="font-semibold">{name}</h2>
            <p className="text-ui text-fg-muted">Settings for {name.toLowerCase()}.</p>
            <Button variant="outline" size="sm" className="mt-auto self-start">
              <PlusIcon />
              Edit {name.toLowerCase()}
            </Button>
          </section>
        ))}
        <Tour
          open={open}
          onOpenChange={setOpen}
          steps={[
            { target: '#long-profile', title: 'Your profile', body: 'Your name and photo, as your team sees them.' },
            { target: '#long-members', title: 'Invite your team', body: 'Add people and choose what each of them can change.', placement: 'top' },
            { target: '#long-integrations', title: 'Connect your tools', body: 'Slack, GitHub and your calendar, in one click each.', placement: 'top' },
            { target: '#long-danger-zone', title: 'Careful here', body: 'Deleting the workspace removes everything in it, for everyone.', placement: 'top' },
          ]}
        />
      </div>
    )
  },
}

/** Reduced motion, forced by a provider: the cut-out jumps to each target and the scroll is instant; only the card’s text fades. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  render: () => (
    <YoujProvider reducedMotion="always">
      <DashboardTour id="reduced" />
    </YoujProvider>
  ),
}
