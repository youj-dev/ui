'use client'

import { sidebarLabels } from '@youj/core/labels'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import { SidebarIcon } from '@youj/icons/components/youj/icons/sidebar'
import { SlidingIndicator } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useIsMobile } from '../../hooks/use-mobile'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { Input } from './input'
import { ScrollArea } from './scroll-area'
import { Separator } from './separator'
import { Sheet, SheetContent, SheetTitle } from './sheet'
import { Skeleton } from './skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

/* shadcn's sidebar, re-skinned and choreographed for youj:
 * - Collapsing to icons animates the width on the slow token; labels,
 *   badges and actions fade out first and back in after the width returns,
 *   group labels fold away, nested lists close their height, so nothing
 *   squashes or truncates on the way.
 * - The current page wears a raised key: one motion SlidingIndicator for the
 *   whole content that glides across groups. When the page is in a closed
 *   nested group (or the sidebar is down to icons), the key sits on the
 *   group's own item.
 * - Collapsed items show their label in a Tooltip on the inline-end side.
 * - ⌘B / Ctrl+B toggles (not while typing); with several providers on a
 *   page, only the one last pressed or focused in. Below `md` the sidebar is a
 *   Sheet from its own edge, with a focus trap.
 * - `side="left"` is the inline-start edge: it mirrors under RTL. */

const SIDEBAR_COOKIE_NAME = 'sidebar_state'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
/* 16rem and 18rem at 100%, in the spacing unit so the UI scale reaches them.
 * Collapsed, the column is one control square plus its 8px gutters (48px at
 * the default density), so it follows the rows' height. */
const SIDEBAR_WIDTH = 'calc(var(--spacing) * 64)'
const SIDEBAR_WIDTH_MOBILE = 'calc(var(--spacing) * 72)'
const SIDEBAR_WIDTH_ICON = 'calc(var(--spacing-control) + var(--spacing) * 4)'
const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

type SidebarContextProps = {
  state: 'expanded' | 'collapsed'
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider.')
  return context
}

/** A keystroke meant for a text field, not for the app. */
function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** A widget handled the keystroke itself. Base UI's disabled-but-focusable
 * controls (a pending button, a disabled tab) cancel every key but Tab to
 * block activation; that isn't a claim on the shortcut. */
function isClaimed(event: KeyboardEvent) {
  if (!event.defaultPrevented) return false
  return !(event.target instanceof Element && event.target.closest('[aria-disabled="true"]'))
}

/* ⌘B belongs to one sidebar at a time, so a page with several (docs, a split
 * view) doesn't toggle them all: the provider that last saw a press or focus
 * inside it (portals included; the innermost when nested), else the first
 * one mounted. */
const shortcutProviders = new Set<object>()
let shortcutOwner: object | null = null
const claimedEvents = new WeakSet<Event>()

function claimShortcut(provider: object, event: SyntheticEvent) {
  if (claimedEvents.has(event.nativeEvent)) return
  claimedEvents.add(event.nativeEvent)
  shortcutOwner = provider
}

function ownsShortcut(provider: object) {
  const owner = shortcutOwner && shortcutProviders.has(shortcutOwner) ? shortcutOwner : shortcutProviders.values().next().value
  return owner === provider
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  className,
  style,
  children,
  onPointerDown,
  onFocus,
  ...props
}: ComponentProps<'div'> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = useState(false)
  const [openState, setOpenState] = useState(defaultOpen)
  const open = openProp ?? openState

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOpenState(next)
      onOpenChange?.(next)
      // Lets a server render the sidebar in the state it was left in.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${next}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [openProp, onOpenChange],
  )

  const toggleSidebar = useCallback(() => {
    if (isMobile) setOpenMobile((o) => !o)
    else setOpen(!open)
  }, [isMobile, open, setOpen])

  const [provider] = useState(() => ({}))
  useEffect(() => {
    shortcutProviders.add(provider)
    return () => {
      shortcutProviders.delete(provider)
      if (shortcutOwner === provider) shortcutOwner = null
    }
  }, [provider])

  // ⌘B / Ctrl+B, as in editors: but never while typing (it is bold there), and once per press.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== SIDEBAR_KEYBOARD_SHORTCUT || !(event.metaKey || event.ctrlKey)) return
      if (event.shiftKey || event.altKey || event.repeat || isClaimed(event) || isTyping(event.target)) return
      if (!ownsShortcut(provider)) return
      event.preventDefault()
      toggleSidebar()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [provider, toggleSidebar])

  const state = open ? 'expanded' : 'collapsed'
  const context = useMemo<SidebarContextProps>(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar],
  )

  return (
    <SidebarContext.Provider value={context}>
      {/* Moving between collapsed items switches their tooltips instantly. */}
      <TooltipProvider>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH,
              '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
              '--sidebar-height': '100svh',
              ...style,
            } as CSSProperties
          }
          className={cn('group/sidebar-wrapper own:flex min-h-svh w-full own:has-data-[variant=inset]:bg-chrome', className)}
          onPointerDown={(event) => {
            claimShortcut(provider, event)
            onPointerDown?.(event)
          }}
          onFocus={(event) => {
            claimShortcut(provider, event)
            onFocus?.(event)
          }}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

/** The sidebar's plane: the chrome, or the chrome as frosted glass over what's behind it (the kit's `yj-glass`). */
type SidebarSurface = 'solid' | 'glass'

const surfaceClass = (surface: SidebarSurface) => (surface === 'glass' ? 'yj-glass' : 'own:bg-chrome')

function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  surface = 'solid',
  className,
  children,
  ...props
}: ComponentProps<'div'> & {
  /** 'left' is the inline-start edge (the right, under RTL). */
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
  /** `glass` frosts the sidebar over whatever is behind it (a backdrop, an image), the phone's sheet too. Default `solid`. */
  surface?: SidebarSurface
}) {
  const k = useYouj()
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === 'none') {
    return (
      <div
        data-slot="sidebar"
        data-yj-tone="chrome"
        data-yj-surface={surface}
        className={cn('own:flex h-full w-(--sidebar-width) flex-col own:text-fg', surfaceClass(surface), className)}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <SidebarSheet open={openMobile} onOpenChange={setOpenMobile} side={side} surface={surface}>
        {children}
      </SidebarSheet>
    )
  }

  const inset = variant === 'floating' || variant === 'inset'
  return (
    <div
      data-slot="sidebar"
      data-state={state}
      data-collapsible={state === 'collapsed' ? collapsible : ''}
      data-variant={variant}
      data-side={side}
      data-yj-surface={surface}
      data-reduced-motion={k.reduced || undefined}
      className="group peer relative own:hidden shrink-0 own:text-fg own:md:block data-[side=right]:order-last"
    >
      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          'sticky top-0 h-(--sidebar-height) w-(--sidebar-width) overflow-hidden',
          // The width animation: the content inside reflows to it frame by frame.
          'transition-[width] yj-duration-slow ease-standard',
          'group-data-[collapsible=offcanvas]:w-0',
          inset
            ? 'own:p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
            : 'own:border-line group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[collapsible=offcanvas]:border-0 data-[side=left]:border-e data-[side=right]:border-s',
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          data-yj-tone="chrome"
          className={cn(
            'own:flex size-full flex-col',
            surfaceClass(surface),
            'own:group-data-[variant=floating]:rounded-lg own:group-data-[variant=floating]:shadow-sm own:group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-line',
            // Off-canvas: the panel keeps its width and slides out as the
            // container closes over it, so nothing squashes.
            collapsible === 'offcanvas' && [
              inset ? 'min-w-[calc(var(--sidebar-width)-(--spacing(4)))]' : 'min-w-(--sidebar-width)',
              'transition-transform yj-duration-slow ease-standard',
              side === 'left'
                ? 'group-data-[collapsible=offcanvas]:-translate-x-full rtl:group-data-[collapsible=offcanvas]:translate-x-full'
                : 'group-data-[collapsible=offcanvas]:translate-x-full rtl:group-data-[collapsible=offcanvas]:-translate-x-full',
            ],
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/* The mobile fallback: the shared Sheet from the sidebar's own edge. It traps
 * focus, closes on Escape or a tap on the scrim, and returns focus to
 * wherever it was opened from. No close button: it would sit on the header. */
function SidebarSheet({
  open,
  onOpenChange,
  side,
  surface,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  side: 'left' | 'right'
  surface: SidebarSurface
  children: ReactNode
}) {
  const labels = useComponentLabels(sidebarLabels)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side === 'left' ? 'start' : 'end'}
        showCloseButton={false}
        data-slot="sidebar"
        data-sidebar="sidebar"
        data-mobile="true"
        data-yj-tone="chrome"
        data-yj-surface={surface}
        className={cn('w-[min(var(--sidebar-width),calc(100vw_-_var(--spacing)*10))] border-line text-fg', surface === 'glass' ? 'yj-glass' : 'bg-chrome')}
        style={{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE } as CSSProperties}
      >
        <SheetTitle className="sr-only">{labels.sidebar}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  )
}

function SidebarTrigger({ className, onClick, ...props }: ComponentProps<typeof Button>) {
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar()
  const labels = useComponentLabels(sidebarLabels)
  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      aria-label={labels.toggleSidebar}
      aria-expanded={isMobile ? openMobile : open}
      aria-keyshortcuts="Meta+B Control+B"
      // Open is the sidebar's resting state, not a pressed one: the icon shows which way it goes, so no fill stays on it.
      className={cn('own:aria-expanded:bg-transparent own:aria-expanded:text-fg-muted own:aria-expanded:hover:bg-hover own:aria-expanded:hover:text-fg', className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <SidebarIcon active={!(isMobile ? openMobile : open)} className="rtl:-scale-x-100" />
    </Button>
  )
}

/** A thin strip on the sidebar's inner edge: click to toggle. Pointer only; keyboards have the trigger and ⌘B. */
function SidebarRail({ className, ...props }: ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar()
  const labels = useComponentLabels(sidebarLabels)
  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      // A pointer affordance only: hidden from assistive tech so the
      // sidebar has one "Toggle sidebar" control, the trigger.
      aria-hidden
      tabIndex={-1}
      onClick={toggleSidebar}
      title={labels.toggleSidebar}
      className={cn(
        'absolute inset-y-0 z-20 own:hidden w-4 own:sm:flex',
        'group-data-[side=left]:-end-2 group-data-[side=right]:-start-2',
        'after:absolute after:inset-y-0 after:start-1/2 after:w-0.5 after:transition-colors after:yj-duration-fast own:hover:after:bg-line',
        'cursor-ew-resize',
        className,
      )}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: ComponentProps<'main'>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        'relative own:flex w-full min-w-0 flex-1 flex-col own:bg-canvas',
        // Inset: the page is a raised panel beside the sidebar.
        'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ms-0 own:md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:border-line own:md:peer-data-[variant=inset]:bg-surface own:md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ms-2',
        className,
      )}
      {...props}
    />
  )
}

function SidebarInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn('h-control-sm w-full shadow-none group-data-[collapsible=icon]:hidden', className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="sidebar-header" data-sidebar="header" className={cn('own:flex flex-col gap-2 own:p-2', className)} {...props} />
}

function SidebarFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="sidebar-footer" data-sidebar="footer" className={cn('own:flex flex-col gap-2 own:p-2', className)} {...props} />
}

function SidebarSeparator({ className, ...props }: ComponentProps<typeof Separator>) {
  return (
    <Separator data-slot="sidebar-separator" data-sidebar="separator" className={cn('mx-2 w-auto own:bg-line', className)} {...props} />
  )
}

/* Where the current-page key goes. Expanded: the active item, or, when it
 * is inside a closed nested group, that group's own item. Collapsed to
 * icons: the item of whichever group holds the page. */
const CURRENT_EXPANDED = [
  '[data-sidebar=menu-button][data-active]',
  '[data-sidebar=menu-sub-button][data-active]:not([data-closed] *)',
  '[data-sidebar=menu-item]:has([data-closed] [data-sidebar=menu-sub-button][data-active]) [data-sidebar=menu-button]',
].join(', ')
const CURRENT_COLLAPSED = [
  '[data-sidebar=menu-button][data-active]',
  '[data-sidebar=menu-item]:has([data-sidebar=menu-sub-button][data-active]) [data-sidebar=menu-button]',
].join(', ')

/** How the current page is marked. */
type SidebarIndicator = 'raised' | 'fill' | 'mark' | 'none'

const indicatorClass: Record<Exclude<SidebarIndicator, 'none'>, string> = {
  // A raised key: the key's plane on a hairline, a step of elevation.
  raised: 'own:rounded-md own:bg-key own:shadow-xs own:ring-1 ring-line',
  // A quiet fill under the row, as a list's selection.
  fill: 'own:rounded-md own:bg-selected',
  // A short bar of the accent on the list's inline-start edge, half the row's height.
  mark: cn(
    'start-0! w-0.75! own:rounded-none own:bg-transparent',
    'before:absolute before:inset-y-[22%] before:start-0 before:w-full own:before:rounded-e-full own:before:bg-accent',
  ),
}

function SidebarContent({
  className,
  children,
  indicator = 'raised',
  ...props
}: ComponentProps<'div'> & {
  /** How the current page is marked: a raised key (default), a quiet fill, an accent mark on the inline-start edge, or `none` when the rows mark it themselves. It glides from page to page. */
  indicator?: SidebarIndicator
}) {
  const { state, isMobile } = useSidebar()
  const collapsed = state === 'collapsed' && !isMobile
  return (
    <ScrollArea data-slot="sidebar-content" data-sidebar="content" data-yj-indicator={indicator} className={cn('min-h-0 flex-1', className)} {...props}>
      {/* The key scrolls with the items, so it lives in the scrolled content. */}
      <div className="relative isolate own:flex min-w-0 flex-col">
        {children}
        {indicator !== 'none' && (
          <SlidingIndicator data-slot="sidebar-indicator" match={collapsed ? CURRENT_COLLAPSED : CURRENT_EXPANDED} className={indicatorClass[indicator]} />
        )}
      </div>
    </ScrollArea>
  )
}

function SidebarGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="sidebar-group" data-sidebar="group" className={cn('relative own:flex w-full min-w-0 flex-col own:p-2', className)} {...props} />
  )
}

/* Fades out at once when collapsing; when expanding, waits a beat for the
 * width to return before fading back in. */
const fadeWithCollapse = cn(
  'transition-opacity yj-duration-fast ease-standard [transition-delay:calc(var(--yj-duration-fast)*var(--yj-motion,1))]',
  'group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:yj-duration-instant group-data-[collapsible=icon]:[transition-delay:0s]',
)

function SidebarGroupLabel({ className, render, ...props }: useRender.ComponentProps<'div'> & ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          // The kit's eyebrow (a stat's label, Typography's Eyebrow): it speaks in
          // the theme's label voice (ui.css), and Bezel sets it in mono capitals.
          'own:flex h-8 shrink-0 items-center own:rounded-md own:px-2 own:text-ui-sm own:font-medium own:text-fg-muted focus-ring',
          // Folds away (the menu below rises into its place) as the sidebar
          // collapses. Folded, it overlaps the item above: it must not catch
          // that item's pointer.
          '[transition:margin_calc(var(--yj-duration-slow)*var(--yj-motion,1))_var(--ease-standard),opacity_calc(var(--yj-duration-fast)*var(--yj-motion,1))_var(--ease-standard)]',
          'group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
          '[&>svg]:size-4 [&>svg]:shrink-0',
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: 'sidebar-group-label', sidebar: 'group-label' },
  })
}

function SidebarGroupAction({ className, render, ...props }: useRender.ComponentProps<'button'> & ComponentProps<'button'>) {
  return useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(
      {
        className: cn(
          'absolute end-3 top-3.5 own:flex aspect-square w-5 items-center justify-center own:rounded-md own:p-0 own:text-fg-muted focus-ring',
          'own:hover:bg-hover own:hover:text-fg [&>svg]:size-4 [&>svg]:shrink-0',
          // A 28px hit area around the 20px glyph, on coarse pointers.
          'after:absolute after:-inset-1 own:md:after:hidden',
          fadeWithCollapse,
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: 'sidebar-group-action', sidebar: 'group-action' },
  })
}

function SidebarGroupContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="sidebar-group-content" data-sidebar="group-content" className={cn('w-full own:text-ui', className)} {...props} />
}

function SidebarMenu({ className, ...props }: ComponentProps<'ul'>) {
  return <ul data-slot="sidebar-menu" data-sidebar="menu" className={cn('own:flex w-full min-w-0 flex-col gap-0.5', className)} {...props} />
}

function SidebarMenuItem({ className, ...props }: ComponentProps<'li'>) {
  return <li data-slot="sidebar-menu-item" data-sidebar="menu-item" className={cn('group/menu-item relative', className)} {...props} />
}

const sidebarMenuButtonVariants = cva(
  [
    // A page's name is read like the content's body: its size, and a step under
    // the text colour (muted read a size smaller beside the page).
    'peer/menu-button group/menu-button own:flex w-full items-center gap-2 overflow-hidden own:rounded-md own:p-2 own:text-start own:text-ui own:text-fg focus-ring',
    'transition-[width,height,padding,color,background-color] yj-duration-slow ease-standard',
    'own:hover:bg-hover own:hover:text-fg',
    // The raised key under the current page is the content's sliding indicator.
    'data-active:font-medium own:data-active:text-fg own:data-active:hover:bg-transparent',
    'own:data-open:hover:bg-hover own:aria-expanded:text-fg',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    'own:group-has-data-[sidebar=menu-action]/menu-item:pe-8',
    // Collapsed, a control square with the 16px icon centred in it, at any density. The `!` keeps `size-control` over
    // the size variants' `h-*` (lg's h-12 included), which Tailwind sorts after `size-*` at equal specificity.
    'group-data-[collapsible=icon]:size-control! own:group-data-[collapsible=icon]:p-[calc((var(--spacing-control)-var(--spacing)*4)/2)]',
    '[&_svg]:size-4 [&_svg]:shrink-0',
    // Everything after the leading icon (or tile, or avatar) is the label and
    // its trailing marks. It truncates rather than pushing a chevron out, and
    // never squashes: it fades before the width goes and after it returns.
    '[&>span:not(:first-child)]:min-w-0 [&>span:not(:first-child)]:truncate',
    '[&>:not(:first-child)]:transition-opacity [&>:not(:first-child)]:yj-duration-fast [&>:not(:first-child)]:ease-standard [&>:not(:first-child)]:[transition-delay:calc(var(--yj-duration-fast)*var(--yj-motion,1))]',
    'group-data-[collapsible=icon]:[&>:not(:first-child)]:opacity-0 group-data-[collapsible=icon]:[&>:not(:first-child)]:yj-duration-instant group-data-[collapsible=icon]:[&>:not(:first-child)]:[transition-delay:0s]',
  ],
  {
    variants: {
      variant: {
        default: '',
        outline: 'own:bg-canvas own:shadow-[0_0_0_1px_var(--color-line)] own:hover:shadow-[0_0_0_1px_var(--color-hover)]',
        // A tile that stays raised (a switcher, a rail's current area): the sliding key's look, standing still.
        raised: 'own:bg-key own:shadow-xs own:ring-1 ring-line own:hover:bg-key own:data-open:hover:bg-key',
      },
      // Rows are controls: they follow the theme's density and step up for touch. In a compact layout
      // (data-yj-density) the default row takes the small control's height, except on touch. A blend of
      // the two heights, never their difference times a factor: Chromium 141 resolved
      // `C - (C - S) * k` to -S, collapsing the row (density-browser.test.tsx measures it).
      size: {
        default: 'h-[calc(var(--spacing-control-sm)_*_var(--ui--compact,0)_*_(1_-_var(--yj-touch,0))_+_var(--spacing-control)_*_(1_-_var(--ui--compact,0)_*_(1_-_var(--yj-touch,0))))] own:text-ui',
        sm: 'h-control-sm own:text-ui-sm',
        // Its 32px avatar or logo, centred in the collapsed square.
        lg: 'h-12 own:text-ui own:group-data-[collapsible=icon]:p-[calc((var(--spacing-control)-var(--spacing)*8)/2)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function SidebarMenuButton({
  render,
  isActive = false,
  variant = 'default',
  size = 'default',
  tooltip,
  className,
  ...props
}: useRender.ComponentProps<'button'> &
  ComponentProps<'button'> & {
    /** The current page: the sidebar's raised key sits under it. */
    isActive?: boolean
    /** Shown beside the item while the sidebar is collapsed to icons. */
    tooltip?: ReactNode
  } & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { isMobile, state } = useSidebar()
  const button = useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>({ className: cn(sidebarMenuButtonVariants({ variant, size }), className) }, props),
    render: tooltip ? <TooltipTrigger render={render} /> : render,
    state: { slot: 'sidebar-menu-button', sidebar: 'menu-button', size, active: isActive },
  })
  if (!tooltip) return button
  return (
    // Always mounted, only disabled while expanded: collapsing with ⌘B must not remount the focused item.
    // A label, not a surface: it closes as the pointer leaves the item and never
    // takes a click, so it can't sit over the SidebarTrigger beside a collapsed rail.
    <Tooltip disabled={state !== 'collapsed' || isMobile} disableHoverablePopup>
      {button}
      <TooltipContent side="inline-end" sideOffset={10} className="pointer-events-none">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ...props
}: useRender.ComponentProps<'button'> & ComponentProps<'button'> & { showOnHover?: boolean }) {
  return useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(
      {
        className: cn(
          // Centred on its row, whatever height the density gives it.
          'absolute end-1 top-1/2 own:flex aspect-square w-5 -translate-y-1/2 items-center justify-center own:rounded-md own:p-0 own:text-fg-muted focus-ring',
          'own:hover:bg-hover own:hover:text-fg own:peer-hover/menu-button:text-fg',
          'after:absolute after:-inset-1 own:md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0',
          fadeWithCollapse,
          showOnHover &&
            'own:peer-data-active/menu-button:text-fg group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 aria-expanded:opacity-100 md:opacity-0',
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: 'sidebar-menu-action', sidebar: 'menu-action' },
  })
}

const sidebarMenuBadgeVariants = cva(
  [
    // A count reads like the content's meta text, centred on its row, its end on one column in every row.
    'pointer-events-none absolute end-1.5 top-1/2 own:flex h-5 min-w-5 -translate-y-1/2 items-center justify-center own:rounded-chip own:font-medium own:tabular-nums select-none',
    fadeWithCollapse,
  ],
  {
    variants: {
      // Plain: the number alone. Pill: the number on a well, where counts read as a column of their own.
      variant: { plain: 'own:px-1 own:text-ui-sm', pill: 'own:px-1.5 own:text-ui-xs' },
      // Danger is the loud count: something failed, or is overdue.
      tone: { default: '', danger: '' },
    },
    compoundVariants: [
      { variant: 'plain', tone: 'default', className: 'own:text-fg-muted own:peer-hover/menu-button:text-fg own:peer-data-active/menu-button:text-fg' },
      { variant: 'plain', tone: 'danger', className: 'own:bg-danger own:text-on-accent' },
      { variant: 'pill', tone: 'default', className: 'own:bg-well own:text-fg-muted own:peer-data-active/menu-button:text-fg' },
      { variant: 'pill', tone: 'danger', className: 'own:bg-danger-subtle own:text-danger-text' },
    ],
    defaultVariants: { variant: 'plain', tone: 'default' },
  },
)

function SidebarMenuBadge({
  className,
  variant = 'plain',
  tone = 'default',
  ...props
}: ComponentProps<'div'> & {
  /** `pill` sets the count on a well. Default `plain`. */
  variant?: 'plain' | 'pill'
  /** `danger` is the loud count: something failed or is overdue. */
  tone?: 'default' | 'danger'
}) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      data-variant={variant}
      data-tone={tone}
      className={cn(sidebarMenuBadgeVariants({ variant, tone }), className)}
      {...props}
    />
  )
}

/** A raised card in the sidebar: a setup checklist, a plan's meter, an upgrade. It steps aside while the sidebar is folded to icons. */
function SidebarCard({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-card"
      className={cn(
        'relative own:flex flex-col own:gap-3 own:rounded-surface own:bg-key own:p-3 own:text-ui-sm own:text-fg own:shadow-xs own:ring-1 ring-line',
        'group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

function SidebarMenuSkeleton({ className, showIcon = false, ...props }: ComponentProps<'div'> & { showIcon?: boolean }) {
  // A width between 50% and 90%, varied per row but derived from useId, so
  // the server and the client agree on it (Math.random broke hydration).
  const id = useId()
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  const width = `${(Math.abs(hash) % 41) + 50}%`
  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn('own:flex h-control items-center gap-2 own:rounded-md own:px-2', className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 own:rounded-md" data-sidebar="menu-skeleton-icon" />}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={{ '--skeleton-width': width } as CSSProperties}
      />
    </div>
  )
}

function SidebarMenuSub({ className, ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        'ms-3.5 me-0 own:flex min-w-0 flex-col gap-0.5 overflow-hidden border-s own:border-line own:ps-2.5 own:pt-0.5',
        // Down to icons, the nested list closes its height instead of vanishing
        // (where interpolate-size exists; elsewhere it simply goes).
        '[interpolate-size:allow-keywords] transition-[height,opacity] yj-duration-slow ease-standard',
        'group-data-[collapsible=icon]:h-0 own:group-data-[collapsible=icon]:pt-0 group-data-[collapsible=icon]:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

function SidebarMenuSubItem({ className, ...props }: ComponentProps<'li'>) {
  return <li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" className={cn('group/menu-sub-item relative', className)} {...props} />
}

function SidebarMenuSubButton({
  render,
  size = 'md',
  isActive = false,
  className,
  ...props
}: useRender.ComponentProps<'a'> &
  ComponentProps<'a'> & {
    size?: 'sm' | 'md'
    /** The current page: the sidebar's raised key sits under it. */
    isActive?: boolean
  }) {
  return useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>(
      {
        className: cn(
          'own:flex h-control-sm min-w-0 items-center gap-2 overflow-hidden own:rounded-md own:px-2 own:text-fg',
          // Inset ring: the nested list clips while its height moves.
          'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus focus-visible:outline-solid',
          'transition-colors yj-duration-fast ease-standard own:hover:bg-hover own:hover:text-fg',
          'data-active:font-medium own:data-active:text-fg own:data-active:hover:bg-transparent',
          'aria-disabled:pointer-events-none aria-disabled:opacity-50',
          'own:data-[size=md]:text-ui own:data-[size=sm]:text-ui-sm [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: 'sidebar-menu-sub-button', sidebar: 'menu-sub-button', size, active: isActive },
  })
}

export {
  Sidebar,
  SidebarCard,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
export type { SidebarIndicator, SidebarSurface }
