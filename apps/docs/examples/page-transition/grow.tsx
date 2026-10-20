'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeftIcon } from '@youj/icons'
import { PageTransition, SharedElement } from '@youj/motion/interactions'

const TEMPLATES = [
  { slug: 'commerce', name: 'Commerce', stack: 'Next.js · Stripe', about: 'A storefront with a cart, checkout and order emails.', tone: 'bg-[radial-gradient(120%_100%_at_15%_15%,color-mix(in_oklch,var(--color-accent)_50%,transparent),transparent_70%)]' },
  { slug: 'docs', name: 'Docs', stack: 'Next.js · MDX', about: 'Versioned pages, full-text search and an API reference.', tone: 'bg-[linear-gradient(135deg,transparent_25%,color-mix(in_oklch,var(--color-accent)_40%,transparent))]' },
  { slug: 'dashboard', name: 'Dashboard', stack: 'React · Postgres', about: 'Sign-in, roles and charts over your own tables.', tone: 'bg-[radial-gradient(120%_100%_at_85%_90%,color-mix(in_oklch,var(--color-accent)_45%,transparent),transparent_65%)]' },
  { slug: 'blog', name: 'Blog', stack: 'Astro · RSS', about: 'Posts in Markdown, with feeds and social cards.', tone: 'bg-[linear-gradient(0deg,color-mix(in_oklch,var(--color-accent)_45%,transparent),transparent_75%)]' },
]

export default function PageTransitionGrow() {
  const [open, setOpen] = useState<string | null>(null)
  const template = TEMPLATES.find((t) => t.slug === open)

  // After each navigation, focus moves to the new page: the Back button, or back to the card that was opened.
  const shell = useRef<HTMLDivElement>(null)
  const opened = useRef<string | null>(null)
  useEffect(() => {
    if (open) opened.current = open
    const target = open ? '[data-back]' : opened.current && `[data-template="${opened.current}"]`
    if (target) shell.current?.querySelector<HTMLElement>(target)?.focus()
  }, [open])

  return (
    <div ref={shell} className="w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex h-11 items-center gap-2 border-b border-line px-3">
        <button
          type="button"
          aria-label="Back"
          data-back=""
          disabled={!template}
          onClick={() => setOpen(null)}
          className="grid size-7 place-items-center rounded-md text-fg-muted outline-none enabled:hover:bg-raised enabled:hover:text-fg disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ArrowLeftIcon size={15} />
        </button>
        <span className="font-mono text-xs text-fg-muted">/templates{template && `/${template.slug}`}</span>
      </div>
      <PageTransition routeKey={open ?? 'templates'} className="h-72">
        {template ? (
          <article className="h-full bg-surface p-4">
            {/* The same name on both pages: the cover grows from its card into the header. The radius is set in
                style, not a class, so the corners stay round while it scales. */}
            <SharedElement name={`cover-${template.slug}`} className={`h-28 bg-raised ${template.tone}`} style={{ borderRadius: 12 }} />
            <SharedElement name={`name-${template.slug}`} className="mt-4 w-fit">
              <p className="text-lg font-semibold tracking-tight text-fg">{template.name}</p>
            </SharedElement>
            <p className="mt-1 text-sm text-fg-muted">{template.about}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-mono text-xs text-fg-muted">{template.stack}</span>
              <button
                type="button"
                className="h-8 rounded-lg bg-accent px-3 text-sm font-medium text-on-accent outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Deploy
              </button>
            </div>
          </article>
        ) : (
          <ul className="grid h-full grid-cols-2 content-start gap-3 bg-surface p-4">
            {TEMPLATES.map((t) => (
              <li key={t.slug}>
                <button
                  type="button"
                  data-template={t.slug}
                  onClick={() => setOpen(t.slug)}
                  className="block w-full rounded-xl p-1.5 text-start outline-none hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <SharedElement name={`cover-${t.slug}`} className={`h-16 bg-raised ${t.tone}`} style={{ borderRadius: 8 }} />
                  <SharedElement name={`name-${t.slug}`} className="mt-2 w-fit">
                    <span className="block text-sm font-medium text-fg">{t.name}</span>
                  </SharedElement>
                  <span className="block text-xs text-fg-muted">{t.stack}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PageTransition>
    </div>
  )
}
