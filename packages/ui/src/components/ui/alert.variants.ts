import { cva } from 'class-variance-authority'

export const alertVariants = cva(
  'group/alert own:grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 own:rounded-lg border own:px-[calc(var(--spacing)*(3.5_-_0.5*var(--ui--compact,0)))] own:py-[calc(var(--spacing)*(3_-_0.5*var(--ui--compact,0)))] text-start own:text-ui has-data-[slot=alert-dismiss]:grid-cols-[auto_minmax(0,1fr)_auto]',
  {
    variants: {
      variant: {
        info: 'border-accent-line own:bg-accent-subtle [--alert-icon:var(--color-accent)]',
        success: 'border-success-line own:bg-success-subtle [--alert-icon:var(--color-success)]',
        warning: 'border-warning-line own:bg-warning-subtle [--alert-icon:var(--color-warning)]',
        danger: 'border-danger-line own:bg-danger-subtle [--alert-icon:var(--color-danger)]',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)
