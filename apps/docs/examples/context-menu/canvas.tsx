'use client'

import { useState } from 'react'
import { cn } from '@youj/core'
import { ClipboardIcon, FileTextIcon, LayoutGridIcon } from '@youj/icons'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@youj/react'

export default function ContextMenuCanvas() {
  const [grid, setGrid] = useState(true)
  const [snap, setSnap] = useState(false)
  const [zoom, setZoom] = useState('100')
  const [notes, setNotes] = useState(0)

  return (
    <ContextMenu>
      {/* The menu opens at the pointer, wherever on the canvas the right-click lands. */}
      <ContextMenuTrigger
        render={<section aria-label="Canvas" tabIndex={0} />}
        className={cn(
          'relative flex h-60 w-full max-w-lg flex-col justify-end rounded-xl border border-dashed border-line bg-surface p-4 focus-ring',
          grid && 'bg-[radial-gradient(var(--color-line-strong)_1px,transparent_1px)] bg-size-[16px_16px]',
        )}
      >
        <p className="text-ui-sm text-fg-muted">
          {notes === 0 ? 'Right-click anywhere on the canvas.' : `${notes} ${notes === 1 ? 'note' : 'notes'} added.`} Zoom {zoom}%
          {snap ? ', snapping to the grid' : ''}.
        </p>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => setNotes((n) => n + 1)}>
          <FileTextIcon />
          Add note
          <ContextMenuShortcut>N</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <LayoutGridIcon />
          Add frame
          <ContextMenuShortcut>F</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled>
          <ClipboardIcon />
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
          Show grid
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked={snap} onCheckedChange={setSnap}>
          Snap to grid
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value={zoom} onValueChange={setZoom}>
          <ContextMenuLabel>Zoom</ContextMenuLabel>
          {['50', '100', '200'].map((level) => (
            <ContextMenuRadioItem key={level} value={level}>
              {level}%
            </ContextMenuRadioItem>
          ))}
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}
