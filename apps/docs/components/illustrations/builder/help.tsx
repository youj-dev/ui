'use client'

import type { ReactNode } from 'react'
import { KeyboardIcon } from '@youj/icons'
import { Kbd, KbdGroup, Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger, Tooltip, TooltipContent, TooltipTrigger } from '@youj/react'
import { TOOLBAR_BUTTON } from '@/components/ui/preview-controls'

/* The builder's shortcuts, in a popover from the canvas toolbar: the same
 * list the canvas describes itself with to assistive tech. */

const SHORTCUTS: { keys: ReactNode; does: string }[] = [
  { keys: <Keys keys={['Drag']} />, does: 'Move a part along the floor' },
  { keys: <Keys keys={['⌥', 'Drag']} />, does: 'Raise or lower it' },
  { keys: <Keys keys={['⇧', 'Click']} />, does: 'Add to the selection' },
  { keys: <Keys keys={['←', '→']} />, does: 'Move along x' },
  { keys: <Keys keys={['↑', '↓']} />, does: 'Move along y' },
  { keys: <Keys keys={['PgUp', 'PgDn']} />, does: 'Raise or lower (z)' },
  { keys: <Keys keys={['⇧', 'Arrow']} />, does: 'Move 2 units' },
  { keys: <Keys keys={['⌘', 'D']} />, does: 'Duplicate' },
  { keys: <Keys keys={['⌫']} />, does: 'Delete' },
  { keys: <Keys keys={['⌘', 'G']} />, does: 'Group (⇧ to ungroup)' },
  { keys: <Keys keys={['F2']} />, does: 'Rename, in the layers' },
  { keys: <Keys keys={['⌘', 'A']} />, does: 'Select everything' },
  { keys: <Keys keys={['⌘', 'Z']} />, does: 'Undo (⇧ to redo)' },
  { keys: <Keys keys={['Esc']} />, does: 'Clear the selection' },
  { keys: <Keys keys={['P']} />, does: 'Preview or edit' },
]

function Keys({ keys }: { keys: string[] }) {
  return (
    <KbdGroup>
      {keys.map((k) => (
        <Kbd key={k}>{k}</Kbd>
      ))}
    </KbdGroup>
  )
}

/** The text the canvas is described by: how to work it from the keyboard. */
export const CANVAS_HELP =
  'Choose parts in the layers list, then press Enter to come here. Arrow keys move the selection along the floor, Page Up and Page Down raise and lower it, Shift moves further. Command D duplicates, Delete removes, Command Z undoes.'

export function HelpPopover() {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger render={<PopoverTrigger render={<button type="button" aria-label="Keyboard shortcuts" className={TOOLBAR_BUTTON} />} />}>
          <KeyboardIcon size={16} strokeWidth={1.75} />
        </TooltipTrigger>
        <TooltipContent>Shortcuts</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" sideOffset={6} className="w-80 p-3">
        <PopoverTitle className="text-[13px] font-semibold">Shortcuts</PopoverTitle>
        <PopoverDescription className="mt-0.5 text-[12px] text-fg-muted">On the canvas, or with parts chosen in the layers.</PopoverDescription>
        <dl className="mt-2.5 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 text-[12px]">
          {SHORTCUTS.map((s) => (
            <div key={s.does} className="contents">
              <dt className="flex justify-end text-fg-muted">{s.keys}</dt>
              <dd className="text-fg">{s.does}</dd>
            </div>
          ))}
        </dl>
      </PopoverContent>
    </Popover>
  )
}
