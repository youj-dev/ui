import { useState } from 'react'
import { ThemeScope } from '@youj/core'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Specimen } from '../../stories/kit'
import { Field, FieldDescription, FieldLabel } from './field'
import { Slider } from './slider'

const meta: Meta<typeof Slider> = {
  title: 'UI/Primitives/Slider',
  component: Slider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI slider: direct manipulation, so the thumb tracks the pointer 1:1 and keyboard steps land instantly, as on a native range. Arrows step, Page Up/Down and Shift+Arrow take large steps, Home/End jump to the ends. The motion is the thumb\'s halo, a disc that grows by transform on the enter curve on hover, focus and drag (opacity only under reduced motion). The thumb is cut from the page with an accent rim; its hit area is 32px (40px on touch). Thumbs sit inside the track edges, and two values make a range.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Slider>

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function SpendLimit() {
  const [value, setValue] = useState(400)
  return (
    <Field className="w-full max-w-[400px]">
      <div className="flex items-baseline justify-between">
        <FieldLabel>Monthly spend limit</FieldLabel>
        <span className="font-mono text-ui text-fg tabular-nums">{usd.format(value)}</span>
      </div>
      <Slider
        value={value}
        onValueChange={(v) => setValue(v as number)}
        min={0}
        max={2000}
        step={50}
        format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
      />
      <FieldDescription>We pause deployments at the limit and email the owners at 80%.</FieldDescription>
    </Field>
  )
}

/** Drag, click the track, or tab in and use the arrow keys. The value is announced formatted as currency. */
export const Hero: Story = {
  render: () => <SpendLimit />,
}

export const Variants: Story = {
  render: () => (
    <div className="grid w-full max-w-[400px] gap-8">
      <Specimen label="range">
        <Slider defaultValue={[20, 80]} thumbLabels={['Minimum price', 'Maximum price']} />
      </Specimen>
      <Specimen label="stepped (step 25)">
        <Slider defaultValue={50} step={25} aria-label="Quality" />
      </Specimen>
      <Specimen label="disabled">
        <Slider defaultValue={35} disabled aria-label="Volume" />
      </Specimen>
      <Specimen label="vertical">
        <div className="flex h-40 gap-8">
          <Slider defaultValue={60} orientation="vertical" aria-label="Bass" />
          <Slider defaultValue={30} orientation="vertical" aria-label="Treble" />
        </div>
      </Specimen>
    </div>
  ),
}

function TankLevel() {
  const [value, setValue] = useState(64)
  return (
    <Field className="w-full max-w-[400px]">
      <div className="flex items-baseline justify-between">
        <FieldLabel>Tank level</FieldLabel>
        <span className="font-mono text-ui text-fg tabular-nums">{value}%</span>
      </div>
      <Slider variant="liquid" value={value} onValueChange={(v) => setValue(v as number)} format={{ style: 'unit', unit: 'percent' }} />
      <FieldDescription>Refill starts when the tank drops below 20%.</FieldDescription>
    </Field>
  )
}

/** `variant="liquid"`: the fill is a liquid in a tube. Drag fast and its surface leans behind the thumb, then sloshes back and settles once you stop; arrow keys make small waves. Under reduced motion the surface stays level. */
export const Liquid: Story = {
  render: () => <TankLevel />,
}

export const LiquidVariants: Story = {
  render: () => (
    <div className="grid w-full max-w-[400px] gap-8">
      <Specimen label="range">
        <Slider variant="liquid" defaultValue={[25, 70]} thumbLabels={['Low mark', 'High mark']} />
      </Specimen>
      <Specimen label="disabled">
        <Slider variant="liquid" defaultValue={40} disabled aria-label="Reservoir" />
      </Specimen>
      <Specimen label="vertical">
        <div className="flex h-40 gap-8">
          <Slider variant="liquid" defaultValue={70} orientation="vertical" aria-label="Left channel" />
          <Slider variant="liquid" defaultValue={45} orientation="vertical" aria-label="Right channel" />
        </div>
      </Specimen>
      <Specimen label="right to left">
        <ThemeScope dir="rtl">
          <div dir="rtl">
            <Slider variant="liquid" defaultValue={55} aria-label="مستوى الماء" />
          </div>
        </ThemeScope>
      </Specimen>
    </div>
  ),
}

/** Under RTL the range fills from the right and the arrow keys follow the reading direction. */
export const RightToLeft: Story = {
  render: () => (
    <ThemeScope dir="rtl">
      <div dir="rtl" className="w-full max-w-[360px]">
        <Slider defaultValue={30} aria-label="مستوى الصوت" />
      </div>
    </ThemeScope>
  ),
}

function SeatsEstimate() {
  const [value, setValue] = useState(14)
  return (
    <Field className="w-full max-w-[400px]">
      <div className="flex items-baseline justify-between">
        <FieldLabel>Seats</FieldLabel>
        <span className="font-mono text-ui text-fg tabular-nums">{value} seats</span>
      </div>
      <Slider variant="ticks" tone="chart-4" value={value} onValueChange={(v) => setValue(v as number)} min={1} max={40} />
      <FieldDescription>Each seat is $9 a month, billed with the plan.</FieldDescription>
    </Field>
  )
}

/** `variant="ticks"`: a ruler of fine ticks instead of a rail, a taller one every fifth, lit in `tone` up to the slim fader cap. For a value read off a scale: usage in an estimate, a quota. It is as direct as the default, so the lit ticks follow the thumb with no easing. */
export const Ticks: Story = {
  render: () => <SeatsEstimate />,
}

export const TicksVariants: Story = {
  render: () => (
    <div className="grid w-full max-w-[400px] gap-8">
      <Specimen label="tones">
        <div className="grid gap-3">
          <Slider variant="ticks" tone="chart-1" defaultValue={62} aria-label="Ingest" />
          <Slider variant="ticks" tone="chart-2" defaultValue={30} aria-label="Retention" />
          <Slider variant="ticks" tone="accent" defaultValue={80} aria-label="Queries" />
        </div>
      </Specimen>
      <Specimen label="range, 21 ticks">
        <Slider variant="ticks" ticks={21} defaultValue={[30, 70]} thumbLabels={['From', 'To']} />
      </Specimen>
      <Specimen label="disabled">
        <Slider variant="ticks" defaultValue={45} disabled aria-label="Scanned" />
      </Specimen>
      <Specimen label="right to left">
        <ThemeScope dir="rtl">
          <div dir="rtl">
            <Slider variant="ticks" tone="chart-3" defaultValue={35} aria-label="المقاعد" />
          </div>
        </ThemeScope>
      </Specimen>
    </div>
  ),
}
