import { useState, type MouseEvent } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider, ThemeScope } from '@youj/core/lib/youj/provider'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
} from './pagination'

const meta: Meta<typeof Pagination> = {
  title: 'UI/Navigation/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'shadcn\'s pagination: a named `nav` of links, the current one marked aria-current="page". The raised key under the current page is one motion SlidingIndicator in the nav, gliding between pages on the `smooth` spring (it jumps under reduced motion). Previous / Next nudge their chevron toward where they go on hover (mirrored in RTL) and, at the edges, render without an href and with aria-disabled. `paginationRange(page, pageCount, siblings)` returns the first and last pages, the siblings around the current one and ellipses, always in 5 + 2 × siblings slots, so the control keeps its width while paging.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Pagination>

function Pager({ pageCount, initial = 1, siblings = 1, label }: { pageCount: number; initial?: number; siblings?: number; label?: string }) {
  const [page, setPage] = useState(initial)
  const go = (next: number) => (event: MouseEvent) => {
    event.preventDefault()
    setPage(Math.min(Math.max(next, 1), pageCount))
  }
  return (
    <Pagination aria-label={label}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href={`?page=${page - 1}`} disabled={page === 1} onClick={go(page - 1)} />
        </PaginationItem>
        {paginationRange(page, pageCount, siblings).map((item) =>
          typeof item === 'number' ? (
            <PaginationItem key={item}>
              <PaginationLink href={`?page=${item}`} isActive={item === page} aria-label={`Page ${item}`} onClick={go(item)}>
                {item}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationEllipsis />
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext href={`?page=${page + 1}`} disabled={page === pageCount} onClick={go(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

const INVOICES = Array.from({ length: 5 }, (_, i) => ({
  id: `INV-${2041 + i}`,
  customer: ['Linear', 'Vercel', 'Raycast', 'Resend', 'Figma'][i]!,
  amount: [1280, 640, 2400, 96, 4800][i]!,
}))

/** An invoice table's footer: the range on the left, the pager on the right. Page with the links or Tab and Enter. */
export const Hero: Story = {
  render: () => (
    <div className="w-full max-w-[680px] overflow-hidden rounded-xl border border-line bg-surface">
      <ul className="divide-y divide-line">
        {INVOICES.map((inv) => (
          <li key={inv.id} className="flex items-center gap-4 px-4 py-2.5 text-ui">
            <span className="w-24 font-mono text-ui-sm text-fg-muted">{inv.id}</span>
            <span className="flex-1 text-fg">{inv.customer}</span>
            <span className="text-fg tabular-nums">${inv.amount.toLocaleString('en-US')}.00</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-t border-line px-4 py-2.5">
        <p className="shrink-0 text-ui-sm text-fg-muted tabular-nums">Showing 41–60 of 1,284</p>
        <div className="min-w-0">
          <Pager pageCount={65} initial={3} />
        </div>
      </div>
    </div>
  ),
}

/** Few pages: every page shows, and the key glides between them. */
export const FewPages: Story = {
  render: () => <Pager pageCount={5} initial={2} />,
}

/** Many pages: the first and last stay, the current page keeps a sibling either side, and the width never changes. */
export const ManyPages: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Pager pageCount={20} initial={1} label="Issues pages" />
      <Pager pageCount={20} initial={10} label="Pull request pages" />
      <Pager pageCount={240} initial={120} siblings={2} label="Audit log pages" />
    </div>
  ),
}

/** dir="rtl": pages read from the right, and the chevrons point (and nudge) the other way. */
export const RightToLeft: Story = {
  render: () => (
    <ThemeScope dir="rtl">
      <div dir="rtl">
        <Pager pageCount={20} initial={4} />
      </div>
    </ThemeScope>
  ),
}

/** Reduced motion: the key jumps to the new page. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <Pager pageCount={12} initial={2} />
    </YoujProvider>
  ),
}
