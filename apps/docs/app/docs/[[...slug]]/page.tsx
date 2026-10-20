import type { ComponentProps } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AnchorProvider } from 'fumadocs-core/toc'
import { findNeighbour } from 'fumadocs-core/page-tree'
import Link from 'fumadocs-core/link'
import { getMDXComponents } from '@/components/mdx'
import { ImportLine } from '@/components/docs/import-line'
import { Pager } from '@/components/docs/pager'
import { StabilityBadge } from '@/components/docs/stability-badge'
import { IntentLink } from '@/components/site/intent-link'
import { DocsToc, PageActions, TocPopover } from '@/components/docs/deferred'
import { cn } from '@/lib/cn'
import { sectionTrail } from '@/lib/sections'
import { siteUrl } from '@/lib/site'
import { source } from '@/lib/source'
import { pageStability } from '@/lib/stability'

type Props = { params: Promise<{ slug?: string[] }> }

/* A page is one column, centered between the sidebar and the TOC
 * (--docs-column, styles/site.css): the header, the text, pictures, code and
 * tables, the pager and the footer all share its two edges. A `full` page has
 * no TOC, and its column widens to 70rem. */
export default async function Page({ params }: Props) {
  const { slug } = await params
  const page = source.getPage(slug)
  if (!page) notFound()
  const MDX = page.data.body
  // MDX links resolve relative file paths and prefetch only on intent: a docs page links to a dozen others, and a reader follows one.
  // (fumadocs-ui's createRelativeLink does the same, but importing it brings its MDX components' client code to every page.)
  const RelativeLink = ({ href, ...props }: ComponentProps<'a'>) => {
    const url = href ? source.resolveHref(href, page) : href
    return url?.startsWith('/') ? <IntentLink href={url} {...props} /> : <Link href={url} prefetch={false} {...props} />
  }
  const toc = page.data.toc
  const full = page.data.full === true
  const rail = !full && toc.length > 0
  const { previous, next } = findNeighbour(source.getPageTree(), page.url)
  const trail = sectionTrail(page.slugs)
  const stability = pageStability(page.url)

  return (
    <AnchorProvider toc={toc}>
      <div className={cn('grid px-5 pr-[max(1.25rem,env(safe-area-inset-right))] pl-[max(1.25rem,env(safe-area-inset-left))] sm:px-8 lg:px-12', rail && 'toc:grid-cols-[minmax(0,1fr)_15rem] toc:gap-12')}>
        <div className={cn('mx-auto w-full min-w-0 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pt-10 md:pt-14', full ? 'max-w-[70rem]' : 'max-w-(--docs-column)')}>
          <article className="relative">
            <header className="docs-head">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Where the page sits, as breadcrumbs: the section links to its overview when this isn't it. */}
                <nav aria-label="Breadcrumb" className="crumbs flex min-w-0 items-center gap-2">
                  <ol className="flex min-w-0 flex-wrap items-center gap-x-2">
                    {trail.map((crumb, i) => {
                      const section = i === 0 && page.slugs.length > 1 ? source.getPage(page.slugs.slice(0, 1)) : undefined
                      return (
                        // Below sm the trail is its section alone: "Components", a link back to the overview. The group under it is the title's neighbor in the menu, and the row has the actions to carry.
                        <li key={crumb} className={cn('flex min-h-6 items-center gap-2', i > 0 && 'max-sm:hidden')}>
                          {i > 0 && <span aria-hidden className="text-fg-subtle">/</span>}
                          {section ? (
                            <IntentLink href={section.url} className="rounded-sm transition-colors duration-(--yj-duration-fast) ease-standard hover:text-fg focus-ring touch:-mx-2 touch:-my-4 touch:px-2 touch:py-4">
                              {crumb}
                            </IntentLink>
                          ) : (
                            crumb
                          )}
                        </li>
                      )
                    })}
                  </ol>
                </nav>
                {stability && stability !== 'alpha' && <StabilityBadge stability={stability} className="max-sm:hidden" />}
                <div className="-my-2 ms-auto flex shrink-0 items-center gap-2 touch:-my-3">
                  <PageActions url={page.url} site={siteUrl()} title={page.data.title} />
                  {rail && toc.length > 1 && <TocPopover items={toc} className="shrink-0 toc:hidden" />}
                </div>
              </div>
              <h1 className="type-title mt-4 text-fg">
                {page.data.title}
              </h1>
              {page.data.description && (
                <p className="mt-2 text-[18px] leading-normal text-pretty text-fg-muted sm:mt-3 sm:text-[19px] sm:leading-relaxed">{page.data.description}</p>
              )}
              <ImportLine slugs={page.slugs} />
              {stability && stability !== 'alpha' && <StabilityBadge stability={stability} className="mt-3 flex sm:hidden" />}
            </header>
            <div className="prose docs-flow mt-6 sm:mt-10 [&>:first-child]:mt-0">
              <MDX components={getMDXComponents({ a: RelativeLink })} />
            </div>
          </article>
          {/* The previous and next pages close the page: its whole footer. */}
          <footer className="mt-14 text-[12.5px] text-fg-muted">
            <Pager previous={previous} next={next} />
          </footer>
        </div>
        {rail && (
          <aside aria-label="On this page" className="docs-rail hidden pt-10 md:pt-14 toc:block">
            <div className="sticky top-[calc(var(--header-height)+3.5rem)] max-h-[calc(100dvh-var(--header-height)-5rem)] overflow-y-auto pt-0.5 pb-6 yj-scrollbar">
              <DocsToc items={toc} />
            </div>
          </aside>
        )}
      </div>
    </AnchorProvider>
  )
}

export function generateStaticParams() {
  return source.generateParams()
}

// Every page is known at build time; anything else is the static 404.
export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = source.getPage(slug)
  if (!page) notFound()
  return { title: page.data.title, description: page.data.description }
}
