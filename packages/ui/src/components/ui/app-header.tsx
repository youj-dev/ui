'use client'

import { createContext, useContext, useEffect, useLayoutEffect, useState, type ComponentProps, type ReactNode, type RefObject } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { MenuIcon, SearchIcon } from '@youj/icons'
import { useComponentLabels } from '@youj/core/labels'
import { appHeaderLabels } from '@youj/core/labels'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useIsMobile } from '../../hooks/use-mobile'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { Kbd, KbdGroup } from './kbd'
import { Sheet, SheetBody, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './sheet'

/* The app's top bar: brand, primary navigation (links or a MegaMenu), a
 * search trigger for the command palette, actions and the account menu.
 * - Sticky by default. Once the page scrolls under it, it condenses: the bar
 *   loses 8px of height and turns into a translucent, blurred surface with a
 *   hairline, on the base token, so content passing beneath reads as beneath.
 *   The thresholds have hysteresis (in past 24px, out under 8px), so it never
 *   flickers at the boundary, and a reversal mid-transition continues from
 *   where it is. Reduced motion: the same states, instantly.
 * - Below `md` the navigation moves into AppHeaderMenu: a hamburger whose
 *   bars morph into a cross (motion's MenuIcon) as a Sheet slides in from the
 *   inline end, with its own cross landing where the hamburger was. The sheet
 *   is modal: focus is trapped inside, Escape closes it and focus returns to
 *   the hamburger. */

/** Height from the control token, so density themes scale the bar with its controls. */
const heights = {
  rest: 'own:h-[calc(var(--spacing-control)+--spacing(6))]',
  condensed: 'data-condensed:h-[calc(var(--spacing-control)+--spacing(4))]',
}

interface AppHeaderProps extends ComponentProps<'header'> {
  /** Stays at the top of its scroll container. Default true. */
  sticky?: boolean
  /** Condenses once content scrolls under it. Default true; only applies while sticky. */
  condense?: boolean
  /** The element that scrolls under the header. Default: the page. */
  scrollContainer?: RefObject<HTMLElement | null>
}

function AppHeader({ sticky = true, condense = true, scrollContainer, className, children, ...props }: AppHeaderProps) {
  const k = useYouj()
  const condensing = sticky && condense
  const { scrollY } = useScroll(scrollContainer ? { container: scrollContainer } : undefined)
  const [condensed, setCondensed] = useState(false)
  const update = (y: number) => setCondensed((was) => (was ? y > 8 : y > 24))
  useMotionValueEvent(scrollY, 'change', (y) => {
    if (condensing) update(y)
  })
  // A page restored mid-scroll starts condensed.
  useLayoutEffect(() => {
    if (!condensing) {
      setCondensed(false)
      return
    }
    const el = scrollContainer?.current
    update(el ? el.scrollTop : window.scrollY)
  }, [condensing, scrollContainer])

  const surface = !condensing || condensed
  return (
    <header
      data-slot="app-header"
      data-yj-tone="header"
      data-sticky={sticky || undefined}
      data-condensed={(condensing && condensed) || undefined}
      data-surface={surface || undefined}
      data-reduced-motion={k.reduced || undefined}
      className={cn(
        'group/app-header z-40 own:flex own:w-full shrink-0 items-center gap-2 border-b border-transparent own:px-3 own:text-ui own:text-fg md:gap-4 own:md:px-5',
        heights.rest,
        heights.condensed,
        'transition-[height,background-color,border-color,box-shadow,backdrop-filter] yj-duration-base ease-standard',
        '[backdrop-filter:blur(0px)]',
        'data-surface:border-line data-surface:yj-glass',
        'own:data-condensed:shadow-xs',
        sticky && 'sticky top-0',
        className,
      )}
      {...props}
    >
      {children}
    </header>
  )
}

/** The logo and product name. Renders a link; pass `render` for a router link. */
function AppHeaderBrand({ className, render, ...props }: useRender.ComponentProps<'a'>) {
  return useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      {
        className: cn(
          'own:inline-flex own:h-control shrink-0 items-center gap-2 own:rounded-md own:px-1 own:text-ui-lg own:font-semibold own:tracking-tight own:text-fg focus-ring',
          "[&_svg:not([class*='size-'])]:size-5 [&_svg]:shrink-0",
          className,
        ),
      },
      props,
    ),
    state: { slot: 'app-header-brand' },
  })
}

/** The primary navigation on wide screens: links or a NavigationMenu / MegaMenu. Hidden below `md`. */
function AppHeaderNav({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="app-header-nav" className={cn('own:hidden own:min-w-0 items-center own:md:flex', className)} {...props} />
}

/** The trailing cluster: search, actions, the account menu and, on phones, the menu button. */
function AppHeaderActions({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="app-header-actions" className={cn('own:ms-auto own:flex shrink-0 items-center gap-1 md:gap-2', className)} {...props} />
}

function useIsApple() {
  const [apple, setApple] = useState(true)
  useEffect(() => {
    setApple(/mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent))
  }, [])
  return apple
}

interface AppHeaderSearchProps extends Omit<ComponentProps<typeof Button>, 'children'> {
  /** The field-like label. Default "Search…". */
  placeholder?: string
  /** The key shown with ⌘ / Ctrl, matching the palette's `shortcut`. Default `k`; `false` hides it. */
  shortcut?: string | false
}

/**
 * Opens the command palette: a search field look-alike with its shortcut on
 * wide screens, an icon button on phones. It is a button (the palette is the
 * field), named "Search" at every size.
 */
function AppHeaderSearch({ placeholder, shortcut = 'k', className, ...props }: AppHeaderSearchProps) {
  const apple = useIsApple()
  const labels = useComponentLabels(appHeaderLabels)
  return (
    <Button
      variant="outline"
      // Named "Search" unless it shows other words: then those.
      aria-label={placeholder ?? labels.search}
      aria-keyshortcuts={shortcut ? `${apple ? 'Meta' : 'Control'}+${shortcut.toUpperCase()}` : undefined}
      data-slot="app-header-search"
      // shape: on a phone the search field folds into an icon button, so its outline goes with it
      className={cn(
        'max-md:size-control max-md:border-transparent own:max-md:bg-transparent own:max-md:px-0 own:max-md:shadow-none own:max-md:hover:bg-hover',
        'justify-start own:bg-transparent font-normal own:text-fg-muted own:shadow-none own:hover:text-fg md:w-56 lg:w-64',
        className,
      )}
      {...props}
    >
      <SearchIcon size={16} strokeWidth={1.75} />
      <span className="own:max-md:sr-only">{placeholder ?? labels.searchPlaceholder}</span>
      {shortcut && (
        // The keys are drawn, not text: `aria-keyshortcuts` carries them, and the button stays named "Search" (its visible words).
        <KbdGroup aria-hidden className="ms-auto max-md:hidden">
          <Kbd data-yj-key={apple ? '⌘' : labels.ctrlKey} className="before:content-[attr(data-yj-key)]" />
          <Kbd data-yj-key={shortcut.toUpperCase()} className="before:content-[attr(data-yj-key)]" />
        </KbdGroup>
      )}
    </Button>
  )
}

interface AppHeaderMenuProps {
  /** Names the drawer and its navigation. Default "Menu". */
  title?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Shown above the links, e.g. the brand or a workspace switcher. */
  header?: ReactNode
  /** Pinned to the bottom of the drawer, e.g. sign-in buttons. */
  footer?: ReactNode
  className?: string
  /** The drawer's navigation: AppHeaderMenuLink rows, groups, anything. */
  children: ReactNode
}

/** Closes the drawer: its links call it as they are followed. */
const AppHeaderMenuContext = createContext<() => void>(() => {})

/** The phone navigation: a hamburger (below `md` only) that opens a Sheet. It closes itself if the screen widens past `md`. */
function AppHeaderMenu({
  title,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  header,
  footer,
  className,
  children,
}: AppHeaderMenuProps) {
  const labels = useComponentLabels(appHeaderLabels)
  title ??= labels.menu
  const [openState, setOpenState] = useState(defaultOpen)
  const open = openProp ?? openState
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next)
    onOpenChange?.(next)
  }
  const mobile = useIsMobile()
  useEffect(() => {
    if (!mobile && open) setOpen(false)
  }, [mobile])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        data-slot="app-header-menu-trigger"
        render={<Button variant="ghost" size="icon" className="md:hidden" aria-label={labels.openMenu(title)} />}
      >
        <MenuIcon active={open} size={18} strokeWidth={1.75} />
      </SheetTrigger>
      <SheetContent side="end" showCloseButton={false} data-slot="app-header-menu" className={cn('md:hidden', className)}>
        {/* As tall as the bar, so the cross lands where the hamburger was. */}
        <SheetHeader className="h-[calc(var(--spacing-control)+--spacing(6))] shrink-0 flex-row items-center gap-3 own:px-4 own:py-0 own:pe-14">
          <SheetTitle className="min-w-0 flex-1 truncate">{header ?? title}</SheetTitle>
        </SheetHeader>
        <SheetClose
          render={<Button variant="ghost" size="icon" className="absolute end-3 top-3" aria-label={labels.closeMenu(title)} />}
        >
          <ArrivingCross />
        </SheetClose>
        <SheetBody className="gap-1 own:p-2">
          <nav aria-label={title} className="flex flex-col gap-0.5">
            <AppHeaderMenuContext.Provider value={() => setOpen(false)}>{children}</AppHeaderMenuContext.Provider>
          </nav>
        </SheetBody>
        {footer && <div className="own:flex flex-col gap-2 border-t border-line p-4">{footer}</div>}
      </SheetContent>
    </Sheet>
  )
}

/** The drawer's cross: it mounts as a hamburger and morphs, so it lands as the one it replaces did. */
function ArrivingCross() {
  const [active, setActive] = useState(false)
  useEffect(() => setActive(true), [])
  return <MenuIcon active={active} size={18} strokeWidth={1.75} />
}

interface AppHeaderMenuLinkProps extends useRender.ComponentProps<'a'> {
  /** The current page. */
  active?: boolean
}

/** A row in the phone drawer. Following it closes the drawer. */
function AppHeaderMenuLink({ className, active = false, render, children, ...props }: AppHeaderMenuLinkProps) {
  const close = useContext(AppHeaderMenuContext)
  return useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      {
        'aria-current': active ? 'page' : undefined,
        className: cn(
          'own:flex own:min-h-control-lg items-center gap-3 own:rounded-md own:px-3 own:text-ui-lg own:font-medium own:text-fg-muted',
          'transition-colors yj-duration-fast ease-standard own:hover:bg-hover own:hover:text-fg focus-ring',
          'own:aria-[current=page]:bg-selected own:aria-[current=page]:text-fg',
          "[&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
          className,
        ),
        children,
        onClick: close,
      },
      props,
    ),
    state: { slot: 'app-header-menu-link', active },
  })
}

export { AppHeader, AppHeaderActions, AppHeaderBrand, AppHeaderMenu, AppHeaderMenuLink, AppHeaderNav, AppHeaderSearch }
export type { AppHeaderMenuLinkProps, AppHeaderMenuProps, AppHeaderProps, AppHeaderSearchProps }
