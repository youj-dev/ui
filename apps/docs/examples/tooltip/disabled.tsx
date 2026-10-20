'use client'

import { useId } from 'react'
import { RocketIcon } from '@youj/icons'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@youj/react'

const REASON = 'Promote is available once the build finishes'

export default function TooltipDisabled() {
  const reason = useId()
  return (
    <div className="flex w-full max-w-sm items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 shadow-xs">
      <div className="min-w-0">
        <p className="truncate text-ui font-medium text-fg">Stream search results from the edge</p>
        <p className="text-ui-sm text-fg-muted">Building · 1m 12s</p>
      </div>
      <Tooltip>
        {/* Still focusable, so keyboard users get the reason too. Presses do nothing. */}
        <TooltipTrigger
          render={
            <Button
              disabled
              focusableWhenDisabled
              aria-describedby={reason}
              className="cursor-not-allowed data-disabled:pointer-events-auto"
            />
          }
        >
          <RocketIcon />
          Promote
        </TooltipTrigger>
        <TooltipContent>{REASON}</TooltipContent>
      </Tooltip>
      {/* Tooltips aren't announced, so the reason is also a description screen readers read. */}
      <span id={reason} className="sr-only">
        {REASON}
      </span>
    </div>
  )
}
