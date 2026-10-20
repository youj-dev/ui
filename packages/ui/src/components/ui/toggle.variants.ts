import { cva } from 'class-variance-authority'

export const toggleVariants = cva(
  [
    'group/toggle relative own:inline-flex shrink-0 items-center justify-center gap-1.5 own:rounded-button own:font-medium whitespace-nowrap select-none',
    'own:text-fg-muted transition-[color,background-color,border-color,box-shadow,scale] own:yj-duration-fast own:ease-standard',
    'own:hover:bg-hover own:hover:text-fg focus-ring',
    'active:scale-[0.97] own:active:yj-duration-instant own:reduced:active:scale-100',
    'own:data-pressed:bg-selected own:data-pressed:hover:bg-selected own:data-pressed:text-fg',
    'data-disabled:pointer-events-none data-disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: 'own:bg-transparent',
        outline: 'own:border own:border-line own:bg-transparent own:shadow-xs',
      },
      size: {
        default: 'h-control min-w-control own:px-2 own:text-ui',
        sm: "h-control-sm min-w-control-sm own:rounded-button-sm own:px-1.5 own:text-ui [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-control-lg min-w-control-lg own:rounded-button-lg own:px-2.5 own:text-ui-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
