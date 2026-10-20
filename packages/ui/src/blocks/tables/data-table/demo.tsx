'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { CheckCircleIcon, CircleDashedIcon, CircleXIcon, CopyIcon, ExternalLinkIcon, LoaderRingIcon, RotateCcwIcon, TrashIcon } from '@youj/icons'
import { useLocale } from '@youj/core'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import {
  DataTableConfirmAction,
  createDataTableColumnHelper,
  createRowActionsColumn,
  type DataTableColumnDef,
} from '../../../components/ui/data-table'
import type { DataTableInitialState, DataTableProps, DataTableSelection } from './props'
import { dateTimeFormat } from '../../../lib/utils'

/* The block's own demo: 48 deployments of a web app, what it shows when the
 * app passes no `rows` or `columns`. Seeded, so the server and the browser
 * render the same rows, and dated from a fixed moment, never the clock. */

export type DeploymentStatus = 'ready' | 'building' | 'error' | 'canceled'

export interface Deployment {
  id: string
  commit: string
  branch: string
  author: string
  environment: 'Production' | 'Preview'
  status: DeploymentStatus
  /** Build time, in seconds. */
  duration: number
  createdAt: string
}

export const DEMO_COPY = {
  title: 'Deployments',
  description: 'Every build of acme-web, newest first.',
  noun: 'deployments',
  search: 'Search deployments…',
  status: { ready: 'Ready', building: 'Building', error: 'Error', canceled: 'Canceled' } satisfies Record<DeploymentStatus, string>,
  redeploy: 'Redeploy',
  delete: 'Delete',
  deleteDescription: 'Their preview URLs stop working. Production keeps serving the current deployment.',
  openPreview: 'Open preview',
  copyUrl: 'Copy URL',
}

const STATUS_VARIANT = { ready: 'success', building: 'default', error: 'danger', canceled: 'secondary' } as const
const STATUS_ICON = { ready: CheckCircleIcon, building: LoaderRingIcon, error: CircleXIcon, canceled: CircleDashedIcon }

export function makeDeployments(count: number): Deployment[] {
  let seed = 11
  const next = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  const pick = <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)]!
  const commits = ['Tighten cache headers', 'New pricing page', 'Debounce the search query', 'Prorate seat changes', 'OG images for posts', 'Bump motion to 13', 'Keep the return path on sign-in', 'Stream the activity feed']
  const statuses: DeploymentStatus[] = ['ready', 'ready', 'ready', 'ready', 'building', 'error', 'canceled']
  let at = Date.UTC(2026, 8, 26, 9, 0)
  return Array.from({ length: count }, (_, i) => {
    at -= Math.floor(next() * 5 * 3_600_000) + 600_000
    return {
      id: `dpl_${(0x4f2a91 + i * 7919).toString(16)}`,
      commit: pick(commits),
      branch: pick(['main', 'main', 'feat/pricing', 'feat/search', 'fix/auth-redirect', 'chore/deps']),
      author: pick(['Priya Raman', 'Jonas Weber', 'Ana Lima', 'Kenji Sato', 'Sara Okafor']),
      environment: next() > 0.6 ? 'Production' : 'Preview',
      status: pick(statuses),
      duration: 18 + Math.floor(next() * 140), // youj-allow: a build's length in seconds, not a motion duration
      createdAt: new Date(at).toISOString(),
    }
  })
}

function Created({ iso }: { iso: string }) {
  const locale = useLocale()
  const format = useMemo(() => dateTimeFormat(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }), [locale])
  return <span className="text-fg-muted">{format.format(new Date(iso))}</span>
}

const col = createDataTableColumnHelper<Deployment>()

/** The demo's columns, rows and actions; a delete or a redeploy changes its own rows. */
export function useDemo(active: boolean) {
  const [rows, setRows] = useState(() => (active ? makeDeployments(48) : []))
  const copy = DEMO_COPY
  const columns = useMemo<DataTableColumnDef<Deployment>[]>(() => {
    const remove = (ids: string[]) => setRows((list) => list.filter((d) => !ids.includes(d.id)))
    const redeploy = (ids: string[]) => setRows((list) => list.map((d) => (ids.includes(d.id) ? { ...d, status: 'building' } : d)))
    return [
      ...col.columns([
        col.accessor('commit', {
          header: 'Commit',
          size: 240,
          minSize: 180,
          cell: (ctx) => (
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{ctx.getValue()}</span>
              <span className="truncate text-ui-xs text-fg-muted">
                <span className="font-mono">{ctx.row.original.branch}</span> · {ctx.row.original.author}
              </span>
            </span>
          ),
          meta: { grow: true, skeleton: 'text' },
        }),
        col.accessor('status', {
          header: 'Status',
          size: 112,
          cell: (ctx) => <Badge variant={STATUS_VARIANT[ctx.getValue()]}>{copy.status[ctx.getValue()]}</Badge>,
          meta: {
            skeleton: 'badge',
            exportValue: (value) => copy.status[value as DeploymentStatus],
            filter: { type: 'select', options: (Object.keys(copy.status) as DeploymentStatus[]).map((value) => ({ value, label: copy.status[value], icon: STATUS_ICON[value] })) },
          },
        }),
        col.accessor('environment', { header: 'Environment', size: 120, meta: { filter: { type: 'select' }, cellClassName: 'text-fg-muted' } }),
        col.accessor('duration', {
          header: 'Duration',
          size: 116,
          cell: (ctx) => `${ctx.getValue()}s`,
          meta: { numeric: true, filter: { type: 'number-range', min: 0, max: 160, step: 5, format: (n) => `${n}s` } },
        }),
        col.accessor((row) => new Date(row.createdAt), {
          id: 'createdAt',
          header: 'Created',
          size: 140,
          sortFn: 'datetime',
          cell: (ctx) => <Created iso={ctx.row.original.createdAt} />,
          meta: { label: 'Created', exportValue: (_, row) => (row as Deployment).createdAt },
        }),
      ]),
      createRowActionsColumn<Deployment>({
        label: (d) => d.id,
        actions: (d) => [
          { label: copy.openPreview, icon: ExternalLinkIcon, onSelect: () => {} },
          { label: copy.copyUrl, icon: CopyIcon, onSelect: () => void navigator.clipboard?.writeText(`https://${d.id}.acme.dev`).catch(() => {}) },
          { label: copy.redeploy, icon: RotateCcwIcon, disabled: d.status === 'building', onSelect: () => redeploy([d.id]) },
          { label: copy.delete, icon: TrashIcon, destructive: true, separated: true, onSelect: () => remove([d.id]) },
        ],
      }),
    ]
  }, [copy])

  const bulkActions = (selection: DataTableSelection<Deployment>): ReactNode => (
    <>
      <Button variant="ghost" size="sm" onClick={() => setRows((list) => list.map((d) => (selection.ids.includes(d.id) ? { ...d, status: 'building' } : d)))}>
        <RotateCcwIcon />
        {copy.redeploy}
      </Button>
      <DataTableConfirmAction
        label={copy.delete}
        icon={<TrashIcon />}
        count={selection.count}
        noun={copy.noun}
        description={copy.deleteDescription}
        onConfirm={() => {
          setRows((list) => list.filter((d) => !selection.ids.includes(d.id)))
          selection.clear()
        }}
      />
    </>
  )

  // What the demo turns on; anything the app passes wins.
  const props: Partial<DataTableProps<Deployment>> = {
    title: copy.title,
    description: copy.description,
    enableRowSelection: true,
    exportable: { filename: 'deployments' },
    search: { placeholder: copy.search },
    initialState: DEMO_STATE,
    bulkActions,
  }
  return { rows, columns, props, copy }
}

/** Rows are named by their deployment id. */
export const DEMO_ROW_ID = (row: Deployment) => row.id

const DEMO_STATE: DataTableInitialState = {
  sorting: [{ id: 'createdAt', desc: true }],
  pagination: { pageSize: 10 },
  columnPinning: { end: ['actions'] },
}
