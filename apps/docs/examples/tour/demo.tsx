'use client'

import { useState } from 'react'
import { DownloadIcon, HomeIcon, SearchIcon, SettingsIcon, UsersIcon } from '@youj/icons'
import { Button, Input, Tour, type TourStep } from '@youj/react'

const steps: TourStep[] = [
  { target: '#tour-demo-nav', title: 'Everything in one place', body: 'Your overview, customers and settings live in the sidebar.', placement: 'inline-end' },
  { target: '#tour-demo-search', title: 'Find any order', body: 'Search by number, customer or amount.' },
  { target: '#tour-demo-kpis', title: 'Today at a glance', body: 'Revenue and orders against the same day last week.' },
  { target: '#tour-demo-export', title: 'Take it with you', body: 'Export the orders you see as CSV.', placement: 'top' },
]

export default function TourDemo() {
  // The tour renders inside this frame: `contain: paint` makes it the box the scrim covers.
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  return (
    <div ref={setFrame} className="relative flex h-[380px] w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-canvas text-fg [contain:paint]">
      <nav id="tour-demo-nav" className="flex w-40 shrink-0 flex-col gap-1 border-e border-line bg-surface p-3">
        <div className="mb-2 px-2 font-semibold">Northwind</div>
        {[
          { icon: HomeIcon, label: 'Overview' },
          { icon: UsersIcon, label: 'Customers' },
          { icon: SettingsIcon, label: 'Settings' },
        ].map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-ui text-fg-muted first:bg-selected first:text-fg">
            <Icon className="size-4" />
            {label}
          </span>
        ))}
      </nav>
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
            <Input id="tour-demo-search" className="ps-8" placeholder="Search orders" aria-label="Search orders" />
          </div>
          <Button onClick={() => setOpen(true)}>Take the tour</Button>
        </div>
        <div id="tour-demo-kpis" className="grid grid-cols-2 gap-3">
          {[
            ['Revenue', '$48.2k'],
            ['Orders', '1,284'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line bg-surface p-3">
              <div className="text-ui-sm text-fg-muted">{label}</div>
              <div className="text-xl font-semibold tabular-nums">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-auto flex justify-end">
          <Button id="tour-demo-export" variant="outline" size="sm">
            <DownloadIcon />
            Export
          </Button>
        </div>
      </div>
      <Tour steps={steps} open={open} onOpenChange={setOpen} container={frame} />
    </div>
  )
}
