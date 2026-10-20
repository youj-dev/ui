'use client'

import { ArchiveIcon, ClockIcon, InboxIcon, PencilIcon, ReplyIcon, TrashIcon } from '@youj/icons'
import { CommandGroup, CommandItem, CommandShortcut } from '@youj/react/components/ui/command'
import { CommandPalette } from '@youj/react/components/ui/command-palette'
import type { Stack } from '../data'
import { STACK_NAMES } from '../styles'
import type { Folio } from '../use-folio'

const STACKS: Stack[] = ['inbox', 'later', 'done', 'sent', 'drafts']

/** ⌘K: everything the keys do, found by name: act on the letter at hand, jump to a stack, write. */
export function Commands({ folio }: { folio: Folio }) {
  const { current } = folio
  const live = current && current.stack !== 'sent' && current.stack !== 'drafts'
  const run = (action: () => void) => () => {
    folio.setPalette(false)
    action()
  }
  return (
    <CommandPalette open={folio.palette} onOpenChange={folio.setPalette} placeholder="Jump to a stack, or act on this letter…" title="Folio commands">
      {current && (
        <CommandGroup heading={current.subject}>
          {current.stack !== 'done' && (
            <CommandItem onSelect={run(() => folio.done(current))}>
              <ArchiveIcon size={16} /> Mark as done
              <CommandShortcut>E</CommandShortcut>
            </CommandItem>
          )}
          {live && (
            <CommandItem onSelect={run(() => folio.setReplying(true))}>
              <ReplyIcon size={16} /> Reply to {current.from.name.split(' ')[0]}
              <CommandShortcut>R</CommandShortcut>
            </CommandItem>
          )}
          {live &&
            folio.laterOptions.map((o) => (
              <CommandItem key={o.key} onSelect={run(() => folio.later(current, o.time))}>
                <ClockIcon size={16} /> Set aside until {o.label.toLowerCase()}
              </CommandItem>
            ))}
          <CommandItem onSelect={run(() => folio.remove(current))}>
            <TrashIcon size={16} /> Delete
            <CommandShortcut>#</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      )}
      <CommandGroup heading="Go to">
        {STACKS.map((s) => (
          <CommandItem key={s} value={`Go to ${STACK_NAMES[s]}`} onSelect={run(() => folio.pick(s))}>
            <InboxIcon size={16} /> {STACK_NAMES[s]}
          </CommandItem>
        ))}
      </CommandGroup>
      <CommandGroup heading="Write">
        <CommandItem onSelect={run(() => folio.compose())}>
          <PencilIcon size={16} /> Write a letter
          <CommandShortcut>C</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </CommandPalette>
  )
}
