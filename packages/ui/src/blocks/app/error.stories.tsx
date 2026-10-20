import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ErrorScreen } from './error'

const meta: Meta<typeof ErrorScreen> = {
  title: 'Blocks/App/Error',
  component: ErrorScreen,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', preset: 'graphite', address: 'app.northwind.io' },
    docs: {
      description: {
        component: 'Give your users a way forward when your app cannot load a page, beside a miniature that plays what is happening.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ErrorScreen>

/** 500: the mainframe stands in machine check. Try again resets it and feeds its cards; it runs again when `onRetry` resolves. */
export const ServerError: Story = {}

/** The 500 without the miniature: the code rises over a field of interference. */
export const ServerErrorPlain: Story = { name: 'Server error, plain', args: { media: null } }

/** A planned window: the repair bench's checklist lights up as the time passes, and its beacon turns green when the window ends. */
export const Maintenance: Story = {
  args: { variant: 'maintenance' },
}

/** Maintenance without the miniature, over a slow dot-matrix wave. */
export const MaintenancePlain: Story = { name: 'Maintenance, plain', args: { variant: 'maintenance', media: null } }

/** The page before you open: the time left rolls down to the launch while the drone charges on its pad, with a way in for early-access codes. The demo accepts `EARLY`. */
export const LaunchCountdown: Story = {
  args: { variant: 'launch' },
}

/** The launch countdown without the miniature, under a slow aurora. */
export const LaunchCountdownPlain: Story = { name: 'Launch countdown, plain', args: { variant: 'launch', media: null } }

/** Your services, links and strings, with the retry wired to `onRetry`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    incidentId: 'req_51Kq0dPz',
    services: [
      { name: 'Checkout', state: 'outage' },
      { name: 'Payouts', state: 'degraded' },
      { name: 'Card issuing', state: 'operational' },
    ],
    statusHref: 'https://status.ledgerly.dev',
    supportHref: 'mailto:support@ledgerly.dev',
    copy: {
      serverTitle: 'Payments are taking a moment',
      serverDescription: 'Ledgerly couldn’t reach the payments service. No charge was made; try again in a few seconds.',
      updated: 'Updated just now',
    },
    onRetry: fn(),
  },
}

/** At zero: the badge turns to “We’re live”, the digits settle and the drone takes off. */
export const Launched: Story = {
  args: { variant: 'launch', launchAt: '2026-01-01T00:00:00Z' },
}
