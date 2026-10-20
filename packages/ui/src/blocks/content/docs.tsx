'use client'

import { useMemo, useState, type ComponentProps, type ElementType } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { BookmarkIcon, PencilIcon } from '@youj/icons'
import { AnchorNav } from '../../components/ui/anchor-nav'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../../components/ui/breadcrumb'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible'
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { DOCS_COPY, PAGES, type DocsCopy, type Page, type Section } from './docs/data'
import { DocsLinkContext } from './docs/doc-link'
import { Feedback } from './docs/feedback'
import { DocsHeader, type DocsBrand } from './docs/header'
import { NavTree } from './docs/nav-tree'
import { PagerCard } from './docs/pager-card'
import { SearchPalette } from './docs/search-palette'

/* Northstar's SDK docs in three columns. The left nav folds its groups
 * (Collapsible) and marks the page you're on with a pill that glides from
 * link to link (SlidingIndicator). The article swaps in with a short rise when
 * the page changes, and carries callouts (Alert), a code block whose package
 * manager tabs slide their underline and whose Copy button morphs to
 * "Copied", and an options table. The right column is "On this page", a
 * scrollspy (AnchorNav) whose bar follows the reader. ⌘K (or the search
 * field) opens a CommandPalette over every page and section. Prev/next cards
 * close the page, and "Was this helpful?" morphs into a thank-you. On phones
 * the nav lives in a Sheet and the contents fold into a Collapsible above the
 * article. Reduced motion: the pill and bar jump and swaps are instant.
 *
 * Pass your `pages` (each section's body is any node, MDX included) and
 * `brand`; route pages with `getHref` and `linkComponent`, or let the docs
 * switch in place (`page`). Hear votes through `onFeedback`; every string is
 * in `copy`. */

interface DocsProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** The pages, in nav order; their `group`s become the nav's folds. Default: Northstar's SDK docs. */
  pages?: Page[]
  /** The open page's id, controlled: pair it with `onPageChange`. */
  page?: string
  /** The page open first, when the docs own it. Default 'installation'. */
  defaultPage?: string
  onPageChange?: (page: string) => void
  /** Each page's route; links then navigate instead of switching in place. */
  getHref?: (page: Page) => string
  /** Renders page links, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: ElementType
  /** The product in the header: `{ name, logo?, href? }`. Default: Northstar. */
  brand?: DocsBrand
  /** The version badge; `null` hides it. Default 'v2.4'. */
  version?: string | null
  /** Where "Edit this page" goes; `null` (or no function) hides it. Default: '#edit'. */
  getEditHref?: ((page: Page) => string) | null
  /** Hears "Was this page helpful?". */
  onFeedback?: (page: string, vote: 'yes' | 'no') => void
  /** Any of the docs' strings, to rewrite or translate. */
  copy?: Partial<DocsCopy>
}

function Docs({
  theme,
  pages = PAGES,
  page: pageProp,
  defaultPage = 'installation',
  onPageChange,
  getHref,
  linkComponent = 'a',
  brand = { name: 'Northstar' },
  version = 'v2.4',
  getEditHref = () => '#edit',
  onFeedback,
  copy: copyProp,
  className,
  ...rest
}: DocsProps) {
  const copy = { ...DOCS_COPY, ...copyProp }
  const [current, setOwnedCurrent] = useControllableState(pageProp, defaultPage)
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const links = useMemo(() => ({ Link: linkComponent, getHref }), [linkComponent, getHref])
  const found = pages.findIndex((p) => p.id === current)
  const index = found >= 0 ? found : Math.min(1, pages.length - 1)
  const page = pages[index]
  const prev = pages[index - 1]
  const next = pages[index + 1]
  const toc = page ? page.sections.map((s) => ({ id: s.id, label: s.title, depth: s.depth })) : []

  const go = (id: string) => {
    setOwnedCurrent(id)
    onPageChange?.(id)
    setMenu(false)
    window.scrollTo({ top: 0 })
  }

  return (
    <ThemeScope theme={theme}>
      <DocsLinkContext.Provider value={links}>
        <div className={cn('min-h-dvh bg-canvas text-fg', className)} {...rest}>
          <DocsHeader brand={brand} version={version} copy={copy} onMenu={() => setMenu(true)} onSearch={() => setSearch(true)} />

          <div className="mx-auto grid max-w-[90rem] lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_15rem]">
            <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto border-e border-line px-4 py-8 lg:block">
              <NavTree pages={pages} label={copy.navigation} current={page?.id ?? ''} onNavigate={go} />
            </aside>

            <main className="min-w-0 px-4 pt-8 pb-20 md:px-10 lg:px-14">
              {page && (
                <Reveal key={page.id} inView={false} distance={8} className="mx-auto flex max-w-[46rem] flex-col gap-8">
                  <div className="flex flex-col gap-4">
                    <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem>{page.group}</BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>{page.title}</BreadcrumbPage>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-4xl font-semibold tracking-tight">{page.title}</h1>
                    <p className="text-lg leading-relaxed text-fg-muted">{page.lead}</p>
                  </div>

                  <Collapsible className="rounded-lg border border-line xl:hidden">
                    <CollapsibleTrigger className="focus-ring flex w-full items-center gap-2 rounded-lg px-4 py-3 text-start text-ui font-medium">
                      <BookmarkIcon size={14} className="text-fg-muted" />
                      {copy.onThisPage}
                      <CollapsibleChevron size={14} className="ms-auto text-fg-muted" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4">
                        <AnchorNav items={toc} title={null} offset={72} aria-label={copy.onThisPage} />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {page.sections.map((s) => (
                    <section key={s.id} aria-labelledby={s.id} className="flex flex-col gap-4">
                      {s.depth ? (
                        <h3 id={s.id} className="scroll-mt-20 text-lg font-semibold tracking-tight">
                          {s.title}
                        </h3>
                      ) : (
                        <h2 id={s.id} className="scroll-mt-20 border-t border-line pt-8 text-2xl font-semibold tracking-tight">
                          {s.title}
                        </h2>
                      )}
                      {s.body}
                    </section>
                  ))}

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                    <Feedback key={page.id} copy={copy} onVote={onFeedback && ((vote) => onFeedback(page.id, vote))} />
                    <p className="flex items-center gap-3 text-ui-sm text-fg-muted">
                      {page.updated && <span>{copy.updated(page.updated)}</span>}
                      {getEditHref && (
                        <a href={getEditHref(page)} className="focus-ring inline-flex items-center gap-1 rounded-sm hover:text-fg">
                          <PencilIcon size={12} /> {copy.editPage}
                        </a>
                      )}
                    </p>
                  </div>

                  <nav aria-label={copy.pagination} className="grid grid-cols-2 gap-3">
                    {prev && <PagerCard page={prev} direction="prev" label={copy.previous} onNavigate={go} />}
                    {next && <PagerCard page={next} direction="next" label={copy.next} onNavigate={go} />}
                  </nav>
                </Reveal>
              )}
            </main>

            <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] py-10 pe-6 xl:block">
              <AnchorNav key={page?.id} items={toc} offset={72} />
            </aside>
          </div>

          <Sheet open={menu} onOpenChange={setMenu}>
            <SheetContent side="start">
              <SheetHeader>
                <SheetTitle>{copy.menuTitle(brand.name)}</SheetTitle>
              </SheetHeader>
              <SheetBody>
                <NavTree pages={pages} label={copy.navigation} current={page?.id ?? ''} onNavigate={go} />
              </SheetBody>
            </SheetContent>
          </Sheet>

          <SearchPalette pages={pages} copy={copy} open={search} onOpenChange={setSearch} onNavigate={go} />
        </div>
      </DocsLinkContext.Provider>
    </ThemeScope>
  )
}

export { Docs, DOCS_COPY }
export type { DocsBrand, DocsCopy, DocsProps, Page as DocsEntry, Section as DocsSection }
