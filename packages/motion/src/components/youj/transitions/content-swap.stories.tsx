import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { RotateCcw } from 'lucide-react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ContentSwap, type ContentSwapProps } from './content-swap'

const meta: Meta<ContentSwapProps> = {
  title: 'Motion/Transitions/ContentSwap',
  component: ContentSwap,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Skeleton → content. The placeholder drops away quickly while the content resolves into focus (a touch of blur and rise on the `enter` curve), and the box morphs from the placeholder’s height to the content’s so what sits below moves instead of jumping. The outgoing layer is popped out of flow so the box can measure the incoming one at once; a swap mid-morph starts from the current height; it works in both directions (refetch). The region is `aria-busy` while loading, the skeleton is hidden from assistive tech, and `loadingLabel` adds a polite announcement. Reduced motion swaps instantly.',
      },
    },
  },
}
export default meta
type Story = StoryObj<ContentSwapProps>

/* The pulse stops for the OS setting (motion-reduce) and for a provider forcing reduced motion (data-yj-reduced). */
const bar = 'rounded-md bg-well animate-pulse motion-reduce:animate-none in-data-yj-reduced:animate-none'

function InvoicesSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5">
      <div className={`${bar} h-4 w-32`} />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`${bar} size-8 rounded-full`} />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className={`${bar} h-3 w-2/5`} />
            <div className={`${bar} h-3 w-1/4`} />
          </div>
          <div className={`${bar} h-3 w-14`} />
        </div>
      ))}
    </div>
  )
}

const INVOICES = [
  ['Acme Corp', 'INV-2041 · Due Oct 12', '$4,200.00', 'AC'],
  ['Globex', 'INV-2040 · Paid Sep 28', '$1,180.00', 'GL'],
  ['Initech', 'INV-2039 · Paid Sep 21', '$860.00', 'IN'],
  ['Umbrella', 'INV-2038 · Overdue 4 days', '$2,975.50', 'UM'],
]

function Invoices() {
  return (
    <div className="flex flex-col gap-3 p-5">
      <p className="text-sm font-medium text-fg">Recent invoices</p>
      {INVOICES.map(([name, meta, amount, initials]) => (
        <div key={name} className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-full bg-well text-[11px] font-medium text-fg-muted">{initials}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-fg">{name}</p>
            <p className="text-xs text-fg-muted">{meta}</p>
          </div>
          <span className="font-mono text-sm text-fg tabular-nums">{amount}</span>
        </div>
      ))}
    </div>
  )
}

function Card({ latency = 1200 }: { latency?: number }) {
  const [loading, setLoading] = useState(true)
  const [run, setRun] = useState(0)
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), latency)
    return () => clearTimeout(t)
  }, [run, latency])
  return (
    <div className="flex w-full max-w-[440px] flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <ContentSwap loading={loading} fallback={<InvoicesSkeleton />} loadingLabel="Loading invoices">
          <Invoices />
        </ContentSwap>
      </div>
      <p className="text-xs text-fg-muted">Four invoices arrive where the skeleton showed three rows: the card grows as they resolve in.</p>
      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        className="inline-flex w-fit items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-fg-muted hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <RotateCcw className="size-3.5" />
        Refetch
      </button>
    </div>
  )
}

/** Invoices loading into a card. Refetch to watch the skeleton come back and resolve again. */
export const Hero: Story = {
  render: () => <Card />,
}

/** Reduced motion: the skeleton is swapped for the content instantly (and the skeleton itself stops pulsing). */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <Card />
    </YoujProvider>
  ),
}
