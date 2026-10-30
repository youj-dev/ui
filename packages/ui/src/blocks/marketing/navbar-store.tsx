'use client'

import { useState, type ComponentProps, type ElementType, type RefObject } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, useLocale, useYouj } from '@youj/core'
import { ArrowRightIcon, MenuIcon, ShoppingBagIcon, UserIcon } from '@youj/icons'
import { AppHeader, AppHeaderSearch } from '../../components/ui/app-header'
import { Button, buttonVariants } from '../../components/ui/button'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import {
  BAG,
  BRAND,
  DEFAULT_COPY,
  DEPARTMENTS,
  POPULAR,
  PRODUCTS,
  PROMO,
  REGIONS,
  UTILITY_LINKS,
  type NavbarStoreBag,
  type NavbarStoreBrand,
  type NavbarStoreCollection,
  type NavbarStoreCopy,
  type NavbarStoreDepartment,
  type NavbarStoreGroup,
  type NavbarStoreLink,
  type NavbarStoreProduct,
  type NavbarStorePromo,
  type NavbarStoreRegion,
  type NavbarStoreSearchResult,
} from './navbar-store/data'
import { Departments } from './navbar-store/departments'
import { StoreDrawer } from './navbar-store/drawer'
import { RegionMenu } from './navbar-store/region-menu'
import { StoreSearch } from './navbar-store/search'

/* A shop's header. A quiet strip on top carries a promise (free shipping),
 * the region and currency menu and the help links, and scrolls away. Under
 * it the bar sticks and turns to frosted glass as the page passes beneath:
 * the departments on the inline start (each a panel of category columns and
 * collection tiles, on the kit's morphing navigation menu), the store's mark
 * in the middle, and on the end the search, the account and the bag, whose
 * count drops in on a settle spring when it changes. Search drops from the
 * top as a floating panel: popular searches and products of the moment until
 * you type, then the matching products with their pictures and prices in the
 * region's currency, and a row for every result. On phones a menu button
 * opens a drawer of folding departments with the region and help links at
 * its foot; the promise stays on its strip.
 * Reduced motion: the count changes in place; panels, drawer and search
 * appear at once.
 *
 * Pass your `departments`, `regions`, `products` for search, the `promo`,
 * `bag` and `brand`; follow the region with `region`/`onRegionChange` and
 * the chosen search result with `onSearchSelect`. Every string is in `copy`. */

type LinkComponent = ElementType

interface NavbarStoreProps extends Omit<ComponentProps<'header'>, 'children'> {
  /** The departments: menus of columns and collection tiles, and plain links. Default: the demo's Clothing, Home, Journal and Sale. */
  departments?: NavbarStoreDepartment[]
  /** The `href` of the page being shown: marked, and its department carries a dot. */
  current?: string
  /** Where the store ships, each with its currency. Empty hides the menu. Default: the US, the UK, the EU and Japan. */
  regions?: NavbarStoreRegion[]
  /** The region shown, to control it. */
  region?: string
  /** The region shown first, when uncontrolled. Default: the first. */
  defaultRegion?: string
  /** Called with the id of the region chosen. */
  onRegionChange?: (id: string) => void
  /** The strip's promise; `null` leaves the strip with the region and links alone. Default: free shipping and returns. */
  promo?: NavbarStorePromo | null
  /** Links at the strip's end (and the drawer's foot). Default: Help and Stores. */
  utilityLinks?: NavbarStoreLink[]
  /** What the search suggests, priced in the region's currency. Default: the demo's six products. */
  products?: NavbarStoreProduct[]
  /** Searches offered before anything is typed. Default: four of the demo's. */
  popularSearches?: string[]
  /** Called with the product or query a search ends on. Default: go to its `href`. */
  onSearchSelect?: (result: NavbarStoreSearchResult) => void
  /** The results page; a query is added as `?q=`. Default `#search`. */
  searchHref?: string
  /** The account page; `null` hides the link. Default `#account`. */
  accountHref?: string | null
  /** The bag and its count; `null` hides it. Default: 2 items, `#bag`. */
  bag?: NavbarStoreBag | null
  /** The store's name, mark and home link. Default: the demo's Marlowe. */
  brand?: NavbarStoreBrand
  /** BCP 47 locale for prices. Default: the provider's. */
  locale?: string
  /** Stick to the top and turn to glass on scroll. Default true. */
  sticky?: boolean
  /** The element that scrolls under the bar. Default: the page. */
  scrollContainer?: RefObject<HTMLElement | null>
  /** Where the skip link goes: your main content's id as a hash; `null` leaves it out. Default `#content`. */
  skipTo?: string | null
  /** The element every internal link renders as, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<NavbarStoreCopy>
}

const prices = new Map<string, Intl.NumberFormat>()
function formatPrice(value: number, locale: string, currency: string) {
  const key = `${locale} ${currency}`
  let format = prices.get(key)
  if (!format) prices.set(key, (format = numberFormat(locale, { style: 'currency', currency })))
  return format.format(value)
}

/** The bag's count: a new number drops in on the settle spring as the old one falls away. */
function BagCount({ count }: { count: number }) {
  const k = useYouj()
  return (
    <MotionFeatures>
      <AnimatePresence initial={false} mode="popLayout">
        {count > 0 && (
          <m.span
            key={count}
            aria-hidden
            initial={k.reduced ? false : { y: '-80%', scale: 0.6, opacity: 0 }}
            animate={{ y: '0%', scale: 1, opacity: 1 }}
            exit={k.reduced ? undefined : { y: '80%', opacity: 0, transition: k.tween('fast', 'exit') }}
            transition={k.spring('settle')}
            className="absolute -end-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-accent px-1 text-ui-xs leading-none font-semibold text-on-accent tabular-nums"
          >
            {count}
          </m.span>
        )}
      </AnimatePresence>
    </MotionFeatures>
  )
}

function NavbarStore({
  departments = DEPARTMENTS,
  current,
  regions = REGIONS,
  region: regionProp,
  defaultRegion,
  onRegionChange,
  promo = PROMO,
  utilityLinks = UTILITY_LINKS,
  products = PRODUCTS,
  popularSearches = POPULAR,
  onSearchSelect,
  searchHref = '#search',
  accountHref = '#account',
  bag = BAG,
  brand = BRAND,
  locale: localeProp,
  sticky = true,
  scrollContainer,
  skipTo = '#content',
  linkComponent: Link = 'a',
  copy: copyProp,
  className,
  ...rest
}: NavbarStoreProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const [region, setRegion] = useControllableState(regionProp, defaultRegion ?? regions[0]?.id ?? '')
  const [searching, setSearching] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const currency = (regions.find((r) => r.id === region) ?? regions[0])?.currency ?? 'USD'
  const home = brand.href ?? '/'
  const pickRegion = (id: string) => {
    setRegion(id)
    onRegionChange?.(id)
  }
  const regionMenu = (className?: string) => regions.length > 0 && <RegionMenu regions={regions} value={region} onValueChange={pickRegion} copy={copy} className={className} />
  const mark = (
    <>
      {brand.logo}
      <span>{brand.name}</span>
    </>
  )
  const plainLink = 'rounded-sm text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring'

  return (
    <>
      <div data-slot="navbar-store-strip" className="relative bg-band text-ui-sm text-fg-muted">
        {skipTo && (
          <a href={skipTo} className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'absolute start-3 top-1 z-50 bg-overlay -translate-y-[200%] focus-visible:translate-y-0')}>
            {copy.skipLink}
          </a>
        )}
        <div className="flex min-h-control items-center gap-4 px-3 py-1 max-md:justify-center md:px-5">
          {promo &&
            (promo.href ? (
              <Link href={promo.href} className={cn(plainLink, 'inline-flex min-w-0 items-center gap-1.5')}>
                <span className="truncate">{promo.label}</span>
                {promo.cta && (
                  <span className="inline-flex shrink-0 items-center gap-1 font-medium text-fg underline-offset-3 hover:underline">
                    {promo.cta}
                    <ArrowRightIcon size={12} className="rtl:-scale-x-100" />
                  </span>
                )}
              </Link>
            ) : (
              <span className="truncate">{promo.label}</span>
            ))}
          <div className="ms-auto flex shrink-0 items-center gap-4 max-md:hidden">
            {regionMenu()}
            <nav aria-label={copy.utilityLabel} className="flex items-center gap-4">
              {utilityLinks.map((link) => (
                <Link key={link.href} href={link.href} className={plainLink}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <AppHeader sticky={sticky} scrollContainer={scrollContainer} {...rest} data-slot="navbar-store" className={cn('grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2', className)}>
        <div className="flex min-w-0 items-center">
          <Button variant="ghost" size="icon" aria-label={copy.openMenu} aria-expanded={drawer} onClick={() => setDrawer(true)} className="-ms-1 md:hidden">
            <MenuIcon active={drawer} size={18} strokeWidth={1.75} />
          </Button>
          <div className="min-w-0 max-md:hidden">
            <Departments departments={departments} current={current} label={copy.navLabel} Link={Link} />
          </div>
        </div>
        <Link href={home} className="inline-flex h-control items-center gap-2 justify-self-center rounded-md px-1 text-ui-lg font-semibold tracking-tight text-fg focus-ring [&_svg]:size-5 [&_svg]:shrink-0">
          {mark}
        </Link>
        <div className="flex items-center justify-end gap-1">
          <AppHeaderSearch placeholder={copy.searchPlaceholder} aria-label={copy.searchLabel.toLowerCase().includes(copy.searchPlaceholder.replace(/…$/, '').toLowerCase()) ? copy.searchLabel : `${copy.searchPlaceholder} ${copy.searchLabel}`} shortcut={false} onClick={() => setSearching(true)} className="md:w-44 lg:w-56" />
          {accountHref && (
            <Link href={accountHref} aria-label={copy.account} className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'max-md:hidden' })}>
              <UserIcon size={18} strokeWidth={1.75} />
            </Link>
          )}
          {bag && (
            <Link href={bag.href} onClick={bag.onClick} aria-label={copy.bag(bag.count)} className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'relative' })}>
              <ShoppingBagIcon size={18} strokeWidth={1.75} />
              <BagCount count={bag.count} />
            </Link>
          )}
        </div>
      </AppHeader>
      <StoreDrawer
        open={drawer}
        onOpenChange={setDrawer}
        departments={departments}
        current={current}
        title={mark}
        region={regionMenu('-ms-2')}
        utilityLinks={utilityLinks}
        copy={copy}
        Link={Link}
      />
      <StoreSearch
        open={searching}
        onOpenChange={setSearching}
        products={products}
        popular={popularSearches}
        price={(value) => formatPrice(value, locale, currency)}
        resultsHref={(query) => `${searchHref}?q=${encodeURIComponent(query)}`}
        onSelect={(result) => (onSearchSelect ? onSearchSelect(result) : window.location.assign(result.href))}
        copy={copy}
      />
    </>
  )
}

export { NavbarStore }
export type {
  NavbarStoreProps,
  NavbarStoreCopy,
  NavbarStoreDepartment,
  NavbarStoreGroup,
  NavbarStoreCollection,
  NavbarStoreLink,
  NavbarStoreRegion,
  NavbarStoreProduct,
  NavbarStoreSearchResult,
  NavbarStorePromo,
  NavbarStoreBag,
  NavbarStoreBrand,
}
