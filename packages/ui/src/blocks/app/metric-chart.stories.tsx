import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MetricChart, type MetricChartPoint } from './metric-chart'

const meta: Meta<typeof MetricChart> = {
  title: 'Blocks/App/Metric chart',
  component: MetricChart,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'One metric over time, stacked by the segments it adds up from, against the period before: a legend that hides and solos series and reads the bucket under the crosshair, annotations on the dates that explain the turns, a range switch and the numbers as a table.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MetricChart>

export const Default: Story = {}

/** Ninety days in weeks: the launch, the outage and the referral program fall in range. */
export const Weekly: Story = { args: { defaultRange: '90d' } }

/** Paid hidden, and no comparison: the stack and the total follow. */
export const SeriesHidden: Story = { name: 'Series hidden', args: { defaultHidden: ['paid', 'previous'] } }

export const Loading: Story = { args: { loading: true } }

export const Empty: Story = { args: { points: [] } }

export const LoadError: Story = { name: 'Error', args: { error: "Signups couldn't be loaded. The analytics service timed out.", onRetry: fn() } }

/* Revenue by plan for a year, in euros, written in German; no range switch and the month in progress hatched. */
const MONTHS = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']
const REVENUE: MetricChartPoint[] = MONTHS.map((month, i) => {
  const growth = 1 + i * 0.045
  const cut = i === 11 ? 0.34 : 1
  return {
    date: `${month}-01`,
    values: { starter: Math.round(18_400 * growth * cut), team: Math.round(41_200 * growth * (i > 6 ? 1.18 : 1) * cut), enterprise: Math.round(62_000 * (1 + i * 0.06) * cut) },
    previous: { starter: Math.round(15_100 * growth * cut), team: Math.round(33_800 * growth * cut), enterprise: Math.round(48_500 * growth * cut) },
  }
})

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { title: 'Umsatz nach Tarif', previous: 'Vorjahr', series: 'Tarife', download: 'CSV herunterladen' },
    locale: 'de-DE',
    series: [
      { id: 'starter', label: 'Starter', tone: 'chart-4' },
      { id: 'team', label: 'Team', tone: 'chart-1' },
      { id: 'enterprise', label: 'Enterprise', tone: 'chart-3' },
    ],
    points: REVENUE,
    granularity: 'month',
    partial: true,
    format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
    ranges: [{ id: '30d', label: '30D', comparison: 'vs. previous 30 days' }],
    annotations: [{ id: 'team-price', date: '2026-06-15', label: 'Neuer Team-Preis', description: 'Team kostet seit Juni 14 € pro Platz.', tone: 'success' }],
    onHiddenChange: fn(),
    onAnnotationSelect: fn(),
    onExport: fn(),
    onCopyLink: fn(),
  },
}

/* A household's year of electricity in kWh; the heat pump goes in during March. */
const ENERGY_MONTHS = ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']
const HEATING = [780, 960, 1040, 910, 640, 330, 150, 60, 40, 45, 120, 260]
const HEATING_BEFORE = [820, 1010, 1100, 960, 880, 520, 240, 90, 60, 65, 170, 410]
const APPLIANCES = [330, 350, 345, 320, 325, 310, 300, 295, 310, 305, 300, 315]
const APPLIANCES_BEFORE = [335, 355, 350, 330, 330, 320, 305, 300, 315, 310, 305, 320]
const CHARGING = [120, 125, 130, 115, 140, 150, 160, 170, 175, 170, 165, 160]
const CHARGING_BEFORE = [60, 70, 75, 65, 80, 85, 90, 95, 100, 95, 90, 85]
const ENERGY: MetricChartPoint[] = ENERGY_MONTHS.map((month, i) => ({
  date: `${month}-01`,
  values: { heating: HEATING[i]!, appliances: APPLIANCES[i]!, ev: CHARGING[i]! },
  previous: { heating: HEATING_BEFORE[i]!, appliances: APPLIANCES_BEFORE[i]!, ev: CHARGING_BEFORE[i]! },
}))

export const EnergyUse: Story = {
  name: 'Energy use',
  args: {
    copy: { title: 'Home energy use (kWh)', previous: 'Last year', series: 'Source', empty: 'No readings in this range', emptyDescription: 'Readings arrive from the smart meter every night.', error: "Energy use couldn't be loaded.", loading: 'Loading energy use', allHidden: 'Every source is hidden.' },
    series: [
      { id: 'heating', label: 'Heating', tone: 'chart-1' },
      { id: 'appliances', label: 'Appliances', tone: 'chart-3' },
      { id: 'ev', label: 'Car charging', tone: 'chart-2' },
    ],
    points: ENERGY,
    granularity: 'month',
    invert: true,
    format: { maximumFractionDigits: 0 },
    ranges: [{ id: '12m', label: '12M', name: 'the last 12 months', comparison: 'vs. a year before' }],
    defaultRange: '12m',
    annotations: [{ id: 'heat-pump', date: '2026-03-10', label: 'Heat pump installed', description: 'The gas boiler was replaced by an air-source heat pump.', tone: 'success' }],
  },
}

/* A school's enrollments by program over a year; the fall term opens in late August. */
const ENROLL = {
  business: [84, 60, 190, 110, 72, 64, 58, 52, 88, 320, 360, 120],
  computing: [120, 88, 260, 150, 98, 90, 84, 76, 130, 440, 510, 190],
  design: [46, 34, 92, 58, 40, 36, 34, 30, 52, 170, 190, 70],
}
const ENROLLMENTS: MetricChartPoint[] = ENERGY_MONTHS.map((month, i) => {
  const before = (n: number) => Math.round(n * (0.88 + (i % 3) * 0.02))
  return {
    date: `${month}-01`,
    values: { business: ENROLL.business[i]!, computing: ENROLL.computing[i]!, design: ENROLL.design[i]! },
    previous: { business: before(ENROLL.business[i]!), computing: before(ENROLL.computing[i]!), design: before(ENROLL.design[i]!) },
  }
})

export const CourseEnrollments: Story = {
  name: 'Course enrollments',
  args: {
    copy: { title: 'Course enrollments', previous: 'Last year', series: 'Program', empty: 'No enrollments in this range', emptyDescription: 'Enrollments appear once registration opens.', error: "Enrollments couldn't be loaded.", loading: 'Loading enrollments', allHidden: 'Every program is hidden.' },
    series: [
      { id: 'computing', label: 'Computing', tone: 'chart-1' },
      { id: 'business', label: 'Business', tone: 'chart-2' },
      { id: 'design', label: 'Design', tone: 'chart-4' },
    ],
    points: ENROLLMENTS,
    granularity: 'month',
    ranges: [{ id: '12m', label: '12M', name: 'the last 12 months', comparison: 'vs. a year before' }],
    defaultRange: '12m',
    annotations: [{ id: 'fall', date: '2026-08-24', label: 'Fall term opens', description: 'Registration for fall courses opened to all students.', tone: 'accent' }],
  },
}

export const Standalone: Story = { args: { embedded: false } }
