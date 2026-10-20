'use client'

import { memo, useState } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { ArrowUpDownIcon, PlusIcon, TrashIcon } from '@youj/icons'

interface Deploy {
  id: number
  branch: string
  commit: string
  age: number
  status: 'Ready' | 'Building' | 'Error'
}

const SEED: Deploy[] = [
  { id: 1, branch: 'main', commit: 'Tighten cache headers', age: 4, status: 'Ready' },
  { id: 2, branch: 'feat/search', commit: 'Debounce the query', age: 12, status: 'Building' },
  { id: 3, branch: 'fix/auth-redirect', commit: 'Keep the return path', age: 31, status: 'Ready' },
  { id: 4, branch: 'chore/deps', commit: 'Bump motion to 13', age: 58, status: 'Error' },
]
const INCOMING = ['feat/onboarding', 'fix/tooltips', 'perf/images']
const DOT = { Ready: 'bg-success', Building: 'bg-warning', Error: 'bg-danger' }
const button =
  'inline-flex h-7 items-center gap-1.5 rounded-md border border-line px-2 text-xs font-medium text-fg-muted outline-none transition-colors yj-duration-fast ease-standard hover:text-fg focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50'
// Dividers live on the cells: with border-collapse the table grid paints them, and they'd stay behind while rows move.
const cell = 'border-b border-line px-3 py-2 [tr:last-child>&]:border-b-0'

// Memoized on purpose: rows still glide, because PresenceItem re-measures whenever the list renders.
const Row = memo(function Row({ deploy, onRemove }: { deploy: Deploy; onRemove: (id: number) => void }) {
  return (
    <PresenceItem as="tr" className="bg-surface">
      <td className={`${cell} ps-4`}>
        <span className="inline-flex items-center gap-2 font-mono text-[13px] text-fg">
          <span aria-hidden className={`size-1.5 rounded-full ${DOT[deploy.status]}`} />
          {deploy.branch}
        </span>
        <span className="sr-only">, {deploy.status}</span>
      </td>
      <td className={`${cell} truncate text-fg-muted`}>{deploy.commit}</td>
      <td className={`${cell} text-end font-mono text-xs text-fg-muted tabular-nums`}>{deploy.age}m</td>
      <td className={`${cell} pe-2 text-end`}>
        <button type="button" aria-label={`Remove ${deploy.branch}`} onClick={() => onRemove(deploy.id)} className={`${button} w-7 justify-center border-transparent px-0`}>
          <TrashIcon size={13} />
        </button>
      </td>
    </PresenceItem>
  )
})

export default function PresenceListTable() {
  const [rows, setRows] = useState(SEED)
  const [byBranch, setByBranch] = useState(false)
  const [next, setNext] = useState(0)
  const sorted = [...rows].sort((a, b) => (byBranch ? a.branch.localeCompare(b.branch) : a.age - b.age))
  const remove = (id: number) => setRows((r) => r.filter((d) => d.id !== id))

  return (
    <div className="flex min-h-[300px] w-full max-w-2xl flex-col">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
          <p className="text-sm font-medium text-fg">Deployments</p>
          <div className="flex gap-1.5">
            <button type="button" className={button} onClick={() => setByBranch((b) => !b)}>
              <ArrowUpDownIcon size={13} />
              Sort by {byBranch ? 'age' : 'branch'}
            </button>
            <button
              type="button"
              className={button}
              disabled={next >= INCOMING.length}
              onClick={() => {
                setRows((r) => [{ id: 100 + next, branch: INCOMING[next]!, commit: 'Preview build', age: 0, status: 'Building' }, ...r])
                setNext((n) => n + 1)
              }}
            >
              <PlusIcon size={13} />
              Deploy
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {/* border-separate + fixed columns: rows can move without dragging borders or reflowing widths. */}
          <table className="w-full min-w-[480px] table-fixed border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-start text-xs text-fg-muted [&>th]:border-b [&>th]:border-line [&>th]:px-3 [&>th]:py-2 [&>th]:font-medium">
                <th className="w-[38%] ps-4 text-start">Branch</th>
                <th className="text-start">Commit</th>
                <th className="w-16 text-end">Age</th>
                <th className="w-12">
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
      </div>
    </div>
  )
}
