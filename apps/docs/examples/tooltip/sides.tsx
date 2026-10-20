'use client'

import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@youj/react'

const SIDES = ['top', 'right', 'bottom', 'left'] as const

export default function TooltipSides() {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 gap-3">
        {SIDES.map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger render={<Button variant="outline" className="w-28 capitalize" />}>{side}</TooltipTrigger>
            {/* Each side drifts 3px in from the trigger. */}
            <TooltipContent side={side}>Opens on the {side}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
