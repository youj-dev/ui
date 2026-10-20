import type { Meta, StoryObj } from '@storybook/react-vite'
import { RunningTotal } from './running-total'

const meta: Meta<typeof RunningTotal> = {
  title: 'Blocks/App/Running Total',
  component: RunningTotal,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A total as it builds up against the period before: both running totals by day number, the gap between them washed, each line ending in its value, a note beside its point and the day it passed last period underneath.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof RunningTotal>

export const Default: Story = { name: 'Signups' }

/* A slower month than the one before: the wash turns to danger and the card says it has not passed yet. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    current: [40, 52, 47, 38, 41, 12, 9, 44, 39, 36, 42, 40, 10, 8, 35, 37, 41],
    previous: [55, 61, 58, 60, 57, 20, 18, 62, 64, 59, 61, 63, 21, 19, 60, 66, 62, 64, 58, 22, 20, 61, 65, 63, 60, 59, 24, 21, 62, 64],
    start: '2026-10-01',
    note: { date: '2026-10-08', text: 'Pricing change' },
    locale: 'fr-FR',
    copy: { title: 'Inscriptions', thisPeriod: 'Cette période', previousPeriod: 'Période précédente', vsPrevious: 'par rapport à la précédente', passed: 'A dépassé le total précédent', notYet: 'Pas encore', perDay: 'Par jour', bestDay: 'Meilleur jour' },
  },
}

export const Empty: Story = { args: { current: [] } }

/* A food bank's donations this month against last, in dollars, with the gala night marked. */
export const Fundraising: Story = {
  args: {
    current: [640, 420, 380, 910, 1250, 310, 260, 540, 480, 2150, 730, 590, 420],
    previous: [520, 480, 610, 390, 350, 260, 240, 580, 510, 470, 620, 430, 300, 280, 640, 590, 520, 480, 380, 310, 270, 610, 540, 500, 440, 360, 330, 720, 650, 980],
    start: '2026-10-01',
    format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    note: { date: '2026-10-10', text: 'Harvest gala' },
    copy: { title: 'Donations', subtitle: 'Harbor Light Food Bank', thisPeriod: 'This month', previousPeriod: 'Last month', vsPrevious: 'vs last month', chart: 'Donations, running total', empty: 'No donations this month', summary: (current, previous, days, passed) => `Donations total ${current} after ${days} days, against ${previous} at the same point last month.${passed ? ` They passed last month's total on ${passed}.` : ''} Use the left and right arrow keys to read each day.` },
  },
}

/* A walker's steps this month against last month. */
export const StepsThisMonth: Story = {
  name: 'Steps this month',
  args: {
    current: [8120, 9450, 7310, 10240, 6890, 12480, 5420, 8830, 9120, 7760, 10980, 8340, 9610],
    previous: [7210, 8040, 8830, 9120, 7420, 11200, 4980, 8110, 8650, 7790, 9340, 8020, 10520, 5870, 8460, 8890, 7940, 9660, 7230, 11840, 6120, 8330, 8780, 8090, 9210, 7630, 10970, 6440, 8520, 9030],
    start: '2026-10-01',
    note: { date: '2026-10-06', text: 'Trail hike' },
    copy: { title: 'Steps', subtitle: 'Watch and phone, all days', thisPeriod: 'This month', previousPeriod: 'Last month', vsPrevious: 'vs last month', chart: 'Steps, running total', empty: 'No steps this month', summary: (current, previous, days, passed) => `${current} steps after ${days} days, against ${previous} at the same point last month.${passed ? ` You passed last month's total on ${passed}.` : ''} Use the left and right arrow keys to read each day.` },
  },
}

export const Standalone: Story = { args: { embedded: false } }
