import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

/* In running text (a direct child of a paragraph, list item, cell, quote or
 * caption) the keycap trims its block margins, so its 20px box sits on the
 * text baseline without growing a 20px line. Flex rows (tooltips, menus,
 * buttons) keep its full height. */
const inText = '[:where(p,li,dd,td,blockquote,figcaption)>&]:-my-0.5'

/** A keycap: a key on a hairline with a 1px bottom edge for depth. */
function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'pointer-events-none inline-flex own:h-5 own:w-fit own:min-w-5 items-center justify-center gap-0.5 own:rounded-sm own:px-1 select-none',
        inText,
        'border border-line own:bg-key own:font-sans text-ui-xs font-medium text-fg-muted own:shadow-[inset_0_-1px_0_var(--color-line)]',
        "[&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    />
  )
}

/** Nested <kbd>s are how HTML spells a key combination (⌘ + K). */
function KbdGroup({ className, ...props }: ComponentProps<'kbd'>) {
  return <kbd data-slot="kbd-group" className={cn('inline-flex items-center gap-1', inText, className)} {...props} />
}

export { Kbd, KbdGroup }
