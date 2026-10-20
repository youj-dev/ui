import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MonthForecast } from './month-forecast'
import { cumulative, projectForecast } from './month-forecast/data'

const meta: Meta<typeof MonthForecast> = {
  title: 'Blocks/App/Month Forecast',
  component: MonthForecast,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See where a month’s running total is heading: the projection against a budget, its likely range, the day it crosses, and the parts it is made of, with your own scenarios to switch between. The demo is a cloud bill; stories show a home’s electricity and a support team’s tickets.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof MonthForecast>

export const Default: Story = { name: 'Cloud bill' }

/** The savings plan from the start: the forecast stays under the budget, so there is no crossing. */
export const SavingsPlan: Story = { name: 'Savings plan', args: { defaultScenario: 'savings' } }

/** A home’s electricity, 19 days into September: the bill in dollars, split by what draws the power, with off-peak charging as the other way the month could go. */
const POWER = cumulative([6, 6, 5, 5, 5, 7, 8, 6, 6, 5, 5, 7, 7, 6, 6, 5, 5, 7, 8])
export const ElectricityBill: Story = {
  name: 'Electricity bill',
  args: {
    actual: POWER,
    scenarios: [
      { id: 'pace', label: 'At this pace' },
      { id: 'offpeak', label: 'With off-peak' },
    ],
    forecasts: {
      // 71 more over 11 days, creeping up with the evening cooling.
      pace: projectForecast(POWER, (i) => [6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7][i]!, 11, 6),
      // The car charges after 9 pm: 61 more.
      offpeak: projectForecast(POWER, (i) => [6, 6, 6, 5, 5, 5, 5, 5, 5, 6, 7][i]!, 11, 6),
    },
    series: [
      { id: 'heating', name: 'heating', spent: 48, projected: { pace: 78, offpeak: 78 }, tone: 'chart-5' },
      { id: 'appliances', name: 'appliances', spent: 30, projected: { pace: 48, offpeak: 48 }, tone: 'chart-1' },
      { id: 'ev', name: 'ev-charging', spent: 37, projected: { pace: 60, offpeak: 50 }, tone: 'chart-3' },
    ],
    budget: 180,
    budgets: [150, 165, 180, 200],
    max: 240,
    copy: {
      title: 'Electricity',
      exportCsv: 'Export readings',
      viewDetails: 'View statements',
      chart: 'Electricity bill forecast for September',
      breakdown: 'By use',
      burn: 'Daily cost',
      updated: 'Forecast updated 06:00',
      emptyTitle: 'No readings for this period yet',
      emptyDescription: 'The forecast appears once the first day’s reading is in.',
    },
    onSetAlert: fn(),
  },
}

/** A support team’s month, in tickets against what the team can handle: the format writes every figure as a plain count, and self-serve answers are the other way the month could go. */
const TICKETS = cumulative([31, 34, 29, 33, 12, 10, 32, 36, 30, 28, 33, 13, 11, 35, 31, 32, 29, 34, 14])
export const SupportTickets: Story = {
  name: 'Support tickets',
  args: {
    actual: TICKETS,
    format: (value: number) => String(Math.round(value)),
    scenarios: [
      { id: 'pace', label: 'At this pace' },
      { id: 'selfserve', label: 'With self-serve' },
    ],
    forecasts: {
      // 290 more: weekdays hold at about 32, weekends near 12.
      pace: projectForecast(TICKETS, (i) => [11, 32, 33, 30, 31, 34, 13, 10, 31, 33, 32][i]!, 11, 30),
      // The help center deflects about a quarter: 205 more.
      selfserve: projectForecast(TICKETS, (i) => [9, 22, 23, 21, 22, 24, 10, 8, 21, 23, 22][i]!, 11, 30),
    },
    series: [
      { id: 'email', name: 'email', spent: 214, projected: { pace: 335, selfserve: 294 }, tone: 'chart-5' },
      { id: 'chat', name: 'chat', spent: 158, projected: { pace: 246, selfserve: 218 }, tone: 'chart-1' },
      { id: 'phone', name: 'phone', spent: 96, projected: { pace: 149, selfserve: 141 }, tone: 'chart-3' },
      { id: 'social', name: 'social', spent: 39, projected: { pace: 67, selfserve: 59 }, tone: 'chart-4' },
    ],
    budget: 750,
    budgets: [650, 700, 750, 800],
    max: 900,
    copy: {
      title: 'Support load',
      exportCsv: 'Export tickets',
      viewDetails: 'View queue',
      projected: 'Projected tickets by month end',
      spent: 'Received so far',
      budget: 'Capacity',
      burn: 'Tickets a day',
      over: (amount: string) => `${amount} over capacity`,
      under: (amount: string) => `${amount} under capacity`,
      seriesRow: (name: string, spent: string, projected: string) => `${name}: ${spent} tickets so far, ${projected} projected`,
      chart: 'Support ticket forecast for September',
      breakdown: 'By channel',
      budgetMenu: 'Monthly capacity',
      adjust: 'Adjust capacity',
      setAlert: 'Set alert',
      updated: 'Forecast updated 06:00',
      emptyTitle: 'No tickets this period yet',
      emptyDescription: 'The forecast appears once the first ticket is in.',
    },
  },
}

/** While your data loads, the figures, chart and bars are skeletons at their own size. */
export const Loading: Story = { args: { loading: true } }

/** No data for the period: the message takes the chart’s place, at the card’s size. */
export const Empty: Story = { args: { actual: [], series: [] } }

/** A failed request: the figures show a dash and Retry sits where the chart is. */
export const Error: Story = { args: { error: 'We couldn’t load this month’s forecast.', onRetry: fn() } }
