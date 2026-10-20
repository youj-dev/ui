'use client'

import { createContext, useContext, useMemo, type CSSProperties } from 'react'
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import type { VariantProps } from 'class-variance-authority'
import { SlidingIndicator } from '@youj/motion'
import { useYouj, useDirection } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'
import { toggleVariants } from './toggle'

/* Base UI's toggle group: one tab stop, arrow keys rove (Home/End jump),
 * `multiple` for independent toggles. Three looks: spaced toggles, joined
 * outline keys (spacing 0), and `segmented`: plain muted labels on a hairline,
 * the pressed one in full ink over a 2px accent bar. In a single-select
 * segmented group the bar is one motion SlidingIndicator that glides to the
 * pressed item on the `smooth` spring (and jumps under reduced motion); with
 * `multiple`, each pressed item draws its own bar. `pill` is the other
 * segmented look: a recessed track whose pressed key is raised out of it (a
 * capsule's toggle uses it). A segment is never narrower than its label, and
 * its hit area covers the group's padding. */

type ToggleGroupVariant = VariantProps<typeof toggleVariants>['variant'] | 'segmented' | 'pill'

const ToggleGroupContext = createContext<{
  variant: ToggleGroupVariant
  size: VariantProps<typeof toggleVariants>['size']
  spacing: number
  /** The key or bar is the group's sliding indicator, not the item's own fill. */
  sliding: boolean
}>({ variant: 'default', size: 'default', spacing: 1, sliding: false })

/** The key, lifted out of the well: the white plane in light on an edge that holds 3:1 against the track (ui.css --ui--key-edge), the raised step in dark. It stays inside the track, so it takes only soft elevation. */
const raisedKeyClass = 'own:bg-key own:shadow-sm-soft own:inset-ring-(length:--yj-stroke-width) inset-ring-(--ui--key-edge)'

function ToggleGroup({
  className,
  variant = 'default',
  size = 'default',
  spacing = variant === 'segmented' || variant === 'pill' ? 0 : 1,
  orientation = 'horizontal',
  multiple,
  children,
  ...props
}: ToggleGroupPrimitive.Props &
  Omit<VariantProps<typeof toggleVariants>, 'variant'> & {
    variant?: ToggleGroupVariant
    /** Gap between items in spacing steps. 0 joins them. */
    spacing?: number
  }) {
  const direction = useDirection()
  const choice = variant === 'segmented' || variant === 'pill'
  const horizontal = orientation === 'horizontal'
  const sliding = choice && !multiple
  const context = useMemo(() => ({ variant, size, spacing, sliding }), [variant, size, spacing, sliding])
  return (
    <DirectionProvider direction={direction}>
      <ToggleGroupPrimitive
        data-slot="toggle-group"
        data-variant={variant}
        data-size={size}
        data-spacing={spacing}
        orientation={orientation}
        multiple={multiple}
        style={{ '--gap': spacing } as CSSProperties}
        className={cn(
          'group/toggle-group flex w-fit items-center own:gap-[--spacing(var(--gap))] own:rounded-button',
          'data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch',
          // Segmented and pill: the group is the control height, so it lines
          // up with inputs and buttons of the same size; its items fill it.
          // `relative isolate` holds the sliding indicator behind the labels.
          choice && 'relative isolate own:gap-0.5',
          choice && horizontal && 'data-[size=default]:h-control data-[size=sm]:h-control-sm data-[size=lg]:h-control-lg',
          // Segmented: a hairline of the theme's stroke along the foot (the start edge when stacked).
          variant === 'segmented' &&
            (horizontal
              ? 'own:rounded-none own:shadow-[inset_0_calc(-1*var(--yj-stroke-width,1px))_0_var(--color-line)]'
              : 'own:rounded-none border-s own:border-line'),
          // Pill: a recessed track.
          variant === 'pill' && [
            'own:rounded-choice own:bg-well own:[--ui--choice-inset:2px] own:p-(--ui--choice-inset)',
            // shape: each size's track takes the choice corner of its height
            'own:data-[size=sm]:[--radius-choice:var(--radius-choice-sm)] own:data-[size=lg]:[--radius-choice:var(--radius-choice-lg)]',
          ],
          className,
        )}
        {...props}
      >
        <ToggleGroupContext.Provider value={context}>{children}</ToggleGroupContext.Provider>
        {sliding && variant === 'pill' && (
          // Concentric with the track: the track's corner less its inset.
          <SlidingIndicator
            data-slot="toggle-group-indicator"
            className={cn('own:rounded-choice-key', raisedKeyClass, 'group-data-disabled/toggle-group:opacity-50')}
          />
        )}
        {sliding && variant === 'segmented' && (horizontal ? (
          <SlidingIndicator
            data-slot="toggle-group-indicator"
            variant="underline"
            className="own:bg-accent group-data-disabled/toggle-group:opacity-50"
          />
        ) : (
          // Stacked: the bar stands on the start edge, over the hairline.
          <SlidingIndicator
            data-slot="toggle-group-indicator"
            className="own:bg-transparent before:absolute before:inset-y-1.5 before:-start-px before:w-0.5 own:before:rounded-full own:before:bg-accent group-data-disabled/toggle-group:opacity-50"
          />
        ))}
      </ToggleGroupPrimitive>
    </DirectionProvider>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  const k = useYouj()
  const context = useContext(ToggleGroupContext)
  const resolvedVariant = variant ?? context.variant
  const resolvedSize = size ?? context.size
  const underlined = resolvedVariant === 'segmented'
  const segmented = underlined || resolvedVariant === 'pill'

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={resolvedVariant}
      data-size={resolvedSize}
      data-spacing={context.spacing}
      data-reduced-motion={k.reduced || undefined}
      className={cn(
        toggleVariants({ variant: segmented ? 'default' : resolvedVariant, size: resolvedSize }),
        'focus-visible:z-10',
        // Joined keys: square inner corners, shared borders.
        !segmented && [
          'touch:yj-hit',
          'own:data-[spacing=0]:rounded-none own:data-[spacing=0]:shadow-none',
          'own:group-data-[orientation=horizontal]/toggle-group:data-[spacing=0]:first:rounded-s-button own:group-data-[orientation=horizontal]/toggle-group:data-[spacing=0]:last:rounded-e-button',
          'own:group-data-[orientation=vertical]/toggle-group:data-[spacing=0]:first:rounded-t-button own:group-data-[orientation=vertical]/toggle-group:data-[spacing=0]:last:rounded-b-button',
          'group-data-[orientation=horizontal]/toggle-group:data-[spacing=0]:data-[variant=outline]:border-s-0 group-data-[orientation=horizontal]/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-s',
          'group-data-[orientation=vertical]/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-[orientation=vertical]/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t',
        ],
        // Segmented and pill: the key's radius is the track's less its inset,
        // so the corners stay concentric. When the group slides its
        // indicator, the item only carries the text.
        segmented && [
          'group-data-[orientation=horizontal]/toggle-group:h-full group-data-[orientation=horizontal]/toggle-group:min-h-0 flex-1 own:rounded-choice-key own:hover:bg-transparent hover:text-fg own:data-pressed:text-fg',
          // Segments share the track equally, but never below their label: the
          // size's min-width would let a fit-width track's equal split run a
          // long label over its padding.
          'min-w-auto',
          // Stacked, a key keeps its control height: flex-1 in a column of
          // auto height would shrink it to its 20px line (and its target
          // under WCAG 2.5.8's 24px).
          'group-data-[orientation=vertical]/toggle-group:flex-none',
          // The whole track is the target: each key's hit area takes in the
          // track's padding and half the gap to its neighbors.
          'after:absolute after:-inset-0.5 touch:after:-inset-y-2.5',
          context.sliding
            ? 'own:data-pressed:bg-transparent'
            : underlined
              ? 'own:data-pressed:bg-transparent own:data-pressed:shadow-[inset_0_-2px_0_var(--color-accent)]'
              : 'own:data-pressed:bg-key own:data-pressed:shadow-sm-soft own:data-pressed:inset-ring-(length:--yj-stroke-width) data-pressed:inset-ring-(--ui--key-edge)',
          // Segments are words side by side: the small key's icon-sized inset runs them together.
          resolvedSize === 'sm' && 'own:px-2.5 touch:min-w-control',
        ],
        className,
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  )
}

export { ToggleGroup, ToggleGroupItem }
