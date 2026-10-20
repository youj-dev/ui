import { useState } from 'react'
import { ThemeScope } from '@youj/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Frame, Note, Specimen } from '../../stories/kit'
import { Button } from './button'
import { HistogramRange } from './histogram-range'

const meta: Meta<typeof HistogramRange> = {
  title: 'UI/Inputs/Histogram range',
  component: HistogramRange,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A two-thumb range over the distribution it filters. Bars inside the range take the accent and bars outside are muted; the accent is the bars clipped to the range, so its edges sit exactly under the thumbs and follow a drag 1:1. The thumbs are the kit’s Slider (keyboard, RTL, locale and halo included), centered on their values so bins, thumbs and axis share one scale, and drawn as a caliper’s jaws: an upright tab on the track with a hairline guide rising through the plot. The whole plot is the hit area. Takes raw `data` (binned into `binCount`) or precomputed `bins`; `format` shapes the readout, the spoken values and the axis. When the data changes, the bars glide to their new heights in a quick wave (slow token, emphasized curve); reduced motion sets them in one frame. The bars are decorative; the readout is spoken through a polite live region once the range settles.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof HistogramRange>

/** Counts per bin of a log-normal size distribution: most files small, a long tail of big ones. */
function sizes(count: number, max: number, mode: number, sigma: number, total: number) {
  const mu = Math.log(mode) + sigma * sigma
  return Array.from({ length: count }, (_, i) => {
    const x = ((i + 0.5) / count) * max
    const pdf = Math.exp(-((Math.log(x) - mu) ** 2) / (2 * sigma * sigma)) / (x * sigma * Math.sqrt(2 * Math.PI))
    return Math.round(pdf * total * (max / count))
  })
}

const megabytes = (v: number) => `${v.toFixed(1)} MB`
const megabytesTick = (v: number) => (v === 0 ? '0' : `${v} MB`)
const SIZE_TICKS = [0, 16, 32, 48, 64]
const UPLOADS = sizes(40, 64, 9, 0.62, 48_600)

function SizeFilter() {
  const [range, setRange] = useState<[number, number]>([4.8, 38])
  return (
    <Frame className="w-[34rem] max-w-full p-5">
      <HistogramRange
        label="File size"
        bins={UPLOADS}
        min={0}
        max={64}
        step={0.1}
        value={range}
        onValueChange={setRange}
        format={megabytes}
        formatTick={megabytesTick}
        ticks={SIZE_TICKS}
      />
    </Frame>
  )
}

/** Drag either thumb, press anywhere on the plot, or tab in and use the arrow keys (Shift or Page Up/Down for large steps). */
export const Hero: Story = {
  render: () => <SizeFilter />,
}

const SERIES = {
  images: sizes(40, 64, 4.5, 0.55, 31_200),
  video: sizes(40, 64, 41, 0.22, 6_400),
  documents: sizes(40, 64, 1.8, 0.7, 11_000),
}

/** Switch the series: the bars glide to the new counts in a wave. Switch again mid-glide and they turn from where they are. */
export const DataChanges: Story = {
  render: function Render() {
    const [series, setSeries] = useState<keyof typeof SERIES>('images')
    return (
      <div className="flex w-[34rem] max-w-full flex-col gap-4">
        <div className="flex gap-2">
          {(Object.keys(SERIES) as (keyof typeof SERIES)[]).map((key) => (
            <Button key={key} size="sm" variant={key === series ? 'default' : 'secondary'} onClick={() => setSeries(key)}>
              {key}
            </Button>
          ))}
        </div>
        <Frame className="p-5">
          <HistogramRange label="File size" bins={SERIES[series]} min={0} max={64} step={0.1} defaultValue={[2, 30]} format={megabytes} formatTick={megabytesTick} ticks={SIZE_TICKS} />
        </Frame>
      </div>
    )
  },
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
/** Nightly prices, as raw values the component counts into bins: log-normal around $120, from a seeded generator. */
const PRICES = (() => {
  let seed = 7
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  return Array.from({ length: 1200 }, () => {
    const z = (random() + random() + random() + random() - 2) * Math.sqrt(3)
    return Math.round(Math.exp(4.8 + 0.5 * z))
  })
})()

export const Variants: Story = {
  render: () => (
    <div className="grid w-[34rem] max-w-full gap-10">
      <Specimen label="raw data, 30 bins, uncontrolled, custom ticks">
        <HistogramRange
          label="Price per night"
          data={PRICES}
          binCount={30}
          min={0}
          max={450}
          step={5}
          defaultValue={[80, 260]}
          format={usd.format}
          ticks={[0, 150, 300, 450]}
        />
      </Specimen>
      <Specimen label='tone="accent": the bars in range take the accent'>
        <HistogramRange label="File size" tone="accent" bins={UPLOADS} min={0} max={64} step={0.1} defaultValue={[4.8, 38]} format={megabytes} formatTick={megabytesTick} ticks={SIZE_TICKS} />
      </Specimen>
      <Specimen label="no label: thumbs are named Min and Max">
        <HistogramRange aria-label="Upload size" bins={UPLOADS} min={0} max={64} step={0.5} defaultValue={[2, 20]} format={megabytes} formatTick={megabytesTick} ticks={SIZE_TICKS} />
      </Specimen>
      <Specimen label="empty: the baseline stays">
        <HistogramRange label="File size" bins={new Array(40).fill(0)} min={0} max={64} step={0.1} format={megabytes} formatTick={megabytesTick} ticks={SIZE_TICKS} />
      </Specimen>
      <Specimen label="disabled">
        <HistogramRange label="File size" bins={UPLOADS} min={0} max={64} step={0.1} defaultValue={[3, 30]} format={megabytes} formatTick={megabytesTick} ticks={SIZE_TICKS} disabled />
      </Specimen>
    </div>
  ),
}

/** Under RTL the minimum is on the right: the bins, the accent and the axis mirror with the thumbs. */
export const RightToLeft: Story = {
  render: () => (
    <ThemeScope dir="rtl">
      <div dir="rtl" className="w-[34rem] max-w-full">
        <HistogramRange label="حجم الملف" bins={UPLOADS} min={0} max={64} step={0.1} defaultValue={[4.8, 38]} format={megabytes} formatTick={megabytesTick} ticks={SIZE_TICKS} />
      </div>
    </ThemeScope>
  ),
}

/** Reduced motion (toolbar): the bars take their heights in one frame, on first paint and on every change. Nothing else moves, so nothing else changes. */
export const ReducedMotion: Story = {
  render: () => (
    <div className="flex w-[34rem] max-w-full flex-col gap-3">
      <Note>Set Motion to reduced in the toolbar, then switch series in Data changes: the heights change in place.</Note>
      <SizeFilter />
    </div>
  ),
}
