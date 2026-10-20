import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CompoundProjection } from './compound-projection'

const meta: Meta<typeof CompoundProjection> = {
  title: 'Blocks/App/Compound Projection',
  component: CompoundProjection,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See what a steady addition grows into: a monthly amount, a number of years and a yearly rate drive rising bars and the total at the end. The demo is a savings plan; stories show a newsletter’s subscribers and a forest’s captured carbon.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof CompoundProjection>

export const Default: Story = { name: 'Savings plan' }

/** Many years group into at most ten bars, always ending on the last year. */
export const ThirtyYears: Story = { name: 'Thirty years', args: { defaultPlan: { monthly: 400, years: 30, rate: 0.05 } } }

/** Another currency and locale, and a starting amount of your own. */
export const WithYourData: Story = { name: 'With your data', args: { locale: 'de-DE', copy: { currency: 'EUR' }, initial: 10000 } }

const count = new Intl.NumberFormat('en', { maximumFractionDigits: 0 })

/** A newsletter: 1,800 readers today, 1,200 new ones a month from campaigns, and the list growing 6% a year on referrals. Totals are people, not money. */
export const SubscriberGrowth: Story = {
  name: 'Subscriber growth',
  args: {
    initial: 1800,
    defaultPlan: { monthly: 1200, years: 5, rate: 0.06 },
    rates: [0.03, 0.06, 0.09, 0.12],
    format: (value: number) => `${count.format(Math.round(value))} readers`,
    copy: {
      title: 'Subscriber growth',
      rateBadge: (rate: string) => `${rate} a year on referrals`,
      split: (added: string, gain: string) => `${added} from sign-ups, ${gain} from referrals`,
      yearsValue: (years: number) => `${years} ${years === 1 ? 'year' : 'years'}`,
      start: 'Save as the goal',
      starting: 'Saving…',
      started: 'Goal saved',
      disclaimer: 'A projection from today’s sign-up rate. Open rates and unsubscribes will move it.',
      contribution: 'New readers a month',
      rate: 'Referral growth a year',
      years: 'Years',
      today: 'Today',
      bars: 'Projected readers by year',
      bar: (year: string, total: string, added: string) => `${year}: ${total}, ${added} from sign-ups`,
      emptyTitle: 'Nothing to project yet',
      emptyDescription: 'Pick a number of years to see the readers.',
    },
    onStart: fn(),
  },
}

const tonnes = new Intl.NumberFormat('en', { maximumFractionDigits: 0 })

/** A reforestation project: 300 t of CO₂ captured today, 50 t more each month from new planting, and 4% a year coming up by itself. Totals and the monthly input are both tonnes. */
export const ForestGrowth: Story = {
  name: 'Forest growth',
  args: {
    initial: 300,
    defaultPlan: { monthly: 50, years: 10, rate: 0.04 },
    rates: [0.02, 0.04, 0.06, 0.08],
    format: (value: number) => `${tonnes.format(Math.round(value))} t CO₂`,
    copy: {
      title: 'Forest growth',
      rateBadge: (rate: string) => `${rate} natural regrowth`,
      split: (planted: string, regrown: string) => `${planted} from planting, ${regrown} from regrowth`,
      start: 'Start planting',
      starting: 'Starting…',
      started: 'Planting started',
      disclaimer: 'Estimates assume steady survival and average tree size. Real capture varies by species and weather.',
      contribution: 'New capture a month (t CO₂)',
      rate: 'Natural regrowth a year',
      years: 'Years',
      today: 'Today',
      year: (year: string) => `In ${year} years`,
      bars: 'Projected CO₂ captured by year',
      bar: (year: string, total: string, planted: string) => `${year}: ${total}, ${planted} from planting`,
    },
    onStart: fn(),
  },
}

/** While your data loads, the figures, bars and fields are skeletons at their own size. */
export const Loading: Story = { args: { loading: true } }

/** Nothing to project (no years): the message takes the bars’ place, at the card’s size. */
export const Empty: Story = { args: { defaultPlan: { monthly: 250, years: 0, rate: 0.07 } } }

/** A failed request: the figures show a dash and Retry sits where the bars are. */
export const Error: Story = { args: { error: 'Couldn’t load the plan.', onRetry: fn() } }

/** The standalone card: its own page and an h1. */
export const Standalone: Story = { args: { embedded: false } }
