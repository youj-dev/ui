'use client'

import type { ReactNode } from 'react'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { TrashIcon } from '@youj/icons/components/youj/icons/trash'
import { cn, initials } from '../../../lib/utils'
import { Button } from '../button'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '../popover'
import { Textarea } from '../textarea'
import type { Point, WhiteboardPin } from './whiteboard-model'
import type { Labels } from './whiteboard-toolbar'

/* Comment pins: a marker on the board for each pin, numbered or marked with
 * its author's initials, that opens the comment in a popover with Resolve
 * and Delete. The app's own thread (CommentThread, say) goes in through
 * `content`; without it, the popover holds a plain note. Pins are screen
 * sized: they stay legible at any zoom. */

interface PinsProps {
  labels: Labels
  pins: readonly WhiteboardPin[]
  /** Each pin's spot on screen, in px from the board's top-left corner. */
  positions: ReadonlyMap<string, Point>
  open: string | null
  onOpenChange: (id: string | null) => void
  readOnly: boolean
  content?: (pin: WhiteboardPin, actions: ReactNode) => ReactNode
  onResolvedChange: (id: string, resolved: boolean) => void
  onDelete: (id: string) => void
  onTextChange: (id: string, text: string) => void
}

function Pins({ labels, pins, positions, open, onOpenChange, readOnly, content, onResolvedChange, onDelete, onTextChange }: PinsProps) {
  return (
    // The board is physical: a pin marks the same spot whatever the reading direction.
    <div role="group" aria-label={labels.whiteboardComments} dir="ltr" data-slot="whiteboard-pins" className="pointer-events-none absolute inset-0 z-4">
      {pins.map((pin, index) => {
        const at = positions.get(pin.id)
        if (!at) return null
        const name = labels.whiteboardPin(index + 1, pin.author)
        const actions = readOnly ? null : (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={pin.resolved ? labels.whiteboardReopen : labels.whiteboardResolve}
              aria-pressed={!!pin.resolved}
              onClick={() => onResolvedChange(pin.id, !pin.resolved)}
              className={cn(pin.resolved && 'own:text-success')}
            >
              <CheckIcon />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={labels.whiteboardDeleteComment} onClick={() => onDelete(pin.id)}>
              <TrashIcon />
            </Button>
          </>
        )
        return (
          <Popover key={pin.id} open={open === pin.id} onOpenChange={(next) => onOpenChange(next ? pin.id : null)}>
            <PopoverTrigger
              data-slot="whiteboard-pin"
              data-yj-resolved={pin.resolved || undefined}
              // The author's initials are drawn, not text: the label names the author.
              data-yj-initials={!pin.resolved && pin.author ? initials(pin.author) : undefined}
              aria-label={pin.resolved ? `${name}, ${labels.whiteboardResolved}` : name}
              className={cn(
                // youj-allow: physical side, the pin's tail points at its spot on the board
                'pointer-events-auto absolute top-0 left-0 own:flex size-7 -translate-y-full items-center justify-center own:rounded-full own:rounded-bl-none border-2 own:border-surface own:text-ui-xs own:font-semibold own:shadow-sm focus-ring',
                'transition-[scale] yj-duration-fast ease-standard hover:scale-110 data-[popup-open]:scale-110 reduced:transition-none',
                pin.resolved ? 'own:bg-band own:text-fg-muted' : 'own:bg-accent own:text-on-accent',
                'before:content-[attr(data-yj-initials)]',
              )}
              style={{ left: at[0], top: at[1] }}
            >
              {pin.resolved ? <CheckIcon className="size-3.5" /> : pin.author ? null : index + 1}
            </PopoverTrigger>
            {content ? (
              // The app's thread brings its own header: the pin's Resolve and Delete go into it, so there is one.
              <PopoverContent side="right" align="start" sideOffset={10} aria-label={name} className="w-96 own:gap-0 own:p-0">
                <div data-slot="whiteboard-pin-content" className="min-h-0">
                  {content(pin, actions)}
                </div>
              </PopoverContent>
            ) : (
              <PopoverContent side="right" align="start" sideOffset={10} className="w-80 own:gap-0 own:p-0">
                <div className="own:flex items-center own:gap-1 own:py-1.5 own:ps-3 own:pe-1.5">
                  <PopoverTitle className="min-w-0 flex-1 truncate own:text-ui-sm own:font-medium">{name}</PopoverTitle>
                  {actions}
                </div>
                <div className="own:px-3 own:pb-3">
                  <Textarea
                    aria-label={name}
                    placeholder={labels.whiteboardCommentPlaceholder}
                    defaultValue={pin.text ?? ''}
                    readOnly={readOnly}
                    onBlur={(e) => e.currentTarget.value !== (pin.text ?? '') && onTextChange(pin.id, e.currentTarget.value)}
                  />
                </div>
              </PopoverContent>
            )}
          </Popover>
        )
      })}
    </div>
  )
}

export { Pins }
