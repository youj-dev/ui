'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import { SlidingIndicator } from '@youj/motion'
import { ActivityIcon, LayoutGridIcon, PuzzleIcon, SettingsIcon } from '@youj/icons'

const NAV = [
  { label: 'Projects', Icon: LayoutGridIcon },
  { label: 'Integrations', Icon: PuzzleIcon },
  { label: 'Activity', Icon: ActivityIcon },
  { label: 'Settings', Icon: SettingsIcon },
]
const TABS = ['Overview', 'Deployments', 'Analytics', 'Logs']
const RANGES = ['1h', '24h', '7d', '30d']

const item = 'rounded-md outline-none transition-colors yj-duration-fast ease-standard focus-visible:ring-2 focus-visible:ring-accent'

export default function SlidingIndicatorDemo() {
  const id = useId()
  const [page, setPage] = useState('Projects')
  const [tab, setTab] = useState(1)
  const [range, setRange] = useState('24h')

  // Arrow keys move between tabs, and focus follows the selection.
  function onTabKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const next = (tab + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length
    setTab(next)
    document.getElementById(`${id}-tab-${next}`)?.focus()
  }

  return (
    <div className="@container w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <p className="ps-1 text-sm font-medium text-fg">
          acme <span className="text-fg-muted">/</span> web
        </p>
        {/* A hover pill follows the pointer and keyboard focus, and fades out when both leave. */}
        <nav aria-label="Workspace" className="relative isolate flex items-center gap-0.5">
          <SlidingIndicator follow="hover" />
          {NAV.map(({ label, Icon }) => (
            <a
              key={label}
              href={`/acme/web/${label.toLowerCase()}`}
              aria-current={page === label ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault()
                setPage(label)
              }}
              className={`${item} inline-flex h-8 items-center gap-1.5 px-2.5 text-[13px] ${page === label ? 'text-fg' : 'text-fg-muted hover:text-fg'}`}
            >
              <Icon size={15} />
              <span className="sr-only @lg:not-sr-only">{label}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* The underline finds the tab with aria-selected="true". No wiring to state. */}
      <div role="tablist" aria-label="Project" onKeyDown={onTabKey} className="relative isolate flex gap-1 overflow-x-auto border-b border-line px-2 [scrollbar-width:none]">
        {TABS.map((label, i) => (
          <button
            key={label}
            id={`${id}-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={tab === i}
            aria-controls={`${id}-panel`}
            tabIndex={tab === i ? 0 : -1}
            onClick={() => setTab(i)}
            className={`${item} my-1.5 px-2.5 py-1.5 text-sm ${tab === i ? 'text-fg' : 'text-fg-muted hover:text-fg'}`}
          >
            {label}
          </button>
        ))}
        <SlidingIndicator variant="underline" />
      </div>

      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tab}`} className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-fg">Requests</p>
            <p className="font-mono text-xs text-fg-muted">p95 82 ms · 0.02% errors</p>
          </div>
          {/* A segmented control: the pill sits on the button with aria-pressed="true". */}
          <div role="group" aria-label="Time range" className="relative isolate inline-flex rounded-lg bg-raised p-0.5">
            <SlidingIndicator className="rounded-md bg-surface shadow-sm ring-1 ring-line dark:bg-line" />
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => setRange(r)}
                className={`${item} h-7 min-w-10 px-2 font-mono text-xs ${range === r ? 'text-fg' : 'text-fg-muted hover:text-fg'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div aria-hidden className="mt-4 flex h-20 items-end gap-1">
          {Array.from({ length: 32 }, (_, i) => (
            <span
              key={i}
              className="h-full flex-1 origin-bottom rounded-sm bg-accent-line transition-transform yj-duration-base ease-standard"
              style={{ transform: `scaleY(${(0.25 + 0.7 * Math.abs(Math.sin(i * 0.55 + RANGES.indexOf(range) * 1.3))).toFixed(3)})` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
