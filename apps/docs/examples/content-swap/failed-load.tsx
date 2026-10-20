'use client'

import { useEffect, useRef, useState } from 'react'
import { ContentSwap } from '@youj/motion'
import { AlertTriangleIcon, GlobeIcon, RefreshIcon } from '@youj/icons'
import { Skeleton } from '@youj/react'

const DOMAINS = [
  { name: 'northwind.dev', detail: 'Production', valid: true },
  { name: 'www.northwind.dev', detail: 'Redirects to northwind.dev', valid: true },
  { name: 'docs.northwind.dev', detail: 'Production', valid: true },
  { name: 'beta.northwind.dev', detail: 'Preview · main', valid: false },
]

function DomainsSkeleton() {
  return (
    <div className="divide-y divide-line">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-7 rounded-md" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

export default function ContentSwapFailedLoad() {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<'loading' | 'failed' | 'ready'>('loading')
  const region = useRef<HTMLDivElement>(null)

  // Stands in for a fetch: the first request times out, and the retry succeeds.
  useEffect(() => {
    setStatus('loading')
    const t = setTimeout(() => setStatus(attempt === 0 ? 'failed' : 'ready'), 1200)
    return () => clearTimeout(t)
  }, [attempt])

  const retry = () => {
    // The button leaves with the error, so focus moves to the region instead of falling back to the page.
    region.current?.focus()
    setAttempt((a) => a + 1)
  }

  return (
    <div className="flex min-h-[270px] w-full max-w-md flex-col">
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <p className="border-b border-line px-4 py-2.5 text-sm font-medium text-fg">Domains</p>
        <div ref={region} tabIndex={-1} className="outline-none">
          <ContentSwap loading={status === 'loading'} fallback={<DomainsSkeleton />} loadingLabel="Loading domains">
            {status === 'failed' ? (
              <div className="flex flex-col items-center px-6 py-6 text-center">
                <span className="grid size-8 place-items-center rounded-full bg-danger-subtle text-danger">
                  <AlertTriangleIcon size={16} />
                </span>
                <div role="alert" className="mt-3">
                  <p className="text-sm font-medium text-fg">Couldn’t load domains</p>
                  <p className="mt-0.5 text-xs text-fg-muted">The request timed out after 10 seconds.</p>
                </div>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-4 inline-flex h-7 items-center gap-1.5 rounded-md border border-line px-2.5 text-xs font-medium text-fg outline-none transition-colors yj-duration-fast ease-standard hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <RefreshIcon size={13} />
                  Try again
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {DOMAINS.map(({ name, detail, valid }) => (
                  <li key={name} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="grid size-7 place-items-center rounded-md border border-line bg-raised text-fg-muted">
                      <GlobeIcon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-fg">{name}</p>
                      <p className="truncate text-xs text-fg-muted">{detail}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-fg-muted">
                      <span className={`size-1.5 rounded-full ${valid ? 'bg-success' : 'bg-warning'}`} />
                      {valid ? 'Valid' : 'Pending DNS'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ContentSwap>
        </div>
      </div>
    </div>
  )
}
