import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DriftHistogram } from './drift-histogram'

const meta: Meta<typeof DriftHistogram> = {
  title: 'Blocks/App/Drift Histogram',
  component: DriftHistogram,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See whether a hole is drifting from nominal: the offset of the recent parts and the process capability, a 3D histogram of where holes landed (older, recent, out of tolerance) with a drift arrow, and the tool offset that would bring them back, with Apply.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof DriftHistogram>

/** A hole's position: 64 parts, the last 30 sit 0.031 mm off nominal, one landed outside the 0.10 tolerance, and the tool offset is ready to apply. */
export const Default: Story = { name: 'Hole position' }

/** A stable process: hits scatter round nominal, no drift, nothing out. */
export const Stable: Story = {
  args: {
    hits: [
      { x: 0.004, y: -0.003 },
      { x: -0.006, y: 0.005 },
      { x: 0.001, y: 0.008 },
      { x: -0.003, y: -0.007 },
      { x: 0.007, y: 0.002 },
      { x: -0.002, y: 0.001 },
      { x: 0.005, y: -0.006 },
      { x: -0.008, y: 0.003 },
    ],
    recent: 4,
  },
}

/** Other data: a wider tolerance, German words, and Apply in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    tolerance: 0.14,
    recent: 5,
    copy: {
      title: 'Positionstoleranz',
      subject: 'Bohrung Ø 6 H7',
      drifting: 'Wandert',
      correction: 'Werkzeugkorrektur',
      apply: 'Übernehmen',
      keyOlder: 'Älter',
      keyRecent: 'Neu',
      keyDrift: 'Drift',
    },
    hits: [
      { x: 0.002, y: 0.001 },
      { x: -0.004, y: 0.006 },
      { x: 0.005, y: -0.003 },
      { x: 0.006, y: 0.002 },
      { x: 0.018, y: 0.012 },
      { x: 0.024, y: 0.015 },
      { x: 0.021, y: 0.019 },
      { x: 0.026, y: 0.011 },
      { x: 0.03, y: 0.017 },
    ],
    onApply: fn(),
  },
}


const grams = (v: number) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(3)} g`

/** Food line: sachet fill weight in grams over target, from two filler heads; Apply adjusts the filler. */
export const FillWeight: Story = {
  name: 'Fill weight',
  args: {
    tolerance: 0.09,
    recent: 6,
    format: grams,
    copy: {
      title: 'Fill weight',
      subject: 'Oat sachet 40 g',
      subtitle: (subject: string, parts: number) => `${subject} · ${parts} sachets`,
      stable: 'On target',
      drifting: 'Running heavy',
      corrected: 'Filler adjusted',
      offsetLabel: (last: number) => `g over target · last ${last}`,
      capability: 'Cpk',
      chartLabel: (parts: number, older: number, recent: number, out: number, offset: string, tolerance: string) =>
        `Where ${parts} sachets landed against a tolerance of ±${tolerance}: ${older} older, ${recent} recent, ${out} outside it. The recent ones sit ${offset} from target.`,
      tolerance: (value: string) => `±${value}`,
      keyOlder: 'Earlier',
      correction: 'Filler setting',
      axis: (name: string, value: string) => `Head ${name === 'X' ? 'A' : 'B'} ${value}`,
      apply: 'Adjust filler',
      applying: 'Adjusting',
      applied: 'Adjusted',
      announceApplied: (x: string, y: string) => `Filler adjusted: head A ${x}, head B ${y}`,
    },
    hits: [
      { x: 0.004, y: -0.002 },
      { x: -0.006, y: 0.003 },
      { x: 0.002, y: 0.006 },
      { x: -0.003, y: -0.005 },
      { x: 0.005, y: 0.001 },
      { x: -0.001, y: 0.004 },
      { x: -0.004, y: -0.003 },
      { x: 0.003, y: -0.006 },
      { x: 0.012, y: 0.008 },
      { x: 0.018, y: 0.011 },
      { x: 0.022, y: 0.016 },
      { x: 0.025, y: 0.013 },
      { x: 0.031, y: 0.02 },
      { x: 0.038, y: 0.027 },
      { x: 0.052, y: 0.041 },
    ],
  },
}

const minutes = (v: number) => `${v < 0 ? '−' : ''}${Math.round(Math.abs(v * 100))} min`

/** Logistics: delivery ETA error, minutes early or late at pickup and at drop-off; Apply shifts the estimate. */
export const DeliveryEtaError: Story = {
  name: 'Delivery ETA error',
  args: {
    tolerance: 0.1,
    recent: 8,
    format: minutes,
    copy: {
      title: 'ETA accuracy',
      subject: 'Downtown route',
      subtitle: (subject: string, parts: number) => `${subject} · ${parts} deliveries`,
      stable: 'Accurate',
      drifting: 'Running late',
      corrected: 'Estimate shifted',
      offsetLabel: (last: number) => `late on average · last ${last}`,
      capability: 'Cpk',
      chartLabel: (parts: number, older: number, recent: number, out: number, offset: string, tolerance: string) =>
        `Where ${parts} deliveries landed against an allowance of ±${tolerance}: ${older} older, ${recent} recent, ${out} outside it. The recent ones average ${offset} off the estimate.`,
      tolerance: (value: string) => `±${value}`,
      keyOlder: 'Earlier',
      keyOut: (n: string) => `Missed · ${n}`,
      correction: 'Estimate shift',
      axis: (name: string, value: string) => `${name === 'X' ? 'Pickup' : 'Drop-off'} ${value}`,
      apply: 'Shift estimate',
      applying: 'Shifting',
      applied: 'Shifted',
      announceApplied: (x: string, y: string) => `Estimate shifted: pickup ${x}, drop-off ${y}`,
    },
    hits: [
      { x: 0.006, y: 0.002 },
      { x: -0.004, y: 0.005 },
      { x: 0.001, y: -0.006 },
      { x: -0.007, y: -0.001 },
      { x: 0.005, y: 0.007 },
      { x: -0.002, y: -0.004 },
      { x: 0.003, y: 0.004 },
      { x: 0.008, y: 0.012 },
      { x: 0.014, y: 0.02 },
      { x: 0.019, y: 0.026 },
      { x: 0.023, y: 0.031 },
      { x: 0.02, y: 0.038 },
      { x: 0.027, y: 0.034 },
      { x: 0.033, y: 0.041 },
      { x: 0.03, y: 0.046 },
      { x: 0.036, y: 0.05 },
    ],
  },
}

/** Skeletons hold the plate's place and the figures while the data loads. */
export const Loading: Story = { args: { loading: true } }

/** No hits: the empty message in the plate's place. */
export const Empty: Story = { args: { hits: [] } }

/** The load failed: the message with Retry in the plate's place. */
export const Error: Story = { args: { error: 'Couldn’t load the hits.', onRetry: fn() } }

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
