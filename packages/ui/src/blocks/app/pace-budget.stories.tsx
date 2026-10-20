import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PaceBudget } from './pace-budget'

const meta: Meta<typeof PaceBudget> = {
  title: 'Blocks/App/Pace Budget',
  component: PaceBudget,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card', preset: 'basalt', address: 'app.ledgerly.com/budget/september' },
    docs: {
      description: {
        component:
          'See where a period’s budget went, the day it runs out at the current pace, and a plan that frees some of it step by step. The demo is a household’s month; stories show a team’s marketing budget and a week of calories.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof PaceBudget>

export const Default: Story = { name: 'Household spending' }

/** Nothing switched on yet: the plan waits for a choice, and Apply stays disabled. */
export const NothingSelected: Story = {
  name: 'Nothing selected',
  args: {
    steps: [
      {
        id: 'phone',
        title: 'Switch to the 15 GB phone plan',
        detail: 'You used 9 GB a month on average since spring. Takes effect today.',
        frees: 24,
        category: 'phone',
      },
    ],
  },
}

/** A team’s October, 19 days in: $51,000 of $60,000 used, so it runs out on the 25th at $1,400 a day. The plan is three cuts. */
export const MarketingBudget: Story = {
  name: 'Marketing budget',
  parameters: { showcase: { kind: 'card', preset: 'basalt', address: 'app.ledgerly.com/budget/q4-marketing' } },
  args: {
    budget: 60000,
    pace: 1400,
    period: { year: 2026, month: 9, today: 19, days: 31 },
    categories: [
      { id: 'ads', name: 'Paid ads', used: 26500, tone: 'chart-1' },
      { id: 'events', name: 'Events', used: 11900, tone: 'chart-2' },
      { id: 'content', name: 'Content', used: 8100, tone: 'chart-3' },
      { id: 'tools', name: 'Tools', used: 4500, tone: 'chart-4' },
    ],
    steps: [
      {
        id: 'ads',
        title: 'Pause the two lowest-return ad sets',
        detail: 'Both have cost more than they returned for 30 days.',
        frees: 1800,
        category: 'ads',
        planned: true,
      },
      {
        id: 'events',
        title: 'Move the November meetup online',
        detail: 'Drops the venue and catering; the talks stay.',
        frees: 2400,
        category: 'events',
        planned: true,
      },
      {
        id: 'tools',
        title: 'Drop the four unused design seats',
        detail: 'None opened since July. Ends with this billing cycle.',
        frees: 360,
        category: 'tools',
      },
    ],
    copy: {
      title: 'Marketing budget',
      subtitle: 'October · Growth team',
      meter: 'Budget used',
      mapLabel: 'Marketing spend by channel',
      used: 'Used',
      exportCsv: 'Export spend',
      plan: 'Cuts',
      nothingLeft: 'Nothing left to cut this month.',
      apply: 'Apply cuts',
      applied: (amount: string) => `Freed ${amount}`,
      emptyTitle: 'No spend yet',
      emptyDescription: 'Channels appear as the first invoices land.',
    },
    onApply: fn(),
  },
}

/** A week of calories against a 14,700 target, on Thursday: 8,300 eaten, so the target runs out on Saturday at 2,150 a day. The plan is three swaps. */
export const CalorieBudget: Story = {
  name: 'Calorie budget',
  parameters: { showcase: { kind: 'card', preset: 'basalt', address: 'app.ledgerly.com/budget/week-38' } },
  args: {
    budget: 14700,
    pace: 2150,
    period: { year: 2026, month: 8, today: 17, days: 20 },
    format: (value: number) => `${Math.round(value).toLocaleString('en')} kcal`,
    categories: [
      { id: 'meals', name: 'Meals', used: 5150, tone: 'chart-2' },
      { id: 'snacks', name: 'Snacks', used: 1650, tone: 'chart-4' },
      { id: 'drinks', name: 'Drinks', used: 1500, tone: 'chart-3' },
    ],
    steps: [
      {
        id: 'soda',
        title: 'Swap soda for sparkling water',
        detail: 'A can a day is about 140 kcal, for the three days left.',
        frees: 420,
        category: 'drinks',
        planned: true,
      },
      {
        id: 'fruit',
        title: 'Pack fruit instead of the vending-machine snack',
        detail: 'Three afternoons, about 100 kcal less each.',
        frees: 300,
        category: 'snacks',
        planned: true,
      },
      {
        id: 'pasta',
        title: 'Halve the evening pasta portion',
        detail: 'About 190 kcal less on each of the next two evenings.',
        frees: 380,
        category: 'meals',
      },
    ],
    copy: {
      title: 'Calories',
      subtitle: 'Sep 14 – 20 · 2,100 a day',
      meter: 'Calories used',
      mapLabel: 'Calories by source',
      used: 'Eaten',
      lasts: 'Lasts the week',
      more: 'More calorie actions',
      editBudget: 'Edit target',
      exportCsv: 'Export food log',
      plan: 'Swaps',
      nothingLeft: 'No swaps left this week.',
      apply: 'Apply swaps',
      applied: (amount: string) => `Freed ${amount}`,
      emptyTitle: 'Nothing logged yet',
      emptyDescription: 'Meals, snacks and drinks appear as you log them.',
    },
    onApply: fn(),
  },
}

/** While your data loads, the figures, map and plan are skeletons at their own size. */
export const Loading: Story = { args: { loading: true } }

/** No categories: the message takes the map’s place, at the card’s size. */
export const Empty: Story = { args: { categories: [] } }

/** A failed request: the figures show a dash and Retry sits where the map is. */
export const Error: Story = { args: { error: 'Couldn’t load this month’s budget.', onRetry: fn() } }

/** The standalone card: its own page, an h1 and the plan an h2. */
export const Standalone: Story = { args: { embedded: false } }
