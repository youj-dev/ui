'use client'

import { InfoIcon } from '@youj/icons'
import { Button, Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger, Progress } from '@youj/react'

export default function PopoverInfotip() {
  return (
    <div className="w-full max-w-xs rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex items-center gap-1">
        <span className="text-ui font-medium text-fg">Build minutes</span>
        <Popover>
          {/* Opens on hover as well as on press, so touch and keyboard users reach the same text. */}
          <PopoverTrigger openOnHover render={<Button variant="ghost" size="icon-xs" aria-label="About build minutes" />}>
            <InfoIcon />
          </PopoverTrigger>
          <PopoverContent side="top" className="w-64">
            <PopoverHeader>
              <PopoverTitle className="text-ui">How minutes are counted</PopoverTitle>
              <PopoverDescription>
                Every build counts from install to upload, rounded up to the minute. The allowance resets on the 1st.
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
        <span className="ms-auto font-mono text-ui-sm text-fg-muted tabular-nums">1,240 / 6,000</span>
      </div>
      <Progress value={21} aria-label="Build minutes used" className="mt-3" />
    </div>
  )
}
