import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { StepTracker } from './step-tracker'
import { ITEMS } from './step-tracker/data'
import { LOAN_COPY, LOAN_ITEMS, LOAN_STAGES } from './step-tracker/loan'
import { VISA_COPY, VISA_ITEMS, VISA_STAGES } from './step-tracker/visa'

const meta: Meta<typeof StepTracker> = {
  title: 'Blocks/App/Step Tracker',
  component: StepTracker,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card', preset: 'basalt', address: 'dashboard.acme.shop/orders/shipments' },
    docs: {
      description: {
        component:
          'Follow anything that moves through a run of stages, replayed live on one rail with the time and place of every scan: a parcel, a loan, a visa. A stage that needed a second try takes the retry loop; one that failed ends the road and the rest is skipped. Pick any stage for its scan, place, attempts and facts; switch items from the tabs or replay one. Under reduced motion each road is shown finished.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof StepTracker>

export const Default: Story = { name: 'Parcel tracking' }

/** Delivered on the first attempt, two days after the order. (Stories are named so the hero sorts first: the docs render the first.) */
export const StraightThrough: Story = {
  args: { defaultItem: ITEMS[1]!.id },
}

/** Refused at customs: the parcel goes back to the sender and the rest of the road never happens. */
export const ReturnedToSender: Story = {
  args: { defaultItem: ITEMS[2]!.id },
}

/** Finance: five stages from submitted to funded, departments for places, and a review that sends the applicant back for a paystub. */
export const LoanApplication: Story = {
  name: 'Loan application',
  args: { stages: LOAN_STAGES, items: LOAN_ITEMS, copy: LOAN_COPY, onNotify: fn() },
}

/** Government: five stages from filed to passport returned; one case is refused at the decision and the passport comes back unstamped. */
export const VisaApplication: Story = {
  name: 'Visa application',
  args: { stages: VISA_STAGES, items: VISA_ITEMS, copy: VISA_COPY, defaultItem: VISA_ITEMS[1]!.id, onNotify: fn() },
}

/** Skeletons in the shape of the card while the data loads; the footer's figures wait too. */
export const Loading: Story = { args: { loading: true } }

/** The load failed: the message and Retry in the room the road takes. */
export const Error: Story = { args: { error: 'Couldn’t reach the carrier. Check your connection and try again.', onRetry: fn() } }

/** No items yet: the kit's empty state in the same room. */
export const Empty: Story = { args: { items: [] } }

/** `embedded={false}`: its own page, centered, with the h1. */
export const Standalone: Story = { args: { embedded: false } }
