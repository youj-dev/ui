'use client'

import { useCallback, useState, type ElementType, type ReactNode } from 'react'
import { SlidingIndicator } from '@youj/motion'
import { Badge } from '../../../components/ui/badge'
import { buttonVariants } from '../../../components/ui/button'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from '../../../components/ui/collapsible'
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from '../../../components/ui/sheet'
import { cn } from '../../../lib/utils'
import type { NavbarDocsCopy, NavbarDocsCta, NavbarDocsLink, NavbarDocsPage, NavbarDocsSection } from './data'

/* The phone drawer, from the inline start: the sections as chips (picking one
 * shows its tree here without leaving the page), then the tree, its groups
 * under small headings and pages with pages of their own folding open (the
 * branch holding the current page starts open, and the current page is
 * scrolled into the middle). The foot carries the bar's links, the
 * repository and the call to action. Following a link closes it. */

const holds = (page: NavbarDocsPage, href?: string): boolean => !!href && !!page.pages?.some((child) => child.href === href || holds(child, href))

/** The current page's link brings itself into view once, as the drawer opens. */
function useIntoView() {
  return useCallback((el: HTMLElement | null) => {
    el?.scrollIntoView?.({ block: 'center' })
  }, [])
}

interface TreeProps {
  pages: NavbarDocsPage[]
  current?: string
  depth: number
  copy: NavbarDocsCopy
  Link: ElementType
  onFollow: () => void
}

function Tree({ pages, current, depth, copy, Link, onFollow }: TreeProps) {
  const intoView = useIntoView()
  return (
    <ul className={cn('flex flex-col gap-px', depth > 0 && 'ms-3 border-s border-line ps-1.5')}>
      {pages.map((page) => {
        const here = page.href === current
        const link = (
          <Link
            href={page.href}
            ref={here ? intoView : undefined}
            aria-current={here ? 'page' : undefined}
            onClick={onFollow}
            className="flex min-h-control min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 text-ui text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring aria-[current=page]:font-medium aria-[current=page]:text-fg"
          >
            <span className="min-w-0 truncate">{page.label}</span>
            {page.badge && <Badge className="ms-auto">{page.badge}</Badge>}
          </Link>
        )
        if (!page.pages?.length) return <li key={page.href}>{link}</li>
        return (
          <li key={page.href}>
            <Collapsible defaultOpen={here || holds(page, current)}>
              <div className="flex items-center gap-0.5">
                {link}
                <CollapsibleTrigger aria-label={copy.showPages(page.label)} className={buttonVariants({ variant: 'ghost', size: 'icon-sm', className: 'aria-expanded:bg-transparent hover:bg-hover' })}>
                  <CollapsibleChevron size={14} />
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <Tree pages={page.pages} current={current} depth={depth + 1} copy={copy} Link={Link} onFollow={onFollow} />
              </CollapsibleContent>
            </Collapsible>
          </li>
        )
      })}
    </ul>
  )
}

interface DocsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sections: NavbarDocsSection[]
  /** The section the page is in: its tree shows first. */
  section: string
  current?: string
  title: ReactNode
  links: NavbarDocsLink[]
  /** The repository link, drawn by the bar. */
  repository: ReactNode
  cta: NavbarDocsCta | null
  copy: NavbarDocsCopy
  Link: ElementType
}

export function DocsDrawer({ open, onOpenChange, sections, section, current, title, links, repository, cta, copy, Link }: DocsDrawerProps) {
  // The section whose tree is shown: the page's, until a chip picks another; it resets as the drawer closes.
  const [picked, setPicked] = useState<string | null>(null)
  const shown = sections.find((s) => s.id === (picked ?? section)) ?? sections[0]
  const change = (next: boolean) => {
    if (!next) setPicked(null)
    onOpenChange(next)
  }
  const follow = () => change(false)
  return (
    <Sheet open={open} onOpenChange={change}>
      <SheetContent side="start" data-slot="navbar-docs-drawer" className="md:hidden">
        <SheetHeader className="py-3">
          <SheetTitle className="flex items-center gap-2 [&_svg]:size-5">{title}</SheetTitle>
        </SheetHeader>
        <SheetBody className="gap-5 own:px-3">
          <div role="group" aria-label={copy.sectionsLabel} className="relative isolate flex flex-wrap gap-1.5">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={s.id === shown?.id}
                onClick={() => setPicked(s.id)}
                className="inline-flex h-control-sm items-center rounded-control border border-line px-3 text-ui-sm font-medium text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring aria-pressed:border-transparent aria-pressed:text-on-action"
              >
                {s.label}
              </button>
            ))}
            <SlidingIndicator className="rounded-control bg-action" />
          </div>
          <nav aria-label={shown?.label} className="flex flex-col gap-5">
            {shown?.groups?.map((group) => (
              <div key={group.title} className="flex flex-col gap-1">
                <p className="px-2.5 text-ui-xs font-medium tracking-wide text-fg-subtle uppercase">{group.title}</p>
                <Tree pages={group.pages} current={current} depth={0} copy={copy} Link={Link} onFollow={follow} />
              </div>
            ))}
          </nav>
        </SheetBody>
        {(links.length > 0 || repository || cta) && (
          <div className="flex flex-col gap-3 border-t border-line p-4">
            <div className="flex flex-wrap items-center gap-1">
              {links.map((link) => (
                <Link key={link.href} href={link.href} onClick={follow} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  {link.label}
                </Link>
              ))}
              <span className="ms-auto">{repository}</span>
            </div>
            {cta && (
              <Link href={cta.href} onClick={cta.onClick} className={buttonVariants({ size: 'lg' })}>
                {cta.label}
              </Link>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
