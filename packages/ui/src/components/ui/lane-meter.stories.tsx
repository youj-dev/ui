import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { LaneMeter, type Lane, type LaneItem, type LaneMeterProps } from './lane-meter'

const FAILED: LaneItem[] = [
  { id: 'job-8f2a1c', label: 'job-8f2a1c', detail: 'Timeout after 30 s' },
  { id: 'job-41be07', label: 'job-41be07', detail: 'SMTP 421: try again later' },
  { id: 'job-c93d58', label: 'job-c93d58', detail: 'Timeout after 30 s' },
  { id: 'job-0a7f12', label: 'job-0a7f12', detail: 'Rate limited by provider' },
  { id: 'job-5e61b9', label: 'job-5e61b9', detail: 'Template “receipt” missing' },
  { id: 'job-77d0ca', label: 'job-77d0ca', detail: 'Timeout after 30 s' },
  { id: 'job-b2f4e3', label: 'job-b2f4e3', detail: 'SMTP 550: mailbox unavailable' },
]

const QUEUE: Lane[] = [
  { id: 'queued', label: 'Queued', value: 214, max: 500 },
  { id: 'running', label: 'Running', value: 24, max: 32, tone: 'accent', active: true },
  { id: 'failed', label: 'Failed', value: 7, tone: 'danger', items: FAILED },
  { id: 'done', label: 'Done', value: 12480, max: 16000, tone: 'success' },
]

const meta: Meta<LaneMeterProps> = {
  title: 'UI/Data/Lane Meter',
  component: LaneMeter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Load across the lanes of a queue or a pipeline as stacked rows of countable cells that share one grid, so lanes compare at a glance: a label, the cells, the value (with a lane’s own capacity muted, “24 / 32”) and an optional action. Each lane is a `meter`. A lane with `items` lights one cell per item; with `onItemAction` each item is a button with a tooltip (one tab stop per lane, arrow keys, Home and End), and a removed item shrinks out while the rest glide over. On first view the cells light in order, lane after lane; new values sweep from the edge on screen; an `active` lane carries a light across its lit cells. On a narrow container each lane stacks. Reduced motion: lit in place, no traveling light.',
      },
    },
  },
  argTypes: {
    segments: { control: { type: 'range', min: 12, max: 48, step: 1 } },
  },
  args: { lanes: QUEUE, format: { notation: 'compact', maximumFractionDigits: 1 } },
  decorators: [(Story) => <div className="w-[36rem] max-w-full">{Story()}</div>],
}
export default meta
type Story = StoryObj<LaneMeterProps>

/** A job queue: the backlog against its capacity, busy workers against their slots (live), failed jobs you can retry one by one, and the hour’s finished jobs. */
export const Hero: Story = {
  render: function Render(args) {
    const [failed, setFailed] = useState(FAILED)
    const [queued, setQueued] = useState(214)
    const lanes = QUEUE.map((lane) =>
      lane.id === 'failed'
        ? {
            ...lane,
            value: failed.length,
            items: failed,
            action: (
              <Button
                size="xs"
                variant="secondary"
                disabled={failed.length === 0}
                onClick={() => {
                  setQueued((q) => q + failed.length)
                  setFailed([])
                }}
              >
                Retry all
              </Button>
            ),
          }
        : lane.id === 'queued'
          ? { ...lane, value: queued }
          : lane,
    )
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <LaneMeter
          {...args}
          lanes={lanes}
          onItemAction={(item) => {
            setFailed((list) => list.filter((i) => i.id !== item.id))
            setQueued((q) => q + 1)
          }}
        />
      </div>
    )
  },
}

export const Playground: Story = {}

/** Values drift every second: each lane sweeps on from the edge on screen, and the busy lane keeps its traveling light. */
export const Live: Story = {
  name: 'Live values',
  render: function Render(args) {
    const [tick, setTick] = useState(0)
    useEffect(() => {
      const id = setInterval(() => setTick((t) => t + 1), 1000)
      return () => clearInterval(id)
    }, [])
    const wave = (base: number, spread: number, phase: number) => Math.max(0, Math.round(base + Math.sin(tick / 2 + phase) * spread))
    const lanes: Lane[] = [
      { id: 'queued', label: 'Queued', value: wave(260, 140, 0), max: 500 },
      { id: 'running', label: 'Running', value: wave(22, 9, 1), max: 32, tone: 'accent', active: true },
      { id: 'retrying', label: 'Retrying', value: wave(40, 30, 2), max: 120, tone: 'warning' },
      { id: 'done', label: 'Done', value: 12000 + tick * 37, max: 16000, tone: 'success' },
    ]
    return <LaneMeter {...args} lanes={lanes} />
  },
}

/** Items as buttons: hover or focus one for its tooltip, press it (or Enter) to retry; the rest glide over and focus moves to the neighbor. */
export const Items: Story = {
  render: function Render(args) {
    const [failed, setFailed] = useState(FAILED)
    return (
      <div className="flex flex-col gap-4">
        <LaneMeter
          {...args}
          lanes={[{ id: 'failed', label: 'Failed', value: failed.length, tone: 'danger', items: failed }]}
          onItemAction={(item) => setFailed((list) => list.filter((i) => i.id !== item.id))}
        />
        <Button size="sm" variant="outline" className="self-start" onClick={() => setFailed(FAILED)}>
          Reset
        </Button>
      </div>
    )
  },
}

/** Chart colors for lanes that aren’t states, and a shared scale (no lane has its own `max`). */
export const SharedScale: Story = {
  name: 'Shared scale',
  args: {
    lanes: [
      { id: 'eu', label: 'eu-west', value: 1840, tone: 'chart-1' },
      { id: 'us', label: 'us-east', value: 2410, tone: 'chart-2' },
      { id: 'ap', label: 'ap-south', value: 620, tone: 'chart-3' },
      { id: 'sa', label: 'sa-east', value: 90, tone: 'chart-4' },
    ],
  },
}

/** Reduced motion lights the cells at once and drops the traveling light; values and items still change. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  parameters: { docs: { description: { story: 'Set the toolbar’s Motion to reduced: cells are lit in place and the busy lane has no traveling light.' } } },
}
