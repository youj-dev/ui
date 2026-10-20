'use client'

import { useState } from 'react'
import {
  CreditCardIcon,
  FilePlusIcon,
  GitBranchIcon,
  GlobeIcon,
  InboxIcon,
  RocketIcon,
  SettingsIcon,
  UserIcon,
} from '@youj/icons'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@youj/react/command'

export default function CommandDemo() {
  const [ran, setRan] = useState('')

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Command label="Command menu" className="rounded-xl border border-line shadow-md">
        <CommandInput placeholder="Type a command or search…" />
        <CommandList className="[--command-list-max:18rem]">
          <CommandEmpty>No commands match.</CommandEmpty>
          <CommandGroup heading="Project">
            <CommandItem onSelect={() => setRan('Deploy to production')}>
              <RocketIcon />
              Deploy to production
              <CommandShortcut>⌘⇧D</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setRan('Create preview branch')}>
              <GitBranchIcon />
              Create preview branch
              <CommandShortcut>B</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setRan('Add domain')}>
              <GlobeIcon />
              Add domain
            </CommandItem>
            <CommandItem onSelect={() => setRan('New environment variable')}>
              <FilePlusIcon />
              New environment variable
              <CommandShortcut>E</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Go to">
            <CommandItem onSelect={() => setRan('Go to inbox')}>
              <InboxIcon />
              Inbox
              <CommandShortcut>G I</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setRan('Go to profile')}>
              <UserIcon />
              Profile
              <CommandShortcut>G P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => setRan('Go to billing')}>
              <CreditCardIcon />
              Billing
            </CommandItem>
            {/* Disabled rows stay visible and are skipped by the arrows. */}
            <CommandItem disabled>
              <SettingsIcon />
              Team settings
              <CommandShortcut>Owners</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <p role="status" className="h-5 px-1 text-ui-sm text-fg-muted">
        {ran && `Ran “${ran}”`}
      </p>
    </div>
  )
}
