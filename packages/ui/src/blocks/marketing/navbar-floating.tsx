'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ElementType, type FocusEvent, type KeyboardEvent, type RefObject } from 'react'
import { AnimatePresence, m, useMotionValue } from 'motion/react'
import { MotionFeatures, observeThemeChange, useYouj } from '@youj/core'
import { Collapse, SlidingIndicator, Stagger } from '@youj/motion'
import { MenuIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { Button, buttonVariants } from '../../components/ui/button'
import { useIsMobile } from '../../hooks/use-mobile'
import { cn } from '../../lib/utils'
import {
  BRAND,
  DEFAULT_COPY,
  LINKS,
  PRIMARY_CTA,
  SECONDARY_CTA,
  type NavbarFloatingBrand,
  type NavbarFloatingCopy,
  type NavbarFloatingCta,
  type NavbarFloatingLink,
} from './navbar-floating/data'
import { useFloatingScroll } from './navbar-floating/use-floating-scroll'

/* A floating island of navigation over the top of the page: the brand, a few
 * links and a call to action. At the top it spans the page's column, quiet
 * and borderless; once the page scrolls under it, it draws in around its
 * links (a layout morph on the smooth spring, transform-only, its corners
 * kept round mid-flight), folds the brand's name to the mark and takes the
 * frosted float surface. Scrolling on down hides it, a little scroll back up
 * returns it; it never hides near the top, while the keyboard is inside it or
 * while its menu is open. In-page links (`#pricing`) follow the section in
 * view: the current one carries aria-current and a pill that glides to it as
 * you read, and a hairline along the island's foot fills with your progress
 * through the page. On phones the island keeps the brand, the call to action
 * and a menu button, and the button grows the island itself into the menu:
 * the links rise in one after another; Escape, a press outside or following a
 * link folds it back, focus returning to the button.
 * Reduced motion: it never hides, and every change (condensed, current,
 * open) lands at once.
 *
 * It floats over the page and takes no room of its own: give the first
 * section enough top padding (about 6rem). Pass your `links`, `brand` and
 * calls to action; `current` when your router knows the page; set
 * `scrollContainer` when the page scrolls inside an element. Every string is
 * in `copy`. */

type LinkComponent = ElementType

interface NavbarFloatingProps extends Omit<ComponentProps<'header'>, 'children'> {
  /** The links, up to about six. In-page links (`#pricing`) follow the section in view. Default: the demo's Features, Pricing, Customers and Changelog. */
  links?: NavbarFloatingLink[]
  /** The product's name, mark and home link. Default: the demo's Halden. */
  brand?: NavbarFloatingBrand
  /** The solid call to action, on the island at every width; `null` hides it. Default: Get started → `#signup`. */
  primaryCta?: NavbarFloatingCta | null
  /** The quiet one beside it at rest (and in the phone menu); `null` hides it. Default: Sign in → `#login`. */
  secondaryCta?: NavbarFloatingCta | null
  /** The current link's `href`, when your router knows the page. Default: the in-page section in view. */
  current?: string
  /** Called with the `href` of the section that comes into view (undefined above the first). */
  onCurrentChange?: (href: string | undefined) => void
  /** Draw in once the page scrolls under it. Default true. */
  condense?: boolean
  /** Hide while the page scrolls down, return on the way up. Default true; never under reduced motion. */
  hideOnScroll?: boolean
  /** A hairline that fills with the reader's progress through the page, once condensed. Default true. */
  progress?: boolean
  /** The element that scrolls under the island. Default: the page. */
  scrollContainer?: RefObject<HTMLElement | null>
  /** Where the skip link goes: your main content's id as a hash; `null` leaves it out. Default `#content`. */
  skipTo?: string | null
  /** The element every link renders as, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<NavbarFloatingCopy>
}

/* The island's corners are concentric with its controls: the control radius plus its padding. */
const ISLAND_RADIUS = 'rounded-[calc(var(--radius-control)+--spacing(1.5))]'

const sectionOf = (href: string) => (href.startsWith('#') && href.length > 1 ? href.slice(1) : undefined)

function NavbarFloating({
  links = LINKS,
  brand = BRAND,
  primaryCta = PRIMARY_CTA,
  secondaryCta = SECONDARY_CTA,
  current: currentProp,
  onCurrentChange,
  condense = true,
  hideOnScroll = true,
  progress = true,
  scrollContainer,
  skipTo = '#content',
  linkComponent: Link = 'a',
  copy: copyProp,
  className,
  ...rest
}: NavbarFloatingProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const k = useYouj()
  const mobile = useIsMobile()
  const panelId = useId()
  const island = useRef<HTMLDivElement>(null)
  const probe = useRef<HTMLSpanElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [focusInside, setFocusInside] = useState(false)
  if (open && !mobile) setOpen(false)

  const sections = links.flatMap((link) => sectionOf(link.href) ?? [])
  const scroll = useFloatingScroll({
    container: scrollContainer,
    condense,
    hide: hideOnScroll && !k.reduced,
    sections: currentProp === undefined ? sections : [],
  })
  const current = currentProp ?? (scroll.current ? `#${scroll.current}` : undefined)
  const condensed = scroll.condensed
  const hidden = scroll.hidden && !open && !focusInside
  const surface = condensed || open
  const drawn = condensed && !mobile

  const reported = useRef(current)
  useEffect(() => {
    if (currentProp !== undefined || reported.current === current) return
    reported.current = current
    onCurrentChange?.(current)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reports a new section, not a new onCurrentChange
  }, [current, currentProp])

  // Motion keeps the corners round while the island morphs only from a radius it can read: the theme's, measured.
  const radius = useMotionValue<string | undefined>(undefined)
  useLayoutEffect(() => {
    const read = () => probe.current && radius.set(getComputedStyle(probe.current).borderTopLeftRadius)
    read()
    return observeThemeChange(island.current, read)
  }, [radius])

  // A press outside folds the menu.
  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => {
      if (!island.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !open) return
    event.stopPropagation()
    setOpen(false)
    menuButton.current?.focus()
  }
  const onBlur = (event: FocusEvent) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusInside(false)
  }
  const follow = (href: string) => {
    const id = sectionOf(href)
    if (id && currentProp === undefined && document.getElementById(id)) scroll.pin(id)
    setOpen(false)
  }
  const ariaCurrent = (href: string) => (href === current ? (sectionOf(href) ? 'true' : 'page') : undefined)
  const morph = k.reduced ? { type: false as const } : k.spring('smooth')

  return (
    <header
      {...rest}
      data-yj-condensed={condensed || undefined}
      data-yj-hidden={hidden || undefined}
      className={cn('pointer-events-none sticky top-0 z-40 h-0', className)}
    >
      {skipTo && (
        <a
          href={skipTo}
          className={cn(
            buttonVariants({ size: 'sm', variant: 'outline' }),
            'pointer-events-auto absolute start-3 top-3 z-50 bg-overlay -translate-y-[200%] focus-visible:translate-y-0',
          )}
        >
          {copy.skipLink}
        </a>
      )}
      <MotionFeatures features="max">
        <m.div
          initial={false}
          animate={{ y: hidden ? '-160%' : '0%' }}
          transition={k.reduced ? { type: false } : k.spring('snappy')}
          className="flex justify-center px-3 pt-3 md:pt-4"
        >
          <m.div
            ref={island}
            layout
            transition={{ layout: morph }}
            style={{ borderRadius: radius }}
            data-yj-tone="float"
            data-slot="navbar-floating-island"
            data-yj-surface={surface || undefined}
            onKeyDown={onKeyDown}
            onFocus={() => setFocusInside(true)}
            onBlur={onBlur}
            className={cn(
              'pointer-events-auto relative isolate flex w-full flex-col border border-transparent p-1.5 text-ui text-fg',
              ISLAND_RADIUS,
              'transition-[background-color,border-color,box-shadow,backdrop-filter] yj-duration-base ease-standard',
              surface && 'border-line shadow-lg',
              condensed && !open && 'yj-glass',
              open && 'bg-chrome-float',
              drawn ? 'md:w-auto' : 'md:max-w-5xl',
            )}
          >
            <span ref={probe} aria-hidden className={cn('pointer-events-none absolute size-0', ISLAND_RADIUS)} />
            <div className={cn('flex items-center gap-1', !drawn && 'md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]')}>
              <m.div layout="position" transition={{ layout: morph }} className="flex min-w-0 items-center">
                <Link
                  href={brand.href ?? '/'}
                  className="relative flex h-control min-w-0 items-center gap-2 rounded-control px-2 text-ui-lg font-semibold tracking-tight text-fg focus-ring [&_svg]:size-5 [&_svg]:shrink-0"
                >
                  {brand.logo}
                  <span className="sr-only">{brand.name}</span>
                  <AnimatePresence initial={false} mode="popLayout">
                    {!drawn && (
                      <m.span
                        key="name"
                        aria-hidden
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={k.tween('fast')}
                        className="truncate"
                      >
                        {brand.name}
                      </m.span>
                    )}
                  </AnimatePresence>
                </Link>
              </m.div>
              <m.nav layout="position" transition={{ layout: morph }} aria-label={copy.navLabel} className="max-md:hidden">
                <ul className="relative isolate flex items-center gap-0.5">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={ariaCurrent(link.href)}
                        onClick={() => follow(link.href)}
                        className="flex h-control items-center gap-1.5 rounded-control px-3 font-medium whitespace-nowrap text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring aria-[current]:text-fg"
                      >
                        {link.label}
                        {link.badge && <Badge size="sm">{link.badge}</Badge>}
                      </Link>
                    </li>
                  ))}
                  <SlidingIndicator data-slot="navbar-floating-current" className="rounded-control bg-selected" />
                  <SlidingIndicator follow="hover" className="rounded-control bg-hover" />
                </ul>
              </m.nav>
              <m.div layout="position" transition={{ layout: morph }} className="relative ms-auto flex items-center gap-1 md:justify-self-end">
                <AnimatePresence initial={false} mode="popLayout">
                  {secondaryCta && !drawn && (
                    <m.span key="secondary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={k.tween('fast')} className="max-md:hidden">
                      <Link href={secondaryCta.href} onClick={secondaryCta.onClick} className={buttonVariants({ variant: 'ghost' })}>
                        {secondaryCta.label}
                      </Link>
                    </m.span>
                  )}
                </AnimatePresence>
                {primaryCta && (
                  <Link href={primaryCta.href} onClick={primaryCta.onClick} className={buttonVariants()}>
                    {primaryCta.label}
                  </Link>
                )}
                <Button
                  ref={menuButton}
                  variant="ghost"
                  size="icon"
                  aria-expanded={open}
                  aria-controls={open ? panelId : undefined}
                  aria-label={open ? copy.closeMenu : copy.openMenu}
                  onClick={() => setOpen(!open)}
                  className="md:hidden"
                >
                  <MenuIcon active={open} size={18} strokeWidth={1.75} />
                </Button>
              </m.div>
            </div>
            <Collapse open={open} id={panelId} className="md:hidden">
              <nav aria-label={copy.navLabel} className="flex flex-col gap-2 px-1 pt-3 pb-1">
                <Stagger as="ul" itemAs="li" inView={false} step="tight" className="flex flex-col gap-0.5">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={ariaCurrent(link.href)}
                      onClick={() => follow(link.href)}
                      className="flex min-h-control-lg items-center gap-2 rounded-control px-3 text-ui-lg font-medium text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg focus-ring aria-[current]:bg-selected aria-[current]:text-fg"
                    >
                      {link.label}
                      {link.badge && <Badge className="ms-auto">{link.badge}</Badge>}
                    </Link>
                  ))}
                </Stagger>
                {secondaryCta && (
                  <Link href={secondaryCta.href} onClick={secondaryCta.onClick} className={buttonVariants({ variant: 'outline', size: 'lg', className: 'w-full' })}>
                    {secondaryCta.label}
                  </Link>
                )}
              </nav>
            </Collapse>
            {progress && (
              <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
                <m.span
                  style={{ scaleX: scroll.progress }}
                  className={cn(
                    'absolute inset-x-0 bottom-0 h-px origin-left bg-accent transition-opacity yj-duration-base ease-standard rtl:origin-right',
                    drawn && !open ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </span>
            )}
          </m.div>
        </m.div>
      </MotionFeatures>
    </header>
  )
}

export { NavbarFloating }
export type { NavbarFloatingProps, NavbarFloatingCopy, NavbarFloatingLink, NavbarFloatingBrand, NavbarFloatingCta }
