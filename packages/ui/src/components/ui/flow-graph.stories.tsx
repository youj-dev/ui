import type { Meta, StoryObj } from '@storybook/react-vite'
import { useId, useState } from 'react'
import { FlowGraph, type FlowEdge, type FlowGraphProps, type FlowNode } from './flow-graph'

/** A nightly warehouse build: three extracts, two staging models, a join, two marts, a test and the publish. */
const NODES: FlowNode[] = [
  { id: 'orders', label: 'extract.orders', kind: 'source', status: 'ok', meta: '48 s' },
  { id: 'refunds', label: 'extract.refunds', kind: 'source', status: 'retried', meta: '1m 12s', attempts: 2 },
  { id: 'fx', label: 'extract.fx_rates', kind: 'source', status: 'ok', meta: '6 s' },
  { id: 'stg-orders', label: 'stg.orders', kind: 'model', status: 'ok', meta: '21 s' },
  { id: 'stg-refunds', label: 'stg.refunds', kind: 'model', status: 'ok', meta: '9 s' },
  { id: 'revenue', label: 'int.revenue', kind: 'join', status: 'running', meta: '0:34' },
  { id: 'mrr', label: 'mart.mrr', kind: 'model', status: 'queued' },
  { id: 'churn', label: 'mart.churn', kind: 'model', status: 'queued' },
  { id: 'fresh', label: 'test.freshness', kind: 'test', status: 'queued' },
  { id: 'backfill', label: 'backfill.q3', kind: 'job', status: 'skipped', meta: 'not due' },
  { id: 'publish', label: 'publish.board', kind: 'sink', status: 'queued' },
]
const EDGES: FlowEdge[] = [
  { from: 'orders', to: 'stg-orders' },
  { from: 'refunds', to: 'stg-refunds' },
  { from: 'stg-orders', to: 'revenue' },
  { from: 'stg-refunds', to: 'revenue' },
  { from: 'fx', to: 'revenue' },
  { from: 'revenue', to: 'mrr' },
  { from: 'revenue', to: 'churn' },
  { from: 'revenue', to: 'backfill' },
  { from: 'mrr', to: 'fresh' },
  { from: 'churn', to: 'fresh' },
  { from: 'fresh', to: 'publish' },
  { from: 'backfill', to: 'publish' },
]

const meta: Meta<FlowGraphProps> = {
  title: 'UI/Data Display/Flow Graph',
  component: FlowGraph,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A graph of steps that lays itself out along the flow, showing each step’s state. It reads right to left under RTL and top to bottom when narrow: mono step cards on a dot grid, joined port to port by curves. Each step shows its state: queued, running (a soft pulse, dashes flowing along the edges into it), succeeded, failed, retried (with its attempts) or skipped (dashed, like its edges). Pick a step to open it; point `controls` at the region that shows its detail. Drag or wheel to pan, Ctrl/⌘ and the wheel (or a pinch), the corner buttons or +/− to zoom, 0 to fit. The steps are one tab stop: arrows along the flow follow the edges, across it move within a layer, Enter opens and Escape closes. Reduced motion: no pulse or flowing dashes, and the view moves in place.',
      },
    },
  },
  args: { nodes: NODES, edges: EDGES },
}
export default meta
type Story = StoryObj<FlowGraphProps>

export const Default: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState<string | null>(null)
    const detailId = useId()
    const node = NODES.find((n) => n.id === open)
    return (
      <div className="flex w-[60rem] max-w-full flex-col gap-3">
        <FlowGraph {...args} value={open} onValueChange={setOpen} controls={detailId} label="Nightly build" />
        <p id={detailId} className="min-h-5 font-mono text-ui-sm text-fg-muted">
          {node ? `${node.label} · ${node.status}${node.meta ? ` · ${node.meta}` : ''}` : 'Pick a step to open it.'}
        </p>
      </div>
    )
  },
}

/** Top to bottom, as it lays out on its own in a narrow canvas. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div className="w-[24rem] max-w-full">
      <FlowGraph {...args} label="Nightly build" />
    </div>
  ),
}

/** A run that stopped: the join failed, so what follows it never ran. */
export const Failed: Story = {
  args: {
    nodes: NODES.map((n) =>
      n.id === 'revenue' ? { ...n, status: 'error', meta: 'OOM at 3.1 GB' } : ['mrr', 'churn', 'fresh', 'publish', 'backfill'].includes(n.id) ? { ...n, status: 'skipped', meta: undefined } : n,
    ),
  },
  render: (args) => (
    <div className="w-[60rem] max-w-full">
      <FlowGraph {...args} label="Nightly build" />
    </div>
  ),
}
