'use client'

import { isValidElement, useCallback, useMemo, useState, type ComponentProps, type ElementType, type MouseEvent, type ReactNode } from 'react'
import { SidebarInset, SidebarProvider, useSidebar } from '../../components/ui/sidebar'
import { cn } from '../../lib/utils'
import { FrameContext, type FrameContextValue, type MobileNav } from './shell/context'
import { NAV } from './shell/data'
import { FrameTabBar } from './shell/mobile-tabs'
import { findTrail, firstPage, hrefOf, type FrameNavItem, type FrameNavSection } from './shell/model'
import { PAPER } from './shell/signature'

export { FrameRail, useFrame, useFrameCompact, useFrameRail } from './shell/context'
export { FrameLogo } from './shell/logo'
export { FrameSectionLabel } from './shell/section-label'
export { badgeText, findTrail, firstPageIn, hrefOf, navPages } from './shell/model'
export type {
  FrameIcon,
  FrameNavItem,
  FrameNavPage,
  FrameNavSection,
  FrameSidebarSlots,
  FrameTeam,
  FrameTopbarSlots,
  FrameTrail,
  FrameUser,
} from './shell/model'

/* The frame an app lives in, as one small contract every frame part shares:
 * a sidebar slot, a top bar slot, the page, and a fallback for phones. Any
 * sidebar goes with any top bar, because they meet only here:
 * - The navigation (`nav`) and the current page live in context (useFrame).
 *   Sidebars draw the nav, top bars name the page from it, the palette and
 *   the phone's tab bar list it.
 * - The sidebar's expanded or collapsed state is the Sidebar's own
 *   (SidebarProvider): ⌘B toggles it, and so does any top bar's trigger.
 * - Below `md` every sidebar becomes a focus-trapped sheet. `mobileNav="tabs"`
 *   adds a bottom tab bar for the first four pages, with Menu for the sheet.
 * - A top bar that names the page (Minimal, Search, Tabs) is marked
 *   `data-yj-frame-titled`. Under it, a page title marked
 *   `data-slot="app-page-title"` folds to screen readers and its header
 *   (`app-page-header`) centers what's left, so the name isn't set twice.
 *   The breadcrumb only places the page, so the page keeps its title.
 * The page scrolls the document: sidebars stay put and top bars stick.
 * The frame is set on paper: white in light
 * whatever the page, the page in dark, a theme's dark chrome where it asks.
 * The sidebars carry their own; the frame's lies behind its parts and shows
 * where the page is a card inset in it (Classic's inset variant, Workspace,
 * Rail + panel, Icon rail); a sidebar marked `data-yj-ground="chrome"` sets
 * it on the theme's gray chrome instead.
 * It is built for the compact layout density (ui.css), taken from the page:
 * an app's root YoujProvider sets `density="compact"`, and a ThemeScope with
 * `density="roomy"` around the frame sets it back.
 * A page of your own goes in AppPage (components/ui/app-page.tsx), as the
 * in-app screens do: a container, the gutter, the title's slots and a page
 * width past which a wide screen gets margins (`width` to span or narrow). */

/** The page's own title folds away under a top bar that already names the page. */
const titledBar =
  '[&:has([data-yj-frame-titled])_[data-slot=app-page-title]]:sr-only [&:has([data-yj-frame-titled])_[data-slot=app-page-header]]:items-center'

/** The top bar's ends sit on the page's gutter (AppPage's, by the same width), so the bar's first and last controls line up with the page's edges. The tabs bar pads its rows instead, its views set in by their own padding so their labels line up too. */
const gutteredBar = cn(
  '@container/frame',
  '[&>[data-slot=app-header]:not([data-yj-frame-topbar=tabs])]:px-4 @3xl/frame:[&>[data-slot=app-header]:not([data-yj-frame-topbar=tabs])]:px-6 @6xl/frame:[&>[data-slot=app-header]:not([data-yj-frame-topbar=tabs])]:px-8',
  '[&>[data-yj-frame-topbar=tabs]>[data-slot=frame-topbar-row]]:px-4 @3xl/frame:[&>[data-yj-frame-topbar=tabs]>[data-slot=frame-topbar-row]]:px-6 @6xl/frame:[&>[data-yj-frame-topbar=tabs]>[data-slot=frame-topbar-row]]:px-8',
  '[&>[data-yj-frame-topbar=tabs]>[data-slot=frame-topbar-views]]:px-1 @3xl/frame:[&>[data-yj-frame-topbar=tabs]>[data-slot=frame-topbar-views]]:px-3 @6xl/frame:[&>[data-yj-frame-topbar=tabs]>[data-slot=frame-topbar-views]]:px-5',
)

interface AppFrameProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The navigation: sections of items. See `shell/data.tsx` for its shape. Default: the demo's navigation. */
  nav?: FrameNavSection[]
  /** The current page's id, when your router owns it. */
  active?: string
  /** The page to start on. Default: the first item. */
  defaultActive?: string
  /** A nav item was followed: `event` is the link's click, or `null` when the palette, search or command sidebar picks the page. Call `event.preventDefault()` to route a click yourself; route a `null` one with your router. */
  onNavigate?: (item: FrameNavItem, event: MouseEvent<HTMLAnchorElement> | null) => void
  /** What every link in the frame's parts renders as, with `href` from the nav: your router's Link (Next.js `Link`, say). Default `a`. */
  linkComponent?: ElementType
  /** A frame sidebar (`FrameSidebarClassic`, `FrameSidebarRail`…). */
  sidebar?: ReactNode
  /** A frame top bar (`FrameTopbarBreadcrumb`, `FrameTopbarTabs`…). */
  topbar?: ReactNode
  /** Below `md`: the sidebar as a sheet (default), or a bottom tab bar as well. */
  mobileNav?: MobileNav
  /** Start with the sidebar collapsed (to icons, a rail or off-canvas, as that sidebar does). */
  defaultCollapsed?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  className?: string
  /** The page. */
  children?: ReactNode
}

function AppFrame({
  nav = NAV,
  active,
  defaultActive,
  onNavigate,
  linkComponent = 'a',
  sidebar,
  topbar,
  mobileNav = 'sheet',
  defaultCollapsed = false,
  collapsed,
  onCollapsedChange,
  className,
  children,
  ...rest
}: AppFrameProps) {
  // A sidebar that is a tab bar on phones (the icon rail) says so, and the frame follows.
  const mobile: MobileNav = (isValidElement(sidebar) && (sidebar.type as { mobileNav?: MobileNav }).mobileNav) || mobileNav
  return (
    <SidebarProvider
      data-slot="app-frame"
      defaultOpen={!defaultCollapsed}
      open={collapsed === undefined ? undefined : !collapsed}
      onOpenChange={onCollapsedChange && ((open) => onCollapsedChange(!open))}
      {...rest}
      className={cn('relative text-fg', className)}
    >
      {/* A sidebar that sets the page on the theme's gray chrome (data-yj-ground="chrome") takes the paper with it. */}
      <div
        aria-hidden
        data-slot="app-frame-paper"
        data-yj-tone="chrome"
        className={cn('pointer-events-none absolute inset-0', PAPER, 'md:group-has-[[data-yj-ground=chrome]]/sidebar-wrapper:[--yj-neutral-page:0]')}
      />
      <FrameState nav={nav} active={active} defaultActive={defaultActive} onNavigate={onNavigate} linkComponent={linkComponent} mobileNav={mobile}>
        {sidebar}
        <SidebarInset data-slot="app-frame-main" className={cn(titledBar, gutteredBar)}>
          {topbar}
          <div
            data-slot="app-frame-content"
            className={cn('flex min-w-0 flex-1 flex-col', mobile === 'tabs' && 'max-md:pb-[calc(--spacing(14)+env(safe-area-inset-bottom))]')}
          >
            {children}
          </div>
        </SidebarInset>
        {mobile === 'tabs' && <FrameTabBar />}
      </FrameState>
    </SidebarProvider>
  )
}

function FrameState({
  nav,
  active: activeProp,
  defaultActive,
  onNavigate,
  linkComponent,
  mobileNav,
  children,
}: Required<Pick<AppFrameProps, 'nav'>> & Pick<AppFrameProps, 'active' | 'defaultActive' | 'onNavigate'> & { linkComponent: ElementType; mobileNav: MobileNav; children: ReactNode }) {
  const { setOpenMobile } = useSidebar()
  const [own, setOwn] = useState(() => defaultActive ?? firstPage(nav))
  const active = activeProp ?? own

  const go = useCallback(
    (item: FrameNavItem, event: MouseEvent<HTMLAnchorElement> | null) => {
      onNavigate?.(item, event)
      if (event?.defaultPrevented) return
      // An item without an href is a page of this frame: go in place, with no jump to #id.
      if (event && !item.href) event.preventDefault()
      if (activeProp === undefined) setOwn(item.id)
      setOpenMobile(false)
    },
    [onNavigate, activeProp, setOpenMobile],
  )

  const value = useMemo<FrameContextValue>(
    () => ({
      nav,
      active,
      trail: findTrail(nav, active),
      mobileNav,
      navigate: (id) => {
        const trail = findTrail(nav, id)
        if (trail) go(trail.child ?? trail.item, null)
      },
      link: (item) => ({
        href: hrefOf(item),
        'aria-current': item.id === active ? 'page' : undefined,
        onClick: (event) => go(item, event),
      }),
      Link: linkComponent,
    }),
    [nav, active, mobileNav, go, linkComponent],
  )
  return <FrameContext.Provider value={value}>{children}</FrameContext.Provider>
}

export { AppFrame }
export type { AppFrameProps }
