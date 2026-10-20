import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { DotMap, type DotMapProps, type DotMapRegion } from './dot-map'

const REGIONS: DotMapRegion[] = [
  { id: 'iad', name: 'iad', lon: -77.04, lat: 38.9, value: 12_400 },
  { id: 'fra', name: 'fra', lon: 8.68, lat: 50.11, value: 9_800 },
  { id: 'sfo', name: 'sfo', lon: -122.42, lat: 37.77, value: 8_900 },
  { id: 'nrt', name: 'nrt', lon: 139.69, lat: 35.68, value: 6_100 },
  { id: 'sin', name: 'sin', lon: 103.82, lat: 1.35, value: 4_300 },
  { id: 'gru', name: 'gru', lon: -46.63, lat: -23.55, value: 2_700, tone: 'warning' },
  { id: 'syd', name: 'syd', lon: 151.21, lat: -33.87, value: 1_900 },
]

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

const meta: Meta<DotMapProps> = {
  title: 'UI/Data/Dot Map',
  component: DotMap,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The world as a grid of dots, lit where the numbers are: each region lights the land dots around it like LEDs, the reach and strength growing with its share of the largest value, under a soft halo in its tone (the accent unless it sets one). `active` brightens one region, dims the rest and runs a crosshair through it with an ink tag; hovering the map reports the nearest region through `onActiveChange`, so a list beside it can follow. A scan sweeps the grid in from the west as it scrolls into view, and every change to a region’s value sends one pulse from it. The land is a committed 3° grid derived from Natural Earth (public domain); nothing geographic loads at runtime. The map is a labeled image with a summary: pair it with a list that holds the figures. Reduced motion: drawn in place, without the scan or pulses.',
      },
    },
  },
  args: {
    regions: REGIONS,
    label: 'Requests by region',
    formatValue: (v: number) => `${compact.format(v)} rps`,
  },
}
export default meta
type Story = StoryObj<DotMapProps>

const frame = 'w-[min(46rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-4'

export const Playground: Story = {
  render: (args) => (
    <div className={frame}>
      <DotMap {...args} />
    </div>
  ),
}

/** A list beside the map sets `active`; the crosshair glides between regions. */
export const LinkedList: Story = {
  name: 'Linked to a list',
  render: function Render(args) {
    const [active, setActive] = useState<string | null>('fra')
    return (
      <div className={`${frame} flex flex-col gap-4`}>
        <DotMap {...args} active={active} onActiveChange={setActive} />
        <ul className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {REGIONS.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onFocus={() => setActive(r.id)}
                onPointerEnter={() => setActive(r.id)}
                className="flex w-full items-baseline justify-between gap-2 rounded-md px-2 py-1.5 font-mono text-ui focus-ring data-[on=true]:bg-hover"
                data-on={active === r.id}
              >
                {r.name}
                <span className="text-fg-muted tabular-nums">{compact.format(r.value)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  },
}

/** Every update pulses the regions whose value changed, once. */
export const Live: Story = {
  render: function Render(args) {
    const [tick, setTick] = useState(0)
    const [running, setRunning] = useState(true)
    useEffect(() => {
      if (!running) return
      const id = setInterval(() => setTick((t) => t + 1), 2400)
      return () => clearInterval(id)
    }, [running])
    const regions = REGIONS.map((r, i) => ({ ...r, value: Math.round(r.value * (1 + Math.sin(tick * 1.3 + i * 2.1) * 0.25)) }))
    return (
      <div className={`${frame} flex flex-col gap-3`}>
        <DotMap {...args} regions={regions} />
        <Button variant="secondary" size="sm" className="self-start" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause updates' : 'Resume updates'}
        </Button>
      </div>
    )
  },
}

/** Chart tones: one hue per region, for categories rather than a single measure. */
export const Tones: Story = {
  args: {
    regions: REGIONS.map((r, i) => ({ ...r, tone: (['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const)[i % 5] })),
  },
  render: (args) => (
    <div className={frame}>
      <DotMap {...args} />
    </div>
  ),
}

/** With nothing to light, the grid alone. */
export const Empty: Story = {
  args: { regions: [] },
  render: (args) => (
    <div className={frame}>
      <DotMap {...args} />
    </div>
  ),
}
