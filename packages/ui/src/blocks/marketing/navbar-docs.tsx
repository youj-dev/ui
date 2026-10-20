'use client'

import { useMemo, useState, type ComponentProps, type ElementType, type MouseEvent, type ReactNode, type RefObject } from 'react'
import { useLocale } from '@youj/core'
import { BrandGithubIcon, MenuIcon } from '@youj/icons'
import { AppHeader, AppHeaderSearch } from '../../components/ui/app-header'
import { Button, buttonVariants } from '../../components/ui/button'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import {
  BRAND,
  CTA,
  DEFAULT_COPY,
  LINKS,
  REPOSITORY,
  SECTIONS,
  VERSIONS,
  type NavbarDocsBrand,
  type NavbarDocsCopy,
  type NavbarDocsCta,
  type NavbarDocsGroup,
  type NavbarDocsLink,
  type NavbarDocsPage,
  type NavbarDocsRepository,
  type NavbarDocsResult,
  type NavbarDocsSection,
  type NavbarDocsVersion,
} from './navbar-docs/data'
import { DocsDrawer } from './navbar-docs/drawer'
import { DocsSearch, resultsOf } from './navbar-docs/search'
import { SectionTabs } from './navbar-docs/tabs'
import { VersionMenu } from './navbar-docs/version-menu'

/* A documentation site's header, in two rows. On top: the product and
 * "Docs", the version menu (the versions served here as a checked list with
 * Latest and Pre-release tags, archived ones as links that leave), a wide
 * search field whose ⌘K palette finds every page by title, group and section
 * (pages chosen this visit first, under Recent), the bar's links, the
 * repository with its star count, your actions and a call to action. Under
 * it, the sections as tabs: an underline glides to the current one on the
 * header's edge, a hover pill follows the pointer and keyboard focus. The
 * header sticks and turns to frosted glass as the page passes under it, its
 * top row tightening. On phones the top row keeps the product, the version,
 * search and a menu button; the tabs scroll sideways with fading edges and
 * keep the current one in sight; the menu is a drawer from the inline start
 * with the sections as chips and the current section's page tree (folding
 * branches, the current page marked and scrolled into view).
 * Reduced motion: the underline and chips jump; the drawer and palette appear.
 *
 * Pass your `sections` (each with its tree), `versions`, `links`, the
 * `repository`, `brand` and `cta`; follow the section and version with
 * `section`/`onSectionChange` and `version`/`onVersionChange`, and the page
 * with `current`. Every string is in `copy`. */

type LinkComponent = ElementType

interface NavbarDocsProps extends Omit<ComponentProps<'header'>, 'children'> {
  /** The docs' sections, each a tab with its page tree for the phone drawer and search. Default: the demo's Get started, Guides, API reference, CLI and Examples. */
  sections?: NavbarDocsSection[]
  /** The current section's id, to control it (from your route, say). */
  section?: string
  /** The section a page starts on, when uncontrolled. Default: the first. */
  defaultSection?: string
  /** Called with the id of a section tab that was followed. */
  onSectionChange?: (id: string) => void
  /** The `href` of the page being shown: marked, and opened to, in the drawer's tree. */
  current?: string
  /** The versions; one with an `href` is archived elsewhere. Empty hides the menu. Default: v4.3, v4.2, v3.x and v2.x. */
  versions?: NavbarDocsVersion[]
  /** The version shown, to control it. */
  version?: string
  /** The version shown first, when uncontrolled. Default: the one marked `latest`, else the first served here. */
  defaultVersion?: string
  /** Called with the id of the version chosen from the menu (archived ones are links and don't call it). */
  onVersionChange?: (id: string) => void
  /** Links on the bar from `lg` and in the drawer. Default: Blog and Changelog. */
  links?: NavbarDocsLink[]
  /** The repository and its star count; `null` hides it. Default: a GitHub link with 12.5k stars. */
  repository?: NavbarDocsRepository | null
  /** The product's name, mark and home link. Default: the demo's Atlas. */
  brand?: NavbarDocsBrand
  /** The call to action on the bar from `md` and in the drawer; `null` hides it. Default: Dashboard → `#dashboard`. */
  cta?: NavbarDocsCta | null
  /** Show the search field and its ⌘K palette. Default true. */
  search?: boolean
  /** Called when a search result is chosen. Default: go to its `href`. */
  onSearchSelect?: (result: NavbarDocsResult) => void
  /** Extra controls before the call to action (a theme toggle, Ask AI). */
  actions?: ReactNode
  /** BCP 47 locale for the star count. Default: the provider's. */
  locale?: string
  /** Stick to the top and turn to glass on scroll. Default true. */
  sticky?: boolean
  /** The element that scrolls under the header. Default: the page. */
  scrollContainer?: RefObject<HTMLElement | null>
  /** Where the skip link goes: your main content's id as a hash; `null` leaves it out. Default `#content`. */
  skipTo?: string | null
  /** The element every internal link renders as, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<NavbarDocsCopy>
}

const compact = new Map<string, Intl.NumberFormat>()
function formatCount(value: number, locale: string) {
  let format = compact.get(locale)
  if (!format) compact.set(locale, (format = numberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 })))
  return format.format(value)
}

/* The top row's height, from the control token, tightening by 8px once the header condenses. */
const ROW =
  'flex h-[calc(var(--spacing-control)+--spacing(6))] items-center gap-2 px-3 transition-[height] yj-duration-base ease-standard group-data-condensed/app-header:h-[calc(var(--spacing-control)+--spacing(4))] md:gap-3 md:px-5'

function NavbarDocs({
  sections = SECTIONS,
  section: sectionProp,
  defaultSection,
  onSectionChange,
  current,
  versions = VERSIONS,
  version: versionProp,
  defaultVersion,
  onVersionChange,
  links = LINKS,
  repository = REPOSITORY,
  brand = BRAND,
  cta = CTA,
  search = true,
  onSearchSelect,
  actions,
  locale: localeProp,
  sticky = true,
  scrollContainer,
  skipTo = '#content',
  linkComponent: Link = 'a',
  copy: copyProp,
  className,
  ...rest
}: NavbarDocsProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const [section, setSection] = useControllableState(sectionProp, defaultSection ?? sections[0]?.id ?? '')
  const served = versions.filter((v) => !v.href)
  const [version, setVersion] = useControllableState(versionProp, defaultVersion ?? (served.find((v) => v.latest) ?? served[0])?.id ?? '')
  const [searching, setSearching] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const home = brand.href ?? '/'
  const results = useMemo(() => resultsOf(sections), [sections])

  const pickSection = (id: string, event: MouseEvent<HTMLAnchorElement>) => {
    // A section opened elsewhere (⌘-click, a new window) leaves this page's tab as it is.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    setSection(id)
    onSectionChange?.(id)
  }
  const pickVersion = (id: string) => {
    setVersion(id)
    onVersionChange?.(id)
  }
  const stars = repository?.stars !== undefined ? formatCount(repository.stars, locale) : ''
  const repo = (iconOnly: boolean) =>
    repository && (
      <a href={repository.href} aria-label={copy.repository(stars)} className={buttonVariants({ variant: 'ghost', size: iconOnly ? 'icon' : 'sm' })}>
        <BrandGithubIcon size={16} />
        {!iconOnly && stars && (
          <span aria-hidden className="text-ui-sm text-fg-muted tabular-nums">
            {stars}
          </span>
        )}
      </a>
    )
  const title = (
    <>
      {brand.logo}
      <span>{brand.name}</span>
      <span aria-hidden className="h-4 w-px bg-line-strong" />
      <span className="font-normal text-fg-muted">{copy.docs}</span>
    </>
  )

  return (
    <AppHeader
      sticky={sticky}
      scrollContainer={scrollContainer}
      {...rest}
      data-slot="navbar-docs"
      className={cn('h-auto! flex-col items-stretch gap-0 border-line px-0 md:gap-0 md:px-0', className)}
    >
      {skipTo && (
        <a href={skipTo} className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'absolute start-3 top-2 z-50 bg-overlay -translate-y-[200%] focus-visible:translate-y-0')}>
          {copy.skipLink}
        </a>
      )}
      <div className={ROW}>
        <Link href={home} className="inline-flex h-control shrink-0 items-center gap-2 rounded-md px-1 text-ui-lg font-semibold tracking-tight text-fg focus-ring [&_svg]:size-5 [&_svg]:shrink-0">
          {title}
        </Link>
        {versions.length > 0 && <VersionMenu versions={versions} value={version} onValueChange={pickVersion} copy={copy} Link={Link} />}
        <div className="flex min-w-0 flex-1 items-center justify-end md:justify-center md:px-4">
          {search && <AppHeaderSearch placeholder={copy.searchPlaceholder} aria-label={copy.searchLabel} onClick={() => setSearching(true)} className="md:w-full md:max-w-md" />}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'max-lg:hidden' })}>
              {link.label}
            </Link>
          ))}
          <span className="max-md:hidden">{repo(false)}</span>
          {actions}
          {cta && (
            <Link href={cta.href} onClick={cta.onClick} className={buttonVariants({ size: 'sm', className: 'ms-1 max-md:hidden' })}>
              {cta.label}
            </Link>
          )}
          <Button variant="ghost" size="icon" aria-label={copy.openMenu} aria-expanded={drawer} onClick={() => setDrawer(true)} className="md:hidden">
            <MenuIcon active={drawer} size={18} strokeWidth={1.75} />
          </Button>
        </div>
      </div>
      {sections.length > 0 && <SectionTabs sections={sections} value={section} onSelect={pickSection} label={copy.sectionsLabel} Link={Link} />}
      <DocsDrawer
        open={drawer}
        onOpenChange={setDrawer}
        sections={sections}
        section={section}
        current={current}
        title={title}
        links={links}
        repository={repo(true)}
        cta={cta}
        copy={copy}
        Link={Link}
      />
      {search && (
        <DocsSearch
          results={results}
          open={searching}
          onOpenChange={setSearching}
          onSelect={(result) => (onSearchSelect ? onSearchSelect(result) : window.location.assign(result.href))}
          copy={copy}
        />
      )}
    </AppHeader>
  )
}

export { NavbarDocs }
export type {
  NavbarDocsProps,
  NavbarDocsCopy,
  NavbarDocsSection,
  NavbarDocsGroup,
  NavbarDocsPage,
  NavbarDocsVersion,
  NavbarDocsLink,
  NavbarDocsRepository,
  NavbarDocsBrand,
  NavbarDocsCta,
  NavbarDocsResult,
}
