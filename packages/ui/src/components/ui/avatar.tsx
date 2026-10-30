'use client'

import { createContext, useContext, type ComponentProps } from 'react'
import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'

/* Base UI shows the fallback until the image has actually loaded (and keeps
 * it if the image fails), so there is never a broken-image frame. The image
 * then fades in over the muted disc on the base token instead of popping. A
 * hairline inner edge keeps light photos from bleeding into the page.
 *
 * A decorative avatar (aria-hidden: the name sits beside it or on its control)
 * draws its initials as generated content, not text: they stand for the
 * picture, so they aren't read out or counted in the control's visible label. */

const DecorativeContext = createContext(false)

const hidden = (value: unknown) => value === true || value === 'true'

function Avatar({
  className,
  size = 'default',
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: 'sm' | 'default' | 'lg'
}) {
  const k = useYouj()
  const decorative = useContext(DecorativeContext) || hidden(props['aria-hidden'])
  return (
    <DecorativeContext.Provider value={decorative}>
      <AvatarPrimitive.Root
        data-slot="avatar"
        data-size={size}
        data-reduced-motion={k.reduced || undefined}
        className={cn(
          'group/avatar relative isolate flex size-8 shrink-0 rounded-full bg-band select-none',
          'own:after:pointer-events-none own:after:absolute own:after:inset-0 own:after:rounded-full own:after:border own:after:border-line-subtle',
          'data-[size=lg]:size-10 data-[size=sm]:size-6',
          className,
        )}
        {...props}
      />
    </DecorativeContext.Provider>
  )
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        'absolute inset-0 size-full rounded-full object-cover',
        'transition-opacity own:yj-duration-base own:ease-standard data-starting-style:opacity-0 reduced:transition-none',
        className,
      )}
      {...props}
    />
  )
}

const CHART_COLORS = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const

/** One of the theme's five chart colours for a seed (a user id, an email): the same seed always gets the same one. */
function avatarColor(seed: string): (typeof CHART_COLORS)[number] {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return CHART_COLORS[Math.abs(hash) % CHART_COLORS.length]!
}

/* A seeded fallback is tinted like an ink (unlayered, as the disc's fill is): the chart colour mixed thin over the
 * disc, its initials the colour with a fifth of fg mixed back in. */
const colorClass =
  'bg-[color-mix(in_oklab,var(--ui--avatar-color)_calc(16%_+_6%_*_var(--yj-dark)),transparent)] own:text-[color-mix(in_oklab,var(--ui--avatar-color)_60%,var(--color-fg))]'
const colorVar: Record<(typeof CHART_COLORS)[number], string> = {
  'chart-1': '[--ui--avatar-color:var(--color-chart-1)]',
  'chart-2': '[--ui--avatar-color:var(--color-chart-2)]',
  'chart-3': '[--ui--avatar-color:var(--color-chart-3)]',
  'chart-4': '[--ui--avatar-color:var(--color-chart-4)]',
  'chart-5': '[--ui--avatar-color:var(--color-chart-5)]',
}

function AvatarFallback({
  className,
  colorSeed,
  ...props
}: AvatarPrimitive.Fallback.Props & {
  /** Tints the fallback with one of the theme's chart colours, picked from this seed (a user id or email), so each person keeps their colour wherever they appear. */
  colorSeed?: string
}) {
  const decorative = useContext(DecorativeContext) || hidden(props['aria-hidden'])
  // Initials of a decorative avatar are drawn, not text.
  const drawn = decorative && typeof props.children === 'string' ? props.children : undefined
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      data-yj-initials={drawn}
      className={cn(
        'own:flex size-full items-center justify-center rounded-full bg-band own:text-ui-sm own:font-medium own:text-fg-muted own:uppercase',
        'own:group-data-[size=sm]/avatar:text-ui-xs own:group-data-[size=lg]/avatar:text-ui',
        drawn !== undefined && 'own:before:content-[attr(data-yj-initials)]',
        colorSeed !== undefined && [colorClass, colorVar[avatarColor(colorSeed)]],
        className,
      )}
      {...props}
    >
      {/* Children win over the spread: a decorative avatar's initials aren't written back as text. */}
      {drawn === undefined ? props.children : undefined}
    </AvatarPrimitive.Fallback>
  )
}

/** A status dot on the avatar's end-bottom edge, cut out of the page by a ring. */
function AvatarBadge({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        'absolute end-0 bottom-0 z-10 own:inline-flex items-center justify-center rounded-full bg-success own:ring-2 ring-canvas select-none',
        'group-data-[size=sm]/avatar:size-1.5 group-data-[size=default]/avatar:size-2 group-data-[size=lg]/avatar:size-2.5',
        className,
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: ComponentProps<'div'>) {
  const decorative = useContext(DecorativeContext) || hidden(props['aria-hidden'])
  return (
    <DecorativeContext.Provider value={decorative}>
      <div
        data-slot="avatar-group"
        className={cn(
          'group/avatar-group own:flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-canvas',
          // The muted fill is ink at low alpha: over the page, overlapping initials would show through. The same tint, on an opaque base.
          '*:data-[slot=avatar]:[background:linear-gradient(var(--color-band),var(--color-band)),var(--color-canvas)]',
          '*:data-[slot=avatar-group-count]:[background:linear-gradient(var(--color-band),var(--color-band)),var(--color-canvas)]',
          className,
        )}
        {...props}
      />
    </DecorativeContext.Provider>
  )
}

function AvatarGroupCount({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        'relative own:flex size-8 shrink-0 items-center justify-center rounded-full bg-band own:text-ui-sm own:font-medium own:text-fg-muted own:tabular-nums own:ring-2 ring-canvas',
        'group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 own:group-has-data-[size=sm]/avatar-group:text-ui-xs',
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge, avatarColor }
