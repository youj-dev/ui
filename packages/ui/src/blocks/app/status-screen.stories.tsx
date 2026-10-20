import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { basalt } from '@youj/core'
import { StatusScreen } from './status-screen'

const meta: Meta<typeof StatusScreen> = {
  title: 'Blocks/App/Status screen',
  component: StatusScreen,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: basalt },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', address: 'app.northwind.io' },
    docs: {
      description: {
        component:
          'Tell visitors why a page is out of reach, and what to do next: sign in, ask for access, wait while it retries, or wait while it loads, each beside a miniature that plays the state.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof StatusScreen>

/** 401: the page needs a signed-in visitor. A parcel locker waits for its code; Sign in sends them to your sign-in page, and the line under the buttons says where they come back to. */
export const Unauthorized: Story = { args: { status: '401' } }

/** The 401 without the miniature: the code set large over the text. */
export const UnauthorizedPlain: Story = { name: 'Unauthorized, plain', args: { status: '401', media: null } }

/** 403: signed in, but not allowed. The firewall is in lockdown; the page names the missing permission and the account that's signed in, and asks an admin for access through `onRequestAccess`. */
export const Forbidden: Story = { args: { status: '403' } }

/** The 403 without the miniature. */
export const ForbiddenPlain: Story = { name: 'Forbidden, plain', args: { status: '403', media: null } }

/** 503: temporarily unavailable. The server cabinet runs with two nodes down while the page retries on its own, waiting longer each time; Try now runs `onRetry` at once (the demo stays down so you see the schedule), with the status page one click away. */
export const ServiceUnavailable: Story = {
  name: 'Service unavailable',
  args: { status: '503' },
}

/** The 503 without the miniature. */
export const ServiceUnavailablePlain: Story = { name: 'Service unavailable, plain', args: { status: '503', media: null } }

/** The page that is still on its way: the hourglass turns while a polite live region and a sweeping bar say it's loading, until you give it a `progress`. Past `slowAfter` it offers a reload. */
export const Loading: Story = { args: { status: 'loading' } }

/** Loading without the miniature. */
export const LoadingPlain: Story = { name: 'Loading, plain', args: { status: 'loading', media: null } }

/** With a known `progress`, the sand and the bar follow it. */
export const LoadingWithProgress: Story = {
  name: 'Loading with progress',
  args: {
    status: 'loading',
    progress: 64,
    copy: {
      loadingTitle: 'Importing your contacts',
      loadingDescription: '3,840 of 6,000 contacts so far. You can leave this page; we’ll email you when it’s done.',
    },
  },
}

/** Your permission, account, links and strings, with the buttons wired to callbacks. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    status: '403',
    permission: 'invoices:export',
    account: 'sam@ledgerly.dev',
    homeHref: '/dashboard',
    signInHref: '/login?switch=1',
    copy: {
      forbiddenTitle: 'Exports are for finance admins',
      forbiddenDescription: 'Your role can view invoices but not export them. Ask a finance admin and we’ll let them know.',
      requestedHint: 'Sent to the finance admins. We’ll email you their answer.',
    },
    onRequestAccess: fn(),
  },
}
