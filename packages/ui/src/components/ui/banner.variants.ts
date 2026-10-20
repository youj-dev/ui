import { cva } from 'class-variance-authority'

export const bannerVariants = cva(
  [
    'group/banner relative own:flex min-h-10 w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 own:px-4 own:py-2 text-center own:text-ui',
    // The dismiss button sits at the end, out of the flow, so the message stays centered on the page.
    'own:has-data-[slot=banner-dismiss]:ps-12 own:has-data-[slot=banner-dismiss]:pe-12',
  ],
  {
    variants: {
      variant: {
        default: 'border-b border-line own:bg-band own:text-fg [--banner-muted:var(--color-fg-muted)]',
        inverse: 'own:bg-fg own:text-canvas [--banner-muted:color-mix(in_oklab,var(--color-canvas)_72%,transparent)]',
        accent: 'own:bg-accent own:text-on-accent [--banner-muted:var(--color-on-accent)]',
        warning: 'border-b border-warning-line own:bg-warning-subtle own:text-fg [--banner-muted:var(--color-fg-muted)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)
