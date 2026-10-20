import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { DensityLanes, type DensityLane } from './density-lanes'

/** Half-hours of a day, "00:00" to "23:30". */
const COLUMNS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)
const TICKS = [0, 12, 24, 36, 48].map((at) => ({ at, label: String(at / 2).padStart(2, '0') }))

/** A swell around `peak` (a half-hour index), over a low floor. */
const swell = (peak: number, height: number, width: number, floor = 4) =>
  COLUMNS.map((_, i) => Math.round(floor + height * Math.exp(-((i - peak) ** 2) / (2 * width * width))))

/** A made-up café's orders through a day, by channel. */
const LANES: DensityLane[] = [
  { id: 'counter', label: 'Counter', values: swell(17, 60, 5) },
  { id: 'app', label: 'App', values: swell(24, 46, 7) },
  { id: 'delivery', label: 'Delivery', values: swell(38, 52, 4) },
  { id: 'catering', label: 'Catering', values: swell(22, 24, 3, 1) },
]

const meta: Meta<typeof DensityLanes> = {
  title: 'UI/Data/Density Lanes',
  component: DensityLanes,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'When things happen, one lane per kind: each column swells above and below the lane’s spine by its value, on one scale for every lane, over a faint grid of dots. Each lane shows its share of the total. Highlight ranges stay in tone while the rest go quiet; a marker flags one column through every lane. One tab stop (a grid): arrows walk columns and lanes, and focus or hover shows the value. The dots light column by column as it scrolls into view. Reduced motion: drawn in place.',
      },
    },
  },
  args: { lanes: LANES, columns: COLUMNS, ticks: TICKS, label: 'Orders through the day, by channel', formatValue: (v: number) => `${v} orders` },
  argTypes: { lanes: { control: false }, columns: { control: false }, ticks: { control: false }, highlight: { control: false } },
  decorators: [
    (Story) => (
      <div className="w-120 max-w-full">
        <Story />
      </div>
    ),
  ],
}
export default meta
type Story = StoryObj<typeof DensityLanes>

export const Default: Story = {}

/** The lunch rush kept in tone, the rest quiet, and its peak flagged. */
export const Highlight: Story = { args: { highlight: [[22, 28]], marker: { column: 24, label: 'Peak 12:00 · 166 orders' } } }

/** Fewer dots of swell and no shares, for a smaller space. */
export const Compact: Story = { args: { depth: 2, shares: false } }

/** No data yet. */
export const Empty: Story = { args: { lanes: [] } }

/** Hours of a day on a 1,440px page: the dots stop growing at `maxDot` (16px apart), so the lanes hold their height and the hours spread apart instead of the chart growing a screen tall. */
export const Wide: Story = {
  args: {
    columns: COLUMNS.filter((_, i) => i % 2 === 0),
    lanes: LANES.slice(0, 3).map((lane) => ({ ...lane, values: lane.values.filter((_, i) => i % 2 === 0) })),
    ticks: [0, 6, 12, 18, 24].map((at) => ({ at, label: String(at).padStart(2, '0') })),
  },
  decorators: [
    (Story) => (
      <div className="w-[1440px]">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const chart = canvasElement.querySelector<HTMLElement>('[data-slot=density-lanes]')!
    for (const plot of chart.querySelectorAll<HTMLElement>('[data-slot=density-lanes-plot]')) expect(plot.getBoundingClientRect().height).toBeLessThanOrEqual(9 * 16)
    expect(chart.getBoundingClientRect().height).toBeLessThan(560)
  },
}
