'use client'

import { useState } from 'react'
import { ArrowRightIcon, UserIcon, UsersIcon } from '@youj/icons'
import { Button } from '@youj/react'
import { CommandGroup, CommandItem, CommandPalette, type CommandPaletteState } from '@youj/react/command'

const ROLES = ['Owner', 'Editor', 'Viewer']
const TEAM: Record<string, string> = { 'Ana Lima': 'Owner', 'Kenji Sato': 'Editor', 'Priya Raman': 'Editor', 'Sara Lindqvist': 'Viewer' }

export default function CommandPalettePages() {
  const [open, setOpen] = useState(false)
  const [roles, setRoles] = useState(TEAM)

  const rows = ({ page, push, pop }: CommandPaletteState) => {
    // Third level: a person's role. Choosing one steps back a page, to the team.
    if (page?.id.startsWith('member:')) {
      const name = page.label
      return (
        <CommandGroup heading={`Role for ${name}`}>
          {ROLES.map((role) => (
            <CommandItem
              key={role}
              value={role}
              checked={roles[name] === role}
              onSelect={() => {
                setRoles((current) => ({ ...current, [name]: role }))
                pop()
              }}
            >
              {role}
            </CommandItem>
          ))}
        </CommandGroup>
      )
    }
    if (page?.id === 'team') {
      return (
        <CommandGroup heading="Members">
          {Object.entries(roles).map(([name, role]) => (
            <CommandItem key={name} value={name} onSelect={() => push({ id: `member:${name}`, label: name, placeholder: 'Choose a role…' })}>
              <UserIcon />
              {name}
              <span className="ms-auto text-ui-sm text-fg-muted">{role}</span>
              <ArrowRightIcon className="size-3.5" />
            </CommandItem>
          ))}
        </CommandGroup>
      )
    }
    return (
      <CommandGroup heading="Workspace">
        <CommandItem onSelect={() => push({ id: 'team', label: 'Team', placeholder: 'Search members…' })}>
          <UsersIcon />
          Manage team…
        </CommandItem>
      </CommandGroup>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Manage team
      </Button>
      <p className="text-ui-sm text-fg-muted">
        {Object.entries(roles)
          .map(([name, role]) => `${name.split(' ')[0]}: ${role}`)
          .join(' · ')}
      </p>
      <CommandPalette open={open} onOpenChange={setOpen} shortcut={false}>
        {rows}
      </CommandPalette>
    </div>
  )
}
