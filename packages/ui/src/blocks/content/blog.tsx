'use client'

import { useEffect, useMemo, type ComponentProps, type ElementType, type ReactNode } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { ScrollProgress } from '@youj/motion'
import { RssIcon } from '@youj/icons'
import { PageTransition } from '@youj/motion/interactions'
import { buttonVariants } from '../../components/ui/button'
import { Skeleton } from '../../components/ui/skeleton'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { Article } from './blog/article'
import { BLOG_COPY, POSTS, type BlogCopy, type BlogSection, type CoverStyle, type Post } from './blog/data'
import { Index } from './blog/post-index'
import { BlogLinkContext } from './blog/post-link'

/* Field Notes, a design studio's journal: a magazine index and the article
 * it opens. The index leads with a split feature, then a row of category
 * filters whose underline glides to the chosen one (SlidingIndicator) above a
 * grid that PresenceList re-flows: posts outside the category fade where they
 * stand while the rest glide into the gaps. Opening a post is a fade-through
 * page change (PageTransition) in which the post's cover flies from its card
 * into the article's header (SharedElement). The article has a reading bar in
 * the masthead, a byline, a pull quote, a sticky table of contents that
 * follows the reader (AnchorNav) on wide screens, a copy-link button that
 * morphs to "Link copied", and a "Next read" card. Reduced motion: pages and
 * filters swap instantly and the cover doesn't fly.
 *
 * Pass your `posts` (a photo in `image`, the article in `sections` or your own
 * body through `renderArticle`) and `brand`; give each post a route with
 * `getHref` and `linkComponent`, or let the page switch itself (`postId`).
 * Every string is in `copy`. */

/** The journal's name in the masthead. */
interface BlogBrand {
  name: string
  logo?: ReactNode
  /** Where the name links. Default: back to the index. */
  href?: string
}

interface BlogProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** The posts, newest first; the first is featured. Default: the demo's seven. */
  posts?: Post[]
  /** The open post's id (`undefined` for the index), controlled: pair it with `onPostIdChange`. */
  postId?: string
  /** The post open first, when the page owns it. Default: the index. */
  defaultPostId?: string
  onPostIdChange?: (postId: string | undefined) => void
  /** Each post's route; links then navigate instead of switching in place. */
  getHref?: (post: Post) => string
  /** Renders post links, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: ElementType
  /** Draws an article's body yourself (MDX, say) instead of its `sections`. */
  renderArticle?: (post: Post) => ReactNode
  /** The journal's name, mark and home link. Default: Field Notes. */
  brand?: BlogBrand
  /** The feed's URL; `null` hides the button. Default '#rss'. */
  rssHref?: string | null
  /** Shows placeholders while the posts load. Default false. */
  loading?: boolean
  /** Replaces the message for a journal without posts. */
  empty?: ReactNode
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<BlogCopy>
}

function Blog({
  theme,
  posts = POSTS,
  postId: postIdProp,
  defaultPostId,
  onPostIdChange,
  getHref,
  linkComponent = 'a',
  renderArticle,
  brand,
  rssHref = '#rss',
  loading = false,
  empty,
  copy: copyProp,
  className,
  ...rest
}: BlogProps) {
  const copy = { ...BLOG_COPY, ...copyProp }
  const [postId, setOwnedPostId] = useControllableState(postIdProp, defaultPostId)
  const setPostId = (id: string | undefined) => (setOwnedPostId(id), onPostIdChange?.(id))
  const post = posts.find((p) => p.id === postId)
  const links = useMemo(() => ({ Link: linkComponent, getHref }), [linkComponent, getHref])
  const name = brand?.name ?? 'Field Notes'
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [postId])
  const [first, ...others] = posts
  return (
    <ThemeScope theme={theme}>
      <BlogLinkContext.Provider value={links}>
        <div className={cn('min-h-dvh bg-canvas text-fg', className)} {...rest}>
          <header data-yj-tone="header" className="sticky top-0 z-20 border-b border-line yj-glass">
            <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 md:px-8">
              <a
                href={brand?.href ?? '#field-notes'}
                onClick={(event) => {
                  if (brand?.href) return
                  event.preventDefault()
                  setPostId(undefined)
                }}
                className="focus-ring me-auto flex items-center gap-2 rounded-sm text-lg font-semibold tracking-tight"
              >
                {brand?.logo}
                <span>
                  {name}
                  {!brand && <span className="text-accent">.</span>}
                </span>
              </a>
              <span className="hidden text-ui-sm text-fg-muted sm:inline">{copy.tagline}</span>
              {rssHref !== null && (
                <a href={rssHref} aria-label={copy.rss} className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}>
                  <RssIcon size={16} />
                </a>
              )}
            </div>
            {post && <ScrollProgress label={copy.readingProgress} className="absolute inset-x-0 -bottom-px" />}
          </header>
          {loading ? (
            <main aria-busy className="mx-auto grid max-w-6xl gap-x-8 gap-y-12 px-4 pt-10 pb-24 sm:grid-cols-2 md:px-8 md:pt-14 lg:grid-cols-3">
              <h1 className="sr-only">{name}</h1>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="aspect-[3/2] rounded-sm" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-6 w-4/5" />
                </div>
              ))}
            </main>
          ) : !first ? (
            <main className="mx-auto max-w-6xl px-4 py-24 text-center md:px-8">
              <h1 className="sr-only">{name}</h1>
              {empty ?? <p className="text-ui text-fg-muted">{copy.empty}</p>}
            </main>
          ) : (
            <PageTransition routeKey={post?.id ?? 'index'}>
              {post ? (
                <Article post={post} posts={posts} copy={copy} onOpen={setPostId} onBack={() => setPostId(undefined)} renderArticle={renderArticle} />
              ) : (
                <Index posts={[first, ...others]} copy={copy} name={name} onOpen={setPostId} />
              )}
            </PageTransition>
          )}
        </div>
      </BlogLinkContext.Provider>
    </ThemeScope>
  )
}

export { Blog, BLOG_COPY }
export type { BlogBrand, BlogCopy, BlogProps, BlogSection, CoverStyle, Post as BlogPost }
