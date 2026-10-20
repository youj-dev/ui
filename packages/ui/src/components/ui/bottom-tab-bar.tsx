'use client'

import { bottomTabBarLabels } from '@youj/core/labels'
import type { ComponentProps, ReactNode } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { SlidingIndicator } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'

/* A phone app's primary navigation: three to five destinations pinned to the
 * bottom edge, above the home indicator (it pads itself by the safe-area
 * inset). The current destination's icon sits on a pill, one motion
 * SlidingIndicator that glides between tabs on the smooth spring, and its
 * label and icon turn to ink; a youj icon plays on hover and focus. A
 * badge counts what's waiting; screen readers hear it after the label. The
 * tabs are links (aria-current="page"), so Tab reaches each one and the
 * browser's own navigation applies. Reduced motion: the pill jumps.
 *
 * It is `fixed` to the viewport by default; pass `className="absolute"` (or
 * `static`) to place it inside a frame. */

function BottomTabBar({ className, children, 'aria-label': label, ...props }: ComponentProps<'nav'>) {
  const k = useYouj()
  const labels = useComponentLabels(bottomTabBarLabels)
  return (
    <nav
      data-slot="bottom-tab-bar"
      data-yj-tone="chrome"
      aria-label={label ?? labels.primaryNavigation}
      data-reduced-motion={k.reduced || undefined}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-line yj-glass own:text-fg',
        'pb-[env(safe-area-inset-bottom)] ps-[env(safe-area-inset-left)] pe-[env(safe-area-inset-right)]',
        className,
      )}
      {...props}
    >
      <ul className="relative isolate mx-auto flex max-w-lg items-stretch px-1">
        {children}
        {/* The pill hugs the icon, not the whole tab. */}
        <SlidingIndicator
          data-slot="bottom-tab-bar-indicator"
          match='[aria-current="page"]'
          className="bg-transparent before:absolute before:top-2 before:left-1/2 before:h-8 before:w-14 before:-translate-x-1/2 own:before:rounded-lg before:bg-selected"
        />
      </ul>
    </nav>
  )
}

interface BottomTabBarItemProps extends useRender.ComponentProps<'a'> {
  icon: ReactNode
  label: ReactNode
  /** The current destination. */
  active?: boolean
  /** A count (99+ past 99) or `true` for a dot. */
  badge?: number | boolean
  /** How the badge is read after the label. Default "N new", or "new" for a dot. */
  badgeLabel?: string
}

function BottomTabBarItem({ className, icon, label, active = false, badge, badgeLabel, render, ...props }: BottomTabBarItemProps) {
  const labels = useComponentLabels(bottomTabBarLabels)
  const showBadge = badge === true || (typeof badge === 'number' && badge > 0)
  const spoken = badgeLabel ?? (typeof badge === 'number' ? labels.badgeNewCount(badge) : labels.badgeNew)
  const link = useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      {
        'aria-current': active ? 'page' : undefined,
        className: cn(
          'group/tab own:flex min-h-14 w-full flex-col items-center justify-start gap-1 own:rounded-md pt-2 pb-1.5 own:text-fg-muted outline-none select-none',
          'transition-colors yj-duration-fast ease-standard hover:text-fg aria-[current=page]:text-fg',
          '[-webkit-tap-highlight-color:transparent]',
          className,
        ),
        children: (
          <>
            <span
              data-slot="bottom-tab-bar-icon"
              // The focus ring draws around the icon's pill, where the eye already is.
              className={cn(
                'relative own:grid h-8 w-14 place-items-center own:rounded-lg',
                'group-focus-visible/tab:outline-2 group-focus-visible/tab:outline-offset-0 group-focus-visible/tab:outline-focus',
                "[&_svg:not([class*='size-'])]:size-5 [&_svg]:shrink-0",
              )}
            >
              {icon}
              {showBadge && (
                <span
                  aria-hidden
                  data-slot="bottom-tab-bar-badge"
                  className={cn(
                    'absolute start-[calc(50%_+_var(--spacing)*1.5)] top-0.5 own:grid place-items-center rounded-full bg-accent own:font-semibold own:text-on-accent own:tabular-nums ring-2 ring-canvas',
                    badge === true ? 'size-2' : 'h-4 min-w-4 px-1 own:text-ui-xs own:leading-none',
                  )}
                >
                  {badge === true ? null : (badge as number) > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            <span className="own:text-ui-xs own:leading-none own:font-medium">
              {label}
              {showBadge && <span className="sr-only">, {spoken}</span>}
            </span>
          </>
        ),
      },
      props,
    ),
    state: { slot: 'bottom-tab-bar-item', active },
  })
  return (
    <li className="flex min-w-0 flex-1" data-yj-trigger="">
      {link}
    </li>
  )
}

export { BottomTabBar, BottomTabBarItem }
export type { BottomTabBarItemProps }
