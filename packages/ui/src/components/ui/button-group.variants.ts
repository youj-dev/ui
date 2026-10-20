import { cva } from 'class-variance-authority'

export const buttonGroupVariants = cva(
  [
    'own:flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10',
    'has-[>[data-slot=button-group]]:gap-2',
    "[&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  ],
  {
    variants: {
      orientation: {
        horizontal: [
          '[&>[data-slot]:has(~[data-slot])]:rounded-e-none',
          '[&>[data-slot]~[data-slot]]:rounded-s-none [&>[data-slot]~[data-slot]]:border-s-0',
        ],
        vertical: [
          'flex-col',
          '[&>[data-slot]:has(~[data-slot])]:rounded-b-none',
          '[&>[data-slot]~[data-slot]]:rounded-t-none [&>[data-slot]~[data-slot]]:border-t-0',
        ],
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  },
)
