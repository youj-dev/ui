'use client'

import { useLayoutEffect, useRef, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react'
import { useLabels } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../../../components/ui/navigation-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { cn } from '../../../lib/utils'
import { badgeText, useFrame, type FrameNavItem, type FrameNavSection } from '../shell'
import { BREATH } from '../shell/signature'

/* Rail + panel's rail: each section a round key with its icon, named in a
 * tooltip, a dot on the key while one of its pages has something new. The
 * shown section's key is raised (the key's plane on a hairline), and the
 * section that holds the current page sets its icon in the accent. The
 * raised key glides between entries.
 * - With the panel beside it, the rail is a toolbar of toggles: ↑ ↓ Home End
 *   move between them, one Tab stop in all. Pressing one shows its section's
 *   pages; pressing the shown one folds the panel away.
 * - Folded to the rail, each key flies its section's pages out beside it:
 *   resting the pointer on it (a short intent delay, so crossing the rail
 *   doesn't flash panels), or Enter, Space or ↓ from the keyboard. Moving to
 *   another key carries the same panel there as its pages change; Tab goes
 *   in, Escape closes it back to its key, and following a page closes it.
 * The two forms are different elements, so when ⌘B swaps them under the
 * keyboard, focus moves to the same section's key in the other. */

/** The raised key: the kit's sliding key, standing on the shown section. */
const RAISED = 'rounded-full bg-key shadow-xs ring-1 ring-line'

const hasNews = (items: readonly FrameNavItem[]): boolean => items.some((item) => item.badge !== undefined || (item.items ? hasNews(item.items) : false))

function Face({ section }: { section: FrameNavSection }) {
  const Icon = section.icon
  return (
    <>
      {Icon ? <Icon size={18} strokeWidth={1.75} /> : <span className="text-ui font-semibold">{section.label?.[0] ?? '·'}</span>}
      {hasNews(section.items) && <span aria-hidden className="absolute end-2 top-2 size-1.5 rounded-full bg-accent ring-2 ring-surface" />}
    </>
  )
}

/* A round key: the rail's keys are round in every theme, as the screen's other rail keys (the brand, the avatar) are. */
const keyClass = cn(
  // shape: the rail's keys are round in every theme, matching the avatar and brand mark on the same rail
  'group/entry relative grid size-10 shrink-0 place-items-center rounded-full text-fg-muted outline-none focus-ring',
  'transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg aria-pressed:text-fg aria-pressed:hover:bg-transparent data-[yj-here]:text-accent-text',
)

interface RailProps {
  nav: FrameNavSection[]
  /** The section the panel shows (none while folded). */
  shown: string | undefined
  /** The section that holds the current page. */
  here: string | undefined
  collapsed: boolean
  panelId: string
  label: string
  onChoose: (id: string) => void
}

export function Rail({ nav, shown, here, collapsed, panelId, label, onChoose }: RailProps) {
  const root = useRef<HTMLDivElement>(null)
  // The entry the keyboard was on, so it can follow the swap between the two forms.
  const focused = useRef<string | null>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the rail swaps forms, to carry focus across
  useLayoutEffect(() => {
    const id = focused.current
    if (!id || (document.activeElement && document.activeElement !== document.body)) return
    root.current?.querySelector<HTMLElement>(`[data-yj-section="${id}"]`)?.focus()
  }, [collapsed])
  const track = {
    onFocus: (event: FocusEvent<HTMLDivElement>) => {
      focused.current = (event.target as HTMLElement).closest<HTMLElement>('[data-yj-section]')?.dataset.yjSection ?? null
    },
    onBlur: () => {
      focused.current = null
    },
  }
  return (
    <div ref={root} {...track} className="relative isolate flex justify-center py-1">
      {collapsed ? <Flyouts nav={nav} here={here} label={label} /> : <Toggles nav={nav} shown={shown} here={here} panelId={panelId} label={label} onChoose={onChoose} />}
    </div>
  )
}

/** Beside the panel: a toolbar of toggles, one Tab stop, the arrows moving between them. */
function Toggles({ nav, shown, here, panelId, label, onChoose }: Omit<RailProps, 'collapsed'>) {
  const current = shown ?? here ?? nav[0]?.id
  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const entries = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-yj-section]')]
    const at = entries.indexOf(event.target as HTMLButtonElement)
    if (at < 0) return
    const next = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: entries.length - 1 }[event.key]
    if (next === undefined) return
    event.preventDefault()
    entries[(next + entries.length) % entries.length]?.focus()
  }
  return (
    <ul role="toolbar" aria-orientation="vertical" aria-label={label} onKeyDown={onKeyDown} className="relative isolate flex flex-col items-center gap-1.5">
      {nav.map((section) => (
        <li key={section.id} role="none">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  data-yj-section={section.id}
                  data-yj-here={here === section.id || undefined}
                  data-yj-trigger=""
                  aria-label={section.label ?? section.id}
                  aria-pressed={shown === section.id}
                  aria-controls={panelId}
                  tabIndex={section.id === current ? 0 : -1}
                  onClick={() => onChoose(section.id)}
                  className={keyClass}
                />
              }
            >
              <Face section={section} />
            </TooltipTrigger>
            <TooltipContent side="inline-end" sideOffset={10} className="pointer-events-none">
              {section.label}
            </TooltipContent>
          </Tooltip>
        </li>
      ))}
      <SlidingIndicator match='[aria-pressed="true"]' className={RAISED} />
    </ul>
  )
}

/** Folded to the rail: each key flies its section's pages out beside it. */
function Flyouts({ nav, here, label }: { nav: FrameNavSection[]; here: string | undefined; label: string }) {
  return (
    <NavigationMenu
      aria-label={label}
      orientation="vertical"
      side="inline-end"
      // From the key's edge, past the rail's padding, to just outside the rail.
      sideOffset={14}
      align="start"
      alignOffset={-4}
      delay={120}
      closeDelay={180}
      className="w-auto max-w-none min-w-0 flex-none items-stretch justify-start"
    >
      <NavigationMenuList className="w-auto min-w-0 flex-col items-center justify-start gap-1.5 [&>[data-slot=navigation-menu-hover-indicator]]:hidden">
        {nav.map((section) => (
          <NavigationMenuItem key={section.id} value={section.id}>
            <NavigationMenuTrigger
              data-yj-section={section.id}
              data-yj-here={here === section.id || undefined}
              data-yj-trigger=""
              aria-label={section.label ?? section.id}
              className={cn(keyClass, 'h-10 p-0 font-normal data-popup-open:bg-key data-popup-open:shadow-xs data-popup-open:ring-1 data-popup-open:ring-line [&>svg:last-child]:hidden')}
            >
              <Face section={section} />
            </NavigationMenuTrigger>
            <NavigationMenuContent
              className={cn(
                'p-1.5',
                // Arriving on the spring, like every pop; the fade stays a short tween.
                '[transition:opacity_calc(var(--yj-duration-fast)*var(--yj-motion,1))_var(--ease-standard),translate_calc(var(--yj-duration-spring)*var(--yj-motion,1))_var(--ease-spring)]!',
                // A vertical list: the new pages arrive from the way you moved, the old ones leave the other way.
                'data-starting-style:data-[activation-direction=down]:translate-y-3 data-starting-style:data-[activation-direction=up]:-translate-y-3',
                'data-ending-style:data-[activation-direction=down]:-translate-y-3 data-ending-style:data-[activation-direction=up]:translate-y-3',
              )}
            >
              <FlyoutPanel section={section} />
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function FlyoutLink({ item, depth, children }: { item: FrameNavItem; depth: number; children?: ReactNode }) {
  const { active, link, Link } = useFrame()
  const Icon = item.icon
  return (
    <li>
      <NavigationMenuLink
        active={active === item.id}
        closeOnClick
        render={<Link {...link(item)} />}
        style={{ paddingInlineStart: `calc(var(--spacing) * ${2 + depth * 4})` }}
        className={cn(
          'h-control items-center gap-2.5 rounded-md py-0 pe-2 text-fg-muted hover:text-fg focus-visible:text-fg data-active:bg-transparent data-active:font-medium data-active:text-fg',
          '[&>svg]:text-fg-subtle hover:[&>svg]:text-fg data-active:[&>svg]:text-accent-text',
          BREATH,
        )}
      >
        {Icon && <Icon size={16} strokeWidth={1.75} />}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.badge !== undefined && (
          <span className="text-ui-xs text-fg-muted tabular-nums">
            <span className="sr-only">, {badgeText(item)}</span>
            <span aria-hidden>{item.badge}</span>
          </span>
        )}
        {children}
      </NavigationMenuLink>
    </li>
  )
}

/** A section's pages in its flyout, nested ones indented under their group's name; the current page on the raised key. */
function FlyoutPanel({ section }: { section: FrameNavSection }) {
  const labels = useLabels()
  const pages = (items: readonly FrameNavItem[]): number => items.reduce((n, item) => n + (item.items?.length ? pages(item.items) : 1), 0)
  const rows = (items: readonly FrameNavItem[], depth: number): ReactNode[] =>
    items.flatMap((item) =>
      item.items?.length
        ? [
            <li key={item.id} data-slot="eyebrow" style={{ paddingInlineStart: `calc(var(--spacing) * ${2 + depth * 4})` }} className="flex h-7 items-center gap-2.5 pt-1 text-ui-sm font-medium text-fg-muted">
              {item.icon && <item.icon size={16} strokeWidth={1.75} />}
              {item.label}
            </li>,
            ...rows(item.items, depth + 1),
          ]
        : [<FlyoutLink key={item.id} item={item} depth={depth} />],
    )
  return (
    <div className="flex w-60 flex-col">
      <div className="flex h-8 items-center gap-2 px-2 text-ui-sm font-medium text-fg">
        {section.label}
        <span className="ms-auto text-ui-sm font-normal text-fg-muted tabular-nums">{labels.pagesFound(pages(section.items))}</span>
      </div>
      <ul className="relative isolate flex flex-col gap-0.5">
        {rows(section.items, 0)}
        <SlidingIndicator match='[aria-current="page"]' className="rounded-md bg-key shadow-xs ring-1 ring-line" />
      </ul>
    </div>
  )
}
