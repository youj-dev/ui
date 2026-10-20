import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProgressList, TransferSummary, type TransferItem, type ProgressListProps } from './progress-list'

const MB = 1_000_000

const ITEMS: TransferItem[] = [
  { id: '1', name: 'hero-still-04.png', size: 14.6 * MB, transferred: 9.4 * MB, rate: 2.9 * MB, status: 'active' },
  { id: '2', name: 'launch-film-master.mov', size: 2310 * MB, transferred: 1402 * MB, rate: 18.9 * MB, status: 'active' },
  { id: '3', name: 'eval-traces-0926.jsonl', size: 386 * MB, transferred: 243 * MB, status: 'failed', error: 'Connection reset at 63%' },
  { id: '4', name: 'brand-guidelines.key', size: 212 * MB, transferred: 81 * MB, status: 'paused' },
  { id: '5', name: 'q4-planning-deck.pdf', size: 38.2 * MB, transferred: 0, status: 'queued' },
  { id: '6', name: 'q3-board-review.pdf', size: 48.2 * MB, transferred: 48.2 * MB, status: 'done' },
  { id: '7', name: 'crm-export-0927.csv', size: 96 * MB, transferred: 96 * MB, status: 'done' },
]

/** A small engine for the stories: active rows move every half second, and the actions change state. */
function useDemo(initial: TransferItem[]) {
  const [items, setItems] = useState(initial)
  useEffect(() => {
    const id = setInterval(
      () =>
        setItems((list) =>
          list.map((i) => {
            if (i.status !== 'active') return i
            const transferred = Math.min(i.size, i.transferred + (i.rate ?? 4 * MB) * 0.5 * (0.8 + Math.random() * 0.4))
            return transferred >= i.size ? { ...i, transferred, rate: undefined, status: 'done' as const } : { ...i, transferred }
          }),
        ),
      500,
    )
    return () => clearInterval(id)
  }, [])
  const set = (id: string, change: Partial<TransferItem>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...change } : i)))
  return {
    items,
    onPause: (id: string) => set(id, { status: 'paused', rate: undefined }),
    onResume: (id: string) => set(id, { status: 'active', rate: 6 * MB }),
    onRetry: (id: string) => set(id, { status: 'active', rate: 8 * MB, error: undefined }),
    onCancel: (id: string) => setItems((list) => list.filter((i) => i.id !== id)),
    onPauseAll: () => setItems((list) => list.map((i) => (i.status === 'active' || i.status === 'queued' ? { ...i, status: 'paused' as const, rate: undefined } : i))),
    onResumeAll: () => setItems((list) => list.map((i) => (i.status === 'paused' ? { ...i, status: 'active' as const, rate: 6 * MB } : i))),
    onCancelAll: () => setItems((list) => list.filter((i) => i.status === 'done')),
  }
}

const meta: Meta<ProgressListProps> = {
  title: 'UI/Data/Progress List',
  component: ProgressList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'File transfers in flight, one row each: a run of cells that lights as the bytes move, what has moved of the size, the live rate and time left in mono, and pause, resume and cancel per row (Retry on a failed one). Failed rows come first, then moving, then queued; done rows settle into a compact row with a drawn check and sink to the foot. Past `max` rows the rest fold under "Show N more". `TransferSummary` is the header: bytes moved of the total, an overall SegmentedMeter, the combined rate and time left, and optional Pause all / Resume all / Cancel all. Finishing and failing are announced. Reduced motion: cells light at once, rows settle in place, nothing breathes.',
      },
    },
  },
  args: { max: 6, segments: 32 },
}
export default meta
type Story = StoryObj<ProgressListProps>

/** The list and its summary, moving: pause, resume, cancel and retry rows, or everything at once. */
export const Default: Story = {
  name: 'File transfers',
  render: function Render(args) {
    const demo = useDemo(ITEMS)
    return (
      <div className="flex w-[36rem] max-w-[calc(100vw-2rem)] flex-col gap-6 rounded-2xl border border-line bg-surface p-5">
        <TransferSummary items={demo.items} onPauseAll={demo.onPauseAll} onResumeAll={demo.onResumeAll} onCancelAll={demo.onCancelAll} />
        <ProgressList {...args} items={demo.items} onPause={demo.onPause} onResume={demo.onResume} onCancel={demo.onCancel} onRetry={demo.onRetry} />
      </div>
    )
  },
}

/** Rows past `max` fold under "Show N more", with what they hold. */
export const Folded: Story = {
  args: { max: 3 },
  render: (args) => (
    <div className="w-[36rem] max-w-[calc(100vw-2rem)]">
      <ProgressList {...args} items={ITEMS} onCancel={() => {}} onPause={() => {}} onResume={() => {}} onRetry={() => {}} />
    </div>
  ),
}

/** Read-only: without callbacks there are no buttons, just the state of each file. */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: (args) => (
    <div className="w-[36rem] max-w-[calc(100vw-2rem)]">
      <ProgressList {...args} items={ITEMS} />
    </div>
  ),
}
