import { cva } from 'class-variance-authority'

/** The look of a top-level trigger, for a plain link that sits beside them. */
export const navigationMenuTriggerStyle = cva(
  [
    'inline-flex h-control w-max items-center justify-center gap-1 own:rounded-md own:px-3 text-ui font-medium text-fg-muted select-none',
    'transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring',
    'data-popup-open:text-fg data-active:text-fg',
    'data-disabled:pointer-events-none data-disabled:opacity-50',
  ],
)
