import { memo, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowDownUp, Pin, Plus, Trash2, X } from 'lucide-react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { PresenceItem, PresenceList } from './presence-list'

const meta: Meta<typeof PresenceList> = {
  title: 'Motion/Transitions/PresenceList',
  component: PresenceList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '`PresenceList` + `PresenceItem`: insert, remove and reorder for lists **and table rows**. Rows enter in their slot, fading down a few px while the rows below glide to make room; removed rows fade where they stand (keeping their space, so column widths hold, and inert at once), then the rows below glide up; reorders glide to the new slots. Movement is FLIP on translate only (`layout="position"`, `smooth` spring): no scale, so cells, borders and text never distort. It avoids the table pitfalls: no `popLayout` (an absolute `<tr>` loses table layout), no height collapse (rows can\'t be clipped), and rows are measured against the list (a layout root), so the list moving doesn\'t make rows glide. Tables need `border-separate border-spacing-0` with dividers on the cells: collapsed borders are painted by the table grid and stay behind while rows move. Each list is its own `LayoutGroup`, and items re-measure whenever the list renders, even when rows are memoized. Reduced motion applies every change instantly.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PresenceList>

interface Deploy {
  id: number
  branch: string
  commit: string
  author: string
  age: number
  status: 'ready' | 'building' | 'error'
}

const SEED: Deploy[] = [
  { id: 1, branch: 'main', commit: 'a41f9e2 Tighten cache headers', author: 'ada', age: 4, status: 'ready' },
  { id: 2, branch: 'feat/search', commit: '9c02b1d Debounce the query', author: 'grace', age: 12, status: 'building' },
  { id: 3, branch: 'fix/auth-redirect', commit: '77e1a08 Keep the return path', author: 'linus', age: 31, status: 'ready' },
  { id: 4, branch: 'chore/deps', commit: '0b9d3c4 Bump motion to 13', author: 'margaret', age: 58, status: 'error' },
  { id: 5, branch: 'feat/billing', commit: 'e13f7aa Prorate seat changes', author: 'alan', age: 95, status: 'ready' },
]
const NEW = [
  { branch: 'feat/onboarding', commit: '5d2c0e9 Skip empty steps', author: 'ada' },
  { branch: 'fix/tooltips', commit: 'c8b41f3 Flip near edges', author: 'grace' },
  { branch: 'perf/images', commit: '1aa6de0 Lazy decode avatars', author: 'linus' },
]

const STATUS = { ready: 'bg-success', building: 'bg-warning', error: 'bg-danger' } as const
const button =
  'inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-xs font-medium text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'

/* Memoized on purpose: rows still glide because PresenceItem re-measures with the list.
 * Dividers live on the cells and the table is border-separate: collapsed borders are
 * painted by the table grid and would stay behind while rows move. Rows get a surface
 * so two rows crossing during a re-sort occlude cleanly. */
const cell = 'border-b border-line [tr:last-child>&]:border-b-0'
const Row = memo(function Row({ deploy, onRemove }: { deploy: Deploy; onRemove: (id: number) => void }) {
  return (
    <PresenceItem as="tr" className="bg-surface transition-colors yj-duration-fast hover:bg-hover">
      <td className={cn(cell, 'py-2.5 pr-3 pl-4')}>
        <span className="inline-flex items-center gap-2 font-mono text-[13px] text-fg">
          <span aria-hidden className={cn('size-1.5 rounded-full', STATUS[deploy.status])} />
          <span className="sr-only">{deploy.status}: </span>
          {deploy.branch}
        </span>
      </td>
      <td className={cn(cell, 'truncate px-3 py-2.5 text-fg-muted')}>{deploy.commit}</td>
      <td className={cn(cell, 'px-3 py-2.5 text-fg-muted')}>{deploy.author}</td>
      <td className={cn(cell, 'px-3 py-2.5 text-right font-mono text-xs text-fg-muted tabular-nums')}>{deploy.age}m</td>
      <td className={cn(cell, 'py-2.5 pr-3 pl-1 text-right')}>
        <button
          type="button"
          aria-label={`Remove ${deploy.branch}`}
          onClick={() => onRemove(deploy.id)}
          className="grid size-7 place-items-center rounded-md text-fg-subtle hover:bg-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <X className="size-3.5" />
        </button>
      </td>
    </PresenceItem>
  )
})

function DeploymentsTable() {
  const [rows, setRows] = useState(SEED)
  const [sort, setSort] = useState<'age' | 'branch'>('age')
  const [next, setNext] = useState(0)
  const sorted = [...rows].sort((a, b) => (sort === 'age' ? a.age - b.age : a.branch.localeCompare(b.branch)))
  const remove = (id: number) => setRows((r) => r.filter((d) => d.id !== id))
  return (
    <div className="w-full max-w-[760px] overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="text-sm font-medium text-fg">Deployments</p>
          <p className="text-xs text-fg-muted">{rows.length} in the last two hours</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={button} onClick={() => setSort((s) => (s === 'age' ? 'branch' : 'age'))}>
            <ArrowDownUp className="size-3.5" />
            Sort by {sort === 'age' ? 'branch' : 'age'}
          </button>
          <button
            type="button"
            className={button}
            disabled={next >= NEW.length}
            onClick={() => {
              const n = NEW[next]
              if (!n) return
              setRows((r) => [{ id: 100 + next, age: 0, status: 'building', ...n }, ...r.map((d) => ({ ...d, age: d.age + 1 }))])
              setNext((i) => i + 1)
            }}
          >
            <Plus className="size-3.5" />
            New deploy
          </button>
        </div>
      </div>
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
        <colgroup>
          <col className="w-[190px]" />
          <col />
          <col className="w-[100px]" />
          <col className="w-[64px]" />
          <col className="w-[44px]" />
        </colgroup>
        <thead>
          <tr className="text-left text-xs text-fg-muted [&>th]:border-b [&>th]:border-line">
            <th className="py-2 pr-3 pl-4 font-medium">Branch</th>
            <th className="px-3 py-2 font-medium">Commit</th>
            <th className="px-3 py-2 font-medium">Author</th>
            <th className="px-3 py-2 text-right font-medium">Age</th>
            <th className="py-2 pr-3 pl-1">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <PresenceList as="tbody">
          {sorted.map((d) => (
            <Row key={d.id} deploy={d} onRemove={remove} />
          ))}
        </PresenceList>
      </table>
    </div>
  )
}

/** A deployments table: add a deploy, remove rows, re-sort. Rows are memoized and still glide. */
export const Hero: Story = {
  render: () => <DeploymentsTable />,
}

interface Note {
  id: number
  title: string
  body: string
  pinned: boolean
}

function Inbox() {
  const [notes, setNotes] = useState<Note[]>([
    { id: 1, title: 'Build failed on chore/deps', body: 'Type error in motion-dom typings.', pinned: false },
    { id: 2, title: 'Ada requested your review', body: 'feat/search: Debounce the query', pinned: false },
    { id: 3, title: 'Domain verified', body: 'acme.dev now serves production.', pinned: false },
    { id: 4, title: 'Usage at 80%', body: 'Image optimizations this month.', pinned: false },
  ])
  const ordered = [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned))
  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-line bg-surface p-2">
      <p className="px-2 pt-1 pb-2 text-xs font-medium text-fg-muted">Notifications</p>
      <PresenceList className="flex flex-col gap-1">
        {ordered.map((n) => (
            <PresenceItem key={n.id} className="group flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-hover">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-fg">
                  {n.pinned && <Pin aria-label="Pinned" className="mr-1.5 inline size-3 text-accent" />}
                  {n.title}
                </p>
                <p className="truncate text-xs text-fg-muted">{n.body}</p>
              </div>
              <button
                type="button"
                aria-label={n.pinned ? `Unpin ${n.title}` : `Pin ${n.title}`}
                onClick={() => setNotes((all) => all.map((x) => (x.id === n.id ? { ...x, pinned: !x.pinned } : x)))}
                className="grid size-7 place-items-center rounded-md text-fg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <Pin className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Dismiss ${n.title}`}
                onClick={() => setNotes((all) => all.filter((x) => x.id !== n.id))}
                className="grid size-7 place-items-center rounded-md text-fg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <Trash2 className="size-3.5" />
              </button>
            </PresenceItem>
        ))}
      </PresenceList>
      {notes.length === 0 && <p className="px-3 py-6 text-center text-sm text-fg-muted">You’re all caught up.</p>}
    </div>
  )
}

/** A list: pin moves an item to the top, dismiss removes it. */
export const List: Story = {
  render: () => <Inbox />,
}

/** Reduced motion: rows appear, leave and reorder instantly. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <DeploymentsTable />
    </YoujProvider>
  ),
}
