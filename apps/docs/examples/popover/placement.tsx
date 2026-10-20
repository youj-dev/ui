'use client'

import { Button, Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@youj/react'

const SIDES = ['top', 'right', 'bottom', 'left'] as const

export default function PopoverPlacement() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {SIDES.map((side) => (
        <Popover key={side}>
          <PopoverTrigger render={<Button variant="outline" className="w-28 capitalize" />}>{side}</PopoverTrigger>
          {/* It grows out of the edge that touches the trigger, and flips when that side runs out of room. */}
          <PopoverContent side={side} className="w-56">
            <PopoverHeader>
              <PopoverTitle className="capitalize">{side}</PopoverTitle>
              <PopoverDescription>The popup's origin follows the side it opens on.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  )
}
