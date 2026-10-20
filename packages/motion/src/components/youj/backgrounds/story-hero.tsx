import type { ReactNode } from 'react'
import { cn } from '@youj/core/lib/youj/cn'

/* Storybook-only shell: a believable landing-page hero to compose a background behind.
 * Not part of any registry item. */

export interface StoryHeroProps {
  background: ReactNode
  eyebrow: string
  title: ReactNode
  body: string
  primary: string
  secondary: string
  align?: 'center' | 'start'
  /** Extra classes on the content column, e.g. to sit text over a quiet part of the background. */
  contentClassName?: string
  /** Extra classes on the body copy, e.g. a stronger text color over a bright background. */
  bodyClassName?: string
}

export function StoryHero({
  background,
  eyebrow,
  title,
  body,
  primary,
  secondary,
  align = 'center',
  contentClassName,
  bodyClassName,
}: StoryHeroProps) {
  const center = align === 'center'
  return (
    <section className="relative isolate flex min-h-[max(100vh,640px)] flex-col overflow-hidden bg-canvas text-fg">
      {background}

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 md:px-10">
        <a href="#top" className="flex items-center gap-2 rounded-md text-sm font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
          <span aria-hidden className="grid size-6 place-items-center rounded-md bg-fg text-canvas">
            <span className="size-2 rotate-45 bg-canvas" />
          </span>
          Youj
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-fg-muted md:flex">
          {['Product', 'Changelog', 'Docs', 'Pricing'].map((item) => (
            <a key={item} href="#top" className="rounded-sm transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
              {item}
            </a>
          ))}
        </nav>
        <a href="#top" className="rounded-full border border-line bg-surface/60 youj-allow-glass px-3.5 py-1.5 text-sm backdrop-blur-md transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
          Sign in
        </a>
      </header>

      <div
        className={cn(
          'relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-24 md:px-10',
          center ? 'items-center text-center' : 'items-start text-start',
          contentClassName,
        )}
      >
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface/50 youj-allow-glass py-1 pe-3 ps-1 text-xs font-medium text-fg-muted backdrop-blur-md">
          <span className="rounded-full bg-accent px-2 py-0.5 text-on-accent">New</span>
          {eyebrow}
        </p>
        <h1 className={cn('max-w-3xl text-5xl font-semibold tracking-[-0.035em] text-balance md:text-7xl md:leading-[1.02]')}>{title}</h1>
        <p className={cn('mt-6 max-w-xl text-lg text-pretty text-fg-muted', center && 'mx-auto', bodyClassName)}>{body}</p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a href="#top" className="rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none">
            {primary}
          </a>
          <a href="#top" className="rounded-full border border-line bg-surface/50 youj-allow-glass px-5 py-2.5 text-sm font-medium backdrop-blur-md transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
            {secondary} <span aria-hidden className="text-fg-subtle">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
