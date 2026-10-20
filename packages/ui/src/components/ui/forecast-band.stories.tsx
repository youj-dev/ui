import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { ForecastBand, type ForecastBandProps, type ForecastPoint } from './forecast-band'

/** Nineteen days of spend, about $440 a day, lighter at weekends. */
const DAILY = [412, 468, 455, 301, 288, 476, 490, 463, 471, 318, 296, 502, 488, 479, 495, 334, 305, 512, 497]
const ACTUAL = DAILY.reduce<number[]>((sums, d) => [...sums, (sums.at(-1) ?? 0) + d], [])

/** The rest of a 30-day period at `pace` a day, the likely range widening with each day out. */
function project(pace: number, days = 11): ForecastPoint[] {
  const last = ACTUAL.at(-1)!
  return Array.from({ length: days }, (_, i) => {
    const value = last + pace * (i + 1)
    const spread = 150 * Math.sqrt(i + 1) + 22 * (i + 1)
    return { value, low: value - spread * 0.85, high: value + spread }
  })
}

const USD = { style: 'currency', currency: 'USD' } as const

const meta: Meta<ForecastBandProps> = {
  title: 'UI/Data/Forecast Band',
  component: ForecastBand,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Where a running total will land against a budget. Spend so far is a solid ink line over a faint wash; from today the forecast continues as a dashed line in its tone, inside its likely range, over a hatched projected area (HatchedBar’s `Hatch`: solid for what’s settled, hatched for what isn’t). The budget is a dashed line; where the forecast crosses it the stretch above is hatched in danger, and a marker on the line names the day, with its flag in a lane over the plot. Time runs from the inline start, so the plot mirrors in RTL while its labels stay upright. When it scrolls into view the actual line draws in to today, the forecast wipes on to the end, and the marker arrives as the wipe reaches it, its ring pulsing once; new data morphs every path on the smooth spring, the budget line and marker glide, and the ring pulses once more only if the crossing day moves. The plot is an image described by a text summary; the legend is text. Reduced motion: drawn in place with a static ring.',
      },
    },
  },
  args: {
    actual: ACTUAL,
    forecast: project(425),
    budget: 12000,
    start: '2026-09-01',
    format: USD,
    max: 15000,
  },
}
export default meta
type Story = StoryObj<ForecastBandProps>

const frame = 'w-[min(44rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-5'

/** A cloud bill on pace to cross its budget on the 28th. */
export const Playground: Story = {
  render: (args) => (
    <div className={frame}>
      <ForecastBand {...args} />
    </div>
  ),
}

/** A slower pace: the forecast and its range stay under the line, so there is no marker and the summary says so. */
export const WithinBudget: Story = {
  name: 'Within budget',
  args: { forecast: project(300) },
  render: (args) => (
    <div className={frame}>
      <ForecastBand {...args} />
    </div>
  ),
}

/** The same bill with a savings scenario: shutting idle preview environments at night slows the pace enough to land under the budget. */
export const SavingsScenario: Story = {
  name: 'Spend with a savings scenario',
  args: {
    scenario: { label: 'With nightly shutdown', values: project(318).map((p) => p.value), tone: 'chart-1' },
  },
  render: (args) => (
    <div className={frame}>
      <ForecastBand {...args} />
    </div>
  ),
}

/** New data morphs the paths and glides the marker; the ring pulses again only when the crossing day moves. */
export const DataChange: Story = {
  name: 'Data change',
  render: function Render(args) {
    const [pace, setPace] = useState(425)
    const [budget, setBudget] = useState(12000)
    return (
      <div className={`${frame} flex flex-col gap-4`}>
        <ForecastBand {...args} forecast={project(pace)} budget={budget} />
        <div className="flex flex-wrap gap-2">
          {[300, 425, 520].map((p) => (
            <Button key={p} size="sm" variant={p === pace ? 'default' : 'outline'} onClick={() => setPace(p)}>
              ${p}/day
            </Button>
          ))}
          {[11000, 12000, 13000].map((b) => (
            <Button key={b} size="sm" variant={b === budget ? 'default' : 'outline'} onClick={() => setBudget(b)}>
              Budget ${b / 1000}k
            </Button>
          ))}
        </div>
      </div>
    )
  },
}

/** Without a start date the crossing is named from today ("in 9 days") and the axis counts days. */
export const RelativeDays: Story = {
  name: 'Relative days',
  args: { start: undefined },
  render: (args) => (
    <div className={frame}>
      <ForecastBand {...args} />
    </div>
  ),
}

/** Reduced motion: drawn in place, the marker's ring static. Set the toolbar's Motion to reduced to compare. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  globals: { reducedMotion: 'always' },
  render: (args) => (
    <div className={frame}>
      <ForecastBand {...args} />
    </div>
  ),
}
