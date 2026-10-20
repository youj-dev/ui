'use client'

import { useEffect, useRef, useState, type ComponentProps, type ElementType, type RefObject } from 'react'
import { MenuIcon } from '@youj/icons'
import { AppHeader, AppHeaderActions, AppHeaderBrand } from '../../components/ui/app-header'
import { Button, buttonVariants } from '../../components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '../../components/ui/sheet'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import {
  BRAND,
  CONTACT,
  CTA,
  DEFAULT_COPY,
  FOOTER_LINKS,
  ITEMS,
  SOCIALS,
  type NavbarFullscreenBrand,
  type NavbarFullscreenCopy,
  type NavbarFullscreenCta,
  type NavbarFullscreenItem,
  type NavbarFullscreenLink,
  type NavbarFullscreenSocial,
} from './navbar-fullscreen/data'
import { MenuBody } from './navbar-fullscreen/menu'

/* A slim bar for a brand-led site (a studio, an editorial product): the
 * mark, a call to action and a Menu button. The menu is the whole screen, a
 * modal dialog that wipes down from the top while its entries, set large,
 * rise into place one after another; the Close button lands where Menu was,
 * its bars folding into a cross as the word turns over. An entry with a
 * level of its own drills in: the list leaves toward the inline start as the
 * next arrives from the end (mirrored in RTL), focus moving to the new
 * level's first entry, and Back returns it to the entry it came from. Beside
 * the list on wide screens a picture follows the entry under the pointer or
 * keyboard focus. The foot holds the small links, a contact line and the
 * profiles. Escape closes from any level and focus returns to Menu; so does
 * following a link. The bar sticks and turns to frosted glass as the page
 * passes under it.
 * Reduced motion: the menu appears and levels swap in place; nothing rises.
 *
 * Pass your `items` (a level is an entry with `items`), `brand`, `cta` and the
 * foot's `footerLinks`, `socials` and `contact`; `current` marks the page you
 * are on and the entries that lead to it. Keep the menu open or closed with
 * `open` / `onOpenChange`. Every string is in `copy`. */

type LinkComponent = ElementType

interface NavbarFullscreenProps extends Omit<ComponentProps<'header'>, 'children'> {
  /** The menu's entries, in order: links, and levels of their own. Default: the demo's Work, Studio, Journal, Sound and Contact. */
  items?: NavbarFullscreenItem[]
  /** The name, mark and home link. Default: the demo's Kestrel. */
  brand?: NavbarFullscreenBrand
  /** The call to action on the bar (and at the menu's foot on phones); `null` hides it. Default: Start a project → `#contact`. */
  cta?: NavbarFullscreenCta | null
  /** Small links at the menu's foot. Default: Press, Imprint and Privacy. */
  footerLinks?: NavbarFullscreenLink[]
  /** Profiles elsewhere, as icon links at the menu's foot. Default: X, GitHub and LinkedIn. */
  socials?: NavbarFullscreenSocial[]
  /** A contact line at the menu's foot, usually a `mailto:`; `null` hides it. Default: hello@kestrel.studio. */
  contact?: NavbarFullscreenLink | null
  /** The `href` of the page being shown: marked current, and the entries that lead to it carry a dot. */
  current?: string
  /** The menu is open, to control it (close it on a route change, say). */
  open?: boolean
  /** The menu starts open, when uncontrolled. Default false. */
  defaultOpen?: boolean
  /** Called when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Stick to the top and turn to glass on scroll. Default true. */
  sticky?: boolean
  /** The element that scrolls under the bar. Default: the page. */
  scrollContainer?: RefObject<HTMLElement | null>
  /** Where the skip link goes: your main content's id as a hash; `null` leaves it out. Default `#content`. */
  skipTo?: string | null
  /** The element every link renders as, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<NavbarFullscreenCopy>
}

/* The bar's height, which the menu's own top row repeats so Close lands where Menu was. */
const ROW = 'h-[calc(var(--spacing-control)+--spacing(6))] px-3 md:px-5'

/** The button's words, Menu over Close in one cell, so the button keeps its width as they trade places. */
function MenuWord({ closing, copy }: { closing: boolean; copy: NavbarFullscreenCopy }) {
  const word = 'col-start-1 row-start-1 transition-[opacity,translate] yj-duration-base ease-standard'
  return (
    <span aria-hidden className="grid">
      <span className={cn(word, closing && '-translate-y-2 opacity-0')}>{copy.menu}</span>
      <span className={cn(word, 'text-start', !closing && 'translate-y-2 opacity-0')}>{copy.close}</span>
    </span>
  )
}

/** Close, arriving as Menu: it mounts as the bar's button and turns over, so it reads as the same button. */
function ArrivingClose({ copy }: { copy: NavbarFullscreenCopy }) {
  const [arrived, setArrived] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setArrived(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <>
      <MenuWord closing={arrived} copy={copy} />
      <MenuIcon active={arrived} size={18} strokeWidth={1.75} />
    </>
  )
}

function NavbarFullscreen({
  items = ITEMS,
  brand = BRAND,
  cta = CTA,
  footerLinks = FOOTER_LINKS,
  socials = SOCIALS,
  contact = CONTACT,
  current,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  sticky = true,
  scrollContainer,
  skipTo = '#content',
  linkComponent: Link = 'a',
  copy: copyProp,
  className,
  ...rest
}: NavbarFullscreenProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const [open, setOpen] = useControllableState(openProp, defaultOpen)
  const first = useRef<HTMLElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const change = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
  }
  const home = brand.href ?? '/'
  const mark = (
    <>
      {brand.logo}
      {brand.name}
    </>
  )
  const ctaLink = cta && (
    <Link href={cta.href} onClick={cta.onClick} className={buttonVariants({ variant: 'outline', className: 'max-md:hidden' })}>
      {cta.label}
    </Link>
  )
  return (
    <AppHeader sticky={sticky} scrollContainer={scrollContainer} {...rest} data-slot="navbar-fullscreen" className={cn('gap-2', className)}>
      {skipTo && (
        <a href={skipTo} className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'absolute start-3 top-2 z-50 bg-overlay -translate-y-[200%] focus-visible:translate-y-0')}>
          {copy.skipLink}
        </a>
      )}
      <AppHeaderBrand href={home} render={<Link href={home} />}>
        {mark}
      </AppHeaderBrand>
      <AppHeaderActions>
        {ctaLink}
        <Sheet open={open} onOpenChange={change}>
          <SheetTrigger render={<Button variant="ghost" className="gap-2.5 px-3" aria-label={copy.menu} />}>
            <MenuWord closing={false} copy={copy} />
            <MenuIcon size={18} strokeWidth={1.75} />
          </SheetTrigger>
          {/* shape: the menu wipes in with clip-path, so `!` replaces the sheet's own slide transition */}
          <SheetContent
            side="top"
            showCloseButton={false}
            ref={popup}
            // From the keyboard, straight to the first entry; from a pointer, the menu itself, so no ring appears until Tab.
            initialFocus={(type) => (type === 'keyboard' ? first.current : popup.current)}
            data-slot="navbar-fullscreen-menu"
            className={cn(
              'h-dvh max-h-none border-0 bg-overlay',
              // A wipe, not a slide: the menu stays where it is and is uncovered from the top, then covered again on the way out.
              '[--yj-sheet-hidden:none] [clip-path:inset(0)] data-starting-style:[clip-path:inset(0_0_100%_0)] data-ending-style:[clip-path:inset(0_0_100%_0)]',
              '[transition:clip-path_calc(var(--yj-duration-slow)*var(--yj-motion,1))_var(--ease-emphasized)]!',
              'data-ending-style:[transition-duration:calc(var(--yj-duration-base)*var(--yj-motion,1))]! data-ending-style:[transition-timing-function:var(--ease-exit)]!',
            )}
          >
            <SheetTitle className="sr-only">{copy.menu}</SheetTitle>
            <div className={cn('flex shrink-0 items-center gap-2 md:gap-4', ROW)}>
              <Link href={home} onClick={() => change(false)} className="inline-flex h-control shrink-0 items-center gap-2 rounded-md px-1 text-ui-lg font-semibold tracking-tight text-fg focus-ring [&_svg]:size-5 [&_svg]:shrink-0">
                {mark}
              </Link>
              <div className="ms-auto flex shrink-0 items-center gap-1 md:gap-2">
                {ctaLink}
                <SheetClose render={<Button variant="ghost" className="gap-2.5 px-3" aria-label={copy.close} />}>
                  <ArrivingClose copy={copy} />
                </SheetClose>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain yj-scrollbar">
              <MenuBody
                items={items}
                current={current}
                footerLinks={footerLinks}
                socials={socials}
                contact={contact}
                cta={cta}
                copy={copy}
                Link={Link}
                onFollow={() => change(false)}
                firstRef={first}
              />
            </div>
          </SheetContent>
        </Sheet>
      </AppHeaderActions>
    </AppHeader>
  )
}

export { NavbarFullscreen }
export type {
  NavbarFullscreenProps,
  NavbarFullscreenCopy,
  NavbarFullscreenItem,
  NavbarFullscreenLink,
  NavbarFullscreenSocial,
  NavbarFullscreenBrand,
  NavbarFullscreenCta,
}
