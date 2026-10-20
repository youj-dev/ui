'use client'

import { useState } from 'react'
import { ArchiveIcon, LayersIcon, MoreHorizontalIcon, PencilIcon, PinIcon, ShareIcon, TrashIcon } from '@youj/icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@youj/react'

export default function IconsInMenu() {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(true)

  return (
    <div className="flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-band font-mono text-ui-sm font-semibold text-fg">OR</div>
      <div className="min-w-0 flex-1">
        <p className="text-ui font-semibold text-fg">Orion</p>
        <p className="text-ui-sm text-fg-muted">Marketing site · 3 environments</p>
      </div>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Project actions" />}>
          {/* A state icon that follows the menu: more ↔ close. */}
          <MoreHorizontalIcon active={open} strokeWidth={1.75} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {/* Rows are menu items, so highlighting a row plays its icon. */}
          <DropdownMenuItem>
            <PencilIcon strokeWidth={1.75} />
            Rename
            <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LayersIcon strokeWidth={1.75} />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ShareIcon strokeWidth={1.75} />
            Share
          </DropdownMenuItem>
          <DropdownMenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>
            <PinIcon active={pinned} strokeWidth={1.75} />
            Pin to sidebar
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <ArchiveIcon strokeWidth={1.75} />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem variant="danger">
            <TrashIcon strokeWidth={1.75} />
            Delete project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
