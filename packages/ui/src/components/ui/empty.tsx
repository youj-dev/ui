'use client'

import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'

/* An empty state: what isn't here yet, why, and what to do about it.
 * The icon sits on a tile over two plates that fan out when it appears (from
 * a neat stack to a few degrees either side, on the emphasized curve) and
 * open a little further while you hover the header, which also plays a
 * youj icon inside (the header is its `data-yj-trigger` group).
 * Reduced motion shows the fanned plates at rest and plays nothing. */

function Empty({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty"
      className={cn(
        'own:flex own:w-full own:min-w-0 flex-1 flex-col own:items-center justify-center own:gap-[calc(var(--spacing)*(5_-_var(--ui--compact,0)))] own:rounded-xl own:p-[calc(var(--spacing)*(8_-_2*var(--ui--compact,0)))] own:text-center text-balance',
        className,
      )}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-header"
      // Youj icons inside play while the header is hovered.
      data-yj-trigger=""
      className={cn('group/empty-header own:flex own:max-w-sm flex-col own:items-center own:gap-1.5', className)}
      {...props}
    />
  )
}

const emptyMediaVariants = cva('own:mb-3 own:flex shrink-0 own:items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0', {
  variants: {
    variant: {
      default: 'own:bg-transparent',
      icon: "relative isolate own:size-12 [&_svg:not([class*='size-'])]:size-5",
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

/* A plate behind the tile: rests fanned a few degrees out, starts stacked
 * when it appears, and opens further on hover. Each rotates about its own
 * bottom corner, so the pair splays like cards in a hand. */
const plateClass = cn(
  'absolute inset-1 -z-1 rounded-lg border border-line bg-band',
  'transition-[rotate,translate] yj-duration-slow ease-emphasized starting:rotate-0 starting:translate-x-0',
  'reduced:transition-none',
)

function EmptyMedia({ className, variant = 'default', children, ...props }: ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) {
  const k = useYouj()
  if (variant !== 'icon') {
    return (
      <div data-slot="empty-icon" data-variant={variant} className={cn(emptyMediaVariants({ variant }), className)} {...props}>
        {children}
      </div>
    )
  }
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      data-reduced-motion={k.reduced || undefined}
      className={cn(emptyMediaVariants({ variant }), className)}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          plateClass,
          'origin-bottom-left -translate-x-2 -rotate-10 group-hover/empty-header:-translate-x-2.5 group-hover/empty-header:-rotate-14',
          'reduced:group-hover/empty-header:-translate-x-2 reduced:group-hover/empty-header:-rotate-10',
        )}
      />
      <span
        aria-hidden
        className={cn(
          plateClass,
          'origin-bottom-right translate-x-2 rotate-10 group-hover/empty-header:translate-x-2.5 group-hover/empty-header:rotate-14',
          'reduced:group-hover/empty-header:translate-x-2 reduced:group-hover/empty-header:rotate-10',
        )}
      />
      <span className="own:grid size-full place-items-center rounded-xl border border-line bg-key own:text-fg shadow-sm">
        {children}
      </span>
    </div>
  )
}

function EmptyTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="empty-title" className={cn('own:text-ui-lg own:font-semibold own:tracking-tight own:text-fg', className)} {...props} />
  )
}

function EmptyDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="empty-description"
      className={cn(
        'own:text-ui own:text-fg-muted [&>a]:text-fg [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-accent',
        className,
      )}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-content"
      className={cn('own:flex own:w-full own:max-w-sm own:min-w-0 flex-wrap own:items-center justify-center own:gap-2 own:text-ui text-balance', className)}
      {...props}
    />
  )
}

export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia }
