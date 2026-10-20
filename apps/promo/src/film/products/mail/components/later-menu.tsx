'use client'

import type { ReactElement } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuShortcut, DropdownMenuTrigger } from '@youj/react/components/ui/dropdown-menu'
import { back } from '../time'
import type { Folio } from '../use-folio'

/** Set aside until…: H opens it on the letter at hand, and 1, 2 or 3 picks a time without leaving the keys. */
export function LaterMenu({ folio, trigger }: { folio: Folio; trigger: ReactElement }) {
  const { current, laterOptions, now } = folio
  return (
    <DropdownMenu open={folio.laterOpen} onOpenChange={folio.setLaterOpen}>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent
        side="top"
        align="center"
        sideOffset={10}
        className="min-w-60"
        onKeyDown={(event) => {
          const option = laterOptions.find((o) => o.key === event.key)
          if (!option || !current) return
          event.preventDefault()
          folio.setLaterOpen(false)
          folio.later(current, option.time)
        }}
      >
        <DropdownMenuLabel>Set aside until</DropdownMenuLabel>
        {laterOptions.map((o) => (
          <DropdownMenuItem key={o.key} onClick={() => current && folio.later(current, o.time)}>
            <span className="flex flex-col">
              <span className="text-fg">{o.label}</span>
              <span className="text-ui-sm text-fg-muted">{back(o.time, now)}</span>
            </span>
            <DropdownMenuShortcut>{o.key}</DropdownMenuShortcut>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
