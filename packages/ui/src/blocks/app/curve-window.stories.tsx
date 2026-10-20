import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CurveWindow } from './curve-window'

const meta: Meta<typeof CurveWindow> = {
  title: 'Blocks/App/Curve Window',
  component: CurveWindow,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Check a station’s tightening bolt by bolt: the torque against angle of the last parts against the pass window, the last one highlighted, and a callout on any part that failed.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof CurveWindow>

/** A station's bolt tightening, torque against angle. Bolt 2 is shown: twelve curves end in the window, and Part 118 ended soft at 47°. */
export const Default: Story = { name: 'Bolt tightening', args: { defaultValue: 'bolt-2' } }

/** A bolt whose parts all passed: no callout. */
export const AllPassed: Story = { name: 'All passed', args: { defaultValue: 'bolt-1' } }

/** Other data: one bolt with its own window, German words, and the picks in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    copy: {
      title: 'Anziehen',
      subtitle: (traces: number) => `Station 2 · M6 Schraube · letzte ${traces}`,
      nokCount: (n: number) => `${n} n. i. O.`,
      at: (x: string) => `bei ${x}`,
    },
    series: [
      {
        id: 'a',
        label: 'Schraube A',
        window: { xFrom: 30, xTo: 44, yFrom: 18, yTo: 25 },
        curves: [
          { id: 'Teil 40', result: 'ok', points: [[0, 0], [10, 1.2], [20, 5.5], [30, 14], [38, 21.5]] },
          { id: 'Teil 41', result: 'nok', note: 'Gewinde schwergängig', points: [[0, 0], [10, 2.5], [20, 9], [30, 19], [36, 27.2]] },
          { id: 'Teil 42', result: 'ok', points: [[0, 0], [10, 1.4], [20, 6], [30, 14.5], [40, 22.4]] },
        ],
      },
      {
        id: 'b',
        label: 'Schraube B',
        window: { xFrom: 30, xTo: 44, yFrom: 18, yTo: 25 },
        curves: [{ id: 'Teil 42', result: 'ok', points: [[0, 0], [10, 1.3], [20, 5.8], [30, 14.2], [39, 21.9]] }],
      },
    ],
    onValueChange: fn(),
  },
}

const window = { xFrom: 2500, xTo: 3000, yFrom: 3.0, yTo: 3.5 }

/** A cell's discharge: a long plateau and a knee near the end, from 4.15 V down to where it ended; a run that ends outside the window fails. */
const discharge = (id: string, endX: number, endY: number, note?: string) => ({
  id,
  result: note ? ('nok' as const) : ('ok' as const),
  note,
  points: Array.from({ length: 11 }, (_, i) => {
    const t = i / 10
    return [Math.round(endX * t), Math.round((4.15 - (4.15 - endY) * (0.5 * t + 0.5 * t ** 7)) * 100) / 100] as [number, number]
  }),
})

/** Tech: battery discharge, voltage against capacity drawn, where the window is the pass band and each series is a cell. */
export const BatteryDischarge: Story = {
  name: 'Battery discharge',
  args: {
    axes: {
      x: { label: 'capacity drawn', unit: 'mAh', domain: [0, 3000], step: 1000, format: (v: number) => `${v}` },
      y: { label: 'voltage', unit: 'V', domain: [2.5, 4.5], step: 0.5, format: (v: number) => v.toFixed(2) },
    },
    copy: {
      title: 'Cell discharge',
      subtitle: (traces: number) => `Test bench 2 · 18650 · last ${traces}`,
      nokCount: (n: number) => `${n} FAIL`,
      allOk: 'All pass',
      seriesLabel: 'Cell',
      ok: 'Pass',
      nok: 'Fail',
      keyOk: 'Pass',
      keyNok: 'Fail',
      keyWindow: 'Pass band',
      at: (x: string) => `V at ${x} mAh`,
      callout: (id: string, y: string) => `${id} · ${y} V`,
      trace: (id: string, result: string, y: string, x: string, note: string) => `${id}: ${result}, ${y} V at ${x} mAh${note ? `, ${note}` : ''}`,
      traceList: 'Runs',
      chartLabel: (series: string, traces: number, nok: number, window: string, y: string, x: string) => `${series}: ${y} against ${x} for the last ${traces} runs, ${nok} outside the pass band of ${window}`,
    },
    series: [
      {
        id: 'cell-a',
        label: 'Cell A',
        window,
        curves: [discharge('Run 1', 2800, 3.2), discharge('Run 2', 2850, 3.25), discharge('Run 3', 1900, 2.95, 'Capacity fades at 1,900 mAh'), discharge('Run 4', 2900, 3.18)],
      },
      {
        id: 'cell-b',
        label: 'Cell B',
        window,
        curves: [discharge('Run 1', 2750, 3.3), discharge('Run 2', 2800, 3.28), discharge('Run 3', 2700, 3.36)],
      },
    ],
  },
}

/** Health: glucose response after a meal, where the window is the target range and each series is a day. */
export const GlucoseResponse: Story = {
  name: 'Glucose response',
  args: {
    axes: {
      x: { label: 'minutes after the meal', unit: 'min', domain: [0, 180], step: 60, format: (v: number) => `${v} min` },
      y: { label: 'glucose', unit: 'mg/dL', domain: [60, 220], step: 40, format: (v: number) => `${v}` },
    },
    copy: {
      title: 'Glucose after meals',
      subtitle: (traces: number) => `Dinner · last ${traces} days`,
      nokCount: (n: number) => `${n} out of range`,
      allOk: 'All in range',
      seriesLabel: 'Day',
      ok: 'In range',
      nok: 'High',
      keyOk: 'In range',
      keyLast: 'Latest',
      keyNok: 'High',
      keyWindow: 'Target range',
      at: (x: string) => `mg/dL at ${x}`,
      traceList: 'Days',
      chartLabel: (series: string, traces: number, nok: number, window: string, y: string, x: string) => `${series}: ${y} against ${x} for the last ${traces} days, ${nok} outside the target range of ${window}`,
      trace: (id: string, result: string, y: string, x: string, note: string) => `${id}: ${result}, ${y} mg/dL at ${x}${note ? `, ${note}` : ''}`,
      callout: (id: string, y: string) => `${id} · ${y} mg/dL`,
    },
    series: [
      {
        id: 'week-1',
        label: 'Week 1',
        window: { xFrom: 120, xTo: 180, yFrom: 80, yTo: 140 },
        curves: [
          { id: 'Mon', result: 'ok', points: [[0, 95], [30, 130], [60, 165], [90, 150], [120, 125], [150, 105], [180, 98]] },
          { id: 'Tue', result: 'ok', points: [[0, 92], [30, 125], [60, 160], [90, 148], [120, 120], [150, 102], [180, 96]] },
          { id: 'Wed', result: 'nok', note: 'Still 168 two hours after', points: [[0, 100], [30, 150], [60, 205], [90, 195], [120, 168], [150, 150], [180, 142]] },
          { id: 'Thu', result: 'ok', points: [[0, 90], [30, 128], [60, 158], [90, 140], [120, 118], [150, 100], [180, 94]] },
        ],
      },
      {
        id: 'week-2',
        label: 'Week 2',
        window: { xFrom: 120, xTo: 180, yFrom: 80, yTo: 140 },
        curves: [
          { id: 'Mon', result: 'ok', points: [[0, 94], [30, 126], [60, 155], [90, 138], [120, 115], [150, 98], [180, 93]] },
          { id: 'Tue', result: 'ok', points: [[0, 96], [30, 128], [60, 160], [90, 142], [120, 122], [150, 104], [180, 97]] },
        ],
      },
    ],
  },
}

/** Skeletons hold the chart's place and the figures while the data loads. */
export const Loading: Story = { args: { loading: true } }

/** No series: the empty message in the chart's place. */
export const Empty: Story = { args: { series: [] } }

/** The load failed: the message with Retry in the chart's place. */
export const Error: Story = { args: { error: 'Couldn’t load the curves.', onRetry: fn() } }

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
