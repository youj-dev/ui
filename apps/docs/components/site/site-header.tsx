'use client'

import { useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useSearchContext } from 'fumadocs-ui/contexts/search'
import { BrandDiscordIcon } from '@youj/icons/components/youj/icons/brand-discord'
import { BrandGithubIcon } from '@youj/icons/components/youj/icons/brand-github'
import { SearchIcon } from '@youj/icons/components/youj/icons/search'
import { Kbd, KbdGroup } from '@youj/react/components/ui/kbd'
import { primeKeyboard } from '@youj/react/components/ui/presentation'
import { deferHydration } from '@/components/ui/defer-hydration'
import { MobileMenu } from '@/components/site/mobile-menu-lazy'
import { SiteLogo } from '@/components/site/site-logo'
import { SoundToggle } from '@/components/site/sound-toggle'
import { ThemeControl } from '@/components/site/theme-toggle'
import { hasPage } from '@/lib/page-index'
import { useScrolledPast } from '@/lib/use-scrolled-past'
import type { HeaderNav, NavMenu } from '@/lib/nav'
import { loadSearch } from '@/components/site/search-seed'
import { columnLinks } from '@/lib/nav-links'
import { communityLinks, type CommunityLink } from '@/lib/project'

/* The menus (and their panels' code, floating-ui's positioning among it) hydrate once the page is idle or a
 * menu is pointed at or focused, and never on a phone, where they're hidden: the server draws them in full. */
const DesktopNav = deferHydration(() => import('@/components/site/desktop-nav').then((m) => m.DesktopNav), {
  idle: true,
  intent: true,
  media: '(min-width: 48rem)',
})

export type SectionId = NavMenu['id']

/** The pages a menu owns: its links' and columns' lists, and its feature, without a fragment or query. A link to a section of a page owns that page alone, not the pages under it (the Sound builder is a section of /docs/sound). */
function ownedPages(menu: NavMenu): { path: string; exact: boolean }[] {
  return [...menu.links, ...(menu.columns ?? []), ...(menu.columns ?? []).flatMap(columnLinks), menu.feature].map((link) => ({ path: link.url.split(/[?#]/)[0]!, exact: link.url.includes('#') }))
}

/**
 * The menu holding the path: Components for the component groups and their
 * pages, Blocks for every Blocks docs page and Create, Visuals for the explorers
 * and galleries (/icons…, /loaders, /miniatures), Docs for every other docs
 * page (the Sound builder and Motion playground among them). Only
 * pages the site has count: the 404 renders once for every other URL, and
 * must hydrate the same wherever it's shown.
 */
export function activeSection(pathname: string, nav: HeaderNav): SectionId | undefined {
  if (!hasPage(nav.pages, pathname)) return undefined
  const within = (base: string) => pathname === base || pathname.startsWith(`${base}/`)
  for (const menu of nav.menus) {
    if (menu.id !== 'docs' && ownedPages(menu).some((page) => (page.exact ? pathname === page.path : within(page.path)))) return menu.id
  }
  if (within('/docs/blocks')) return 'blocks'
  if (within('/docs')) return 'docs'
  return undefined
}

/** Each community link's mark: the brands' own, static, in the text color. */
export const communityIcon: Record<CommunityLink['id'], typeof BrandGithubIcon> = {
  discord: BrandDiscordIcon,
  github: BrandGithubIcon,
}

/**
 * Discord and GitHub as icon buttons, each once it has somewhere to go
 * (lib/project's `site.links`). A button's name is its aria-label; the tip
 * under it repeats the name for the pointer and the keyboard, drawn in CSS
 * so the header carries no tooltip code, in the inverse tone the kit's Tooltip
 * wears. From md up: below, the menu sheet
 * holds them.
 */
const TIP =
  'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded-md bg-inverse px-2 py-1 text-ui-sm font-medium whitespace-nowrap text-fg opacity-0 shadow-sm transition-opacity yj-duration-fast ease-standard'

/** A community button before launch: no link, a tap or click shows "Coming soon" (hover and focus show it too). */
export function SoonButton({ link, className, above = false, children }: { link: CommunityLink; className: string; above?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      type="button"
      aria-label={`${link.label}: coming soon`}
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      onBlur={() => setOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      className={`group/tip relative ${className}`}
    >
      {children}
      <span aria-hidden data-yj-tone="inverse" className={`${TIP} ${above ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} ${open ? 'opacity-100' : 'group-hover/tip:opacity-100 group-hover/tip:delay-300 group-focus-visible/tip:opacity-100 touch:hidden'}`}>
        Coming soon
      </span>
    </button>
  )
}

const HEADER_BUTTON = 'hidden size-8 touch:size-11 place-items-center rounded-lg text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg focus-ring md:inline-grid'

function CommunityLinks() {
  return communityLinks().map((link) => {
    const Icon = communityIcon[link.id]
    if (link.soon)
      return (
        <SoonButton key={link.id} link={link} className={HEADER_BUTTON}>
          <Icon size={18} />
        </SoonButton>
      )
    return (
      <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.label} className={`group/tip relative ${HEADER_BUTTON}`}>
        <Icon size={18} />
        <span aria-hidden data-yj-tone="inverse" className={`${TIP} top-full mt-1.5 group-hover/tip:opacity-100 group-hover/tip:delay-300 group-focus-visible/tip:opacity-100 touch:hidden`}>
          {link.label}
        </span>
      </a>
    )
  })
}

function SearchTrigger() {
  const { setOpenSearch, hotKey } = useSearchContext()
  return (
    <>
      <button
        type="button"
        onPointerEnter={loadSearch}
        onFocus={loadSearch}
        onTouchStart={loadSearch}
        onClick={() => {
          primeKeyboard()
          setOpenSearch(true)
        }}
        className="group hidden h-control w-56 items-center gap-2 rounded-lg site-fill ps-2.5 pe-1.5 text-ui text-fg-muted hover:text-fg focus-ring xl:flex"
      >
        <SearchIcon size={16} strokeWidth={1.75} />
        <span className="min-w-0 flex-1 truncate text-start">Search docs…</span>
        {/* Keys read left to right in every direction: ⌘ K, never K ⌘. */}
        <KbdGroup dir="ltr" className="shrink-0">
          {hotKey.map((key, i) => (
            <Kbd key={i}>{key.display}</Kbd>
          ))}
        </KbdGroup>
      </button>
      <button
        type="button"
        onPointerEnter={loadSearch}
        onFocus={loadSearch}
        onTouchStart={loadSearch}
        onClick={() => {
          primeKeyboard()
          setOpenSearch(true)
        }}
        aria-label="Search docs"
        className="inline-grid size-8 touch:size-11 place-items-center rounded-lg text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg focus-ring xl:hidden"
      >
        <SearchIcon size={18} strokeWidth={1.6} />
      </button>
    </>
  )
}

export function SiteHeader({ nav }: { nav: HeaderNav }) {
  const pathname = usePathname()
  const active = activeSection(pathname, nav)
  // Once the page has scrolled, the header grows its hairline.
  const scrolled = useScrolledPast('3px')
  const home = pathname === '/'
  // /view/… is a bare demo, framed by the Blocks and Examples pages; /stealth is the private-preview gate.
  if (pathname.startsWith('/view/') || pathname === '/stealth') return null

  return (
    <header
      data-yj-tone="header"
      data-scrolled={scrolled || !home || undefined}
      className="sticky top-0 yj-glass z-40 h-(--header-height) border-b border-transparent transition-[border-color] yj-duration-base ease-standard data-scrolled:border-line"
    >
      <a
        href="#main"
        className="sr-only rounded-md bg-accent text-ui font-medium text-on-accent focus:not-sr-only focus:absolute focus:start-4 focus:top-2 focus:z-50 focus:inline-flex focus:h-9 focus:items-center focus:px-3.5"
      >
        Skip to content
      </a>
      {/* Full width on every page, the homepage and the docs too, so moving between them never shifts the header and a wide screen never strands it in the middle. */}
      {/* The notch is above it (--header-height adds it) and a landscape phone's sides are beside it: the bar pads for both. */}
      <div className="mx-auto flex h-full w-full max-w-(--docs-width) items-center gap-2 pt-[env(safe-area-inset-top)] pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] md:pr-[max(1.5rem,env(safe-area-inset-right))] md:pl-[max(1.5rem,env(safe-area-inset-left))]">
        <SiteLogo className="-ms-1 me-3" />
        <DesktopNav nav={nav} active={active} />
        <div className="ms-auto flex items-center gap-1 touch:-me-1.5">
          <SearchTrigger />
          <CommunityLinks />
          <SoundToggle />
          <ThemeControl />
          <MobileMenu nav={nav} active={active} />
        </div>
      </div>
    </header>
  )
}
