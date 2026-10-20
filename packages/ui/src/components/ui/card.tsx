'use client'

import type { ComponentProps } from 'react'
import { SpotlightSurface } from '@youj/motion'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'

/* shadcn's card on youj surfaces: a hairline-bordered raised panel with
 * header (title, description, and an action slot beside them), content and
 * a recessed footer.
 * - `lift`: for cards that are one big target. On hover or keyboard focus
 *   inside, it rises 2px and its shadow deepens; pressing sets it back down.
 *   Reduced motion keeps the shadow change and drops the travel.
 * - `spotlight`: wears motion's Spotlight effect, a pointer-tracked light
 *   under the cursor whose edge glows where the light passes the border. In a
 *   SpotlightGroup, neighboring cards share one light. Reduced motion shows
 *   a static accent border on hover and focus instead. */

interface CardProps extends ComponentProps<'div'> {
  size?: 'default' | 'sm'
  /**
   * `inset`: in the Bezel style, a shell carrying the head, with the rest in a
   * well inside it at the concentric radius. Classic draws it as the default card.
   * `panel`: in every style, a slim header strip (the title as a small label,
   * an info tip, a menu button) over the content on a raised surface inset in
   * the shell.
   */
  variant?: 'default' | 'inset' | 'panel'
  /** Rise on hover and focus: for cards that are one big target. */
  lift?: boolean
  /** Light the card with motion's Spotlight effect. */
  spotlight?: boolean
}

function Card({ className, size = 'default', variant = 'default', lift = false, spotlight = false, ...props }: CardProps) {
  const k = useYouj()
  const classes = cn(
    'group/card relative own:flex flex-col own:gap-(--card-spacing) own:rounded-(--card-radius) own:border own:border-line own:bg-surface own:py-(--card-spacing) own:text-ui own:text-fg own:shadow-xs',
    // Spacing and corners follow the layout density (ui.css): 20px (16px small), 4px less compact; the corner caps at 12px compact.
    'own:[--card-spacing:calc(var(--spacing)*(5_-_var(--ui--compact,0)))] own:data-[size=sm]:[--card-spacing:calc(var(--spacing)*(4_-_var(--ui--compact,0)))]',
    '[--card-radius:min(var(--radius-surface),var(--ui--panel-radius-max,var(--radius-surface)))]',
    'own:has-data-[slot=card-footer]:pb-0 own:has-[>img:first-child]:pt-0',
    // A <form> around the parts lays out as if it weren't there, so they keep the card's gap and sections.
    'own:[&>form]:contents',
    'own:*:[img:first-child]:rounded-t-[calc(var(--card-radius)-1px)] own:*:[img:last-child]:rounded-b-[calc(var(--card-radius)-1px)]',
    // Panel: the shell is the band, padded a step; the head is a slim strip and every other part sits on
    // the surface inside it at the concentric radius.
    variant === 'panel' && [
      'own:gap-1 own:bg-band own:p-1 own:[--card-spacing:calc(var(--spacing)*(4_-_var(--ui--compact,0)))]',
      'own:*:data-[slot=card-content]:rounded-[calc(var(--card-radius)-var(--spacing))] own:*:data-[slot=card-content]:border own:*:data-[slot=card-content]:border-line-subtle own:*:data-[slot=card-content]:bg-surface own:*:data-[slot=card-content]:py-(--card-spacing)',
      'own:*:data-[slot=card-footer]:rounded-[calc(var(--card-radius)-var(--spacing))] own:*:data-[slot=card-footer]:border-0 own:*:data-[slot=card-footer]:bg-transparent own:*:data-[slot=card-footer]:py-2',
      // The strip: one line, the title as the theme's label face (mono capitals in Bezel), the action at the end.
      'own:*:data-[slot=card-header]:flex own:*:data-[slot=card-header]:min-h-9 own:*:data-[slot=card-header]:items-center own:*:data-[slot=card-header]:gap-1.5 own:*:data-[slot=card-header]:ps-2.5 own:*:data-[slot=card-header]:pe-0.5 own:*:data-[slot=card-header]:py-0.5',
      'own:[&>[data-slot=card-header]>[data-slot=card-title]]:flex own:[&>[data-slot=card-header]>[data-slot=card-title]]:items-center own:[&>[data-slot=card-header]>[data-slot=card-title]]:gap-1',
      'own:[&>[data-slot=card-header]>[data-slot=card-title]]:text-ui-xs own:[&>[data-slot=card-header]>[data-slot=card-title]]:font-medium own:[&>[data-slot=card-header]>[data-slot=card-title]]:text-fg-muted',
      '[&>[data-slot=card-header]>[data-slot=card-title]]:[font-family:var(--yj-label-font)] [&>[data-slot=card-header]>[data-slot=card-title]]:[text-transform:var(--yj-label-case)] [&>[data-slot=card-header]>[data-slot=card-title]]:[letter-spacing:var(--yj-label-tracking)]',
      'own:[&>[data-slot=card-header]>[data-slot=card-description]]:text-ui-sm own:[&>[data-slot=card-header]>[data-slot=card-description]]:truncate',
      'own:[&>[data-slot=card-header]>[data-slot=card-action]]:ms-auto own:[&>[data-slot=card-header]>[data-slot=card-action]]:flex own:[&>[data-slot=card-header]>[data-slot=card-action]]:items-center own:[&>[data-slot=card-header]>[data-slot=card-action]]:gap-1.5 own:[&>[data-slot=card-header]>[data-slot=card-action]]:self-center',
    ],
    lift && [
      // One big target: the card itself wears the focus ring of the link inside.
      'focus-ring-within',
      'transition-[translate,box-shadow,border-color] yj-duration-base own:ease-standard',
      'own:hover:-translate-y-0.5 own:hover:border-line-control own:hover:shadow-md own:has-[:focus-visible]:-translate-y-0.5 own:has-[:focus-visible]:shadow-md',
      'own:active:translate-y-0 own:active:shadow-sm own:active:yj-duration-instant',
      'own:reduced:translate-y-0 own:reduced:hover:translate-y-0 own:reduced:has-[:focus-visible]:translate-y-0',
    ],
    className,
  )
  const shared = {
    'data-slot': 'card',
    'data-size': size,
    'data-variant': variant === 'default' ? undefined : variant,
    'data-lift': lift || undefined,
    'data-reduced-motion': k.reduced || undefined,
  }
  if (spotlight) return <SpotlightSurface {...shared} className={classes} {...props} />
  return <div {...shared} className={classes} {...props} />
}

function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'group/card-header @container/card-header own:grid own:auto-rows-min own:items-start own:gap-1 own:px-(--card-spacing)',
        'own:has-data-[slot=card-action]:grid-cols-[1fr_auto] own:has-data-[slot=card-description]:grid-rows-[auto_auto]',
        'own:[.border-b]:pb-(--card-spacing)',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('own:text-ui-lg own:leading-snug own:font-semibold own:tracking-tight own:text-fg own:group-data-[size=sm]/card:text-ui', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-description" className={cn('own:text-ui own:text-fg-muted', className)} {...props} />
}

function CardAction({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('own:col-start-2 own:row-span-2 own:row-start-1 own:self-start own:justify-self-end', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('own:px-(--card-spacing)', className)} {...props} />
}

function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        // The card doesn't clip (the spotlight's edge sits on its border), so
        // the footer carries the inner radius itself.
        'own:flex own:items-center own:gap-2 own:rounded-b-[calc(var(--card-radius,var(--radius-surface))-1px)] own:border-t own:border-line own:bg-band own:px-(--card-spacing) own:py-3',
        className,
      )}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent, type CardProps }
