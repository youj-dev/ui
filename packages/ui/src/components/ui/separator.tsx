import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import { cn } from '../../lib/utils'

/** A line in the border token, as heavy as the theme's stroke (a 1px hairline by default); Base UI supplies role="separator" and aria-orientation. */
function Separator({ className, orientation = 'horizontal', ...props }: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        'own:shrink-0 own:bg-line own:data-[orientation=horizontal]:h-[var(--yj-stroke-width,1px)] own:data-[orientation=horizontal]:w-full own:data-[orientation=vertical]:w-[var(--yj-stroke-width,1px)] data-[orientation=vertical]:self-stretch',
        className,
      )}
      {...props}
    />
  )
}

export { Separator }
