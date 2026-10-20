'use client'

import { SearchIcon, SidebarIcon } from '@youj/icons'
import { Button, Kbd, KbdGroup, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@youj/react'

export default function KbdInContext() {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Keycaps inside a button are a visual hint, so they stay out of its accessible name. */}
        <Button variant="outline" className="w-56 justify-start text-fg-muted">
          <SearchIcon />
          Search docs
          <KbdGroup aria-hidden className="ms-auto">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>

        {/* In a tooltip: the keycaps restyle themselves for the tooltip's chip. */}
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" size="icon" aria-label="Toggle sidebar" />}>
            <SidebarIcon />
          </TooltipTrigger>
          <TooltipContent>
            Toggle sidebar
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>B</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>

        <Button>
          Deploy
          {/* shape: the shortcut rides inside the primary button, in its lettering, not as a key of its own */}
          <Kbd aria-hidden className="border-transparent bg-on-accent/15 youj-allow-tint text-on-accent shadow-none">D</Kbd>
        </Button>
      </div>
    </TooltipProvider>
  )
}
