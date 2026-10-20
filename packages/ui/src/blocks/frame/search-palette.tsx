'use client'

import { Fragment, useState, type ReactNode } from 'react'
import { useLabels } from '@youj/core'
import { PlusIcon, SidebarIcon, UserPlusIcon } from '@youj/icons'
import { AppHeaderSearch } from '../../components/ui/app-header'
import { CommandGroup, CommandItem, CommandShortcut } from '../../components/ui/command'
import { CommandPalette } from '../../components/ui/command-palette'
import { useSidebar } from '../../components/ui/sidebar'
import { navPages, useFrame, type FrameIcon } from './shell'

/* ⌘K search for a frame's top bar: a field-like button (an icon on phones)
 * that opens the command palette. The palette lists every page of the
 * frame's nav, nested pages after the groups they sit in, so any page is a few keys
 * away, then actions: yours, after Toggle sidebar (⌘B). ⌘K (Ctrl+K) opens
 * it from anywhere; Escape closes it and focus returns to the button. Pass
 * your own `commands` and run them in `onCommand`. */

/** A row under Actions. */
interface FrameSearchCommand {
  id: string
  label: string
  icon?: FrameIcon
  /** Shown at the row's end, "⌘N". */
  shortcut?: string
  /** More words it's found by. */
  keywords?: string[]
}

const COMMANDS: FrameSearchCommand[] = [
  { id: 'new-project', label: 'New project', icon: PlusIcon, shortcut: '⌘N' },
  { id: 'invite-people', label: 'Invite people', icon: UserPlusIcon },
]

interface FrameSearchPaletteProps {
  /** The button's field-like label. Default "Search…". */
  placeholder?: string
  /** Rows under Actions as data, after Toggle sidebar. Default: New project and Invite people. */
  commands?: FrameSearchCommand[]
  /** A command was chosen (the palette has closed). */
  onCommand?: (command: FrameSearchCommand) => void
  /** Rows under Actions as elements (CommandItem, with a CommandShortcut), in place of `commands`. */
  actions?: ReactNode
  className?: string
}

function FrameSearchPalette({ placeholder, commands = COMMANDS, onCommand, actions, className }: FrameSearchPaletteProps) {
  const labels = useLabels()
  const [open, setOpen] = useState(false)
  const { nav, navigate } = useFrame()
  const { toggleSidebar } = useSidebar()
  const run = (action: () => void) => () => {
    setOpen(false)
    action()
  }
  return (
    <>
      <AppHeaderSearch data-frame-search="palette" placeholder={placeholder} onClick={() => setOpen(true)} className={className} />
      <CommandPalette open={open} onOpenChange={setOpen}>
        {nav.map((section) => (
          <CommandGroup key={section.id} heading={section.label ?? labels.pages}>
            {navPages([section]).map(({ item, parents }) => {
              // A nested page wears its top group's icon and reads after the groups it sits in.
              const Icon = item.icon ?? parents.find((p) => p.icon)?.icon
              return (
                <CommandItem key={item.id} value={[item.label, ...parents.map((p) => p.label), item.id].join(' ')} onSelect={run(() => navigate(item.id))}>
                  {Icon && <Icon size={16} strokeWidth={1.75} />}
                  {parents.map((parent) => (
                    <Fragment key={parent.id}>
                      <span className="text-fg-muted">{parent.label}</span>
                      <span aria-hidden className="text-fg-muted">
                        /
                      </span>
                    </Fragment>
                  ))}
                  {item.label}
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
        <CommandGroup heading={labels.actions}>
          <CommandItem value="toggle sidebar" onSelect={run(toggleSidebar)}>
            <SidebarIcon size={16} strokeWidth={1.75} />
            {labels.toggleSidebar}
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          {actions ??
            commands.map((command) => {
              const Icon = command.icon
              return (
                <CommandItem key={command.id} value={[command.label, ...(command.keywords ?? [])].join(' ').toLowerCase()} onSelect={run(() => onCommand?.(command))}>
                  {Icon && <Icon size={16} strokeWidth={1.75} />}
                  {command.label}
                  {command.shortcut && <CommandShortcut>{command.shortcut}</CommandShortcut>}
                </CommandItem>
              )
            })}
        </CommandGroup>
      </CommandPalette>
    </>
  )
}

export { FrameSearchPalette }
export type { FrameSearchPaletteProps, FrameSearchCommand }
