import type { Meta, StoryObj } from '@storybook/react-vite'
import { basalt } from '@youj/core'
import { RequestTracking } from './request-tracking'

const meta: Meta<typeof RequestTracking> = {
  title: 'Blocks/App/Request tracking',
  component: RequestTracking,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: basalt },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', address: 'shop.northwind.io/track' },
    docs: {
      description: {
        component:
          'Let people look up an order, request or incident by its reference and see where it stands, step by step, with when each step happened and what comes next.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof RequestTracking>

/** An order being packed: the packaging line beside it fills its pallet with the steps done, and wraps it once the order is delivered. */
export const Default: Story = {}

/** The same order without the miniature. */
export const Plain: Story = { args: { media: null } }

/** The bare lookup, before anything is tracked: the line runs on its own. The demo finds any reference like `ORD-1001` and says so for the rest. */
export const Lookup: Story = { args: { result: null, defaultReference: '' } }

const T = Date.UTC(2026, 9, 7, 14, 2)
const MIN = 60_000

/** An incident for a customer: its own steps, a stopped step, a time zone, and no miniature. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    media: null,
    timeZone: 'America/New_York',
    copy: {
      title: 'Follow an incident',
      description: 'Enter the incident ID from our email to see where the fix stands.',
      referenceLabel: 'Incident ID',
      placeholder: 'INC-2041',
      referenceHint: 'The incident ID is in the email we sent you.',
      resultLabel: (reference) => `Incident ${reference}`,
    },
    result: {
      reference: 'INC-2041',
      title: 'Webhook deliveries delayed',
      status: 'Identified',
      tone: 'warning',
      eta: T + 90 * MIN,
      steps: [
        { title: 'Detected', detail: 'Delivery lag rose above 5 minutes in eu-west.', at: T, state: 'done' },
        { title: 'Retry queue paused', detail: 'A failed deploy was rolled back.', at: T + 18 * MIN, state: 'failed' },
        { title: 'Fix rolling out', detail: 'Queue workers restart region by region.', at: T + 41 * MIN, state: 'current' },
        { title: 'Backlog replayed', detail: 'Held events are delivered in order.', at: T + 90 * MIN, state: 'upcoming' },
        { title: 'Review published', state: 'upcoming' },
      ],
    },
  },
}
