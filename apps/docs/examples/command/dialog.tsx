'use client'

import { useState } from 'react'
import { FilePlusIcon, FilterIcon, InboxIcon, SearchIcon } from '@youj/icons'
import { Button } from '@youj/react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@youj/react/command'

export default function CommandInDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="w-64 justify-start text-fg-muted">
        <SearchIcon />
        Search commands…
      </Button>
      {/* Hung from the top third of the screen, so the input stays put while the list grows and shrinks. */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search…" wrapperClassName="h-12 px-4" className="text-ui-lg" />
          <CommandList className="[--command-list-max:22rem]">
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem onSelect={() => setOpen(false)}>
                <FilePlusIcon />
                Create issue
                <CommandShortcut>C</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <FilterIcon />
                Filter issues
                <CommandShortcut>F</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => setOpen(false)}>
                <InboxIcon />
                Go to inbox
                <CommandShortcut>G I</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
