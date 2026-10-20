'use client'

import type { CodeState } from '@/lib/code-load'

/* Line lengths for the placeholder, so it reads as code rather than a bar chart. */
const LINES = [58, 34, 0, 72, 46, 64, 28, 0, 52, 40]

/**
 * A Code tab's file (lib/code-load.ts's `useCode`): its highlighted markup once
 * it's here; until then a placeholder of code-shaped lines that fades in only
 * if the fetch is slow enough to notice; and if it couldn't be fetched, a line
 * saying so with a retry. Renders inside the tab's `.code-panel`, which is the
 * scroller and carries `aria-busy` while it loads.
 */
export function CodeSource({ state }: { state: CodeState }) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: html is highlighted from repo source by our own code route
  if (state.status === 'ready') return <div dangerouslySetInnerHTML={{ __html: state.body.html }} />
  if (state.status === 'error')
    return (
      <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5 text-[13px] text-fg-muted">
        The code couldn’t be loaded.
        <button type="button" onClick={state.retry} className="rounded-md border border-line bg-surface px-2.5 py-1 text-[12.5px] font-medium text-fg hover:border-line-strong focus-ring">
          Try again
        </button>
      </div>
    )
  if (state.status === 'idle') return null
  return (
    <div className="loading-in px-4 py-3.5">
      <span className="sr-only">Loading code…</span>
      <div aria-hidden className="flex flex-col">
        {LINES.map((width, i) => (
          <span key={i} className="flex h-[1.7em] items-center text-[12.75px]">
            {width > 0 && <span className="h-[0.6em] rounded-sm bg-line" style={{ width: `${width}%` }} />}
          </span>
        ))}
      </div>
    </div>
  )
}
