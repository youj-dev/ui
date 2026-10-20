import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { LossWaterfall } from './loss-waterfall'

const meta: Meta<typeof LossWaterfall> = {
  title: 'Blocks/App/Loss Waterfall',
  component: LossWaterfall,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See where an amount went: an isometric waterfall from the start down through each loss to what is left, the biggest loss called out, and a row to look into the one you pick.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof LossWaterfall>

/** 71.4% from 490 planned minutes; slow cycles cost the most. */
export const Default: Story = { name: 'Machine efficiency' }

/** Another loss picked: its bar stays at full strength and the callout and the drill-in row follow. */
export const Picked: Story = { args: { defaultSelected: 'breakdowns' } }

/** Other data: a shorter day with three losses, a drop in efficiency, German words, and the picks in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    start: 420,
    change: -1.8,
    copy: { title: 'Effizienz', subtitle: 'Linie 5 · heute', loss: (label: string, minutes: string) => `${label} ${minutes} Min.`, callout: (minutes: string) => `−${minutes} Min.` },
    losses: [
      { id: 'a', label: 'Störungen', value: 52, tone: 'chart-4', drill: { title: 'Störungen an Presse 1', detail: '4 Stopps, längster 25 Min.' } },
      { id: 'b', label: 'Rüsten', value: 33, tone: 'chart-2', drill: { title: 'Rüsten auf Werkzeug C', detail: '33 Min. statt 25 Min.' } },
      { id: 'c', label: 'Ausschuss', value: 18, tone: 'chart-1' },
    ],
    onLossChange: fn(),
    onDrill: fn(),
  },
}

/** Finance: gross pay worn down by deductions to take-home pay, in dollars. `format` writes the amounts and the copy drops the minute unit. */
export const TakeHomePay: Story = {
  name: 'Take-home pay',
  args: {
    start: 6400,
    change: 1.2,
    format: (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n),
    copy: {
      title: 'Take-home pay',
      subtitle: 'October · gross to net',
      metric: 'Take-home',
      change: (points: string) => `${points} pts vs September`,
      drawingLabel: (start: string, steps: string, result: string, percent: string) => `Gross pay ${start}, less ${steps}, leaves ${result}: ${percent} take-home`,
      loss: (label: string, value: string) => `${label} ${value}`,
      callout: (value: string) => `−${value}`,
      legendLabel: 'Deductions',
    },
    losses: [
      { id: 'tax', label: 'Tax', value: 1180, tone: 'chart-4', drill: { title: 'Federal and state tax', detail: '18.4% of gross' } },
      { id: 'pension', label: 'Pension', value: 384, tone: 'chart-2', drill: { title: '401(k) contribution', detail: '6% with a 3% match' } },
      { id: 'health', label: 'Health', value: 312, tone: 'chart-1', drill: { title: 'Family health plan', detail: 'Renews January 1' } },
      { id: 'transit', label: 'Transit', value: 96, tone: 'chart-3' },
    ],
    onLossChange: fn(),
    onDrill: fn(),
  },
}

/** Marketing: visitors worn down by each step's drop-off to the people who sign up. The amounts are plain counts. */
export const SignupFunnel: Story = {
  name: 'Signup funnel',
  args: {
    start: 12400,
    change: 0.6,
    copy: {
      title: 'Signup funnel',
      subtitle: 'Last 30 days · visitors to signups',
      metric: 'Conversion',
      change: (points: string) => `${points} pts vs last month`,
      drawingLabel: (start: string, steps: string, result: string, percent: string) => `${start} visitors, less ${steps}, leaves ${result} signups: ${percent} conversion`,
      loss: (label: string, value: string) => `${label} ${value} lost`,
      callout: (value: string) => `−${value}`,
      legendLabel: 'Drop-offs',
    },
    losses: [
      { id: 'bounce', label: 'Left the page', value: 6200, tone: 'chart-5', drill: { title: 'Left the landing page', detail: '50% of visitors, mostly on mobile' } },
      { id: 'pricing', label: 'Pricing', value: 2900, tone: 'chart-4', drill: { title: 'Dropped at pricing', detail: '47% of those who looked' } },
      { id: 'form', label: 'Signup form', value: 1750, tone: 'chart-2', drill: { title: 'Abandoned the form', detail: 'Most at the password step' } },
      { id: 'verify', label: 'Email check', value: 560, tone: 'chart-1' },
    ],
    onLossChange: fn(),
    onDrill: fn(),
  },
}

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
