import { cva } from 'class-variance-authority'

/* Soft by default: a 10% tint of the color with its "ink" (the color with a
 * fifth of fg mixed back in) as text, which holds AA on the tint in both
 * themes. Only `solid` spends the accent at full strength. */
export const badgeVariants = cva(
  [
    'group/badge own:inline-flex own:w-fit own:shrink-0 items-center justify-center own:gap-1 overflow-hidden own:rounded-chip own:border own:border-transparent',
    // A remove button's 24px hit area reaches past the 20px chip (WCAG 2.5.8); the label truncates on its own span.
    'has-data-[slot=badge-remove]:overflow-visible',
    'own:text-ui-sm own:font-medium whitespace-nowrap',
    'transition-[color,background-color,border-color] own:yj-duration-fast own:ease-standard focus-ring',
    '[&>svg]:pointer-events-none [&>svg]:size-3 [&>svg:first-child]:-ms-0.5 [&>svg:last-child]:-me-0.5',
  ],
  {
    variants: {
      variant: {
        default: 'own:bg-accent-subtle own:text-accent-text [a&]:hover:bg-accent-line',
        solid: 'own:bg-accent own:text-on-accent [a&]:yj-solid-hover',
        secondary: 'own:bg-hover own:text-fg-muted [a&]:hover:bg-hover [a&]:hover:text-fg',
        outline: 'own:border-line own:text-fg-muted [a&]:hover:bg-hover [a&]:hover:text-fg',
        success: 'own:bg-success-subtle own:text-success-text [a&]:hover:bg-success-line',
        warning: 'own:bg-warning-subtle own:text-warning-text [a&]:hover:bg-warning-line',
        danger: 'own:bg-danger-subtle own:text-danger-text [a&]:hover:bg-danger-line',
        // A status with no severity (draft, archived, paused), as quiet as the tinted ones.
        neutral: 'own:bg-band own:text-fg-muted [a&]:hover:bg-selected [a&]:hover:text-fg',
      },
      /* sm: a count or tag in a dense row (18px); lg: a status beside a page or card title (24px). The corner is the theme's chip corner at every size. */
      size: {
        sm: 'own:h-4.5 own:px-1.5 own:text-ui-xs',
        default: 'own:h-5 own:px-2',
        lg: 'own:h-6 own:px-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
