import type { Meta, StoryObj } from '@storybook/react-vite'
import { DailyBars, type DailyBarsDay } from './daily-bars'

const meta: Meta<typeof DailyBars> = {
  title: 'Blocks/App/Daily Bars',
  component: DailyBars,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A period read day by day: the total with its change, a bar per day with the busiest lit, the average as a dashed line, notes as callouts and the top, average and quietest days underneath. Point at a day or use the arrow keys.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DailyBars>

export const Default: Story = { name: 'Daily visits' }

/* Two weeks of a shop's orders, in German, with a note on each of two days. */
const DAYS: DailyBarsDay[] = [48, 52, 47, 61, 58, 22, 19, 55, 63, 188, 71, 66, 24, 21].map((value, i) => ({ date: `2026-10-${String(i + 1).padStart(2, '0')}`, value }))

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    days: DAYS,
    previousTotal: 640,
    locale: 'de-DE',
    notes: [
      { date: '2026-10-10', text: 'Herbstverkauf' },
      { date: '2026-10-06', text: 'Newsletter' },
    ],
    copy: { title: 'Bestellungen pro Tag', subtitle: 'bergwerk.example', vsPrevious: 'zur Vorperiode', averageTag: (v) => `Ø ${v}`, topDay: 'Stärkster Tag', dailyAverage: 'Tagesschnitt', quietest: 'Ruhigster Tag' },
  },
}

export const Empty: Story = { args: { days: [] } }

/* Three weeks of a campus library's door count; midterm week is the busiest. */
const VISITS = [1020, 1105, 1090, 1060, 880, 410, 640, 1110, 1180, 1150, 1130, 940, 430, 700, 1480, 1620, 1710, 1690, 1240, 780, 980]
const LIBRARY: DailyBarsDay[] = VISITS.map((value, i) => ({ date: new Date(Date.UTC(2026, 8, 21 + i)).toISOString().slice(0, 10), value }))

export const LibraryVisits: Story = {
  name: 'Library visits',
  args: {
    days: LIBRARY,
    previousTotal: 19_800,
    notes: [
      { date: '2026-09-26', text: 'Short hours' },
      { date: '2026-10-07', text: 'Exam week' },
    ],
    copy: { title: 'Library visits', subtitle: 'Maple Hall library', chart: 'Visits per day', empty: 'No visits in this period' },
  },
}

/* A month of rain at a weather station, in inches to two decimals. */
const RAIN = [0, 0, 0.12, 0.45, 0.08, 0, 0, 0, 0, 0.02, 0.31, 0.88, 1.42, 0.26, 0, 0, 0, 0, 0.05, 0, 0, 0, 0.18, 0.52, 0.09, 0, 0, 0.04, 0.21, 0]
const RAINFALL: DailyBarsDay[] = RAIN.map((value, i) => ({ date: new Date(Date.UTC(2026, 8, 11 + i)).toISOString().slice(0, 10), value }))

export const Rainfall: Story = {
  args: {
    days: RAINFALL,
    previousTotal: 3.9,
    format: { style: 'unit', unit: 'inch', unitDisplay: 'short', minimumFractionDigits: 2, maximumFractionDigits: 2 },
    notes: [{ date: '2026-09-23', text: 'Storm front' }],
    copy: {
      title: 'Rainfall',
      subtitle: 'Willow Creek station',
      chart: 'Rainfall per day',
      topDay: 'Wettest day',
      quietest: 'Driest day',
      empty: 'No readings in this period',
      summary: (total, days, topDate, top, average) => `${total} of rain over ${days} days, ${average} a day on average. The wettest day was ${topDate} with ${top}. Use the left and right arrow keys to read each day.`,
    },
  },
}

export const Standalone: Story = { args: { embedded: false } }
