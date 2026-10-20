import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

/* The page an overlay block's story is shown over (a drawer, a support
 * widget, a survey, a cookie banner): a neutral sketch of an app page, a top
 * bar, a heading and a few cards in quiet shapes with no words, so the eye
 * goes to the overlay, under a thin scrim that dims it as the real thing
 * would. Stories and the docs' gallery only; it never ships with a block. */

interface PlaceholderPageProps {
  /** Something live in the top bar's end (a cart trigger), above the scrim. */
  action?: ReactNode
  /** Wash the page under the overlay's scrim. Off for an overlay that brings its own (a modal Sheet). Default true. */
  dimmed?: boolean
  className?: string
}

const bar = 'rounded-full bg-[color-mix(in_oklab,var(--color-fg)_9%,transparent)]'

function PlaceholderPage({ action, dimmed = true, className }: PlaceholderPageProps) {
  return (
    <div className={cn('relative isolate flex min-h-dvh flex-col bg-canvas text-fg', className)}>
      <header className="flex h-14 shrink-0 items-center gap-6 border-b border-line bg-canvas px-5 sm:px-8">
        <div aria-hidden className="flex items-center gap-2.5">
          <span className="size-6 rounded-md bg-[color-mix(in_oklab,var(--color-fg)_16%,transparent)]" />
          <span className={cn(bar, 'h-2.5 w-16')} />
        </div>
        <div aria-hidden className="flex items-center gap-4 max-sm:hidden">
          {[44, 56, 40].map((w) => (
            <span key={w} className={cn(bar, 'h-2')} style={{ width: w }} />
          ))}
        </div>
        <div className="ms-auto flex items-center gap-3">
          <span aria-hidden className={cn(bar, 'h-8 w-40 max-md:hidden')} />
          {action}
          <span aria-hidden className="size-8 rounded-full bg-[color-mix(in_oklab,var(--color-fg)_12%,transparent)]" />
        </div>
      </header>
      <div aria-hidden className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-3">
          <span className={cn(bar, 'h-4 w-48')} />
          <span className={cn(bar, 'h-2.5 w-80 max-w-full')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex h-28 flex-col justify-end gap-2 rounded-xl border border-line bg-surface p-4">
              <span className={cn(bar, 'h-5 w-16')} />
              <span className={cn(bar, 'h-2 w-24')} />
            </div>
          ))}
        </div>
        <div className="flex min-h-56 flex-1 flex-col gap-3 rounded-xl border border-line bg-surface p-5">
          {[92, 78, 85, 64, 72].map((w, i) => (
            <span key={i} className={cn(bar, 'h-2.5')} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      {dimmed && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 bg-scrim"
        />
      )}
    </div>
  )
}

export { PlaceholderPage, type PlaceholderPageProps }
