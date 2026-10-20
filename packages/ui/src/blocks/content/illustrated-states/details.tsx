'use client'

import { useSyncExternalStore } from 'react'
import { CheckIcon, CircleDashedIcon, LoaderRingIcon, WifiIcon, WifiOffIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Progress } from '../../../components/ui/progress'
import { cn } from '../../../lib/utils'
import { FIRST_STEPS, MAINTENANCE, MISSING_PATH, PENDING_SYNC, POPULAR_PAGES, RECEIPT, TEMPLATES, type IllustratedStateKind } from './data'

/* The one thing under each state's actions that makes it specific: the first
 * steps on the welcome, templates on an empty workspace, the address that
 * missed and where to go instead on a 404, the window and its steps during
 * maintenance, the receipt after a payment, and the live connection with
 * what's waiting to sync while offline. Each sits on the same quiet panel. */

const PANEL = 'w-full rounded-xl border border-line bg-surface/80 youj-allow-glass text-start backdrop-blur'
const LABEL = 'font-mono text-ui-xs uppercase tracking-[0.12em] text-fg-muted'

function Steps() {
  return (
    <ol aria-label="First steps" className={cn(PANEL, 'flex flex-col py-1')}>
      {FIRST_STEPS.map((step, i) => (
        <li key={step.title} className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
          <span
            aria-hidden
            className={cn(
              'grid size-6 shrink-0 place-items-center rounded-full font-mono text-ui-xs tabular-nums',
              i === 0 ? 'bg-accent text-on-accent' : 'bg-band text-fg-muted',
            )}
          >
            {i + 1}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-ui font-medium text-fg">{step.title}</span>
            <span className="text-ui-sm text-fg-muted">{step.detail}</span>
          </span>
          {i === 0 && <span className={LABEL}>Up next</span>}
        </li>
      ))}
    </ol>
  )
}

function Templates({ onTemplate }: { onTemplate?: (name: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className={LABEL}>Or start from a template</span>
      <ul className="flex flex-wrap justify-center gap-2">
        {TEMPLATES.map((name) => (
          <li key={name}>
            <Button variant="outline" size="sm" onClick={() => onTemplate?.(name)}>
              {name}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Elsewhere({ path }: { path: string }) {
  return (
    <div className={cn(PANEL, 'flex flex-col')}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line px-4 py-3">
        <span className={LABEL}>Requested</span>
        <code className="min-w-0 font-mono text-ui-sm break-all text-fg">{path}</code>
      </div>
      <nav aria-label="Popular pages" className="px-2 py-2">
        <ul className="grid grid-cols-2 gap-1">
          {POPULAR_PAGES.map((page) => (
            <li key={page.href}>
              <a href={page.href} className="flex rounded-md px-2 py-1.5 text-ui text-fg transition-colors yj-duration-fast ease-standard hover:bg-hover focus-ring">
                {page.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

function Window() {
  return (
    <div className={cn(PANEL, 'flex flex-col gap-3 p-4')}>
      <div className="flex items-baseline justify-between gap-3 text-ui-sm text-fg-muted">
        <span>Back by {MAINTENANCE.until}</span>
        <span className="font-mono tabular-nums">{MAINTENANCE.progress}%</span>
      </div>
      <Progress value={MAINTENANCE.progress} aria-label="Maintenance progress" />
      <ol className="mt-1 flex flex-col gap-2">
        {MAINTENANCE.steps.map((step, i) => {
          const state = i < MAINTENANCE.done ? 'done' : i === MAINTENANCE.done ? 'active' : 'pending'
          return (
            <li key={step} className="flex items-center gap-2.5 text-ui">
              {state === 'done' ? (
                <CheckIcon size={16} className="text-success" />
              ) : state === 'active' ? (
                <LoaderRingIcon size={16} className="text-accent" />
              ) : (
                <CircleDashedIcon size={16} className="text-fg-muted" />
              )}
              <span className={state === 'pending' ? 'text-fg-muted' : 'text-fg'}>{step}</span>
              <span className="sr-only">{state === 'done' ? '(done)' : state === 'active' ? '(in progress)' : '(up next)'}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Receipt() {
  return (
    <dl className={cn(PANEL, 'grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 px-4 py-2')}>
      {RECEIPT.map((row) => (
        <div key={row.term} className="col-span-2 grid grid-cols-subgrid items-baseline border-t border-line py-2 first:border-t-0">
          <dt className="text-ui-sm text-fg-muted">{row.term}</dt>
          <dd className="text-end text-ui font-medium text-fg tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/* The browser's own online state, as an external store. The server can't
 * know it, so it renders offline (the page's premise) and the client takes
 * over after hydration. */
const subscribe = (notify: () => void) => {
  window.addEventListener('online', notify)
  window.addEventListener('offline', notify)
  return () => {
    window.removeEventListener('online', notify)
    window.removeEventListener('offline', notify)
  }
}

/** Whether the browser says it's online. */
export function useOnline() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => false,
  )
}

function Connection() {
  const online = useOnline()
  return (
    <div className={cn(PANEL, 'flex flex-col gap-1 px-4 py-3')}>
      <p role="status" className="flex items-center gap-2 text-ui font-medium text-fg">
        {online ? <WifiIcon size={16} className="text-success" /> : <WifiOffIcon size={16} className="text-fg-muted" />}
        {online ? 'Your connection is back. Try again to pick up where you left off.' : 'Waiting for a connection'}
      </p>
      <p className="text-ui-sm text-pretty text-fg-muted">{PENDING_SYNC}</p>
    </div>
  )
}

export function StateDetail({ state, path = MISSING_PATH, onTemplate }: { state: IllustratedStateKind; path?: string; onTemplate?: (name: string) => void }) {
  switch (state) {
    case 'welcome':
      return <Steps />
    case 'empty':
      return <Templates onTemplate={onTemplate} />
    case 'not-found':
      return <Elsewhere path={path} />
    case 'maintenance':
      return <Window />
    case 'success':
      return <Receipt />
    case 'offline':
      return <Connection />
  }
}
