import type { ComponentProps } from 'react'
import { cn } from '../../../lib/utils'
import { Eyebrow } from '../../../components/ui/typography'

/** One band of the panel, ruled off from the next by a hairline. */
export function Section({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('border-b border-line px-(--card-spacing) py-(--card-spacing)', className)} {...props} />
}

/** A short name in the theme's label voice (mono capitals where the theme sets them, as Bezel does), as an Eyebrow so the style gives it its label voice. */
export function SectionLabel({ className, ...props }: ComponentProps<'span'>) {
  return (
    <Eyebrow
      className={cn(
        'text-ui-sm text-fg-muted font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]',
        className,
      )}
      {...props}
    />
  )
}
