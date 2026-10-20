'use client'

import { createContext, useContext, type ElementType, type ReactNode } from 'react'
import type { Page } from './data'

/** How page links behave: a route per page (`getHref`, followed as a normal link) or the docs' own switch. */
const DocsLinkContext = createContext<{ Link: ElementType; getHref?: (page: Page) => string }>({ Link: 'a' })

/** A link to a docs page: your route when `getHref` is set, else `#id` switched in place through `onNavigate`. */
function DocLink({ page, onNavigate, className, children, ...props }: { page: Page; onNavigate: (id: string) => void; className?: string; children: ReactNode; 'aria-current'?: 'page' }) {
  const { Link, getHref } = useContext(DocsLinkContext)
  return (
    <Link
      href={getHref ? getHref(page) : `#${page.id}`}
      onClick={(event: React.MouseEvent) => {
        if (!getHref) event.preventDefault()
        onNavigate(page.id)
      }}
      className={className}
      {...props}
    >
      {children}
    </Link>
  )
}

export { DocLink, DocsLinkContext }
