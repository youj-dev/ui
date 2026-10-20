'use client'

import { createContext, useContext, type ElementType } from 'react'
import { cn } from '../../../lib/utils'
import type { Post } from './data'

/** How post links behave: a route per post (`getHref`, followed as a normal link) or the page's own switch (`onOpen`). */
const BlogLinkContext = createContext<{ Link: ElementType; getHref?: (post: Post) => string }>({ Link: 'a' })

/** `cover`: a pointer-only duplicate of the title's link, so keyboards and screen readers meet each post once. */
function PostLink({
  post,
  onOpen,
  cover,
  className,
  children,
}: {
  post: Post
  onOpen: (id: string) => void
  cover?: boolean
  className?: string
  children: React.ReactNode
}) {
  const { Link, getHref } = useContext(BlogLinkContext)
  return (
    <Link
      href={getHref ? getHref(post) : `#${post.id}`}
      aria-hidden={cover || undefined}
      tabIndex={cover ? -1 : undefined}
      onClick={(event: React.MouseEvent) => {
        if (getHref) return
        event.preventDefault()
        onOpen(post.id)
      }}
      className={cn('focus-ring rounded-sm', className)}
    >
      {children}
    </Link>
  )
}

export { BlogLinkContext, PostLink }
