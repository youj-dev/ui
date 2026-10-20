'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@youj/core'
import { ArrowLeftIcon, ChevronRightIcon, GitCommitIcon } from '@youj/icons'
import { PageTransition, SharedElement, type PageDirection } from '@youj/motion/interactions'

const DEPLOYS = [
  { id: 'a41f9e2', message: 'Tighten cache headers', author: 'Priya Raman', when: '9:41', status: 'Ready', dot: 'bg-success', time: '38s' },
  { id: '7c02b1d', message: 'New pricing page', author: 'Jonas Weber', when: '9:12', status: 'Ready', dot: 'bg-success', time: '41s' },
  { id: 'e9d4a70', message: 'Bump the build image', author: 'Ana Lima', when: 'Tue', status: 'Failed', dot: 'bg-danger', time: '12s' },
  { id: '3b8f0c4', message: 'Edge config for the EU region', author: 'Kenji Sato', when: 'Mon', status: 'Ready', dot: 'bg-success', time: '36s' },
]

export default function PageTransitionDemo() {
  // A tiny router: the path is the routeKey, and the direction comes from the last move.
  const [path, setPath] = useState('/deployments')
  const [direction, setDirection] = useState<PageDirection>('forward')
  const open = DEPLOYS.find((d) => path === `/deployments/${d.id}`)
  const go = (next: string, dir: PageDirection) => {
    setDirection(dir)
    setPath(next)
  }

  // Like a router would: after each navigation, focus lands on the new page, not on <body>.
  const shell = useRef<HTMLDivElement>(null)
  const last = useRef<string | null>(null)
  useEffect(() => {
    if (last.current === null) {
      last.current = path
      return
    }
    const target = open ? '[data-back]' : `[data-deploy="${last.current.split('/')[2]}"]`
    shell.current?.querySelector<HTMLElement>(target)?.focus()
    last.current = path
  }, [path, open])

  return (
    <div ref={shell} className="w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex h-11 items-center gap-2 border-b border-line px-3">
        <button
          type="button"
          aria-label="Back"
          data-back=""
          disabled={!open}
          onClick={() => go('/deployments', 'back')}
          className="grid size-7 place-items-center rounded-md text-fg-muted outline-none enabled:hover:bg-raised enabled:hover:text-fg disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeftIcon size={15} />
        </button>
        <span className="font-mono text-xs text-fg-muted">{path}</span>
      </div>
      <PageTransition routeKey={path} direction={direction} className="h-68">
        {open ? (
          <article className="h-full bg-surface p-5">
            <SharedElement name={`title-${open.id}`} className="w-fit">
              <p className="text-lg font-semibold tracking-tight text-fg">{open.message}</p>
            </SharedElement>
            <SharedElement name={`status-${open.id}`} className="mt-2 w-fit">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs text-fg">
                <span className={cn('size-1.5 rounded-full', open.dot)} />
                {open.status}
              </span>
            </SharedElement>
            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-fg-muted">Commit</dt>
              <dd className="flex items-center gap-1.5 font-mono text-[13px] text-fg">
                <GitCommitIcon size={14} className="text-fg-muted" />
                {open.id}
              </dd>
              <dt className="text-fg-muted">Author</dt>
              <dd className="text-fg">{open.author}</dd>
              <dt className="text-fg-muted">Build</dt>
              <dd className="text-fg">{open.time}</dd>
            </dl>
          </article>
        ) : (
          <ul className="h-full bg-surface py-1">
            {DEPLOYS.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  data-deploy={d.id}
                  onClick={() => go(`/deployments/${d.id}`, 'forward')}
                  className="flex w-full items-center gap-3 px-4 py-3 text-start outline-none hover:bg-raised focus-visible:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
                >
                  <span className="min-w-0 flex-1">
                    <SharedElement name={`title-${d.id}`} className="w-fit max-w-full">
                      <span className="block truncate text-sm font-medium text-fg">{d.message}</span>
                    </SharedElement>
                    <span className="mt-0.5 block text-xs text-fg-muted">
                      {d.author} · {d.when}
                    </span>
                  </span>
                  <SharedElement name={`status-${d.id}`}>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs text-fg">
                      <span className={cn('size-1.5 rounded-full', d.dot)} />
                      {d.status}
                    </span>
                  </SharedElement>
                  <ChevronRightIcon size={15} className="text-fg-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </PageTransition>
    </div>
  )
}
