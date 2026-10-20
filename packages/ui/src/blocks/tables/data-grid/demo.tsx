'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ArchiveIcon, ArrowUpRightIcon, CheckCircleIcon, LinkIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import type { DataGridRowAction } from './body'
import { createDataGridColumns } from './columns'
import type { DataGridPerson } from './model'
import type { DataGridProps, DataGridSelection, DataGridView } from './props'

/* The block's own demo: a product team's projects, what it shows when the app
 * passes no `rows` or `columns`. Seeded, so the server and the browser render
 * the same rows, and dated from a fixed moment, never the clock. */

export const DEMO_NOW = Date.UTC(2026, 8, 29, 9, 0)
const DAY = 86_400_000

export type ProjectStatus = 'on-track' | 'at-risk' | 'off-track' | 'paused' | 'done'

export interface Project {
  id: string
  name: string
  team: 'Platform' | 'Growth' | 'Mobile' | 'Design systems' | 'Security'
  status: ProjectStatus
  members: DataGridPerson[]
  done: number
  tasks: number
  /** Story points shipped each week, the last ten weeks. */
  velocity: number[]
  budget: number
  target: string
  tags: string[]
  summary: string
}

export const DEMO_COPY = {
  title: 'Projects',
  description: 'Every project in the Q4 plan, with who is on it and how it is going.',
  noun: 'projects',
  search: 'Search projects…',
  status: { 'on-track': 'On track', 'at-risk': 'At risk', 'off-track': 'Off track', paused: 'Paused', done: 'Done' } satisfies Record<ProjectStatus, string>,
  columns: { name: 'Project', status: 'Status', members: 'Team', done: 'Progress', velocity: 'Velocity', budget: 'Budget', target: 'Target', tags: 'Tags', team: 'Group' },
  views: { all: 'All projects', risk: 'Needs attention', shipping: 'Shipping this month' },
  open: 'Open project',
  copyLink: 'Copy link',
  markOnTrack: 'Mark on track',
  archive: 'Archive',
  next: 'Next milestone',
}

const STATUS_TONE = { 'on-track': 'success', 'at-risk': 'warning', 'off-track': 'danger', paused: 'neutral', done: 'accent' } as const
const TAGS = { q4: { label: 'Q4 plan' }, customer: { label: 'Customer ask' }, infra: { label: 'Infrastructure' }, a11y: { label: 'Accessibility' }, launch: { label: 'Launch' } } as const
const PEOPLE: DataGridPerson[] = [
  { id: 'mira', name: 'Mira Chen' },
  { id: 'jonas', name: 'Jonas Weber' },
  { id: 'priya', name: 'Priya Raman' },
  { id: 'kenji', name: 'Kenji Sato' },
  { id: 'sara', name: 'Sara Okafor' },
  { id: 'leo', name: 'Leo Martins' },
  { id: 'ana', name: 'Ana Lima' },
]
const PROJECTS: ReadonlyArray<[string, Project['team'], string]> = [
  ['Usage-based billing', 'Growth', 'Meter API calls and bill them monthly.'],
  ['Passkeys', 'Security', 'Sign in with a passkey on every platform.'],
  ['Offline mode', 'Mobile', 'Keep working on a plane; sync when back.'],
  ['Design tokens v3', 'Design systems', 'One token set for web, iOS and Android.'],
  ['Audit log export', 'Security', 'Stream the audit log to a customer bucket.'],
  ['Onboarding checklist', 'Growth', 'Five steps to a team’s first project.'],
  ['Search rewrite', 'Platform', 'Typo-tolerant search across every object.'],
  ['Postgres 17', 'Platform', 'Upgrade the primary cluster with no downtime.'],
  ['Widgets', 'Mobile', 'Home-screen widgets for today’s tasks.'],
  ['Dark mode polish', 'Design systems', 'Every surface checked in dark at AA.'],
  ['SCIM provisioning', 'Security', 'Sync users and groups from the IdP.'],
  ['Referral program', 'Growth', 'Give a month, get a month.'],
  ['Edge caching', 'Platform', 'Cache the read API at the edge.'],
  ['Screen reader pass', 'Design systems', 'Audit and fix every flow with VoiceOver and NVDA.'],
  ['Push digest', 'Mobile', 'One quiet push a day instead of twenty.'],
  ['Data residency', 'Platform', 'Keep EU workspaces’ data in the EU.'],
  ['Annual plans', 'Growth', 'Pay yearly, save two months.'],
  ['Rate limits v2', 'Platform', 'Per-key limits with headers that explain them.'],
]

export function makeProjects(): Project[] {
  let seed = 23
  const next = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  const statuses: ProjectStatus[] = ['on-track', 'on-track', 'on-track', 'at-risk', 'off-track', 'paused', 'done']
  const tagKeys = Object.keys(TAGS)
  return PROJECTS.map(([name, team, summary], i) => {
    const status = statuses[Math.floor(next() * statuses.length)]!
    const tasks = 12 + Math.floor(next() * 48)
    const ratio = status === 'done' ? 1 : status === 'off-track' ? 0.15 + next() * 0.3 : 0.25 + next() * 0.65
    let level = 8 + next() * 14
    const drift = status === 'off-track' ? -0.07 : status === 'at-risk' ? -0.03 : 0.03
    return {
      id: `prj_${(0x2b7e15 + i * 7919).toString(16)}`,
      name,
      team,
      status,
      members: [...PEOPLE].sort(() => next() - 0.5).slice(0, 1 + Math.floor(next() * 4)),
      done: Math.round(tasks * ratio),
      tasks,
      velocity: Array.from({ length: 10 }, () => Math.round((level = Math.max(2, level * (1 + drift + (next() - 0.5) * 0.3))))),
      budget: Math.round((40 + next() * 260) * 1000),
      target: new Date(DEMO_NOW + Math.round((next() * 110 - 15) * DAY)).toISOString(),
      tags: [...tagKeys].sort(() => next() - 0.5).slice(0, Math.floor(next() * 3.4)),
      summary,
    }
  })
}

const col = createDataGridColumns<Project>()

export function projectColumns(copy = DEMO_COPY) {
  const h = copy.columns
  const status = Object.fromEntries((Object.keys(STATUS_TONE) as ProjectStatus[]).map((key) => [key, { label: copy.status[key], tone: STATUS_TONE[key] }]))
  return [
    col.identity('name', { header: h.name, shape: 'square', secondary: (p) => p.team, size: 240 }),
    col.status('status', { header: h.status, options: status, size: 128 }),
    col.people('members', { header: h.members, size: 120 }),
    col.meter('done', { header: h.done, max: (p) => p.tasks, tone: (ratio) => (ratio >= 1 ? 'success' : 'neutral'), size: 156 }),
    col.trend('velocity', { header: h.velocity, size: 160 }),
    col.currency('budget', { header: h.budget, currency: 'USD', compact: true, size: 112 }),
    col.date('target', { header: h.target, size: 124 }),
    col.tags('tags', { header: h.tags, options: TAGS, size: 200, minSize: 170, meta: { grow: true } }),
    col.text('team', { header: h.team, groupable: true, facet: true, size: 140 }),
  ]
}

/** The demo's columns, rows, views and actions; archiving or marking a project changes its own rows. */
export function useDemo(active: boolean) {
  const [rows, setRows] = useState(() => (active ? makeProjects() : []))
  const copy = DEMO_COPY
  const columns = useMemo(() => projectColumns(copy), [copy])
  const update = (ids: string[], change: (p: Project) => Project | null) =>
    setRows((list) => list.flatMap((p) => (ids.includes(p.id) ? (change(p) ?? []) : [p])))
  const views: DataGridView[] = [
    { id: 'all', label: copy.views.all, state: {}, count: rows.length },
    { id: 'risk', label: copy.views.risk, state: { columnFilters: [{ id: 'status', value: ['at-risk', 'off-track'] }] }, count: rows.filter((p) => p.status === 'at-risk' || p.status === 'off-track').length },
    {
      id: 'shipping',
      label: copy.views.shipping,
      state: { sorting: [{ id: 'target', desc: false }], columnFilters: [{ id: 'status', value: ['on-track', 'at-risk', 'off-track'] }] },
    },
  ]
  const rowActions = (): DataGridRowAction<Project>[] => [
    { label: copy.open, icon: ArrowUpRightIcon, inline: true, onSelect: () => {} },
    { label: copy.copyLink, icon: LinkIcon, inline: true, onSelect: (p) => void navigator.clipboard?.writeText(`https://acme.dev/projects/${p.id}`).catch(() => {}) },
    { label: copy.markOnTrack, icon: CheckCircleIcon, onSelect: (p) => update([p.id], (x) => ({ ...x, status: 'on-track' })) },
    { label: copy.archive, icon: ArchiveIcon, destructive: true, separated: true, onSelect: (p) => update([p.id], () => null) },
  ]
  const bulkActions = (selection: DataGridSelection<Project>): ReactNode => (
    <>
      <Button variant="ghost" size="sm" onClick={() => update(selection.ids, (p) => ({ ...p, status: 'on-track' }))}>
        <CheckCircleIcon />
        {copy.markOnTrack}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-danger-text hover:bg-danger-subtle hover:text-danger-text"
        onClick={() => {
          update(selection.ids, () => null)
          selection.clear()
        }}
      >
        <ArchiveIcon />
        {copy.archive}
      </Button>
    </>
  )
  const renderDetail = (p: Project) => (
    <div className="grid gap-1 text-ui-sm">
      <p className="text-fg">{p.summary}</p>
      <p className="text-fg-muted">
        {copy.next}: {Math.max(0, p.tasks - p.done)} / {p.tasks}
      </p>
    </div>
  )
  // What the demo turns on; anything the app passes wins.
  const props: Partial<DataGridProps<Project>> = {
    title: copy.title,
    description: copy.description,
    selectable: true,
    views,
    rowActions,
    bulkActions,
    renderDetail,
    search: { placeholder: copy.search },
    now: DEMO_NOW,
    pageSize: 10,
    // Shown at first: what fits a laptop's width without scrolling; Tags, Budget and Team are a View options click away.
    initialState: { columnVisibility: { team: false, tags: false, budget: false } },
  }
  return { rows, columns, props, copy }
}
