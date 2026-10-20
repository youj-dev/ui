'use client'

import { useState, type ComponentProps, type ElementType, type ReactNode, type RefObject } from 'react'
import { Collapse } from '@youj/motion'
import { ArrowRightIcon, SearchIcon, XIcon } from '@youj/icons'
import { AppHeader, AppHeaderActions, AppHeaderBrand, AppHeaderMenu, AppHeaderNav, AppHeaderSearch } from '../../components/ui/app-header'
import { Badge } from '../../components/ui/badge'
import { Button, buttonVariants } from '../../components/ui/button'
import { AccountMenu } from './navbar/account'
import {
  ACCOUNT_LINKS,
  ANNOUNCEMENT,
  BRAND,
  DEFAULT_COPY,
  LINKS,
  SEARCH_ITEMS,
  type MarketingNavbarAccountLink,
  type MarketingNavbarAnnouncement,
  type MarketingNavbarBrand,
  type MarketingNavbarCard,
  type MarketingNavbarCopy,
  type MarketingNavbarCta,
  type MarketingNavbarGroup,
  type MarketingNavbarItem,
  type MarketingNavbarLink,
  type MarketingNavbarPreview,
  type MarketingNavbarSearchItem,
  type MarketingNavbarUser,
} from './navbar/data'
import { DrawerLinks, drawerFooter } from './navbar/drawer'
import { DesktopNav } from './navbar/menu'
import { NavbarSearch } from './navbar/search'

/* A product site's navbar. The brand, then Product, Solutions and Resources
 * as mega menus on the kit's navigation menu, whose popup morphs from one
 * panel to the next: a preview card beside the links follows the one hovered
 * or focused, cross-fading as it rises in from the way you moved (or a
 * column of media cards: a post, a guide), a strip below points at a launch
 * or a story, and the trigger of the menu holding the current page carries a
 * dot. Then plain links, ⌘K
 * search, and the account on the inline end: Sign in and Start free when
 * signed out, a Dashboard button and an avatar menu when signed in. An
 * announcement bar sits above and scrolls away; the bar itself sticks and
 * condenses into a translucent, hairlined surface once the page passes under
 * it. Below `md` the navigation is a drawer whose menus fold open as
 * sections and whose footer carries the account.
 * Keyboard: Tab to a trigger, Enter / Space / ↓ opens its panel, Tab walks
 * the links, Escape closes and returns to the trigger; ⌘K (Ctrl+K) opens
 * search from anywhere. Reduced motion: panels and previews switch in place.
 *
 * Pass your own sitemap as `links`, your `brand`, the `user` when signed in
 * (and `onSignOut`), the `announcement`, and `searchItems` for pages outside
 * the menus; set `linkComponent` for your router. Every string is in `copy`. */

type LinkComponent = ElementType

interface MarketingNavbarProps extends Omit<ComponentProps<'header'>, 'children'> {
  /** The link of the page being shown, marked as current; the trigger of the menu holding it carries a dot. */
  current?: string
  /** The open mega menu's label, `null` for none, to control it (close it on a route change, say). */
  menu?: string | null
  /** The mega menu open at first, when uncontrolled. Default: none. */
  defaultMenu?: string | null
  /** Called with the label of the menu that opens, or `null` as it closes. */
  onMenuChange?: (menu: string | null) => void
  /** Stick to the top and condense on scroll. Default true. */
  sticky?: boolean
  /** The element that scrolls under the bar. Default: the page. */
  scrollContainer?: RefObject<HTMLElement | null>
  /** The top-level entries, in order: plain links and mega menus. Default: the demo's Product, Solutions, Resources, Customers and Pricing. */
  links?: MarketingNavbarItem[]
  /** The product's name, logo and home link. Default: the demo's Northwind. */
  brand?: MarketingNavbarBrand
  /** The bar above the header; `null` hides it. Default: the demo's launch notice. */
  announcement?: MarketingNavbarAnnouncement | null
  /** The announcement was dismissed (the visitor's choice to remember is yours). */
  onDismissAnnouncement?: () => void
  /** The signed-in person: the bar shows the dashboard button and the account menu instead of the sign-in calls to action. Default: signed out. */
  user?: MarketingNavbarUser | null
  /** The account menu's pages above Sign out. Default: Dashboard, Billing and Settings. */
  accountLinks?: MarketingNavbarAccountLink[]
  /** Called when the visitor chooses Sign out. */
  onSignOut?: () => void
  /** The signed-in button on the bar; `null` hides it. Default: Dashboard → `#dashboard`. */
  dashboardCta?: MarketingNavbarCta | null
  /** The solid call to action when signed out, on the bar from `md` and first in the drawer; `null` hides it. Default: Start free → `#signup`. */
  primaryCta?: MarketingNavbarCta | null
  /** The quiet call to action beside it; `null` hides it. Default: Sign in → `#login`. */
  secondaryCta?: MarketingNavbarCta | null
  /** Show the ⌘K search. Default true. */
  search?: boolean
  /** Pages the search finds beyond the menus' links. Default: Pricing, Customers, Security and Contact. */
  searchItems?: MarketingNavbarSearchItem[]
  /** Called when a search result is chosen. Default: go to its `href`. */
  onSearchSelect?: (item: MarketingNavbarSearchItem) => void
  /** Extra controls on the inline end, before the search (a theme toggle, a GitHub star count). */
  actions?: ReactNode
  /** The element every internal link renders as, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<MarketingNavbarCopy>
}

function Announcement({
  announcement,
  onDismiss,
  copy,
  Link,
}: {
  announcement: MarketingNavbarAnnouncement
  onDismiss: () => void
  copy: MarketingNavbarCopy
  Link: LinkComponent
}) {
  const [open, setOpen] = useState(true)
  return (
    <Collapse open={open}>
      <aside aria-label={copy.announcementLabel} className="relative flex items-center justify-center gap-3 bg-accent px-12 py-2 text-ui-sm text-on-accent">
        <Link href={announcement.href} className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-sm text-center focus-ring">
          {announcement.badge && <Badge variant="outline" className="border-current text-current">{announcement.badge}</Badge>}
          <span className="font-medium">{announcement.label}</span>
          {announcement.cta && (
            <span className="inline-flex items-center gap-1 underline underline-offset-3">
              {announcement.cta}
              <ArrowRightIcon size={14} aria-hidden className="rtl:-scale-x-100" />
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={copy.dismissAnnouncement}
          className="absolute end-2 top-1/2 -translate-y-1/2 text-current hover:text-current"
          onClick={() => {
            setOpen(false)
            onDismiss()
          }}
        >
          <XIcon size={14} />
        </Button>
      </aside>
    </Collapse>
  )
}

function MarketingNavbar({
  current,
  menu,
  defaultMenu,
  onMenuChange,
  sticky = true,
  scrollContainer,
  links = LINKS,
  brand = BRAND,
  announcement = ANNOUNCEMENT,
  onDismissAnnouncement,
  user = null,
  accountLinks = ACCOUNT_LINKS,
  onSignOut,
  dashboardCta = { label: DEFAULT_COPY.dashboard, href: '#dashboard' },
  primaryCta: primary = { label: DEFAULT_COPY.signUp, href: '#signup' },
  secondaryCta: secondary = { label: DEFAULT_COPY.signIn, href: '#login' },
  search = true,
  searchItems = SEARCH_ITEMS,
  onSearchSelect,
  actions,
  linkComponent: Link = 'a',
  copy: copyProp,
  ...rest
}: MarketingNavbarProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const [searching, setSearching] = useState(false)
  const home = brand.href ?? '/'
  const cta = (item: MarketingNavbarCta, variant: 'default' | 'ghost') => (
    <Link href={item.href} onClick={item.onClick} className={buttonVariants({ size: 'sm', variant, className: 'max-md:hidden' })}>
      {item.label}
    </Link>
  )
  return (
    <>
      {announcement && <Announcement announcement={announcement} onDismiss={() => onDismissAnnouncement?.()} copy={copy} Link={Link} />}
      <AppHeader sticky={sticky} scrollContainer={scrollContainer} {...rest}>
        <AppHeaderBrand href={home} render={<Link href={home} />}>
          {brand.logo}
          {brand.name}
        </AppHeaderBrand>
        <AppHeaderNav>
          <DesktopNav links={links} current={current} label={copy.navLabel} menu={menu} defaultMenu={defaultMenu} onMenuChange={onMenuChange} Link={Link} />
        </AppHeaderNav>
        <AppHeaderActions>
          {actions}
          {search && (
            <>
              <AppHeaderSearch placeholder={copy.searchPlaceholder} aria-label={copy.searchLabel} onClick={() => setSearching(true)} className="md:max-lg:hidden" />
              <Button variant="ghost" size="icon" aria-label={copy.searchLabel} onClick={() => setSearching(true)} className="max-md:hidden lg:hidden">
                <SearchIcon size={16} />
              </Button>
            </>
          )}
          {user ? (
            <>
              {dashboardCta && cta(dashboardCta, 'default')}
              <AccountMenu user={user} links={accountLinks} onSignOut={onSignOut} copy={copy} Link={Link} />
            </>
          ) : (
            <>
              {secondary && cta(secondary, 'ghost')}
              {primary && cta(primary, 'default')}
            </>
          )}
          <AppHeaderMenu
            title={copy.menu || undefined}
            header={
              <span className="inline-flex items-center gap-2 [&_svg]:size-5">
                {brand.logo}
                {brand.name}
              </span>
            }
            footer={drawerFooter({ user, accountLinks, primary: user ? dashboardCta : primary, secondary, onSignOut, copy, Link })}
          >
            <DrawerLinks links={links} current={current} label={copy.sections} Link={Link} />
          </AppHeaderMenu>
        </AppHeaderActions>
      </AppHeader>
      {search && (
        <NavbarSearch
          links={links}
          items={searchItems}
          copy={copy}
          open={searching}
          onOpenChange={setSearching}
          onSelect={(item) => (onSearchSelect ? onSearchSelect(item) : window.location.assign(item.href))}
        />
      )}
    </>
  )
}

export { MarketingNavbar }
export type {
  MarketingNavbarProps,
  MarketingNavbarCopy,
  MarketingNavbarItem,
  MarketingNavbarGroup,
  MarketingNavbarLink,
  MarketingNavbarCard,
  MarketingNavbarPreview,
  MarketingNavbarCta,
  MarketingNavbarBrand,
  MarketingNavbarAnnouncement,
  MarketingNavbarUser,
  MarketingNavbarAccountLink,
  MarketingNavbarSearchItem,
}
