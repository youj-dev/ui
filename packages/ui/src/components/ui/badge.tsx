import type { CSSProperties, ComponentProps } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { type VariantProps } from 'class-variance-authority'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import { cn } from '../../lib/utils'
import { badgeVariants } from './badge.variants'

/** The colours a chip takes by name; anything else is used as a CSS colour. */
const NAMED = new Set(['accent', 'info', 'success', 'warning', 'danger', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'])

/** A theme colour's name (`chart-3`, `success`) as its variable, or a CSS colour as it is. */
function chipColor(color: string) {
  return NAMED.has(color) ? `var(--color-${color})` : color
}

/* A coloured chip is tinted like the inks: the colour thin under the label,
 * and the label the colour with a fifth of fg mixed back in. */
const colorClass =
  'own:bg-[color-mix(in_oklab,var(--ui--badge-color)_calc(12%_+_4%_*_var(--yj-dark)),transparent)] own:text-[color-mix(in_oklab,var(--ui--badge-color)_80%,var(--color-fg))] own:border-transparent'

function Badge({
  className,
  variant = 'default',
  size = 'default',
  color,
  style,
  render,
  ...props
}: Omit<useRender.ComponentProps<'span'>, 'variant' | 'color'> & {
  variant?: VariantProps<typeof badgeVariants>['variant']
  /** `sm` (18px) for a count or tag in a dense row, `lg` (24px) beside a title. Default `default` (20px; 22px in Bezel). */
  size?: VariantProps<typeof badgeVariants>['size']
  /** A colour of your own for a label chip, in place of the variant's: a theme colour's name (`chart-1`…`chart-5`, `accent`, `info`, `success`, `warning`, `danger`) or any CSS colour (`var(--brand)`). The chip is tinted with it and its text inked from it. A CSS colour's contrast is yours to check. */
  color?: string
}) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ variant, size }), color !== undefined && colorClass, className),
        style: color === undefined ? style : ({ '--ui--badge-color': chipColor(color), ...style } as CSSProperties),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
      size,
    },
  })
}

/**
 * The remove control of a chip: put it last inside a Badge and give it an
 * aria-label ("Remove design"). It is a 16px glyph with a 24px hit area, and
 * it takes no ring of its own: give the Badge `focus-ring-within` so the whole
 * chip rings while it has keyboard focus.
 */
function BadgeRemove({ className, children, type = 'button', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      data-slot="badge-remove"
      className={cn(
        'relative own:-me-1 own:grid own:size-4 own:shrink-0 cursor-default place-items-center own:rounded-full own:text-current opacity-60 outline-none',
        'transition-[opacity,background-color] own:yj-duration-fast own:ease-standard',
        'own:hover:bg-hover hover:opacity-100 focus-visible:opacity-100 disabled:pointer-events-none',
        'own:after:absolute own:after:-inset-1 [&>svg]:size-3',
        className,
      )}
      {...props}
    >
      {children ?? <XIcon strokeWidth={2.25} />}
    </button>
  )
}

/**
 * A status dot: put it first inside a Badge ("● Live"). It takes the badge's
 * text color, so a success badge gets a green dot; `color` paints it a colour
 * of its own (a label's colour on an outline chip). Decorative (aria-hidden):
 * the badge's text carries the meaning.
 */
function BadgeDot({
  className,
  color,
  style,
  ...props
}: Omit<ComponentProps<'span'>, 'color'> & {
  /** The dot's own colour: a theme colour's name (`chart-1`…`chart-5`, `accent`, `success`…) or any CSS colour. Default: the badge's text colour. */
  color?: string
}) {
  return (
    <span
      aria-hidden
      data-slot="badge-dot"
      className={cn('own:size-1.5 own:shrink-0 own:rounded-full own:bg-current', className)}
      style={color === undefined ? style : { backgroundColor: chipColor(color), ...style }}
      {...props}
    />
  )
}

export { Badge, BadgeDot, BadgeRemove, badgeVariants }
