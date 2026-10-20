'use client'

import type { ComponentType } from 'react'
import {
  ActivityIcon,
  BarChartIcon,
  GitBranchIcon,
  GlobeIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LogsIcon,
  RocketIcon,
  SearchIcon,
  SettingsIcon,
  type IconProps,
} from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Kbd } from '../../../components/ui/kbd'
import { cn } from '../../../lib/utils'

/* Northwind's deployments view, drawn from the real components at a fixed
 * desktop width (the hero scales it to fit, like a screenshot). It is a
 * picture of the app: the hero renders it inert and hidden. */

export const SHOT_WIDTH = 1120
export const SHOT_HEIGHT = 680

const NAV: { icon: ComponentType<IconProps>; label: string; current?: boolean }[] = [
  { icon: LayoutDashboardIcon, label: 'Overview' },
  { icon: RocketIcon, label: 'Deployments', current: true },
  { icon: BarChartIcon, label: 'Analytics' },
  { icon: LogsIcon, label: 'Logs' },
  { icon: GlobeIcon, label: 'Domains' },
  { icon: SettingsIcon, label: 'Settings' },
]

type Status = 'Ready' | 'Building' | 'Failed' | 'Canceled'
const TONE = { Ready: 'success', Building: 'warning', Failed: 'danger', Canceled: 'secondary' } as const
const DOT = { Ready: 'bg-success', Building: 'bg-warning', Failed: 'bg-danger', Canceled: 'bg-fg-subtle' } as const

const DEPLOYS: { id: string; env: 'Production' | 'Preview'; current?: boolean; status: Status; message: string; branch: string; who: string; when: string; took: string }[] = [
  { id: 'dpl_9c41', env: 'Preview', status: 'Building', message: 'Lazy-load the size guide images', branch: 'perf/size-guide', who: 'MO', when: 'just now', took: '0:41' },
  { id: 'dpl_8f2c', env: 'Production', current: true, status: 'Ready', message: 'Checkout: remember the last shipping method', branch: 'main', who: 'TB', when: '12m ago', took: '0:23' },
  { id: 'dpl_8e07', env: 'Preview', status: 'Ready', message: 'Add Klarna to the payment step', branch: 'feat/klarna', who: 'PR', when: '38m ago', took: '0:27' },
  { id: 'dpl_8d93', env: 'Preview', status: 'Failed', message: 'Upgrade the image optimizer to v5', branch: 'deps/images-v5', who: 'GH', when: '1h ago', took: '1:12' },
  { id: 'dpl_8c1a', env: 'Production', status: 'Ready', message: 'Fix the currency switcher on Safari 17', branch: 'main', who: 'MO', when: '3h ago', took: '0:22' },
  { id: 'dpl_8b66', env: 'Preview', status: 'Canceled', message: 'Try a sticky add-to-bag bar', branch: 'exp/sticky-bag', who: 'AL', when: '5h ago', took: '0:09' },
  { id: 'dpl_8a20', env: 'Production', status: 'Ready', message: 'Autumn collection landing page', branch: 'main', who: 'PR', when: 'Yesterday', took: '0:31' },
]

function Sidebar() {
  return (
    <aside className="flex w-52 shrink-0 flex-col gap-1 border-e border-line bg-transparent p-3">
      <div className="mb-3 flex items-center gap-2.5 px-2 py-1.5">
        <span className="grid size-7 place-items-center rounded-md bg-accent text-ui-sm font-semibold text-on-accent">A</span>
        <span className="flex flex-col leading-tight">
          <span className="text-ui font-medium">Acme</span>
          <span className="text-ui-sm text-fg-muted">Pro · 12 seats</span>
        </span>
      </div>
      {NAV.map(({ icon: Icon, label, current }) => (
        <span
          key={label}
          className={cn('flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-ui text-fg-muted', current && 'bg-canvas text-fg shadow-xs')}
        >
          <Icon size={15} /> {label}
        </span>
      ))}
      <div className="mt-auto flex flex-col gap-2 rounded-lg border border-line bg-canvas p-3">
        <span className="flex flex-col text-ui-sm text-fg-muted">
          Build minutes <span className="text-fg tabular-nums">1,284 of 6,000</span>
        </span>
        <span className="h-1.5 overflow-hidden rounded-full bg-well">
          <span className="block h-full w-[21%] rounded-full bg-accent" />
        </span>
      </div>
    </aside>
  )
}

function Row({ d }: { d: (typeof DEPLOYS)[number] }) {
  return (
    <li className="grid grid-cols-[9rem_minmax(0,1fr)_9rem_6rem_4rem] items-center gap-4 px-5 py-3">
      <span className="flex flex-col gap-1">
        <span className="font-mono text-ui-sm text-fg">{d.id}</span>
        <span className="flex items-center gap-1.5">
          <span className="text-ui-sm text-fg-muted">{d.env}</span>
          {d.current && <Badge variant="solid">Current</Badge>}
        </span>
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-ui text-fg">{d.message}</span>
        <span className="inline-flex items-center gap-1.5 text-ui-sm text-fg-muted">
          <GitBranchIcon size={13} /> {d.branch}
        </span>
      </span>
      <span className="flex items-center gap-2">
        <span className={cn('size-2 rounded-full', DOT[d.status])} />
        <Badge variant={TONE[d.status]}>{d.status}</Badge>
      </span>
      <span className="flex items-center gap-2 text-ui-sm text-fg-muted">
        <Avatar size="sm">
          <AvatarFallback>{d.who}</AvatarFallback>
        </Avatar>
        {d.when}
      </span>
      <span className="text-end font-mono text-ui-sm text-fg-muted tabular-nums">{d.took}</span>
    </li>
  )
}

export function DeploymentsShot() {
  return (
    <div className="flex bg-canvas text-fg" style={{ width: SHOT_WIDTH, height: SHOT_HEIGHT }}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-line px-5">
          <span className="text-ui text-fg-muted">
            acme <span className="mx-1">/</span> storefront <span className="mx-1">/</span> <span className="text-fg">Deployments</span>
          </span>
          <span className="ms-auto flex h-control-sm w-60 items-center gap-2 rounded-md border border-line-control px-2.5 text-ui text-fg-muted">
            <SearchIcon size={14} /> Search deployments
            <Kbd className="ms-auto">⌘K</Kbd>
          </span>
          <Button size="sm" variant="outline">
            <HistoryIcon size={14} /> Roll back
          </Button>
          <Button size="sm">
            <RocketIcon size={14} /> Deploy
          </Button>
        </header>
        <div className="flex items-center gap-2 px-5 pt-4 pb-3">
          {['All', 'Production', 'Preview'].map((f, i) => (
            <span key={f} className={cn('rounded-md px-2.5 py-1 text-ui', i === 0 ? 'bg-band text-fg' : 'text-fg-muted')}>
              {f}
            </span>
          ))}
          <span className="ms-auto inline-flex items-center gap-1.5 text-ui-sm text-fg-muted">
            <ActivityIcon size={13} className="text-success-text" /> 38 regions healthy
          </span>
        </div>
        <ul className="mx-5 flex flex-col divide-y divide-line rounded-lg border border-line">
          {DEPLOYS.map((d) => (
            <Row key={d.id} d={d} />
          ))}
        </ul>
      </div>
    </div>
  )
}
