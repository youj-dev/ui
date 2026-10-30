'use client'

import { useId, useRef, useState, type ComponentProps, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react'
import { useSoundCue } from '@youj/core'
import { imageAccordionLabels, useComponentLabels } from '@youj/core/labels'
import { useDirection } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'

/* A row (or column) of pictures where one is open wide and the rest wait as
 * slim strips. Pointing at a strip, focusing it or pressing it opens it; the
 * open panel shows its caption (title and a short line) on a plate.
 * - Size: the component never changes size. The panels share its box by
 *   flex-grow: the open one takes about three fifths and the strips split the
 *   rest, so only the split moves.
 * - Activation: `hover` (default) opens on pointer hover and on focus, and a
 *   press opens it on touch; `click` opens only on a press, Enter or Space.
 * - Motion: the split glides on the smooth spring sampled into CSS, the
 *   caption fades up once its panel opens, and strips sit a little quieter.
 *   Every duration is scaled by --yj-motion, so under reduced motion the
 *   split and caption jump.
 * - Keyboard: the panels are buttons in one tab stop; the arrow keys of the
 *   orientation (mirrored in RTL), Home and End move between them. Each is
 *   named by its title and described by its line; the open one carries
 *   `aria-current`. */

interface ImageAccordionItem {
  id: string
  /** The picture: `{ src, alt }` for an image, or your own node (an illustration, a video, a gradient). It fills the panel. */
  media: ReactNode | { src: string; alt: string }
  /** The caption's first line, and the panel's accessible name. */
  title: ReactNode
  /** A short line under the title. */
  description?: ReactNode
}

interface ImageAccordionProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  items: ImageAccordionItem[]
  /** The open panel's id (controlled). */
  value?: string
  /** The panel open at first. Default: the first. */
  defaultValue?: string
  /** Called with the id of the panel that opens. */
  onValueChange?: (id: string) => void
  /** `hover` opens a panel on hover or focus (a press on touch); `click` only on a press. Default 'hover'. */
  activation?: 'hover' | 'click'
  /** Panels side by side (`horizontal`) or stacked (`vertical`). Default 'horizontal'. */
  orientation?: 'horizontal' | 'vertical'
  /** Names the group. Default: the labels' "Gallery". */
  'aria-label'?: string
  /** With sound on (`YoujProvider`’s `sound`), opening a panel by press or key plays `select`; hovering stays silent. `false` keeps this one silent. Default true. */
  sound?: boolean
}

const isImage = (media: ImageAccordionItem['media']): media is { src: string; alt: string } =>
  typeof media === 'object' && media !== null && !Array.isArray(media) && 'src' in media && typeof media.src === 'string'

function ImageAccordion({
  items,
  value,
  defaultValue,
  onValueChange,
  activation = 'hover',
  orientation = 'horizontal',
  sound = true,
  'aria-label': ariaLabel,
  className,
  onKeyDown: onKeyDownProp,
  onBlur: onBlurProp,
  ...props
}: ImageAccordionProps) {
  const rtl = useDirection() === 'rtl'
  const labels = useComponentLabels(imageAccordionLabels)
  const cue = useSoundCue()
  const uid = useId()
  const [current, setCurrent] = useControllableState(value, defaultValue ?? items[0]?.id ?? '')
  const active = items.some((item) => item.id === current) ? current : items[0]?.id
  // The latest open id, so a focus that follows a key press doesn't report the change twice.
  const latest = useRef(active)
  latest.current = active
  // The tab stop follows focus while the group has it, then returns to the open panel.
  const [focused, setFocused] = useState<string | null>(null)
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const vertical = orientation === 'vertical'
  // The open panel takes about three fifths of the box, whatever the count.
  const grow = Math.max(1, (items.length - 1) * 1.5)

  const open = (id: string, withCue: boolean) => {
    if (id === latest.current) return
    latest.current = id
    setCurrent(id)
    onValueChange?.(id)
    if (withCue && sound) cue('select')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDownProp?.(event)
    if (event.defaultPrevented) return
    const index = items.findIndex((item) => item.id === (focused ?? active))
    if (index < 0) return
    const next = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'
    const prev = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
    let to: number
    if (event.key === next) to = (index + 1) % items.length
    else if (event.key === prev) to = (index - 1 + items.length) % items.length
    else if (event.key === 'Home') to = 0
    else if (event.key === 'End') to = items.length - 1
    else return
    event.preventDefault()
    const id = items[to]?.id
    if (id === undefined) return
    if (activation === 'hover') open(id, true)
    buttons.current.get(id)?.focus()
  }

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    onBlurProp?.(event)
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(null)
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel ?? labels.imageAccordion}
      data-slot="image-accordion"
      data-orientation={orientation}
      data-yj-activation={activation}
      {...props}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      className={cn('@container/image-accordion own:flex w-full own:gap-1.5', vertical ? 'flex-col own:h-120' : 'flex-row own:h-80', className)}
    >
      {items.map((item) => {
        const isOpen = item.id === active
        const titleId = `${uid}-${item.id}-title`
        const lineId = `${uid}-${item.id}-line`
        return (
          <button
            key={item.id}
            ref={(el) => {
              if (el) buttons.current.set(item.id, el)
              else buttons.current.delete(item.id)
            }}
            type="button"
            data-slot="image-accordion-panel"
            data-state={isOpen ? 'active' : 'inactive'}
            aria-current={isOpen || undefined}
            aria-labelledby={item.description ? `${titleId} ${lineId}` : titleId}
            tabIndex={item.id === (focused ?? active) ? 0 : -1}
            onFocus={() => {
              setFocused(item.id)
              if (activation === 'hover') open(item.id, false)
            }}
            onPointerEnter={(event) => {
              if (activation === 'hover' && event.pointerType !== 'touch') open(item.id, false)
            }}
            onClick={() => open(item.id, true)}
            style={{ flexGrow: isOpen ? grow : 1 }}
            className={cn(
              'group/panel focus-ring relative basis-0 own:cursor-pointer overflow-hidden own:rounded-lg own:bg-well text-start',
              vertical ? 'own:min-h-10 own:min-w-0' : 'own:min-h-0 own:min-w-10',
              '[transition:flex-grow_calc(var(--yj-duration-spring)*var(--yj-motion,1))_var(--ease-spring)]',
            )}
          >
            <span
              data-slot="image-accordion-media"
              className={cn(
                'pointer-events-none absolute inset-0 own:block *:size-full',
                'transition-[filter] yj-duration-base ease-standard',
                'group-data-[state=inactive]/panel:saturate-[.55] group-data-[state=inactive]/panel:brightness-[.88]',
                'group-hover/panel:saturate-100 group-hover/panel:brightness-100',
              )}
            >
              {isImage(item.media) ? (
                <img src={item.media.src} alt={item.media.alt} draggable={false} className="block size-full object-cover" />
              ) : (
                item.media
              )}
            </span>
            <span
              data-slot="image-accordion-caption"
              className={cn(
                'pointer-events-none absolute bottom-3 start-3 own:flex w-max flex-col own:gap-0.5 own:rounded-md own:border own:border-line own:bg-surface own:px-3 own:py-2 own:text-fg own:shadow-sm-soft',
                'max-w-[min(--spacing(72),calc(55cqw_-_--spacing(6)))]',
                'transition-[opacity,translate] yj-duration-base ease-enter',
                'group-data-[state=inactive]/panel:translate-y-1 group-data-[state=inactive]/panel:opacity-0',
                'group-data-[state=active]/panel:[transition-delay:calc(var(--yj-duration-fast)*var(--yj-motion,1))]',
              )}
            >
              <span id={titleId} data-slot="image-accordion-title" className="own:text-ui-sm own:font-medium">
                {item.title}
              </span>{' '}
              {item.description && (
                <span id={lineId} data-slot="image-accordion-description" className="own:text-ui-xs own:text-fg-muted">
                  {item.description}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export { ImageAccordion, type ImageAccordionProps, type ImageAccordionItem }
