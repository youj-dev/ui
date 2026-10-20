'use client'

import { IllustrationMap } from '@youj/illustrations'
import { Button, Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, type SheetSide } from '@youj/react'

// `start` and `end` follow the writing direction: in a right-to-left page they swap edges.
const SIDES: { side: SheetSide; label: string }[] = [
  { side: 'top', label: 'Top' },
  { side: 'bottom', label: 'Bottom' },
  { side: 'left', label: 'Left' },
  { side: 'right', label: 'Right' },
  { side: 'start', label: 'Start' },
  { side: 'end', label: 'End' },
]

export default function SheetSides() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {SIDES.map(({ side, label }) => (
        <Sheet key={side}>
          <SheetTrigger render={<Button variant="outline" className="w-28" />}>{label}</SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>{label}</SheetTitle>
              <SheetDescription>
                Slides in from the {side === 'start' || side === 'end' ? `${side} edge of the writing direction` : `${side} edge`} and
                leaves the way it came.
              </SheetDescription>
            </SheetHeader>
            <SheetBody>
              <div className="flex items-center gap-4">
                {/* Decorative: with no title the scene is hidden from assistive tech. */}
                <IllustrationMap unit={9} className="-my-4 -mx-2 shrink-0" />
                <p className="text-ui text-fg-muted">Press Escape, the scrim or × to close it.</p>
              </div>
            </SheetBody>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  )
}
